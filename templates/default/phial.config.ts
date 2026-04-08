import { defineConfig } from "phial/vite";

export default defineConfig({
  server: {
    middleware: ["server-trace"],
  },
  dev: {
    port: 3000,
  },
});
