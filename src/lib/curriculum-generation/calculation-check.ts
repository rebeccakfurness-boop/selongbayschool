/** Recomputes each of a calc-heavy lesson's stated worked answers from its stated inputs, flagging
 * any mismatch for the reviewing teacher (see GeneratedLesson.calculationChecks in ./types).
 * Evaluates a small, safe arithmetic subset (+, -, *, /, parentheses, decimals) via a
 * hand-written recursive-descent parser rather than eval()/Function() -- interactive_content and
 * everything a generation provider returns is generated JSON, not code that should ever run. */

export interface CalculationCheck {
  /** What this check is verifying, shown to the reviewing teacher, e.g. "Worked example step 3". */
  description: string;
  /** A plain arithmetic expression using the lesson's own stated input values, e.g. "12 * 0.15". */
  expression: string;
  /** The answer the generated content actually states -- compared against evaluating expression. */
  expectedResult: number;
}

class ExpressionError extends Error {}

function evaluateArithmetic(expr: string): number {
  const s = expr.replace(/\s+/g, '');
  let pos = 0;

  function peek(): string | undefined {
    return s[pos];
  }
  function consumeNumber(): number {
    const start = pos;
    while (pos < s.length && /[0-9.]/.test(s[pos])) pos++;
    if (pos === start) throw new ExpressionError(`Expected a number at position ${start}`);
    return Number(s.slice(start, pos));
  }
  function parseFactor(): number {
    if (peek() === '(') {
      pos++;
      const value = parseExpr();
      if (peek() !== ')') throw new ExpressionError('Expected a closing )');
      pos++;
      return value;
    }
    if (peek() === '-') {
      pos++;
      return -parseFactor();
    }
    return consumeNumber();
  }
  function parseTerm(): number {
    let value = parseFactor();
    while (peek() === '*' || peek() === '/') {
      const op = s[pos];
      pos++;
      const rhs = parseFactor();
      value = op === '*' ? value * rhs : value / rhs;
    }
    return value;
  }
  function parseExpr(): number {
    let value = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = s[pos];
      pos++;
      const rhs = parseTerm();
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }

  if (s.length === 0) throw new ExpressionError('Empty expression');
  const result = parseExpr();
  if (pos !== s.length) throw new ExpressionError(`Unexpected characters starting at position ${pos}`);
  return result;
}

const EPSILON = 1e-6;

/** One human-readable warning per check that failed to verify or didn't match, in the same order
 * as `checks` -- empty when everything checks out, never thrown (a malformed expression becomes a
 * warning for the teacher to look at, not a pipeline failure). */
export function checkCalculations(checks: CalculationCheck[]): string[] {
  const warnings: string[] = [];
  for (const check of checks) {
    try {
      const actual = evaluateArithmetic(check.expression);
      if (Math.abs(actual - check.expectedResult) > EPSILON) {
        warnings.push(
          `${check.description}: "${check.expression}" evaluates to ${actual}, but the stated answer is ${check.expectedResult}.`
        );
      }
    } catch (err) {
      warnings.push(
        `${check.description}: could not verify "${check.expression}" (${err instanceof Error ? err.message : 'invalid expression'}).`
      );
    }
  }
  return warnings;
}
