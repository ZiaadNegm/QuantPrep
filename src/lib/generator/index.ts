/**
 * Mental Math Question Generator
 *
 * Main entry point for generating a session of procedural math questions.
 * Pure TypeScript module with no database or framework dependencies.
 */

export { checkAnswer, normalizeAnswer } from './normalization';
export { createRng } from './rng';
export type {
  DistributionSlot,
  GeneratorConfig,
  Level,
  NumberType,
  OperationType,
  Question,
  SessionQuestions,
  VariablePosition,
} from './types';

import { createDistribution } from './balancer';
import { generateL1 } from './levels/l1';
import { generateL2 } from './levels/l2';
import { generateL3 } from './levels/l3';
import { generateL4 } from './levels/l4';
import { generateL5 } from './levels/l5';
import { createRng } from './rng';
import type { DistributionSlot, GeneratorConfig, Question, SessionQuestions } from './types';
import { validateQuestions } from './validation';

export const GENERATOR_VERSION = '1.0.0';

/**
 * Generate a question for a given distribution slot.
 */
function generateQuestion(slot: DistributionSlot, rng: ReturnType<typeof createRng>): Question {
  switch (slot.level) {
    case 1:
      return generateL1(slot.operationType, slot.variablePosition, rng);
    case 2:
      return generateL2(slot.operationType, slot.variablePosition, rng);
    case 3:
      return generateL3(slot.operationType, slot.variablePosition, rng);
    case 4:
      return generateL4(slot.operationType, slot.variablePosition, rng);
    case 5:
      return generateL5(slot.operationType, slot.variablePosition, slot.numberType, rng);
    default:
      return generateL1(slot.operationType, slot.variablePosition, rng);
  }
}

/**
 * Generate a complete session of mental math questions.
 *
 * @param config - Specifies which levels, operations, number types to include and how many questions
 * @param seed - String seed for deterministic generation. Same seed = same questions.
 * @returns A SessionQuestions object containing the generated questions and generator version.
 *
 * The generation process:
 * 1. Create a seeded RNG from the seed string
 * 2. Use the balancer to distribute questions across levels/operations/types
 * 3. Generate each question using the appropriate level generator
 * 4. Shuffle the final list with the seeded RNG
 * 5. Validate and deduplicate
 */
export function generateSession(config: GeneratorConfig, seed: string): SessionQuestions {
  const rng = createRng(seed);

  // Step 1: Create distribution slots
  const slots = createDistribution(config, config.questionCount, rng);

  // Step 2: Generate questions for each slot
  // Generate extra questions to account for potential dedup removal
  const overgenerate = Math.ceil(config.questionCount * 1.2);
  const extraSlots: DistributionSlot[] = [];

  // If we need more slots than distributed, create extras
  while (slots.length + extraSlots.length < overgenerate) {
    const extraBatch = createDistribution(config, overgenerate - slots.length, rng);
    extraSlots.push(...extraBatch);
  }

  const allSlots = [...slots, ...extraSlots.slice(0, overgenerate - slots.length)];

  const rawQuestions: Question[] = [];
  for (const slot of allSlots) {
    rawQuestions.push(generateQuestion(slot, rng));
  }

  // Step 3: Shuffle
  const shuffled = rng.shuffle(rawQuestions);

  // Step 4: Validate and deduplicate
  const validated = validateQuestions(shuffled);

  // Step 5: Trim to requested count
  const questions = validated.slice(0, config.questionCount);

  return {
    questions,
    generatorVersion: GENERATOR_VERSION,
  };
}
