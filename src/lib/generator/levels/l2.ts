/**
 * Level 2 — Medium (target ≤5s)
 *
 * - Addition: 2-3 digit + 2 digit, carrying may occur
 * - Subtraction: 2-3 digit - 2 digit, borrowing may occur
 * - Multiplication: 2-digit x 1-digit, result ≤999
 * - Division: clean division, dividend up to ~200, divisor 2-12
 * - Only integers
 */

import type { RNG } from '../rng';
import type { OperationType, Question, VariablePosition } from '../types';

const TARGET_TIME = 5;

function formatPrompt(
  a: number | string,
  b: number | string,
  c: number | string,
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
        case 'add': return c - b;
        case 'sub': return c + b;
        case 'mul': return c / b;
        case 'div': return c * b;
      }
      break; // eslint-disable-line no-fallthrough
    case 'middle':
      switch (op) {
        case 'add': return c - a;
        case 'sub': return a - c;
        case 'mul': return c / a;
        case 'div': return a / c;
      }
      break; // eslint-disable-line no-fallthrough
  }
  return c;
}

function generateAdd(rng: RNG, pos: VariablePosition): Question {
  // 2-3 digit + 2-digit
  const a = rng.nextInt(50, 499);
  const b = rng.nextInt(10, 99);
  const c = a + b;
  const answer = computeAnswer(a, b, c, 'add', pos);
  const prompt = formatPrompt(a, b, c, '+', pos);

  return {
    prompt,
    correctAnswer: String(answer),
    level: 2,
    operationType: 'add',
    numberType: 'integer',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

function generateSub(rng: RNG, pos: VariablePosition): Question {
  // 2-3 digit - 2-digit, result positive
  const b = rng.nextInt(10, 99);
  const a = rng.nextInt(b + 1, b + 400);
  const c = a - b;
  const answer = computeAnswer(a, b, c, 'sub', pos);
  const prompt = formatPrompt(a, b, c, '-', pos);

  return {
    prompt,
    correctAnswer: String(answer),
    level: 2,
    operationType: 'sub',
    numberType: 'integer',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

function generateMul(rng: RNG, pos: VariablePosition): Question {
  // 2-digit x 1-digit, result ≤999
  const b = rng.nextInt(2, 9);
  const maxA = Math.min(99, Math.floor(999 / b));
  const a = rng.nextInt(10, maxA);
  const c = a * b;
  const answer = computeAnswer(a, b, c, 'mul', pos);
  const prompt = formatPrompt(a, b, c, '\u00d7', pos);

  return {
    prompt,
    correctAnswer: String(answer),
    level: 2,
    operationType: 'mul',
    numberType: 'integer',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

function generateDiv(rng: RNG, pos: VariablePosition): Question {
  // Clean division, dividend up to ~200, divisor 2-12
  const divisor = rng.nextInt(2, 12);
  const quotient = rng.nextInt(2, Math.floor(200 / divisor));
  const dividend = divisor * quotient;

  const a = dividend;
  const b = divisor;
  const c = quotient;
  const answer = computeAnswer(a, b, c, 'div', pos);
  const prompt = formatPrompt(a, b, c, '\u00f7', pos);

  return {
    prompt,
    correctAnswer: String(answer),
    level: 2,
    operationType: 'div',
    numberType: 'integer',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

export function generateL2(
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
