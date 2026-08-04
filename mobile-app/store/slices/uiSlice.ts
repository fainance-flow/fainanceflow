import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UIState = {
  sidebarCollapsed: boolean;
};

const initialState: UIState = {
  sidebarCollapsed: false,
};

const slice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const { setSidebarCollapsed, toggleSidebar } = slice.actions;
export default slice.reducer;
