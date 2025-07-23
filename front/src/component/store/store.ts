import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import complaintsReducer from "./auth/complaintsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    complaints: complaintsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>; // Типизация RootState
export type AppDispatch = typeof store.dispatch;
