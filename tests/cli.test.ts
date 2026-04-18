import { describe, expect, test, vi, afterEach } from "vitest";
import { parseArgs, printHelp, printNextSteps } from "../src/cli.ts";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("parseArgs", () => {
  test("returns defaults with no args", () => {
    vi.stubEnv("npm_config_user_agent", "pnpm/9.0.0");
    const result = parseArgs([]);
    expect(result).toMatchObject({
      template: "default",
      packageManager: "pnpm",
      install: false,
      force: false,
    });
  });

  test("--help returns { help: true }", () => {
    expect(parseArgs(["--help"])).toEqual({ help: true });
    expect(parseArgs(["-h"])).toEqual({ help: true });
  });

  test("positional argument sets target", () => {
    const result = parseArgs(["my-app"]);
    expect(result.target).toBe("my-app");
  });

  test("--template sets template", () => {
    expect(parseArgs(["--template", "zero-config"]).template).toBe("zero-config");
  });

  test("--template missing value throws", () => {
    expect(() => parseArgs(["--template"])).toThrow("Missing value for --template");
  });

  test("--package-manager sets and normalizes package manager", () => {
    expect(parseArgs(["--package-manager", "yarn"]).packageManager).toBe("yarn");
  });

  test("--package-manager with unknown value throws", () => {
    expect(() => parseArgs(["--package-manager", "deno"])).toThrow("Unsupported package manager: deno");
  });

  test("--install sets install to true", () => {
    expect(parseArgs(["--install"]).install).toBe(true);
  });

  test("--no-install sets install to false", () => {
    expect(parseArgs(["--install", "--no-install"]).install).toBe(false);
  });

  test("--force sets force to true", () => {
    expect(parseArgs(["--force"]).force).toBe(true);
  });

  test("unknown flag throws", () => {
    expect(() => parseArgs(["--unknown"])).toThrow("Unknown option: --unknown");
  });

  test("extra positional argument throws", () => {
    expect(() => parseArgs(["my-app", "extra"])).toThrow("Unexpected argument: extra");
  });
});

describe("printHelp", () => {
  test("prints usage to stdout", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    printHelp();
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain("Usage: create-vuloom");
    spy.mockRestore();
  });
});

describe("printNextSteps", () => {
  test("includes cd step when target differs from cwd", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    printNextSteps({ targetDir: "/some/path/my-app", packageManager: "pnpm", install: false }, "/some/path");
    const output: string = spy.mock.calls[0][0];
    expect(output).toContain("cd my-app");
    expect(output).toContain("pnpm install");
    spy.mockRestore();
  });

  test("skips install step when install is true", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    printNextSteps({ targetDir: "/some/path/my-app", packageManager: "pnpm", install: true }, "/some/path");
    const output: string = spy.mock.calls[0][0];
    expect(output).not.toContain("pnpm install");
    spy.mockRestore();
  });
});
