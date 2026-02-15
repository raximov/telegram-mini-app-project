import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "dist");

const runtimeConfig = {
  BUN_PUBLIC_API_BASE_URL: process.env.BUN_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  BUN_PUBLIC_USE_MOCK_DATA: process.env.BUN_PUBLIC_USE_MOCK_DATA ?? "false",
  BUN_PUBLIC_REQUEST_TIMEOUT_MS: process.env.BUN_PUBLIC_REQUEST_TIMEOUT_MS ?? "15000",
  BUN_PUBLIC_MOCK_LATENCY_MS: process.env.BUN_PUBLIC_MOCK_LATENCY_MS ?? "220",
};

await mkdir(outputDir, { recursive: true });
await writeFile(
  path.join(outputDir, "runtime-config.json"),
  `${JSON.stringify(runtimeConfig, null, 2)}\n`,
  "utf8",
);

console.log("Wrote dist/runtime-config.json");
