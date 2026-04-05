import { defineConfig } from "phial/vite-plugin";

export default defineConfig({
  server: {
    middleware: ["server-trace"],
  },
  dev: {
    port: 3000,
  },
});
