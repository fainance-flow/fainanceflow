import { configureStore } from "@reduxjs/toolkit";
import auth from "@store/slices/authSlice";
import ui from "@store/slices/uiSlice";

export const store = configureStore({
  reducer: {
    auth,
    ui,
  },
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
