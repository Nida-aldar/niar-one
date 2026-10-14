export type DataValue = string | number | null;
export type DataRecord = Record<string, DataValue>;

function signature(row: DataRecord, headers: string[]) {
  return JSON.stringify(headers.map((header) => row[header] ?? null));
}

export function countMissing(rows: DataRecord[], headers: string[]) {
  return Object.fromEntries(headers.map((header) => [
    header,
    rows.reduce((count, row) => count + (row[header] === null || row[header] === "" ? 1 : 0), 0),
  ]));
}

export function countDuplicates(rows: DataRecord[], headers: string[]) {
  const found = new Set<string>();
  let count = 0;
  for (const row of rows) {
    const key = signature(row, headers);
    if (found.has(key)) count += 1;
    else found.add(key);
  }
  return count;
}

export function removeDuplicates(rows: DataRecord[], headers: string[]) {
  const found = new Set<string>();
  return rows.filter((row) => {
    const key = signature(row, headers);
    if (found.has(key)) return false;
    found.add(key);
    return true;
  });
}

export function removeIncomplete(rows: DataRecord[], headers: string[]) {
  return rows.filter((row) => headers.every((header) => row[header] !== null && row[header] !== ""));
}

export function fillMissing(rows: DataRecord[], headers: string[], replacement: string) {
  return rows.map((row) => Object.fromEntries(headers.map((header) => [
    header, row[header] === null || row[header] === "" ? replacement : row[header],
  ])));
}

export function filterRows(rows: DataRecord[], headers: string[], query: string) {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return rows;
  return rows.filter((row) => headers.some((header) =>
    String(row[header] ?? "").toLocaleLowerCase().includes(term),
  ));
}
