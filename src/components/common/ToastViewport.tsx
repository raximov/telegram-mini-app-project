import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { dismissToast } from "@/store/slices/uiSlice";

const TOAST_TIMEOUT_MS = 3500;

export const ToastViewport = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        dispatch(dismissToast(toast.id));
      }, TOAST_TIMEOUT_MS)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [dispatch, toasts]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-viewport" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => dispatch(dismissToast(toast.id))}
            aria-label="Dismiss notification"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
};
