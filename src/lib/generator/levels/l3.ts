/**
 * Level 3 — Hard (target ≤7s)
 *
 * - Decimals with 1-2 decimal places
 * - Addition/subtraction of decimals
 * - Decimal division using clean transformations
 * - Decimal multiplication
 * - Variable position unknowns are common
 * - Results should be clean (no ugly long decimal tails)
 */

import type { RNG } from '../rng';
import type { OperationType, Question, VariablePosition } from '../types';

const TARGET_TIME = 7;

/**
 * Round to avoid floating point issues, keeping up to 4 decimal places.
 */
function cleanDecimal(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/**
 * Format a decimal number, stripping trailing zeros.
 */
function fmt(n: number): string {
  const cleaned = cleanDecimal(n);
  if (Number.isInteger(cleaned)) return String(cleaned);
  // Use toFixed with enough precision then strip trailing zeros
  let s = cleaned.toFixed(4);
  s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s;
}

function formatPrompt(
  a: string,
  b: string,
  c: string,
  opSymbol: string,
  pos: VariablePosition
): string {
  switch (pos) {
    case 'right':
      return `${a} ${opSymbol} ${b} = ?`;
    case 'left':
      return `? ${opSymbol} ${b} = ${c}`;
    case 'middle':
      return `${a} ${opSymbol} ? = ${c}`;
  }
}

function computeAnswer(
  a: number,
  b: number,
  c: number,
  op: OperationType,
  pos: VariablePosition
): number {
  switch (pos) {
    case 'right':
      return c;
    case 'left':
      switch (op) {
        case 'add': return cleanDecimal(c - b);
        case 'sub': return cleanDecimal(c + b);
        case 'mul': return cleanDecimal(c / b);
        case 'div': return cleanDecimal(c * b);
      }
      break; // eslint-disable-line no-fallthrough
    case 'middle':
      switch (op) {
        case 'add': return cleanDecimal(c - a);
        case 'sub': return cleanDecimal(a - c);
        case 'mul': return cleanDecimal(c / a);
        case 'div': return cleanDecimal(a / c);
      }
      break; // eslint-disable-line no-fallthrough
  }
  return c;
}

/**
 * Generate a "clean" decimal with 1-2 decimal places.
 * Values like 0.1, 0.25, 1.5, 3.75, etc.
 */
function randomDecimal(rng: RNG, minWhole: number, maxWhole: number, allowZeroWhole: boolean): number {
  const whole = allowZeroWhole ? rng.nextInt(0, maxWhole) : rng.nextInt(minWhole, maxWhole);
  // Pick from clean decimal fractions to avoid ugly tails
  const cleanFractions = [0, 0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9];
  const frac = rng.pick(cleanFractions);
  // If whole is 0, ensure fraction is nonzero
  if (whole === 0 && frac === 0) return 0.1;
  return cleanDecimal(whole + frac);
}

function generateAdd(rng: RNG, pos: VariablePosition): Question {
  const a = randomDecimal(rng, 0, 9, true);
  const b = randomDecimal(rng, 0, 9, true);
  // Ensure both aren't zero
  const aVal = a === 0 ? 0.5 : a;
  const bVal = b === 0 ? 0.3 : b;
  const c = cleanDecimal(aVal + bVal);

  const answer = computeAnswer(aVal, bVal, c, 'add', pos);
  const prompt = formatPrompt(fmt(aVal), fmt(bVal), fmt(c), '+', pos);

  return {
    prompt,
    correctAnswer: fmt(answer),
    level: 3,
    operationType: 'add',
    numberType: 'decimal',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

function generateSub(rng: RNG, pos: VariablePosition): Question {
  let a = randomDecimal(rng, 1, 10, false);
  let b = randomDecimal(rng, 0, 5, true);
  // Ensure a > b for positive result
  if (a <= b) {
    [a, b] = [b + 1, a];
  }
  const c = cleanDecimal(a - b);

  const answer = computeAnswer(a, b, c, 'sub', pos);
  const prompt = formatPrompt(fmt(a), fmt(b), fmt(c), '-', pos);

  return {
    prompt,
    correctAnswer: fmt(answer),
    level: 3,
    operationType: 'sub',
    numberType: 'decimal',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

function generateMul(rng: RNG, pos: VariablePosition): Question {
  // Use values that multiply cleanly
  // Strategy: pick from a set of clean multiplier pairs
  const cleanPairs: [number, number][] = [
    [0.2, 0.5], [0.3, 0.4], [0.5, 0.6], [0.25, 4], [0.5, 1.5],
    [0.3, 1.5], [0.4, 2.5], [1.5, 0.8], [2.5, 0.4], [0.2, 3.5],
    [1.2, 0.5], [0.6, 1.5], [2.5, 0.2], [0.75, 4], [0.8, 0.5],
    [1.5, 6], [2.5, 3], [0.5, 7], [3.5, 2], [4.5, 2],
  ];

  const [a, b] = rng.pick(cleanPairs);
  const c = cleanDecimal(a * b);

  const answer = computeAnswer(a, b, c, 'mul', pos);
  const prompt = formatPrompt(fmt(a), fmt(b), fmt(c), '\u00d7', pos);

  return {
    prompt,
    correctAnswer: fmt(answer),
    level: 3,
    operationType: 'mul',
    numberType: 'decimal',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

function generateDiv(rng: RNG, pos: VariablePosition): Question {
  // Generate clean decimal divisions by working backwards:
  // Pick quotient and divisor, compute dividend = quotient * divisor
  const cleanQuotients = [0.5, 1, 1.5, 2, 2.25, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7.5, 8, 10];
  const cleanDivisors = [0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8, 1.5, 2, 2.5, 4, 5];

  const quotient = rng.pick(cleanQuotients);
  const divisor = rng.pick(cleanDivisors);
  const dividend = cleanDecimal(quotient * divisor);

  // Ensure dividend is a clean number
  if (dividend === 0) {
    // Fallback
    const a = 4.5;
    const b = 0.5;
    const c = 9;
    const answer = computeAnswer(a, b, c, 'div', pos);
    const prompt = formatPrompt(fmt(a), fmt(b), fmt(c), '\u00f7', pos);
    return {
      prompt,
      correctAnswer: fmt(answer),
      level: 3,
      operationType: 'div',
      numberType: 'decimal',
      variablePosition: pos,
      targetTimeSeconds: TARGET_TIME,
    };
  }

  const a = dividend;
  const b = divisor;
  const c = quotient;
  const answer = computeAnswer(a, b, c, 'div', pos);
  const prompt = formatPrompt(fmt(a), fmt(b), fmt(c), '\u00f7', pos);

  return {
    prompt,
    correctAnswer: fmt(answer),
    level: 3,
    operationType: 'div',
    numberType: 'decimal',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

export function generateL3(
  op: OperationType,
  pos: VariablePosition,
  rng: RNG
): Question {
  switch (op) {
    case 'add': return generateAdd(rng, pos);
    case 'sub': return generateSub(rng, pos);
    case 'mul': return generateMul(rng, pos);
    case 'div': return generateDiv(rng, pos);
  }
}
