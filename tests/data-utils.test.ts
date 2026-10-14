import assert from "node:assert/strict";
import test from "node:test";
import { countDuplicates, countMissing, fillMissing, filterRows, removeDuplicates, removeIncomplete } from "../lib/data-utils";

const headers = ["name", "score"];
const rows = [
  { name: "Asha", score: 4 },
  { name: "Asha", score: 4 },
  { name: "Ravi", score: null },
];

test("data quality helpers detect missing cells and exact duplicate rows", () => {
  assert.deepEqual(countMissing(rows, headers), { name: 0, score: 1 });
  assert.equal(countDuplicates(rows, headers), 1);
});

test("cleaning helpers remove duplicates/incomplete rows and fill missing cells", () => {
  assert.equal(removeDuplicates(rows, headers).length, 2);
  assert.equal(removeIncomplete(rows, headers).length, 2);
  assert.deepEqual(fillMissing(rows, headers, "0")[2], { name: "Ravi", score: "0" });
});

test("row filters search all columns case-insensitively", () => {
  assert.deepEqual(filterRows(rows, headers, "ravi"), [rows[2]]);
  assert.equal(filterRows(rows, headers, "").length, rows.length);
});
