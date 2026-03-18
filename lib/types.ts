export type Difficulty = "L1" | "L2" | "L3" | "L4" | "L5";

export type Mode = "practice" | "test";

export type SessionType = "finite" | "open-ended";

export type Operation = "addition" | "subtraction" | "multiplication" | "division";

export type NumberType = "integer" | "decimal" | "fraction" | "mixed";

export interface TestPreset {
  id: string;
  name: string;
  questionCount: number;
  timeLimit: number; // in seconds
  description?: string;
}

export interface PracticeConfig {
  mode: "practice";
  difficulty: Difficulty;
  sessionType: SessionType;
  questionCount?: number;
  timerEnabled: boolean;
  timerDuration?: number; // in seconds
  operations: Operation[];
  numberTypes: NumberType[];
}

export interface TestConfig {
  mode: "test";
  presetId: string;
  preset: TestPreset;
}

export type SessionConfig = PracticeConfig | TestConfig;

export interface Question {
  id: string;
  prompt: string;
  answer: number | string;
  operation: Operation;
  numberType: NumberType;
  difficulty: Difficulty;
}

export interface QuestionResult {
  question: Question;
  userAnswer: string | null;
  isCorrect: boolean;
  isSkipped: boolean;
  responseTime: number; // in ms
}

export interface SessionResult {
  id: string;
  config: SessionConfig;
  questions: QuestionResult[];
  score: number;
  accuracy: number;
  totalTime: number; // in ms
  averageResponseTime: number; // in ms
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  completedAt: Date;
}

export const TEST_PRESETS: TestPreset[] = [
  {
    id: "optiver-80-8",
    name: "Optiver 80 in 8",
    questionCount: 80,
    timeLimit: 480, // 8 minutes
    description: "80 questions in 8 minutes",
  },
  {
    id: "mixed-sprint-20",
    name: "Mixed Sprint 20",
    questionCount: 20,
    timeLimit: 120, // 2 minutes
    description: "20 mixed questions",
  },
  {
    id: "mixed-sprint-40",
    name: "Mixed Sprint 40",
    questionCount: 40,
    timeLimit: 240, // 4 minutes
    description: "40 mixed questions",
  },
  {
    id: "fractions-decimals",
    name: "Fractions & Decimals Drill",
    questionCount: 30,
    timeLimit: 300, // 5 minutes
    description: "Focus on fractions and decimals",
  },
];

export const DIFFICULTY_INFO: Record<Difficulty, { label: string; description: string; targetTime: string }> = {
  L1: { label: "Easy", description: "Simple one-step arithmetic", targetTime: "< 2s" },
  L2: { label: "Medium", description: "Carrying/borrowing, 2-3 digits", targetTime: "< 5s" },
  L3: { label: "Hard", description: "Decimals, equation reversing", targetTime: "< 7s" },
  L4: { label: "Very Hard", description: "Fractions, reciprocal logic", targetTime: "< 10s" },
  L5: { label: "Elite", description: "Multi-step transformations", targetTime: "< 15s" },
};

export const QUESTION_COUNTS = [10, 20, 40, 80] as const;

export const TIMER_DURATIONS = [
  { value: 120, label: "2m" },
  { value: 300, label: "5m" },
  { value: 480, label: "8m" },
  { value: 600, label: "10m" },
] as const;
