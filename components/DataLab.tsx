"use client";

import Papa from "papaparse";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileSpreadsheet, Trash2, Upload } from "lucide-react";
import { apiRequest } from "@/components/JsonForm";
import { Notice } from "@/components/Notice";
import { countDuplicates, countMissing, fillMissing as fillMissingValues, filterRows, removeDuplicates as removeDuplicateRows, removeIncomplete, type DataRecord } from "@/lib/data-utils";

type CellValue = string | number | null;
type DataRow = DataRecord;
type ChartKind = "bar" | "line" | "pie";
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_ROWS = 20_000;
const MAX_COLUMNS = 80;
const CHART_COLORS = ["#7554f6", "#38a8d9", "#43b99b", "#e7a74a", "#dd6b9c", "#7381d9"];

function safeCell(value: unknown): CellValue {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "object" && value && "text" in value) return String((value as { text: unknown }).text);
  if (typeof value === "object" && value && "result" in value) return safeCell((value as { result: unknown }).result);
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function uniqueHeaders(headers: string[]) {
  const used = new Set<string>();
  return headers.map((header, index) => {
    const base = header.trim() || `Column ${index + 1}`;
    let label = base;
    let suffix = 2;
    while (used.has(label)) label = `${base} (${suffix++})`;
    used.add(label);
    return label;
  });
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DataLab() {
  const [rows, setRows] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");
  const [column, setColumn] = useState("");
  const [chartKind, setChartKind] = useState<ChartKind>("bar");
  const [replacement, setReplacement] = useState("0");
  const usageTracked = useRef(false);

  useEffect(() => {
    if (usageTracked.current) return;
    usageTracked.current = true;
    void apiRequest("/api/usage", { method: "POST", body: JSON.stringify({ tool: "data-lab" }) }).catch((caught: unknown) => {
      setError(caught instanceof Error ? `Usage history could not be recorded: ${caught.message}` : "Usage history could not be recorded.");
    });
  }, []);

  const missingCounts = useMemo(() => countMissing(rows, headers), [headers, rows]);
  const duplicateCount = useMemo(() => countDuplicates(rows, headers), [headers, rows]);
  const missingTotal = Object.values(missingCounts).reduce((sum, count) => sum + count, 0);
  const filteredRows = useMemo(() => filterRows(rows, headers, filter), [filter, headers, rows]);
  const selectedColumn = column || headers.find((header) => rows.some((row) => typeof row[header] === "number")) || headers[0] || "";
  const lineChartData = useMemo(() => {
    if (!selectedColumn) return [];
    return filteredRows.flatMap((row, index) => {
      const value = Number(row[selectedColumn]);
      return row[selectedColumn] !== null && row[selectedColumn] !== "" && Number.isFinite(value) ? [{ row: index + 1, value }] : [];
    }).slice(0, 100);
  }, [filteredRows, selectedColumn]);
  const categoryChartData = useMemo(() => {
    if (!selectedColumn) return [];
    const groups = new Map<string, number>();
    for (const row of filteredRows) {
      const value = String(row[selectedColumn] ?? "(missing)");
      groups.set(value, (groups.get(value) ?? 0) + 1);
    }
    return [...groups.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 20);
  }, [filteredRows, selectedColumn]);
  const numericValues = useMemo(() => filteredRows.flatMap((row) => {
    const value = row[selectedColumn];
    return typeof value === "number" && Number.isFinite(value) ? [value] : [];
  }), [filteredRows, selectedColumn]);
  const summary = numericValues.length ? {
    count: numericValues.length,
    min: Math.min(...numericValues),
    max: Math.max(...numericValues),
    average: numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length,
  } : null;

  async function loadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setMessage(""); setRows([]); setHeaders([]); setFileName("");
    if (file.size > MAX_BYTES) { setError("Choose a file smaller than 10 MB."); event.target.value = ""; return; }
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["csv", "xlsx"].includes(extension)) {
      setError("Unsupported file. Choose a CSV or .xlsx workbook.");
      event.target.value = ""; return;
    }
    setLoading(true);
    try {
      let parsedHeaders: string[];
      let parsedRows: DataRow[];
      if (extension === "csv") {
        const text = await file.text();
        const result = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: "greedy", dynamicTyping: true });
        if (result.errors.length) throw new Error(`CSV parsing failed: ${result.errors[0].message}`);
        parsedHeaders = uniqueHeaders(result.meta.fields ?? []);
        if (!parsedHeaders.length) throw new Error("The CSV does not contain a header row.");
        parsedRows = result.data.map((row) => Object.fromEntries((result.meta.fields ?? []).map((field, index) => [parsedHeaders[index], safeCell(row[field])])));
      } else {
        const ExcelJS = await import("exceljs");
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const sheet = workbook.worksheets[0];
        if (!sheet || sheet.rowCount < 1) throw new Error("The Excel workbook has no readable worksheet.");
        const rawHeaders: string[] = [];
        sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => { rawHeaders[colNumber - 1] = String(safeCell(cell.value) ?? ""); });
        parsedHeaders = uniqueHeaders(rawHeaders);
        if (!parsedHeaders.length) throw new Error("The first worksheet has no header row.");
        parsedRows = [];
        for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
          const row = sheet.getRow(rowNumber);
          const data = Object.fromEntries(parsedHeaders.map((header, index) => [header, safeCell(row.getCell(index + 1).value)]));
          if (Object.values(data).some((value) => value !== null)) parsedRows.push(data);
        }
      }
      if (parsedHeaders.length > MAX_COLUMNS) throw new Error(`This file has too many columns. The limit is ${MAX_COLUMNS}.`);
      if (parsedRows.length > MAX_ROWS) throw new Error(`This file has too many rows. The limit is ${MAX_ROWS.toLocaleString()}.`);
      if (!parsedRows.length) throw new Error("The file has headers but no data rows.");
      setHeaders(parsedHeaders); setRows(parsedRows); setFileName(file.name); setColumn(parsedHeaders[0]);
      setMessage(`Loaded ${parsedRows.length.toLocaleString()} rows and ${parsedHeaders.length} columns. Your file stays in this browser.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not read this file.");
    } finally { setLoading(false); event.target.value = ""; }
  }

  function removeDuplicates() {
    const cleaned = removeDuplicateRows(rows, headers);
    setRows(cleaned); setMessage(`Removed ${rows.length - cleaned.length} duplicate row(s).`);
  }

  function dropIncomplete() {
    const cleaned = removeIncomplete(rows, headers);
    setRows(cleaned); setMessage(`Removed ${rows.length - cleaned.length} row(s) with missing values.`);
  }

  function fillMissing() {
    const value = replacement.trim();
    if (!value) { setError("Enter a replacement value first."); return; }
    setRows((current) => fillMissingValues(current, headers, value));
    setMessage("Missing cells have been filled with the replacement value.");
  }

  function exportCsv() {
    const csv = Papa.unparse(rows, { columns: headers, escapeFormulae: true });
    download(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }), `${fileName.replace(/\.[^.]+$/, "") || "niar-cleaned"}.csv`);
    setMessage(`Exported ${rows.length.toLocaleString()} cleaned rows to CSV.`);
  }

  async function exportExcel() {
    setLoading(true); setError("");
    try {
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Cleaned data");
      sheet.addRow(headers);
      for (const row of rows) sheet.addRow(headers.map((header) => row[header]));
      const buffer = await workbook.xlsx.writeBuffer();
      download(new Blob([buffer as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${fileName.replace(/\.[^.]+$/, "") || "niar-cleaned"}.xlsx`);
      setMessage(`Exported ${rows.length.toLocaleString()} cleaned rows to Excel.`);
    } catch (caught) {
      setError(caught instanceof Error ? `Excel export failed: ${caught.message}` : "Excel export failed.");
    } finally { setLoading(false); }
  }

  function exportReport() {
    const report = {
      sourceFile: fileName,
      generatedAt: new Date().toISOString(),
      rows: rows.length,
      columns: headers.length,
      missingValuesByColumn: countMissing(rows, headers),
      duplicateRows: countDuplicates(rows, headers),
      filterAppliedToChartAndPreviewOnly: filter || null,
    };
    download(new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8" }), `${fileName.replace(/\.[^.]+$/, "") || "niar-cleaned"}-report.json`);
    setMessage("Dataset summary report exported as JSON.");
  }

  return (
    <main className="route-page"><section className="page-shell data-lab-shell">
      <div className="dashboard-heading"><div><span className="eyebrow"><span className="eyebrow-dot" /> NIAR Data Lab · private in-browser processing</span><h1>Make data make sense.</h1><p>Inspect, clean, chart, and export CSV and Excel files. Your file is processed locally and never uploaded.</p></div>
        <label className={`button button-primary file-button${loading ? " disabled" : ""}`}><Upload size={16} />{loading ? "Processing…" : "Choose CSV / Excel"}<input accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={loading} onChange={loadFile} type="file" /></label>
      </div>
      {error && <Notice kind="error">{error}</Notice>}{message && <Notice kind="success">{message}</Notice>}
      {!rows.length ? <div className="panel upload-empty"><FileSpreadsheet size={30} /><h2>Bring a spreadsheet to explore.</h2><p>CSV or XLSX · up to 10 MB · 20,000 rows · 80 columns. Macros are not executed.</p><p>Only the first worksheet of an Excel workbook is read.</p></div> : <>
        <div className="metric-grid data-metrics"><article className="metric-card"><strong>{rows.length.toLocaleString()}</strong><span>Rows</span></article><article className="metric-card"><strong>{headers.length}</strong><span>Columns</span></article><article className="metric-card"><strong>{missingTotal.toLocaleString()}</strong><span>Missing cells</span></article><article className="metric-card"><strong>{duplicateCount}</strong><span>Duplicate rows</span></article></div>
        <section className="panel cleaning-panel"><div><h2>Clean this dataset</h2><p>Actions apply to the dataset in this browser session.</p></div>
          <label>Fill missing cells with<input maxLength={100} onChange={(event) => setReplacement(event.target.value)} value={replacement} /></label>
          <button className="button button-outline" onClick={fillMissing} type="button">Fill missing</button><button className="button button-outline" onClick={dropIncomplete} type="button">Drop incomplete rows</button><button className="button button-outline" onClick={removeDuplicates} type="button"><Trash2 size={14} /> Remove duplicates</button>
        </section>
        <div className="data-workspace">
          <section className="panel chart-panel">
            <div className="panel-title"><div><h2>Explore a column</h2><p>Charts reflect the current text filter.</p></div><div className="chart-controls">
              <label>Column<select aria-label="Chart column" onChange={(event) => setColumn(event.target.value)} value={selectedColumn}>{headers.map((header) => <option key={header}>{header}</option>)}</select></label>
              <label>Chart<select aria-label="Chart type" onChange={(event) => setChartKind(event.target.value as ChartKind)} value={chartKind}><option value="bar">Bar</option><option value="line">Line (numeric)</option><option value="pie">Pie</option></select></label>
            </div></div>
            {summary && <div className="data-summary"><span><strong>{summary.count}</strong> numeric</span><span>Min <strong>{summary.min.toLocaleString()}</strong></span><span>Avg <strong>{summary.average.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></span><span>Max <strong>{summary.max.toLocaleString()}</strong></span></div>}
            <div className="chart-box">
              {chartKind === "line" ? !lineChartData.length ? <p className="empty-state">No numeric values in this column for a line chart.</p> :
                <ResponsiveContainer height={285} width="100%">
                  <LineChart data={lineChartData}><CartesianGrid stroke="#eeecf3" strokeDasharray="3 3" /><XAxis dataKey="row" /><YAxis /><Tooltip /><Line dataKey="value" dot={false} stroke="#7554f6" strokeWidth={2} type="monotone" /></LineChart>
                </ResponsiveContainer> : null}
              {chartKind !== "line" && (!categoryChartData.length ? <p className="empty-state">No values to chart.</p> :
                <ResponsiveContainer height={285} width="100%">
                  {chartKind === "bar" ? <BarChart data={categoryChartData}><CartesianGrid stroke="#eeecf3" strokeDasharray="3 3" /><XAxis dataKey="name" interval={0} tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Bar dataKey="count" fill="#7554f6" radius={[4, 4, 0, 0]} /></BarChart> :
                    <PieChart><Pie data={categoryChartData} dataKey="count" label nameKey="name" outerRadius={95}>{categoryChartData.map((entry, index) => <Cell fill={CHART_COLORS[index % CHART_COLORS.length]} key={entry.name} />)}</Pie><Tooltip /></PieChart>}
                </ResponsiveContainer>)}
            </div>
            {headers.length > 0 && <div className="column-missing"><strong>Missing values by column</strong>{headers.map((header) => <span key={header}>{header}: {missingCounts[header]}</span>)}</div>}
          </section>
          <section className="panel preview-panel"><div className="panel-title"><div><h2>Data preview</h2><p>{fileName} · showing first 100 rows</p></div><div className="export-actions"><button className="button button-outline button-tiny" disabled={loading} onClick={exportCsv} type="button"><Download size={14} /> Clean CSV</button><button className="button button-outline button-tiny" disabled={loading} onClick={() => void exportExcel()} type="button"><Download size={14} /> Clean XLSX</button><button className="button button-outline button-tiny" disabled={loading} onClick={exportReport} type="button">Report JSON</button></div></div>
            <label className="data-filter">Filter rows<input onChange={(event) => setFilter(event.target.value)} placeholder="Search any column…" value={filter} /></label>
            <div className="table-scroll"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{filteredRows.slice(0, 100).map((row, index) => <tr key={index}>{headers.map((header) => <td key={header}>{row[header] === null ? <span className="missing-cell">missing</span> : String(row[header])}</td>)}</tr>)}</tbody></table>{!filteredRows.length && <p className="empty-state">No rows match this filter.</p>}</div>
          </section>
        </div>
      </>}
    </section></main>
  );
}
