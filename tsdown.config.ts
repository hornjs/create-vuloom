import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  target: 'node20',
  dts: false,
  minify: true,
  fixedExtension: false,
  deps: {
    onlyBundle: false as const,
  },
});
