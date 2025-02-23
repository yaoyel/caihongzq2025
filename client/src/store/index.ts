import { configureStore } from '@reduxjs/toolkit';
import assessmentReducer from './slices/assessmentSlice';
import reportReducer from './slices/reportSlice';

export const store = configureStore({
  reducer: {
    assessment: assessmentReducer,
    report: reportReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;