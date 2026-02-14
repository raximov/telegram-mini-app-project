const readPublicEnv = (key: string, fallback: string): string => {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key] as string;
  }

  return fallback;
};

const readBoolean = (value: string): boolean => value.toLowerCase() === "true";

const readNumber = (value: string, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const appEnv = {
  apiBaseUrl: readPublicEnv("BUN_PUBLIC_API_BASE_URL", "http://127.0.0.1:8000"),
  useMockData: readBoolean(readPublicEnv("BUN_PUBLIC_USE_MOCK_DATA", "true")),
  requestTimeoutMs: readNumber(readPublicEnv("BUN_PUBLIC_REQUEST_TIMEOUT_MS", "15000"), 15000),
  requestLatencyMs: readNumber(readPublicEnv("BUN_PUBLIC_MOCK_LATENCY_MS", "220"), 220),
};

export type AppEnv = typeof appEnv;
