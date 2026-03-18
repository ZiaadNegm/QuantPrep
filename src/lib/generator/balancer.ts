/**
 * Distributes questions evenly across levels, operations, number types,
 * and variable positions.
 */

import type { RNG } from './rng';
import type {
  DistributionSlot,
  GeneratorConfig,
  Level,
  NumberType,
  OperationType,
  VariablePosition,
} from './types';

/**
 * Valid number types per level:
 * L1-L2: integer only
 * L3: decimal only
 * L4: fraction only
 * L5: all types
 */
function getValidNumberTypes(level: Level, requestedTypes: NumberType[]): NumberType[] {
  let levelTypes: NumberType[];
  switch (level) {
    case 1:
    case 2:
      levelTypes = ['integer'];
      break;
    case 3:
      levelTypes = ['decimal'];
      break;
    case 4:
      levelTypes = ['fraction'];
      break;
    case 5:
      levelTypes = ['integer', 'decimal', 'fraction'];
      break;
    default:
      levelTypes = ['integer'];
  }
  const intersection = requestedTypes.filter((t) => levelTypes.includes(t));
  return intersection.length > 0 ? intersection : levelTypes;
}

/**
 * Pick a variable position based on level.
 * L1-L2: 80% right, 10% left, 10% middle
 * L3+: 40% right, 30% left, 30% middle
 */
function pickVariablePosition(level: Level, rng: RNG): VariablePosition {
  const r = rng.next();
  if (level <= 2) {
    if (r < 0.8) return 'right';
    if (r < 0.9) return 'left';
    return 'middle';
  } else {
    if (r < 0.4) return 'right';
    if (r < 0.7) return 'left';
    return 'middle';
  }
}

/**
 * Create an even distribution of question slots across the configured
 * levels and operations, then assign number types and variable positions.
 */
export function createDistribution(
  config: GeneratorConfig,
  count: number,
  rng: RNG
): DistributionSlot[] {
  const { levels, operations, numberTypes } = config;

  if (levels.length === 0 || operations.length === 0) {
    return [];
  }

  // Build all (level, operation) combos
  const combos: { level: Level; op: OperationType }[] = [];
  for (const level of levels) {
    for (const op of operations) {
      combos.push({ level, op });
    }
  }

  // Distribute count evenly across combos
  const base = Math.floor(count / combos.length);
  let remainder = count - base * combos.length;

  // Shuffle combos so remainder distribution is random
  const shuffled = rng.shuffle(combos);

  const slots: DistributionSlot[] = [];

  for (const combo of shuffled) {
    const qty = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;

    for (let i = 0; i < qty; i++) {
      const validTypes = getValidNumberTypes(combo.level, numberTypes);
      const numberType = rng.pick(validTypes);
      const variablePosition = pickVariablePosition(combo.level, rng);

      slots.push({
        level: combo.level,
        operationType: combo.op,
        numberType,
        variablePosition,
      });
    }
  }

  return slots;
}
