import { configureStore } from '@reduxjs/toolkit';
import assessmentReducer from './slices/assessmentSlice';
import reportReducer from './slices/reportSlice';
import majorListReducer from './slices/majorListSlice';

export const store = configureStore({
  reducer: {
    assessment: assessmentReducer,
    report: reportReducer,
    majorList: majorListReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;