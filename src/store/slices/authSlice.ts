import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthSession } from "@/types/domain";
import { loadPersistedAuth } from "@/store/persistence";

export interface AuthState {
  token: string | null;
  expiresAt: string | null;
  status: "idle" | "loading";
  error: string | null;
}

const persisted = loadPersistedAuth();

const initialState: AuthState = {
  token: persisted.token,
  expiresAt: persisted.expiresAt,
  status: "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<AuthSession>) => {
      state.token = action.payload.token;
      state.expiresAt = action.payload.expiresAt;
      state.error = null;
      state.status = "idle";
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.status = action.payload ? "loading" : "idle";
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.status = "idle";
    },
    clearSession: (state) => {
      state.token = null;
      state.expiresAt = null;
      state.error = null;
      state.status = "idle";
    },
  },
});

export const { setSession, clearSession, setAuthError, setAuthLoading } = authSlice.actions;

export const authReducer = authSlice.reducer;

export const isSessionExpired = (expiresAt: string | null): boolean => {
  if (!expiresAt) {
    return true;
  }

  return Date.now() >= new Date(expiresAt).getTime();
};
