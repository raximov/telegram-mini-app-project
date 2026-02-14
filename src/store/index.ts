import { configureStore, isRejectedWithValue, type Middleware } from "@reduxjs/toolkit";
import { api } from "@/store/api/api";
import { authReducer, clearSession } from "@/store/slices/authSlice";
import { userReducer, clearProfile } from "@/store/slices/userSlice";
import { testReducer } from "@/store/slices/testSlice";
import { attemptReducer, clearAttempt } from "@/store/slices/attemptSlice";
import { uiReducer, pushToast, setGlobalError } from "@/store/slices/uiSlice";
import { savePersistedAuth, savePersistedTheme, savePersistedUser } from "@/store/persistence";

const rtkQueryErrorMiddleware: Middleware = (storeApi) => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const payload = action.payload as { data?: { detail?: string }; status?: number };
    const detail = payload?.data?.detail ?? "Request failed.";

    if (payload?.status === 401) {
      storeApi.dispatch(clearSession());
      storeApi.dispatch(clearProfile());
      storeApi.dispatch(clearAttempt());
    }

    storeApi.dispatch(setGlobalError(detail));
    storeApi.dispatch(
      pushToast({
        type: payload?.status === 401 ? "warning" : "error",
        message: detail,
      })
    );
  }

  return next(action);
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    test: testReducer,
    attempt: attemptReducer,
    ui: uiReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }).concat(api.middleware, rtkQueryErrorMiddleware),
});

store.subscribe(() => {
  const state = store.getState();
  savePersistedAuth({ token: state.auth.token, expiresAt: state.auth.expiresAt });
  savePersistedUser(state.user.profile);
  savePersistedTheme(state.ui.theme);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
