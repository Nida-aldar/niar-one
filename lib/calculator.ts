const tokenPattern = /\s*(?:(\d+(?:\.\d*)?|\.\d+)|([()+\-*/%]))/gy;

export function evaluateExpression(expression: string) {
  expression = expression.trim();
  if (!expression) throw new Error("Enter a calculation first.");
  const tokens: (number | string)[] = [];
  let position = 0;
  while (position < expression.length) {
    tokenPattern.lastIndex = position;
    const match = tokenPattern.exec(expression);
    if (!match) throw new Error("Use numbers, parentheses, and + − × ÷ % operators only.");
    tokens.push(match[1] ? Number(match[1]) : match[2]);
    position = tokenPattern.lastIndex;
  }
  if (!tokens.length) throw new Error("Enter a calculation first.");

  let index = 0;
  const peek = () => tokens[index];
  const consume = () => tokens[index++];
  const primary = (): number => {
    const token = consume();
    if (token === "+") return primary();
    if (token === "-") return -primary();
    if (token === "(") {
      const value = expressionValue();
      if (consume() !== ")") throw new Error("Check that your parentheses are balanced.");
      return value;
    }
    if (typeof token === "number") return token;
    throw new Error("The calculation is incomplete.");
  };
  const term = (): number => {
    let value = primary();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const operator = consume();
      const right = primary();
      if (operator === "*" ) value *= right;
      else if (operator === "/") {
        if (right === 0) throw new Error("Division by zero is not allowed.");
        value /= right;
      } else {
        if (right === 0) throw new Error("Modulo by zero is not allowed.");
        value %= right;
      }
    }
    return value;
  };
  const expressionValue = (): number => {
    let value = term();
    while (peek() === "+" || peek() === "-") {
      const operator = consume();
      const right = term();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  };

  const result = expressionValue();
  if (index !== tokens.length) throw new Error("The calculation contains an unexpected operator.");
  if (!Number.isFinite(result)) throw new Error("The result is outside the supported numeric range.");
  return Number(result.toPrecision(12));
}
