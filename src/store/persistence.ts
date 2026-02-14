import type { Role, UserProfile } from "@/types/domain";

const STORAGE_KEYS = {
  auth: "tma.auth",
  user: "tma.user",
  theme: "tma.theme",
};

const safeRead = <T>(key: string): T | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const safeWrite = (key: string, value: unknown): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
};

const safeRemove = (key: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
};

export interface PersistedAuthState {
  token: string | null;
  expiresAt: string | null;
}

export const loadPersistedAuth = (): PersistedAuthState => {
  const data = safeRead<PersistedAuthState>(STORAGE_KEYS.auth);
  return {
    token: data?.token ?? null,
    expiresAt: data?.expiresAt ?? null,
  };
};

export const savePersistedAuth = (state: PersistedAuthState): void => {
  if (!state.token || !state.expiresAt) {
    safeRemove(STORAGE_KEYS.auth);
    return;
  }

  safeWrite(STORAGE_KEYS.auth, state);
};

export const loadPersistedUser = (): UserProfile | null => safeRead<UserProfile>(STORAGE_KEYS.user);

export const savePersistedUser = (user: UserProfile | null): void => {
  if (!user) {
    safeRemove(STORAGE_KEYS.user);
    return;
  }

  safeWrite(STORAGE_KEYS.user, user);
};

export const loadPersistedTheme = (): "light" | "dark" => {
  const value = safeRead<string>(STORAGE_KEYS.theme);
  return value === "dark" ? "dark" : "light";
};

export const savePersistedTheme = (theme: "light" | "dark"): void => {
  safeWrite(STORAGE_KEYS.theme, theme);
};
