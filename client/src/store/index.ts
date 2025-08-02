import { configureStore } from '@reduxjs/toolkit';
import assessmentReducer from './slices/assessmentSlice';
import reportReducer from './slices/reportSlice';
import majorListReducer from './slices/majorListSlice';
import intentionDetailReducer from './slices/intentionDetailSlice';
import aiVolunteerReducer from './slices/aiVolunteerSlice';

export const store = configureStore({
  reducer: {
    assessment: assessmentReducer,
    report: reportReducer,
    majorList: majorListReducer,
    intentionDetail: intentionDetailReducer,
    aiVolunteer: aiVolunteerReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;