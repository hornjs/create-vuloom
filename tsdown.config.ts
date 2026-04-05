import { defineConfig } from "tsdown";
import fs from "node:fs";
import path from "node:path";

export default defineConfig({
  entry: ["./src/index.ts"],
  target: 'node20',
  dts: false,
  minify: true,
  fixedExtension: false,
  deps: {
    onlyBundle: false as const,
  },
  onSuccess() {
    const file = path.resolve("dist/index.js");
    const original = fs.readFileSync(file, "utf-8");
    const shebang = "#!/usr/bin/env node\n\n";
    if (!original.startsWith(shebang)) {
      fs.writeFileSync(file, `${shebang}${original}`);
    }
    fs.chmodSync(file, 0o755);
  },
});
