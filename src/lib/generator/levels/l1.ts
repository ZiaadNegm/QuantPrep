/**
 * Level 1 — Easy (target ≤2s)
 *
 * - Addition: single-digit + single-digit, or small 2-digit + single-digit (no carrying)
 * - Subtraction: result positive, no borrowing
 * - Multiplication: single-digit x single-digit (times tables up to 9x9)
 * - Division: clean division, divisor 2-9, dividend ≤81
 * - Only integers, all results are clean integers
 */

import type { RNG } from '../rng';
import type { OperationType, Question, VariablePosition } from '../types';

const TARGET_TIME = 2;

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
  // c = a op b (for right position, answer is c)
  // For left: ? op b = c => ? = reverse(c, b)
  // For middle: a op ? = c => ? = reverse(c, a) but from other side
  switch (pos) {
    case 'right':
      return c;
    case 'left':
      // ? op b = c
      switch (op) {
        case 'add': return c - b;       // ? + b = c => ? = c - b
        case 'sub': return c + b;       // ? - b = c => ? = c + b
        case 'mul': return c / b;       // ? * b = c => ? = c / b
        case 'div': return c * b;       // ? / b = c => ? = c * b
      }
      break; // eslint-disable-line no-fallthrough
    case 'middle':
      // a op ? = c
      switch (op) {
        case 'add': return c - a;       // a + ? = c => ? = c - a
        case 'sub': return a - c;       // a - ? = c => ? = a - c
        case 'mul': return c / a;       // a * ? = c => ? = c / a
        case 'div': return a / c;       // a / ? = c => ? = a / c
      }
      break; // eslint-disable-line no-fallthrough
  }
  return c;
}

function generateAdd(rng: RNG, pos: VariablePosition): Question {
  let a: number, b: number;

  if (rng.next() < 0.5) {
    // single-digit + single-digit
    a = rng.nextInt(1, 9);
    b = rng.nextInt(1, 9);
  } else {
    // 2-digit + single-digit, no carrying
    // To avoid carrying: ones digit of a + b < 10
    const tens = rng.nextInt(1, 9);
    const onesA = rng.nextInt(0, 5);
    b = rng.nextInt(1, 9 - onesA); // ensure onesA + b <= 9
    a = tens * 10 + onesA;
  }

  const c = a + b;
  const answer = computeAnswer(a, b, c, 'add', pos);
  const prompt = formatPrompt(a, b, c, '+', pos);

  return {
    prompt,
    correctAnswer: String(answer),
    level: 1,
    operationType: 'add',
    numberType: 'integer',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

function generateSub(rng: RNG, pos: VariablePosition): Question {
  let a: number, b: number;

  if (rng.next() < 0.5) {
    // single-digit - single-digit, result >= 0
    a = rng.nextInt(1, 9);
    b = rng.nextInt(0, a);
  } else {
    // 2-digit - 1-digit or small 2-digit, no borrowing
    // No borrowing means ones(a) >= ones(b)
    const tens = rng.nextInt(1, 3);
    const onesA = rng.nextInt(1, 9);
    b = rng.nextInt(1, onesA); // ones of b <= ones of a
    a = tens * 10 + onesA;
  }

  const c = a - b;
  const answer = computeAnswer(a, b, c, 'sub', pos);
  const prompt = formatPrompt(a, b, c, '-', pos);

  return {
    prompt,
    correctAnswer: String(answer),
    level: 1,
    operationType: 'sub',
    numberType: 'integer',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

function generateMul(rng: RNG, pos: VariablePosition): Question {
  const a = rng.nextInt(2, 9);
  const b = rng.nextInt(2, 9);
  const c = a * b;
  const answer = computeAnswer(a, b, c, 'mul', pos);
  const prompt = formatPrompt(a, b, c, '\u00d7', pos);

  return {
    prompt,
    correctAnswer: String(answer),
    level: 1,
    operationType: 'mul',
    numberType: 'integer',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

function generateDiv(rng: RNG, pos: VariablePosition): Question {
  const divisor = rng.nextInt(2, 9);
  const quotient = rng.nextInt(1, Math.min(9, Math.floor(81 / divisor)));
  const dividend = divisor * quotient;

  const a = dividend;
  const b = divisor;
  const c = quotient;
  const answer = computeAnswer(a, b, c, 'div', pos);
  const prompt = formatPrompt(a, b, c, '\u00f7', pos);

  return {
    prompt,
    correctAnswer: String(answer),
    level: 1,
    operationType: 'div',
    numberType: 'integer',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

export function generateL1(
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
