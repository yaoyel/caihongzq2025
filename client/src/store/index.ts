import { configureStore } from '@reduxjs/toolkit';
import assessmentReducer from './slices/assessmentSlice';
import reportReducer from './slices/reportSlice';
import majorListReducer from './slices/majorListSlice';
import intentionDetailReducer from './slices/intentionDetailSlice';

export const store = configureStore({
  reducer: {
    assessment: assessmentReducer,
    report: reportReducer,
    majorList: majorListReducer,
    intentionDetail: intentionDetailReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;