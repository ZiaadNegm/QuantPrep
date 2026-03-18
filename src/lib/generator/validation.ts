/**
 * Validates generated questions: removes duplicates and flags edge cases.
 */

import type { Question } from './types';

/**
 * Remove duplicate questions (same prompt text) from the list.
 * Keeps the first occurrence of each unique prompt.
 */
export function validateQuestions(questions: Question[]): Question[] {
  const seen = new Set<string>();
  const result: Question[] = [];

  for (const q of questions) {
    // Normalize prompt for comparison (trim whitespace)
    const key = q.prompt.trim();

    if (seen.has(key)) {
      continue; // Skip duplicate
    }

    seen.add(key);

    // Validate the question has a non-empty answer
    if (!q.correctAnswer || q.correctAnswer.trim() === '') {
      continue;
    }

    // Skip questions where the answer is NaN or Infinity
    if (q.correctAnswer === 'NaN' || q.correctAnswer === 'Infinity' || q.correctAnswer === '-Infinity') {
      continue;
    }

    result.push(q);
  }

  return result;
}
