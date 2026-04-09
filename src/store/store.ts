import { configureStore } from '@reduxjs/toolkit';
import careerReducer from './careerSlice';

export const store = configureStore({
  reducer: {
    career: careerReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
