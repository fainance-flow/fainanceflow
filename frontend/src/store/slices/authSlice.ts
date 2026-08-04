import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@utils/types";

type AuthState = {
  user: User | null;
  status: "idle" | "authenticating" | "authenticated" | "anonymous";
};

const initialState: AuthState = {
  user: null,
  status: "idle",
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authStart(state) {
      state.status = "authenticating";
    },
    authSuccess(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.status = "authenticated";
    },
    authClear(state) {
      state.user = null;
      state.status = "anonymous";
    },
  },
});

export const { authStart, authSuccess, authClear } = slice.actions;
export default slice.reducer;
