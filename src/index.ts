import { serve } from "bun";
import index from "./index.html";

const port = Number(process.env.PORT ?? process.env.BUN_PORT ?? 3000);

const server = serve({
  port,
  routes: {
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);
