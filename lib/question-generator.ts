import { Difficulty, Operation, NumberType, Question } from "./types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function simplifyFraction(num: number, den: number): [number, number] {
  const g = gcd(Math.abs(num), Math.abs(den));
  return [num / g, den / g];
}

function formatFraction(num: number, den: number): string {
  const [n, d] = simplifyFraction(num, den);
  if (d === 1) return n.toString();
  return `${n}/${d}`;
}

interface GeneratorConfig {
  difficulty: Difficulty;
  operations: Operation[];
  numberTypes: NumberType[];
}

export function generateQuestion(config: GeneratorConfig): Question {
  const operation = randomChoice(config.operations);
  const numberType = randomChoice(config.numberTypes);
  
  let prompt: string;
  let answer: number | string;
  
  switch (config.difficulty) {
    case "L1":
      ({ prompt, answer } = generateL1(operation, numberType));
      break;
    case "L2":
      ({ prompt, answer } = generateL2(operation, numberType));
      break;
    case "L3":
      ({ prompt, answer } = generateL3(operation, numberType));
      break;
    case "L4":
      ({ prompt, answer } = generateL4(operation, numberType));
      break;
    case "L5":
      ({ prompt, answer } = generateL5(operation, numberType));
      break;
    default:
      ({ prompt, answer } = generateL1(operation, numberType));
  }
  
  return {
    id: generateId(),
    prompt,
    answer,
    operation,
    numberType,
    difficulty: config.difficulty,
  };
}

function generateL1(operation: Operation, numberType: NumberType): { prompt: string; answer: number | string } {
  // Simple single-digit or small two-digit operations
  let a: number, b: number, prompt: string, answer: number | string;
  
  if (numberType === "fraction" || numberType === "mixed") {
    // Simple fraction for L1: same denominator
    const den = randomChoice([2, 4, 5]);
    const numA = randomInt(1, den - 1);
    const numB = randomInt(1, den - 1);
    
    if (operation === "addition") {
      prompt = `${numA}/${den} + ${numB}/${den}`;
      const resultNum = numA + numB;
      answer = formatFraction(resultNum, den);
    } else if (operation === "subtraction") {
      const larger = Math.max(numA, numB);
      const smaller = Math.min(numA, numB);
      prompt = `${larger}/${den} - ${smaller}/${den}`;
      answer = formatFraction(larger - smaller, den);
    } else {
      // For mult/div at L1 with fractions, use integers instead
      a = randomInt(1, 9);
      b = randomInt(1, 9);
      if (operation === "multiplication") {
        prompt = `${a} × ${b}`;
        answer = a * b;
      } else {
        const product = a * b;
        prompt = `${product} ÷ ${a}`;
        answer = b;
      }
    }
  } else {
    a = randomInt(1, 12);
    b = randomInt(1, 12);
    
    switch (operation) {
      case "addition":
        prompt = `${a} + ${b}`;
        answer = a + b;
        break;
      case "subtraction":
        if (a < b) [a, b] = [b, a];
        prompt = `${a} - ${b}`;
        answer = a - b;
        break;
      case "multiplication":
        prompt = `${a} × ${b}`;
        answer = a * b;
        break;
      case "division":
        const product = a * b;
        prompt = `${product} ÷ ${a}`;
        answer = b;
        break;
    }
  }
  
  return { prompt, answer };
}

function generateL2(operation: Operation, numberType: NumberType): { prompt: string; answer: number | string } {
  // 2-3 digit operations with carrying/borrowing
  let a: number, b: number, prompt: string, answer: number | string;
  
  if (numberType === "decimal") {
    a = randomInt(10, 99);
    b = randomInt(1, 9);
    
    switch (operation) {
      case "addition":
        prompt = `${a} + ${b}`;
        answer = a + b;
        break;
      case "subtraction":
        prompt = `${a} - ${b}`;
        answer = a - b;
        break;
      case "multiplication":
        a = randomInt(10, 25);
        prompt = `${a} × ${b}`;
        answer = a * b;
        break;
      case "division":
        a = randomInt(2, 9);
        const product = a * randomInt(10, 20);
        prompt = `${product} ÷ ${a}`;
        answer = product / a;
        break;
    }
  } else {
    a = randomInt(10, 99);
    b = randomInt(10, 99);
    
    switch (operation) {
      case "addition":
        prompt = `${a} + ${b}`;
        answer = a + b;
        break;
      case "subtraction":
        if (a < b) [a, b] = [b, a];
        prompt = `${a} - ${b}`;
        answer = a - b;
        break;
      case "multiplication":
        a = randomInt(10, 25);
        b = randomInt(2, 9);
        prompt = `${a} × ${b}`;
        answer = a * b;
        break;
      case "division":
        b = randomInt(2, 12);
        const quotient = randomInt(10, 25);
        a = b * quotient;
        prompt = `${a} ÷ ${b}`;
        answer = quotient;
        break;
    }
  }
  
  return { prompt, answer };
}

function generateL3(operation: Operation, numberType: NumberType): { prompt: string; answer: number | string } {
  // Decimals, unknown placement
  let prompt: string, answer: number | string;
  
  if (numberType === "decimal" || numberType === "mixed") {
    const a = (randomInt(10, 99) / 10).toFixed(1);
    const b = (randomInt(10, 99) / 10).toFixed(1);
    
    switch (operation) {
      case "addition":
        prompt = `${a} + ${b}`;
        answer = (parseFloat(a) + parseFloat(b)).toFixed(1);
        break;
      case "subtraction":
        const larger = Math.max(parseFloat(a), parseFloat(b));
        const smaller = Math.min(parseFloat(a), parseFloat(b));
        prompt = `${larger.toFixed(1)} - ${smaller.toFixed(1)}`;
        answer = (larger - smaller).toFixed(1);
        break;
      case "multiplication":
        const m = randomInt(1, 9);
        const n = (randomInt(10, 50) / 10).toFixed(1);
        prompt = `${m} × ${n}`;
        answer = (m * parseFloat(n)).toFixed(1);
        break;
      case "division":
        const divisor = randomInt(2, 5);
        const quotient = (randomInt(10, 50) / 10).toFixed(1);
        const dividend = (divisor * parseFloat(quotient)).toFixed(1);
        prompt = `${dividend} ÷ ${divisor}`;
        answer = quotient;
        break;
    }
  } else {
    // Unknown placement: ? + 15 = 42
    const result = randomInt(50, 150);
    const known = randomInt(10, result - 10);
    const unknown = result - known;
    
    switch (operation) {
      case "addition":
        prompt = `? + ${known} = ${result}`;
        answer = unknown;
        break;
      case "subtraction":
        prompt = `${result} - ? = ${known}`;
        answer = unknown;
        break;
      case "multiplication":
        const m = randomInt(2, 9);
        const n = randomInt(10, 20);
        prompt = `? × ${m} = ${m * n}`;
        answer = n;
        break;
      case "division":
        const d = randomInt(2, 9);
        const q = randomInt(10, 20);
        prompt = `? ÷ ${d} = ${q}`;
        answer = d * q;
        break;
    }
  }
  
  return { prompt, answer };
}

function generateL4(operation: Operation, numberType: NumberType): { prompt: string; answer: number | string } {
  // Fractions, reciprocal logic
  let prompt: string, answer: number | string;
  
  if (numberType === "fraction" || numberType === "mixed") {
    const den1 = randomChoice([2, 3, 4, 5, 6]);
    const den2 = randomChoice([2, 3, 4, 5, 6]);
    const num1 = randomInt(1, den1 - 1);
    const num2 = randomInt(1, den2 - 1);
    
    switch (operation) {
      case "addition":
        prompt = `${num1}/${den1} + ${num2}/${den2}`;
        const addResult = (num1 * den2 + num2 * den1);
        const addDen = den1 * den2;
        answer = formatFraction(addResult, addDen);
        break;
      case "subtraction":
        const larger = num1 / den1 > num2 / den2 ? [num1, den1] : [num2, den2];
        const smaller = num1 / den1 > num2 / den2 ? [num2, den2] : [num1, den1];
        prompt = `${larger[0]}/${larger[1]} - ${smaller[0]}/${smaller[1]}`;
        const subResult = larger[0] * smaller[1] - smaller[0] * larger[1];
        const subDen = larger[1] * smaller[1];
        answer = formatFraction(subResult, subDen);
        break;
      case "multiplication":
        prompt = `${num1}/${den1} × ${num2}/${den2}`;
        answer = formatFraction(num1 * num2, den1 * den2);
        break;
      case "division":
        prompt = `${num1}/${den1} ÷ ${num2}/${den2}`;
        answer = formatFraction(num1 * den2, den1 * num2);
        break;
    }
  } else {
    // Complex integer operations
    const a = randomInt(25, 75);
    const b = randomInt(25, 75);
    
    switch (operation) {
      case "addition":
        prompt = `${a} + ${b}`;
        answer = a + b;
        break;
      case "subtraction":
        prompt = `${Math.max(a, b)} - ${Math.min(a, b)}`;
        answer = Math.abs(a - b);
        break;
      case "multiplication":
        const m = randomInt(12, 25);
        const n = randomInt(4, 9);
        prompt = `${m} × ${n}`;
        answer = m * n;
        break;
      case "division":
        const d = randomInt(7, 15);
        const q = randomInt(7, 15);
        prompt = `${d * q} ÷ ${d}`;
        answer = q;
        break;
    }
  }
  
  return { prompt, answer };
}

function generateL5(operation: Operation, numberType: NumberType): { prompt: string; answer: number | string } {
  // Hardest: multi-step, pattern recognition
  let prompt: string, answer: number | string;
  
  // Multi-step operations
  const a = randomInt(10, 30);
  const b = randomInt(5, 15);
  const c = randomInt(2, 8);
  
  const patterns = [
    () => {
      prompt = `${a} × ${b} + ${c * 10}`;
      answer = a * b + c * 10;
    },
    () => {
      prompt = `${a * b} ÷ ${a} + ${c}`;
      answer = b + c;
    },
    () => {
      const sq = randomInt(11, 19);
      prompt = `${sq}²`;
      answer = sq * sq;
    },
    () => {
      const base = randomInt(2, 5);
      const exp = randomInt(3, 4);
      prompt = `${base}^${exp}`;
      answer = Math.pow(base, exp);
    },
    () => {
      const pct = randomChoice([10, 15, 20, 25]);
      const value = randomInt(100, 500);
      prompt = `${pct}% of ${value}`;
      answer = (pct / 100) * value;
    },
  ];
  
  randomChoice(patterns)();
  
  return { prompt, answer };
}

export function generateQuestionSet(
  config: GeneratorConfig,
  count: number
): Question[] {
  return Array.from({ length: count }, () => generateQuestion(config));
}
