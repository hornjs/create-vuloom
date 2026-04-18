import { describe, expect, test, vi, afterEach } from "vitest";
import {
  detectPackageManager,
  normalizePackageManager,
  formatInstallCommand,
  formatRunCommand,
} from "../src/package-manager.ts";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("detectPackageManager", () => {
  test("detects pnpm", () => {
    vi.stubEnv("npm_config_user_agent", "pnpm/9.0.0 npm/? node/v22.0.0 linux x64");
    expect(detectPackageManager()).toBe("pnpm");
  });

  test("detects yarn", () => {
    vi.stubEnv("npm_config_user_agent", "yarn/4.0.0 npm/? node/v22.0.0 linux x64");
    expect(detectPackageManager()).toBe("yarn");
  });

  test("detects bun", () => {
    vi.stubEnv("npm_config_user_agent", "bun/1.0.0 npm/? node/v22.0.0 linux x64");
    expect(detectPackageManager()).toBe("bun");
  });

  test("falls back to npm", () => {
    vi.stubEnv("npm_config_user_agent", "");
    expect(detectPackageManager()).toBe("npm");
  });
});

describe("normalizePackageManager", () => {
  test.each(["pnpm", "npm", "yarn", "bun"])("accepts %s", (pm) => {
    expect(normalizePackageManager(pm)).toBe(pm);
  });

  test("throws on unknown package manager", () => {
    expect(() => normalizePackageManager("deno")).toThrow("Unsupported package manager: deno");
  });
});

describe("formatInstallCommand", () => {
  test.each([
    ["pnpm", "pnpm install"],
    ["npm", "npm install"],
    ["yarn", "yarn install"],
    ["bun", "bun install"],
  ])("%s → %s", (pm, expected) => {
    expect(formatInstallCommand(pm)).toBe(expected);
  });
});

describe("formatRunCommand", () => {
  test.each([
    ["pnpm", "dev", "pnpm dev"],
    ["yarn", "build", "yarn build"],
    ["npm", "dev", "npm run dev"],
    ["bun", "test", "bun run test"],
  ])("%s %s → %s", (pm, script, expected) => {
    expect(formatRunCommand(pm, script)).toBe(expected);
  });
});
