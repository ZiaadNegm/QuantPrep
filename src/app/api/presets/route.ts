import { NextResponse } from 'next/server';
import type { Level, OperationType, NumberType } from '@/lib/generator';

const ALL_OPERATIONS: OperationType[] = ['add', 'sub', 'mul', 'div'];
const ALL_NUMBER_TYPES: NumberType[] = ['integer', 'decimal', 'fraction'];
const ALL_LEVELS: Level[] = [1, 2, 3, 4, 5];

const TEST_PRESETS = [
  {
    name: 'optiver_80_in_8',
    label: 'Optiver 80-in-8',
    description: '80 questions in 8 minutes across all levels and operations',
    questionCount: 80,
    timerDurationSeconds: 480,
    levels: ALL_LEVELS,
    operations: ALL_OPERATIONS,
    numberTypes: ALL_NUMBER_TYPES,
  },
  {
    name: 'mixed_sprint_20',
    label: 'Mixed Sprint (20)',
    description: '20 questions in 2 minutes',
    questionCount: 20,
    timerDurationSeconds: 120,
    levels: ALL_LEVELS,
    operations: ALL_OPERATIONS,
    numberTypes: ALL_NUMBER_TYPES,
  },
  {
    name: 'mixed_sprint_40',
    label: 'Mixed Sprint (40)',
    description: '40 questions in 4 minutes',
    questionCount: 40,
    timerDurationSeconds: 240,
    levels: ALL_LEVELS,
    operations: ALL_OPERATIONS,
    numberTypes: ALL_NUMBER_TYPES,
  },
  {
    name: 'fractions_decimals',
    label: 'Fractions & Decimals',
    description: '30 questions in 5 minutes, levels 3-5 with fractions and decimals',
    questionCount: 30,
    timerDurationSeconds: 300,
    levels: [3, 4, 5] as Level[],
    operations: ALL_OPERATIONS,
    numberTypes: ['decimal', 'fraction'] as NumberType[],
  },
];

export async function GET() {
  return NextResponse.json({ presets: TEST_PRESETS });
}
