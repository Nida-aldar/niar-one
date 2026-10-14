import assert from "node:assert/strict";
import test from "node:test";
import { evaluateExpression } from "../lib/calculator";

test("calculator respects precedence and parentheses", () => {
  assert.equal(evaluateExpression("12 * (3 + 4)"), 84);
  assert.equal(evaluateExpression("10 - 6 / 2"), 7);
  assert.equal(evaluateExpression("5 % 2"), 1);
});

test("calculator handles unary signs and whitespace", () => {
  assert.equal(evaluateExpression("  -2 + +5  "), 3);
});

test("calculator rejects incomplete, unsafe, and zero division expressions", () => {
  assert.throws(() => evaluateExpression("5 / 0"), /Division by zero/);
  assert.throws(() => evaluateExpression("(5 + 2"), /parentheses/);
  assert.throws(() => evaluateExpression("globalThis.process"), /numbers/);
  assert.throws(() => evaluateExpression("1 +"), /incomplete/);
});
