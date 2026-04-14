import { defineConfig } from "vuloom/vite";

export default defineConfig({
  server: {
    middleware: ["server-trace"],
  },
  dev: {
    port: 3000,
  },
});
