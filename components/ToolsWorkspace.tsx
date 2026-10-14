"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Calculator, Check, Copy, FileJson2, FileText, Heart, QrCode, Search, Type, Weight } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { PageIntro } from "@/components/PageIntro";
import { Notice } from "@/components/Notice";
import { evaluateExpression } from "@/lib/calculator";
import { apiRequest } from "@/components/JsonForm";

const catalog = [
  { name: "Word & character counter", group: "Text", description: "Count words, characters, and reading time.", href: "#counter", icon: Type },
  { name: "Case converter", group: "Text", description: "Convert text to uppercase, lowercase, or title case.", href: "#case", icon: FileText },
  { name: "QR code generator", group: "Create", description: "Generate a QR code image from text or a URL.", href: "#qr", icon: QrCode },
  { name: "JSON formatter", group: "Developer", description: "Validate JSON and format it for readability.", href: "#json", icon: FileJson2 },
  { name: "Unit converter", group: "Everyday", description: "Convert common length, mass, and temperature units.", href: "#units", icon: Weight },
  { name: "Calculator", group: "Everyday", description: "Calculate safely with arithmetic and parentheses.", href: "#calculator", icon: Calculator },
  { name: "Print to PDF", group: "Documents", description: "Use your browser’s built-in print-to-PDF dialog.", href: "#pdf", icon: FileText },
];
const FAVORITES_KEY = "niar-favorite-tools";
const RECENT_KEY = "niar-recent-tools";
const units: Record<string, Record<string, number>> = {
  length: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, mi: 1609.344 },
  mass: { mg: 0.001, g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237 },
};

function titleCase(input: string) {
  return input.toLocaleLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, prefix: string, letter: string) => prefix + letter.toLocaleUpperCase());
}
function sentenceCase(input: string) {
  return input.toLocaleLowerCase().replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (match) => match.toLocaleUpperCase());
}

export function ToolsWorkspace() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("Word & character counter");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [json, setJson] = useState("{\n  \"niar\": \"one\"\n}");
  const [jsonResult, setJsonResult] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [qrText, setQrText] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [qrError, setQrError] = useState("");
  const [unitCategory, setUnitCategory] = useState("length");
  const [unitFrom, setUnitFrom] = useState("m");
  const [unitTo, setUnitTo] = useState("km");
  const [unitValue, setUnitValue] = useState("1");
  const [calcInput, setCalcInput] = useState("12 * (3 + 4)");
  const [calcResult, setCalcResult] = useState<number | null>(null);
  const [calcError, setCalcError] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const usageTracked = useRef(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]") as string[];
      Promise.resolve().then(() => setFavorites(saved));
    } catch { localStorage.removeItem(FAVORITES_KEY); }
    if (!usageTracked.current) {
      usageTracked.current = true;
      void apiRequest("/api/usage", { method: "POST", body: JSON.stringify({ tool: "utilities" }) }).catch((caught: unknown) => {
        setError(caught instanceof Error ? `Usage history could not be recorded: ${caught.message}` : "Usage history could not be recorded.");
      });
    }
  }, []);

  const filteredCatalog = useMemo(() => catalog.filter((tool) =>
    `${tool.name} ${tool.group} ${tool.description}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (!showFavoritesOnly || favorites.includes(tool.name)),
  ), [favorites, query, showFavoritesOnly]);
  const selected = catalog.find((tool) => tool.name === active) ?? catalog[0];
  const wordCount = text.trim() ? text.trim().split(/\s+/u).length : 0;
  const charCount = [...text].length;
  const readingTime = wordCount ? Math.max(1, Math.ceil(wordCount / 200)) : 0;
  const availableUnits = units[unitCategory];

  function chooseTool(name: string, href: string) {
    setActive(name);
    const anchor = document.querySelector(href);
    anchor?.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      const recent = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[];
      localStorage.setItem(RECENT_KEY, JSON.stringify([name, ...recent.filter((entry) => entry !== name)].slice(0, 8)));
    } catch {
      localStorage.removeItem(RECENT_KEY);
    }
  }
  function toggleFavorite(name: string) {
    const next = favorites.includes(name) ? favorites.filter((entry) => entry !== name) : [...favorites, name];
    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    setNotice(next.includes(name) ? `${name} added to favorites.` : `${name} removed from favorites.`);
  }
  function formatJson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setJsonError(""); setJsonResult("");
    try { setJsonResult(JSON.stringify(JSON.parse(json), null, 2)); }
    catch (caught) { setJsonError(caught instanceof Error ? caught.message : "Invalid JSON."); }
  }
  async function generateQr(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setQrError(""); setQrUrl("");
    try { setQrUrl(await QRCode.toDataURL(qrText.trim(), { width: 360, margin: 2, errorCorrectionLevel: "M" })); }
    catch (caught) { setQrError(caught instanceof Error ? caught.message : "Could not create the QR code."); }
    finally { setPending(false); }
  }
  function convertUnits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice("");
    const value = Number(unitValue);
    if (!Number.isFinite(value)) { setNotice("Enter a valid number to convert."); return; }
    let converted: number;
    if (unitCategory === "temperature") {
      const celsius = unitFrom === "°C" ? value : unitFrom === "°F" ? (value - 32) * 5 / 9 : value - 273.15;
      converted = unitTo === "°C" ? celsius : unitTo === "°F" ? celsius * 9 / 5 + 32 : celsius + 273.15;
    } else {
      converted = value * (availableUnits[unitFrom] / availableUnits[unitTo]);
    }
    setNotice(`${value} ${unitFrom} = ${Number(converted.toPrecision(10))} ${unitTo}`);
  }
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setCalcError("");
    try { setCalcResult(evaluateExpression(calcInput)); }
    catch (caught) { setCalcError(caught instanceof Error ? caught.message : "Calculation failed."); }
  }

  return (
    <main className="route-page"><section className="page-shell tools-directory">
      <PageIntro eyebrow="Small tools, useful moments" title={<>A practical toolkit.<br /><span>Right when you need it.</span></>} description="Tools run in your browser. Your text, JSON, and QR content are not sent to a server." />
      {notice && <Notice>{notice}</Notice>}{error && <Notice kind="error">{error}</Notice>}
      <div className="directory-layout">
        <aside className="panel directory-sidebar"><label className="tool-search"><Search size={16} /><input aria-label="Search utilities" onChange={(event) => setQuery(event.target.value)} placeholder="Search tools…" value={query} /></label>
          <button aria-pressed={showFavoritesOnly} className="favorite-filter" onClick={() => setShowFavoritesOnly((current) => !current)} type="button"><Heart size={15} />{showFavoritesOnly ? "Show all tools" : "Favorites only"}</button>
          <div className="directory-tool-list">{filteredCatalog.map((tool) => { const Icon = tool.icon; return <button aria-current={active === tool.name ? "true" : undefined} className={active === tool.name ? "directory-tool active" : "directory-tool"} key={tool.name} onClick={() => chooseTool(tool.name, tool.href)} type="button"><Icon size={17} /><span><strong>{tool.name}</strong><small>{tool.group}</small></span></button>; })}{!filteredCatalog.length && <p className="empty-state">No matching tools. Try a different search.</p>}</div>
        </aside>
        <div className="tool-workarea">
          <div className="panel active-tool-heading"><div><span className="eyebrow">{selected.group} tool</span><h2>{selected.name}</h2><p>{selected.description}</p></div><button aria-label={favorites.includes(selected.name) ? "Remove from favorites" : "Add to favorites"} aria-pressed={favorites.includes(selected.name)} className="favorite-toggle" onClick={() => toggleFavorite(selected.name)} type="button"><Heart fill={favorites.includes(selected.name) ? "currentColor" : "none"} size={19} /></button></div>
          {active === "Word & character counter" && <section className="panel utility-panel" id="counter"><label>Your text<textarea onChange={(event) => setText(event.target.value)} placeholder="Start typing or paste your text here…" rows={10} value={text} /></label><div className="counter-stats"><span><strong>{wordCount}</strong> words</span><span><strong>{charCount}</strong> characters</span><span><strong>{text.length}</strong> characters (with spaces)</span><span><strong>{readingTime}</strong> min read</span></div></section>}
          {active === "Case converter" && <section className="panel utility-panel" id="case"><label>Text to convert<textarea onChange={(event) => setText(event.target.value)} placeholder="Type or paste text…" rows={7} value={text} /></label><div className="utility-actions">{[["UPPERCASE", text.toLocaleUpperCase()], ["lowercase", text.toLocaleLowerCase()], ["Title Case", titleCase(text)], ["Sentence case", sentenceCase(text)]].map(([label, result]) => <button className="button button-outline" key={label} onClick={() => { setText(result); setNotice(`${label} applied.`); }} type="button">{label}</button>)}<button className="button button-outline" onClick={() => { void navigator.clipboard.writeText(text); setNotice("Text copied to clipboard."); }} type="button"><Copy size={14} />Copy</button></div></section>}
          {active === "JSON formatter" && <form className="panel utility-panel" id="json" onSubmit={formatJson}><label>JSON input<textarea autoCapitalize="off" autoComplete="off" autoCorrect="off" onChange={(event) => setJson(event.target.value)} spellCheck={false} value={json} /></label><button className="button button-primary" type="submit">Validate &amp; format</button>{jsonError && <Notice kind="error">{jsonError}</Notice>}{jsonResult && <><Notice kind="success">Valid JSON.</Notice><pre className="code-output">{jsonResult}</pre><button className="button button-outline" onClick={() => { void navigator.clipboard.writeText(jsonResult); setNotice("Formatted JSON copied."); }} type="button"><Copy size={14} />Copy result</button></>}</form>}
          {active === "QR code generator" && <form className="panel utility-panel" id="qr" onSubmit={generateQr}><label>Text or URL<input maxLength={2000} onChange={(event) => setQrText(event.target.value)} placeholder="https://example.com" required value={qrText} /></label><button className="button button-primary" disabled={pending} type="submit"><QrCode size={16} />{pending ? "Generating…" : "Generate QR code"}</button>{qrError && <Notice kind="error">{qrError}</Notice>}{qrUrl && <div className="qr-output"><img alt="Generated QR code" height="240" src={qrUrl} width="240" /><a className="button button-outline" download="niar-qr-code.png" href={qrUrl}>Download PNG</a></div>}</form>}
          {active === "Unit converter" && <form className="panel utility-panel" id="units" onSubmit={convertUnits}><label>Category<select onChange={(event) => { const next = event.target.value; setUnitCategory(next); setUnitFrom(next === "temperature" ? "°C" : Object.keys(units[next])[0]); setUnitTo(next === "temperature" ? "°F" : Object.keys(units[next])[1]); }} value={unitCategory}><option value="length">Length</option><option value="mass">Mass</option><option value="temperature">Temperature</option></select></label><label>Value<input inputMode="decimal" onChange={(event) => setUnitValue(event.target.value)} value={unitValue} /></label><div className="form-row"><label>From<select onChange={(event) => setUnitFrom(event.target.value)} value={unitFrom}>{(unitCategory === "temperature" ? ["°C", "°F", "K"] : Object.keys(availableUnits)).map((unit) => <option key={unit}>{unit}</option>)}</select></label><label>To<select onChange={(event) => setUnitTo(event.target.value)} value={unitTo}>{(unitCategory === "temperature" ? ["°C", "°F", "K"] : Object.keys(availableUnits)).map((unit) => <option key={unit}>{unit}</option>)}</select></label></div><button className="button button-primary" type="submit">Convert</button></form>}
          {active === "Calculator" && <form className="panel utility-panel" id="calculator" onSubmit={calculate}><label>Expression<input inputMode="decimal" onChange={(event) => setCalcInput(event.target.value)} value={calcInput} /></label><p className="muted-small">Supports addition, subtraction, multiplication, division, modulo, and parentheses. No code is evaluated.</p><button className="button button-primary" type="submit"><Calculator size={16} />Calculate</button>{calcError && <Notice kind="error">{calcError}</Notice>}{calcResult !== null && <div className="calculator-result"><span>Result</span><strong>{calcResult}</strong></div>}</form>}
          {active === "Print to PDF" && <section className="panel utility-panel" id="pdf"><FileText size={32} /><h3>Use your browser’s print-to-PDF</h3><p>This opens the native print dialog. Choose “Save as PDF” if your browser or system supports it. NIAR One does not upload or modify documents.</p><button className="button button-primary" onClick={() => window.print()} type="button">Print / save as PDF</button></section>}
          <p className="tool-privacy-note"><Check size={14} />This utility runs locally in your browser. <Link href="/ai">Need writing help? Try NIAR AI <ArrowRight size={13} /></Link></p>
        </div>
      </div>
    </section></main>
  );
}
