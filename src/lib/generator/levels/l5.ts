/**
 * Level 5 — Elite (target ≤15s)
 *
 * - Larger multiplication (2-digit x 2-digit)
 * - Factor/power recognition (e.g. 49 x ? = 343)
 * - Mixed decimal/fraction (e.g. 0.3 - 4/7)
 * - Division requiring chunking (e.g. 198 ÷ 9)
 * - Decimal x unknown (e.g. ? x 0.13 = 14.3)
 * - Results should be tractable for mental math
 */

import { gcd, reduceFraction } from '../normalization';
import type { RNG } from '../rng';
import type { NumberType, OperationType, Question, VariablePosition } from '../types';

const TARGET_TIME = 15;

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

function cleanDecimal(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function fmtNum(n: number): string {
  const cleaned = cleanDecimal(n);
  if (Number.isInteger(cleaned)) return String(cleaned);
  let s = cleaned.toFixed(4);
  s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s;
}

function fmtFrac(num: number, den: number): string {
  const [rn, rd] = reduceFraction(num, den);
  if (rd === 1) return String(rn);
  return `${rn}/${rd}`;
}

// --- Multiplication generators ---

function generateLargeMul(rng: RNG, pos: VariablePosition): Question {
  // 2-digit x 2-digit
  const a = rng.nextInt(11, 29);
  const b = rng.nextInt(11, 29);
  const c = a * b;

  let answer: number;
  switch (pos) {
    case 'right': answer = c; break;
    case 'left': answer = c / b; break;
    case 'middle': answer = c / a; break;
  }

  const prompt = formatPrompt(String(a), String(b), String(c), '\u00d7', pos);
  return {
    prompt,
    correctAnswer: String(answer!),
    level: 5,
    operationType: 'mul',
    numberType: 'integer',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

function generateFactorRecognition(rng: RNG, pos: VariablePosition): Question {
  // a x ? = c where a and c have a recognizable relationship
  // Use perfect squares/cubes: e.g. 7^2=49, 7^3=343 => 49 x 7 = 343
  const bases: { base: number; square: number; cube: number }[] = [
    { base: 3, square: 9, cube: 27 },
    { base: 4, square: 16, cube: 64 },
    { base: 5, square: 25, cube: 125 },
    { base: 6, square: 36, cube: 216 },
    { base: 7, square: 49, cube: 343 },
    { base: 8, square: 64, cube: 512 },
    { base: 9, square: 81, cube: 729 },
  ];

  const { base, square, cube } = rng.pick(bases);

  // square x base = cube (always use middle position for factor recognition)
  const effectivePos = pos === 'right' ? 'middle' : pos;
  const a = square;
  const b = base;
  const c = cube;

  const answer = effectivePos === 'left' ? c / b : c / a;

  const prompt = formatPrompt(String(a), String(b), String(c), '\u00d7', effectivePos);
  return {
    prompt,
    correctAnswer: String(answer),
    level: 5,
    operationType: 'mul',
    numberType: 'integer',
    variablePosition: effectivePos,
    targetTimeSeconds: TARGET_TIME,
  };
}

// --- Division generators ---

function generateChunkingDiv(rng: RNG, pos: VariablePosition): Question {
  // Large dividend ÷ single digit requiring chunking
  const divisor = rng.pick([3, 4, 6, 7, 8, 9]);
  const quotient = rng.nextInt(15, 50);
  const dividend = divisor * quotient;

  let answer: number;
  switch (pos) {
    case 'right': answer = quotient; break;
    case 'left': answer = quotient * divisor; break;  // ? / divisor = quotient => ? = quotient * divisor = dividend
    case 'middle': answer = dividend / quotient; break; // dividend / ? = quotient => ? = divisor
  }

  const prompt = formatPrompt(String(dividend), String(divisor), String(quotient), '\u00f7', pos);
  return {
    prompt,
    correctAnswer: String(answer!),
    level: 5,
    operationType: 'div',
    numberType: 'integer',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

// --- Mixed decimal/fraction generators ---

function decimalToFraction(d: number): [number, number] {
  // Convert a clean decimal to a fraction
  // Multiply by 10000 then reduce
  const sign = d < 0 ? -1 : 1;
  const abs = Math.abs(d);
  const str = abs.toFixed(4).replace(/0+$/, '');
  const dotIndex = str.indexOf('.');
  if (dotIndex === -1) return [d, 1];
  const decPlaces = str.length - dotIndex - 1;
  const den = Math.pow(10, decPlaces);
  const num = Math.round(abs * den);
  const g = gcd(num, den);
  return [sign * num / g, den / g];
}

function generateMixedAddSub(rng: RNG, pos: VariablePosition): Question {
  // decimal +/- fraction
  const isSub = rng.next() < 0.5;
  const op: OperationType = isSub ? 'sub' : 'add';
  const opSymbol = isSub ? '-' : '+';

  // Pick a clean decimal
  const decValues = [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8, 1.5, 2.5];
  let decVal = rng.pick(decValues);

  // Pick a fraction
  const fracDen = rng.pick([3, 4, 5, 6, 7, 8]);
  const fracNum = rng.nextInt(1, fracDen - 1);
  const [rfN, rfD] = reduceFraction(fracNum, fracDen);
  const fracVal = rfN / rfD;

  // For subtraction, ensure positive result by picking a larger clean decimal
  if (isSub && decVal <= fracVal) {
    const largerDecimals = [1.5, 2.5, 3.5, 4.5, 5.0, 5.5];
    decVal = largerDecimals.find(d => d > fracVal) ?? 5.0;
  }

  // Compute result as a fraction for exact answer
  const [dN, dD] = decimalToFraction(decVal);
  let resultN: number, resultD: number;
  const commonD = dD * rfD / gcd(dD, rfD); // LCM
  if (isSub) {
    resultN = dN * (commonD / dD) - rfN * (commonD / rfD);
  } else {
    resultN = dN * (commonD / dD) + rfN * (commonD / rfD);
  }
  resultD = commonD;
  const [rrN, rrD] = reduceFraction(resultN, resultD);

  // Check if result is a clean decimal or fraction
  const resultVal = rrN / rrD;
  const isCleanDecimal = Math.abs(resultVal - cleanDecimal(resultVal)) < 1e-9 &&
    (rrD === 1 || rrD === 2 || rrD === 4 || rrD === 5 || rrD === 10 || rrD === 20 || rrD === 25 || rrD === 50 || rrD === 100);

  const resultStr = isCleanDecimal ? fmtNum(resultVal) : fmtFrac(rrN, rrD);

  // For variable position, compute the answer
  let answerStr: string;
  switch (pos) {
    case 'right':
      answerStr = resultStr;
      break;
    case 'left':
      // ? op frac = result => ? = result inv_op frac
      if (isSub) {
        // ? - frac = result => ? = result + frac
        const ansN = rrN * (commonD / rrD) + rfN * (commonD / rfD);
        const [an, ad] = reduceFraction(ansN, commonD);
        const av = an / ad;
        answerStr = (ad === 1 || ad === 2 || ad === 4 || ad === 5 || ad === 10) ? fmtNum(av) : fmtFrac(an, ad);
      } else {
        // ? + frac = result => ? = result - frac
        const ansN = rrN * (commonD / rrD) - rfN * (commonD / rfD);
        const [an, ad] = reduceFraction(ansN, commonD);
        const av = an / ad;
        answerStr = (ad === 1 || ad === 2 || ad === 4 || ad === 5 || ad === 10) ? fmtNum(av) : fmtFrac(an, ad);
      }
      break;
    case 'middle':
      // dec op ? = result => ? = dec inv_op result... but ? is the fraction
      answerStr = fmtFrac(rfN, rfD);
      break;
  }

  const prompt = formatPrompt(fmtNum(decVal), fmtFrac(rfN, rfD), resultStr, opSymbol, pos);

  return {
    prompt,
    correctAnswer: answerStr!,
    level: 5,
    operationType: op,
    numberType: 'fraction',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}

function generateDecimalMulUnknown(rng: RNG, pos: VariablePosition): Question {
  // ? x 0.13 = 14.3 style
  // Work backwards: pick integer-ish answer and a decimal multiplier
  const cleanMultipliers = [0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.25, 0.33, 0.125];
  const multiplier = rng.pick(cleanMultipliers);

  // Pick a "nice" unknown that produces a clean product
  // unknown * multiplier should be clean
  // Use multiples of 10 or 100 to keep products clean
  const unknown = rng.nextInt(5, 30) * 10;
  const product = cleanDecimal(unknown * multiplier);

  // Force middle position for "? x decimal = product" pattern
  const effectivePos: VariablePosition = pos === 'right' ? 'left' : pos;

  const answer = effectivePos === 'left'
    ? cleanDecimal(product / multiplier)
    : multiplier; // middle

  const prompt = formatPrompt(
    fmtNum(unknown),
    fmtNum(multiplier),
    fmtNum(product),
    '\u00d7',
    effectivePos
  );

  return {
    prompt,
    correctAnswer: fmtNum(answer!),
    level: 5,
    operationType: 'mul',
    numberType: 'decimal',
    variablePosition: effectivePos,
    targetTimeSeconds: TARGET_TIME,
  };
}

export function generateL5(
  op: OperationType,
  pos: VariablePosition,
  numberType: NumberType,
  rng: RNG
): Question {
  switch (op) {
    case 'mul':
      if (numberType === 'decimal') return generateDecimalMulUnknown(rng, pos);
      if (numberType === 'fraction') return generateMixedAddSub(rng, pos); // fallback
      // Integer mul: mix of large mul and factor recognition
      if (rng.next() < 0.5) return generateLargeMul(rng, pos);
      return generateFactorRecognition(rng, pos);

    case 'div':
      if (numberType === 'fraction') return generateMixedAddSub(rng, pos); // fallback
      return generateChunkingDiv(rng, pos);

    case 'add':
    case 'sub':
      if (numberType === 'fraction' || numberType === 'decimal') {
        return generateMixedAddSub(rng, pos);
      }
      // Integer add/sub at L5: large numbers
      return generateLargeIntegerAddSub(op, rng, pos);
  }
}

function generateLargeIntegerAddSub(
  op: OperationType,
  rng: RNG,
  pos: VariablePosition
): Question {
  const a = rng.nextInt(100, 999);
  const b = rng.nextInt(100, 999);

  let c: number;
  let opSymbol: string;
  if (op === 'add') {
    c = a + b;
    opSymbol = '+';
  } else {
    // Ensure positive
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    c = big - small;
    const prompt = formatPrompt(String(big), String(small), String(c), '-', pos);
    let answer: number;
    switch (pos) {
      case 'right': answer = c; break;
      case 'left': answer = c + small; break;
      case 'middle': answer = big - c; break;
    }
    return {
      prompt,
      correctAnswer: String(answer!),
      level: 5,
      operationType: op,
      numberType: 'integer',
      variablePosition: pos,
      targetTimeSeconds: TARGET_TIME,
    };
  }

  let answer: number;
  switch (pos) {
    case 'right': answer = c; break;
    case 'left': answer = c - b; break;
    case 'middle': answer = c - a; break;
  }

  const prompt = formatPrompt(String(a), String(b), String(c), opSymbol, pos);
  return {
    prompt,
    correctAnswer: String(answer!),
    level: 5,
    operationType: op,
    numberType: 'integer',
    variablePosition: pos,
    targetTimeSeconds: TARGET_TIME,
  };
}
