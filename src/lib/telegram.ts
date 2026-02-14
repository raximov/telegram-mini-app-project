import type { TelegramWebApp } from "@/types/domain";

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

const FALLBACK_THEME = {
  bg: "#f5f8ff",
  text: "#13203a",
  card: "#ffffff",
  hint: "#60708f",
  button: "#0e8bff",
  buttonText: "#ffffff",
};

export const getTelegramWebApp = (): TelegramWebApp | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.Telegram?.WebApp ?? null;
};

export const isTelegramWebApp = (): boolean => getTelegramWebApp() !== null;

export const getTelegramInitData = (): string => getTelegramWebApp()?.initData ?? "";

export const bootstrapTelegramWebApp = (): void => {
  const webApp = getTelegramWebApp();
  if (!webApp) {
    applyThemeVariables(null);
    return;
  }

  webApp.ready();
  webApp.expand();
  applyThemeVariables(webApp);
};

export const applyThemeVariables = (webApp: TelegramWebApp | null): void => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const params = webApp?.themeParams;

  root.style.setProperty("--tg-bg", params?.bg_color ?? FALLBACK_THEME.bg);
  root.style.setProperty("--tg-text", params?.text_color ?? FALLBACK_THEME.text);
  root.style.setProperty("--tg-card", params?.secondary_bg_color ?? FALLBACK_THEME.card);
  root.style.setProperty("--tg-hint", params?.hint_color ?? FALLBACK_THEME.hint);
  root.style.setProperty("--tg-button", params?.button_color ?? FALLBACK_THEME.button);
  root.style.setProperty("--tg-button-text", params?.button_text_color ?? FALLBACK_THEME.buttonText);

  const scheme = webApp?.colorScheme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  root.dataset.theme = scheme;
};
