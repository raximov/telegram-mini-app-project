import { useEffect } from "react";
import { bootstrapTelegramWebApp } from "@/lib/telegram";
import { clearSession, isSessionExpired } from "@/store/slices/authSlice";
import { clearProfile } from "@/store/slices/userSlice";
import { clearAttempt } from "@/store/slices/attemptSlice";
import { pushToast, setOnline } from "@/store/slices/uiSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export const useSessionBootstrap = (): void => {
  const dispatch = useAppDispatch();
  const expiresAt = useAppSelector((state) => state.auth.expiresAt);
  const theme = useAppSelector((state) => state.ui.theme);

  useEffect(() => {
    bootstrapTelegramWebApp();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const handleOnline = (): void => {
      dispatch(setOnline(true));
      dispatch(pushToast({ type: "info", message: "Connection restored." }));
    };

    const handleOffline = (): void => {
      dispatch(setOnline(false));
      dispatch(pushToast({ type: "warning", message: "You are offline. Actions will fail until connection is back." }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [dispatch]);

  useEffect(() => {
    const checkSession = (): void => {
      if (!expiresAt) {
        return;
      }

      if (isSessionExpired(expiresAt)) {
        dispatch(clearSession());
        dispatch(clearProfile());
        dispatch(clearAttempt());
        dispatch(pushToast({ type: "warning", message: "Session expired. Please log in again." }));
      }
    };

    checkSession();
    const timer = window.setInterval(checkSession, 30_000);

    return () => window.clearInterval(timer);
  }, [dispatch, expiresAt]);
};
