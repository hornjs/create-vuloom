import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createPhialApp } from "../src/index.ts";

const tempDirs: string[] = [];

async function readInstalledPhialVersion(): Promise<string> {
  const require = createRequire(import.meta.url);
  const packageJsonPath = require.resolve("phial/package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    version?: string;
  };

  if (!packageJson.version) {
    throw new Error(`Missing version in installed phial package: ${packageJsonPath}`);
  }

  return packageJson.version;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("createPhialApp", () => {
  test("scaffolds the installed phial version into the template package.json", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "create-phial-test-"));
    tempDirs.push(cwd);

    const installedPhialVersion = await readInstalledPhialVersion();

    await createPhialApp({
      cwd,
      target: "my-app",
    });

    const packageJson = JSON.parse(
      await readFile(join(cwd, "my-app", "package.json"), "utf8"),
    ) as {
      dependencies?: Record<string, string>;
    };

    expect(packageJson.dependencies?.phial).toBe(`^${installedPhialVersion}`);
  });
});
