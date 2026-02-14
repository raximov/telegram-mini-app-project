import { serve } from "bun";
import index from "./index.html";

const port = Number(process.env.PORT ?? process.env.BUN_PORT ?? 3000);
const runtimeConfig = {
  BUN_PUBLIC_API_BASE_URL: process.env.BUN_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  BUN_PUBLIC_USE_MOCK_DATA: process.env.BUN_PUBLIC_USE_MOCK_DATA ?? "false",
  BUN_PUBLIC_REQUEST_TIMEOUT_MS: process.env.BUN_PUBLIC_REQUEST_TIMEOUT_MS ?? "15000",
  BUN_PUBLIC_MOCK_LATENCY_MS: process.env.BUN_PUBLIC_MOCK_LATENCY_MS ?? "220",
};

const server = serve({
  port,
  routes: {
    "/runtime-config.json": new Response(
      JSON.stringify(runtimeConfig),
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    ),
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);
