export interface Question {
  id: number;
  content: string;
  ageRange: '4-8' | '9-14' | '14+';
}

export interface Answer {
  questionId: number;
  content: string;
  submittedAt: string;
}

export interface AnswerSummary {
  total: number;
  completed: number;
  answers: Answer[];
}

export interface Scale {
  id: number;
  content: string;
  type: 'like' | 'talent';
  direction: 'positive' | 'negative';
  dimension: '看' | '听' | '说' | '记' | '想' | '做' | '运动';
}

export interface ScaleAnswer {
  scaleId: number;
  score: number;
  submittedAt: string;
}

export interface ScaleAnswerSummary {
  total: number;
  completed: number;
  answers: ScaleAnswer[];
}

export interface AssessmentTheme {
  title: string;
  description?: string;
  questions: Question[];
  progress: {
    total: number;
    completed: number;
    percent: number;
  };
}

export interface AssessmentSection {
  title: string;
  type: 'like' | 'talent';
  direction: 'positive' | 'negative';
  color: string;
}