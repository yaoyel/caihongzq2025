import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Question {
  id: number;
  content: string;
  ageRange: '4-8' | '9-14' | '14+';
}

interface Answer {
  questionId: number;
  content: string;
  submittedAt: string;
}

interface AnswerSummary {
  total: number;
  completed: number;
  answers: Answer[];
}

interface AssessmentState {
  questions: Question[];
  answers: Record<number, string>;
  summary: AnswerSummary | null;
}

const initialState: AssessmentState = {
  questions: [],
  answers: {},
  summary: null
};

const assessmentSlice = createSlice({
  name: 'assessment',
  initialState,
  reducers: {
    setQuestions: (state: AssessmentState, action: PayloadAction<Question[]>) => {
      state.questions = action.payload;
    },
    setAnswers: (state: AssessmentState, action: PayloadAction<Record<number, string>>) => {
      state.answers = action.payload;
      localStorage.setItem('assessment_answers', JSON.stringify(action.payload));
    },
    setSummary: (state: AssessmentState, action: PayloadAction<AnswerSummary>) => {
      state.summary = action.payload;
      localStorage.setItem('assessment_summary', JSON.stringify(action.payload));
    },
    loadPersistedState: (state: AssessmentState) => {
      const savedAnswers = localStorage.getItem('assessment_answers');
      const savedSummary = localStorage.getItem('assessment_summary');

      if (savedAnswers) {
        state.answers = JSON.parse(savedAnswers);
      }
      if (savedSummary) {
        state.summary = JSON.parse(savedSummary);
      }
    },
    clearAssessment: (state: AssessmentState) => {
      state.questions = [];
      state.answers = {};
      state.summary = null;
      localStorage.removeItem('assessment_answers');
      localStorage.removeItem('assessment_summary');
    }
  }
});

export const { 
  setQuestions, 
  setAnswers, 
  setSummary, 
  loadPersistedState,
  clearAssessment 
} = assessmentSlice.actions;

export default assessmentSlice.reducer;