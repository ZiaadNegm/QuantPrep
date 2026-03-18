/**
 * Level 4 — Very Hard (target ≤10s)
 *
 * - Fractions with unlike denominators
 * - Addition/subtraction of fractions requiring LCM
 * - Integer ÷ fraction (e.g. 25 ÷ 5/7 = 35)
 * - Fraction × fraction
 * - Keep denominators manageable (≤27)
 * - Answers as reduced fractions or integers
 */

import { gcd, lcm, reduceFraction } from '../normalization';
import type { RNG } from '../rng';
import type { OperationType, Question, VariablePosition } from '../types';

const TARGET_TIME = 10;

/** Format a fraction, reducing it. If denominator is 1, format as integer. */
function fmtFrac(num: number, den: number): string {
  const [rn, rd] = reduceFraction(num, den);
  if (rd === 1) return String(rn);
  return `${rn}/${rd}`;
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

/**
 * For fractions, we work with (numerator, denominator) pairs throughout.
 * computeAnswer returns the answer as [num, den].
 */
function computeFractionAnswer(
  aN: number, aD: number,
  bN: number, bD: number,
  cN: number, cD: number,
  op: OperationType,
  pos: VariablePosition
): [number, number] {
  // For right: answer = c
  // For left: ? op b = c => ? = inverse
  // For middle: a op ? = c => ? = inverse
  switch (pos) {
    case 'right':
      return reduceFraction(cN, cD);
    case 'left':
      switch (op) {
        case 'add': {
          // ? + b = c => ? = c - b
          const den = lcm(cD, bD);
          const num = cN * (den / cD) - bN * (den / bD);
          return reduceFraction(num, den);
        }
        case 'sub': {
          // ? - b = c => ? = c + b
          const den = lcm(cD, bD);
          const num = cN * (den / cD) + bN * (den / bD);
          return reduceFraction(num, den);
        }
        case 'mul': {
          // ? * b = c => ? = c / b = c * (bD/bN)
          return reduceFraction(cN * bD, cD * bN);
        }
        case 'div': {
          // ? / b = c => ? = c * b
          return reduceFraction(cN * bN, cD * bD);
        }
      }
      break; // eslint-disable-line no-fallthrough
    case 'middle':
      switch (op) {
        case 'add': {
          // a + ? = c => ? = c - a
          const den = lcm(cD, aD);
          const num = cN * (den / cD) - aN * (den / aD);
          return reduceFraction(num, den);
        }
        case 'sub': {
          // a - ? = c => ? = a - c
          const den = lcm(aD, cD);
          const num = aN * (den / aD) - cN * (den / cD);
          return reduceFraction(num, den);
        }
        case 'mul': {
          // a * ? = c => ? = c / a = c * (aD/aN)
          return reduceFraction(cN * aD, cD * aN);
        }
        case 'div': {
          // a / ? = c => ? = a / c = a * (cD/cN)
          return reduceFraction(aN * cD, aD * cN);
        }
      }
      break; // eslint-disable-line no-fallthrough
  }
  return reduceFraction(cN, cD);
}

/** Generate two fractions with unlike denominators that add/subtract cleanly. */
function pickFractionPair(rng: RNG): { aN: number; aD: number; bN: number; bD: number } {
  // Pick two different denominators whose LCM is manageable (≤27)
  const denomPairs: [number, number][] = [
    [2, 3], [2, 5], [3, 4], [3, 5], [4, 5], [3, 7], [4, 7],
    [2, 7], [5, 6], [3, 8], [4, 9], [5, 8], [6, 7], [8, 3],
    [5, 7], [6, 5], [8, 9], [4, 6], [3, 10], [7, 8],
  ];
  const [aD, bD] = rng.pick(denomPairs);

  // Pick numerators that are coprime with their denominators and < denominator
  const aN = rng.nextInt(1, aD - 1);
  const bN = rng.nextInt(1, bD - 1);

  return { aN, aD, bN, bD };
}

function generateAdd(rng: RNG, pos: VariablePosition): Question {
  const { aN, aD, bN, bD } = pickFractionPair(rng);

  // c = a + b
  const commonDen = lcm(aD, bD);
  const cN = aN * (commonDen / aD) + bN * (commonDen / bD);
  const cD = commonDen;
  const [rcN, rcD] = reduceFraction(cN, cD);

  const [ansN, ansD] = computeFractionAnswer(aN, aD, bN, bD, rcN, rcD, 'add', pos);
  const prompt = formatPrompt(fmtFrac(aN, aD), fmtFrac(bN, bD), fmtFrac(rcN, rcD), '+', pos);

  return {
    prompt,
    correctAnswer: fmtFrac(ansN, ansD),
    level: 4,
    operationType: 'add',
    numberType: 'fraction',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

function generateSub(rng: RNG, pos: VariablePosition): Question {
  let { aN, aD, bN, bD } = pickFractionPair(rng);

  // Ensure a > b for positive result
  const aVal = aN / aD;
  const bVal = bN / bD;
  if (aVal <= bVal) {
    // Swap
    [aN, aD, bN, bD] = [bN, bD, aN, aD];
  }

  // c = a - b
  const commonDen = lcm(aD, bD);
  const cN = aN * (commonDen / aD) - bN * (commonDen / bD);
  const cD = commonDen;
  const [rcN, rcD] = reduceFraction(cN, cD);

  const [ansN, ansD] = computeFractionAnswer(aN, aD, bN, bD, rcN, rcD, 'sub', pos);
  const prompt = formatPrompt(fmtFrac(aN, aD), fmtFrac(bN, bD), fmtFrac(rcN, rcD), '-', pos);

  return {
    prompt,
    correctAnswer: fmtFrac(ansN, ansD),
    level: 4,
    operationType: 'sub',
    numberType: 'fraction',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

function generateMul(rng: RNG, pos: VariablePosition): Question {
  // fraction x fraction
  const aD = rng.pick([2, 3, 4, 5, 6, 7, 8, 9]);
  const aN = rng.nextInt(1, aD - 1);
  const bD = rng.pick([2, 3, 4, 5, 6, 7, 8, 9]);
  const bN = rng.nextInt(1, bD - 1);

  // c = (aN*bN) / (aD*bD)
  const [rcN, rcD] = reduceFraction(aN * bN, aD * bD);
  // Verify denominator is manageable
  const [raN, raD] = reduceFraction(aN, aD);
  const [rbN, rbD] = reduceFraction(bN, bD);

  const [ansN, ansD] = computeFractionAnswer(raN, raD, rbN, rbD, rcN, rcD, 'mul', pos);
  const prompt = formatPrompt(fmtFrac(raN, raD), fmtFrac(rbN, rbD), fmtFrac(rcN, rcD), '\u00d7', pos);

  return {
    prompt,
    correctAnswer: fmtFrac(ansN, ansD),
    level: 4,
    operationType: 'mul',
    numberType: 'fraction',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

function generateDiv(rng: RNG, pos: VariablePosition): Question {
  // integer ÷ fraction = integer (or clean fraction)
  // a ÷ (bN/bD) = a * (bD/bN) = c
  // Pick values so the result is a clean integer
  const bD = rng.pick([2, 3, 4, 5, 6, 7]);
  const bN = rng.nextInt(1, bD - 1);
  // Ensure bN and bD are coprime
  const g = gcd(bN, bD);
  const rbN = bN / g;
  const rbD = bD / g;

  // a * rbD must be divisible by rbN for clean integer result
  // Pick a as a multiple of rbN
  const multiplier = rng.nextInt(2, 7);
  const a = multiplier * rbN;

  // c = a * (rbD / rbN) = multiplier * rbD
  const cVal = multiplier * rbD;

  const [ansN, ansD] = computeFractionAnswer(a, 1, rbN, rbD, cVal, 1, 'div', pos);
  const prompt = formatPrompt(
    String(a),
    fmtFrac(rbN, rbD),
    fmtFrac(cVal, 1),
    '\u00f7',
    pos
  );

  return {
    prompt,
    correctAnswer: fmtFrac(ansN, ansD),
    level: 4,
    operationType: 'div',
    numberType: 'fraction',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

export function generateL4(
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
