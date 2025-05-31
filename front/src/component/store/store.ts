import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>; // Типизация RootState
export type AppDispatch = typeof store.dispatch;
