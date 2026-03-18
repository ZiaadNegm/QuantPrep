/**
 * Answer normalization and comparison for mental math answers.
 * Handles integers, decimals, fractions, and negative values.
 */

/** Greatest common divisor using Euclidean algorithm */
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

/** Least common multiple */
export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

/**
 * Reduce a fraction to lowest terms.
 * Returns [numerator, denominator] with denominator always positive.
 */
export function reduceFraction(num: number, den: number): [number, number] {
  if (den === 0) throw new Error('Division by zero');
  // Ensure denominator is positive
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const d = gcd(Math.abs(num), den);
  return [num / d, den / d];
}

/**
 * Normalize an answer string to a canonical form.
 *
 * Rules:
 * - Trim whitespace
 * - ".5" becomes "0.5"
 * - Strip trailing zeros from decimals: "2.50" -> "2.5", "3.0" -> "3"
 * - Reduce fractions to lowest terms: "4/6" -> "2/3"
 * - Fractions that are whole numbers become integers: "6/3" -> "2"
 * - Handle negative values consistently: "-1/3" not "1/-3"
 */
export function normalizeAnswer(input: string): string {
  let s = input.trim();
  if (s === '') return s;

  // Check for negative sign
  const negative = s.startsWith('-');
  if (negative) s = s.slice(1).trim();

  // Handle fraction: a/b
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 2) {
      const num = parseFloat(parts[0].trim());
      const den = parseFloat(parts[1].trim());
      if (!isNaN(num) && !isNaN(den) && den !== 0 && Number.isInteger(num) && Number.isInteger(den)) {
        const signedNum = negative ? -num : num;
        const [rNum, rDen] = reduceFraction(signedNum, den);
        if (rDen === 1) {
          return String(rNum);
        }
        return `${rNum}/${rDen}`;
      }
    }
  }

  // Handle decimal or integer
  let numVal = parseFloat(s);
  if (isNaN(numVal)) return input.trim();

  if (negative) numVal = -numVal;

  // If it's effectively an integer, return as integer
  if (Number.isInteger(numVal)) {
    return String(numVal);
  }

  // Strip trailing zeros from decimal representation
  // Use toFixed with enough precision, then strip
  let result = numVal.toString();

  // Handle cases like "0.10" → already handled by parseFloat
  // But ensure no floating point artifacts
  // Round to 10 decimal places to avoid float issues
  const rounded = parseFloat(numVal.toFixed(10));
  result = rounded.toString();

  // Remove trailing zeros after decimal point
  if (result.includes('.')) {
    result = result.replace(/\.?0+$/, '');
  }

  return result;
}

/**
 * Check if a user's answer matches the correct answer.
 * Normalizes both before comparing.
 */
export function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  if (normalizedUser === normalizedCorrect) return true;

  // Also try numeric comparison for decimal/fraction equivalence
  // e.g., user enters "0.5" but correct is "1/2"
  const userVal = parseNumericValue(normalizedUser);
  const correctVal = parseNumericValue(normalizedCorrect);

  if (userVal !== null && correctVal !== null) {
    return Math.abs(userVal - correctVal) < 1e-9;
  }

  return false;
}

/**
 * Parse a normalized string to a numeric value.
 * Handles integers, decimals, and fractions.
 */
function parseNumericValue(s: string): number | null {
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 2) {
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return num / den;
      }
    }
    return null;
  }
  const val = parseFloat(s);
  return isNaN(val) ? null : val;
}
