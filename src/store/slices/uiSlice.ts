import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AppToast } from "@/types/domain";
import { loadPersistedTheme } from "@/store/persistence";

export interface UiState {
  theme: "light" | "dark";
  online: boolean;
  globalError: string | null;
  toasts: AppToast[];
}

const initialState: UiState = {
  theme: loadPersistedTheme(),
  online: true,
  globalError: null,
  toasts: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<UiState["theme"]>) => {
      state.theme = action.payload;
    },
    setOnline: (state, action: PayloadAction<boolean>) => {
      state.online = action.payload;
    },
    setGlobalError: (state, action: PayloadAction<string | null>) => {
      state.globalError = action.payload;
    },
    pushToast: (state, action: PayloadAction<Omit<AppToast, "id">>) => {
      state.toasts.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...action.payload,
      });
    },
    dismissToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const { setTheme, setOnline, setGlobalError, pushToast, dismissToast, clearToasts } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
