export type OperationType = 'add' | 'sub' | 'mul' | 'div';
export type NumberType = 'integer' | 'decimal' | 'fraction';
export type VariablePosition = 'left' | 'middle' | 'right';
export type Level = 1 | 2 | 3 | 4 | 5;

export interface Question {
  prompt: string;
  correctAnswer: string;
  level: Level;
  operationType: OperationType;
  numberType: NumberType;
  variablePosition: VariablePosition;
  targetTimeSeconds: number;
}

export interface GeneratorConfig {
  levels: Level[];
  operations: OperationType[];
  numberTypes: NumberType[];
  questionCount: number;
}

export interface SessionQuestions {
  questions: Question[];
  generatorVersion: string;
}

export interface DistributionSlot {
  level: Level;
  operationType: OperationType;
  numberType: NumberType;
  variablePosition: VariablePosition;
}
