/**
 * Seeded PRNG using mulberry32 algorithm.
 * Provides deterministic random number generation for reproducible question sets.
 */

export interface RNG {
  /** Returns a float in [0, 1) */
  next(): number;
  /** Returns an integer in [min, max] (inclusive) */
  nextInt(min: number, max: number): number;
  /** Pick a random element from an array */
  pick<T>(array: T[]): T;
  /** Return a shuffled copy of the array (Fisher-Yates) */
  shuffle<T>(array: T[]): T[];
}

/**
 * cyrb53 hash — converts a string seed into a numeric seed.
 * Produces a 53-bit hash (fits safely in a JS number).
 */
function hashString(str: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  // Combine into a 32-bit integer (sufficient for mulberry32 seed)
  return (h2 >>> 0) ^ (h1 >>> 0);
}

/**
 * mulberry32 — fast 32-bit PRNG with good distribution.
 * Returns a function that produces floats in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a seeded RNG from a string seed.
 * The same seed always produces the same sequence of random numbers.
 */
export function createRng(seed: string): RNG {
  const numericSeed = hashString(seed);
  const rawNext = mulberry32(numericSeed);

  const rng: RNG = {
    next(): number {
      return rawNext();
    },

    nextInt(min: number, max: number): number {
      return min + Math.floor(rawNext() * (max - min + 1));
    },

    pick<T>(array: T[]): T {
      if (array.length === 0) {
        throw new Error('Cannot pick from empty array');
      }
      return array[Math.floor(rawNext() * array.length)];
    },

    shuffle<T>(array: T[]): T[] {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rawNext() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },
  };

  return rng;
}
