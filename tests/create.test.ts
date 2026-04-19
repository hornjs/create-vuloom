import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  createVuloomApp,
  ensureTargetDirectory,
  toPackageName,
  readInstalledPackageVersion,
} from "../src/create.ts";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("toPackageName", () => {
  test("lowercases and trims", () => {
    expect(toPackageName("  MyApp  ")).toBe("myapp");
  });

  test("replaces invalid characters with dashes", () => {
    expect(toPackageName("My Cool App!")).toBe("my-cool-app");
  });

  test("strips leading/trailing dashes and dots", () => {
    expect(toPackageName("--my-app--")).toBe("my-app");
  });

  test("falls back to 'vuloom-app' for empty result", () => {
    expect(toPackageName("---")).toBe("vuloom-app");
  });
});

describe("readInstalledPackageVersion", () => {
  test("returns a valid semver string for a direct dependency", async () => {
    const version = await readInstalledPackageVersion("vuloom");
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  test("resolves a transitive dependency via chain", async () => {
    const version = await readInstalledPackageVersion("vuloom", "sevok");
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe("ensureTargetDirectory", () => {
  test("creates directory when it does not exist", async () => {
    const base = await mkdtemp(join(tmpdir(), "create-test-"));
    tempDirs.push(base);
    const target = join(base, "new-dir");

    await ensureTargetDirectory(target, {});

    const { stat } = await import("node:fs/promises");
    const s = await stat(target);
    expect(s.isDirectory()).toBe(true);
  });

  test("throws when target is a file", async () => {
    const base = await mkdtemp(join(tmpdir(), "create-test-"));
    tempDirs.push(base);
    const target = join(base, "file.txt");
    await writeFile(target, "");

    await expect(ensureTargetDirectory(target, {})).rejects.toThrow("Target path is not a directory");
  });

  test("throws when directory is non-empty without force", async () => {
    const base = await mkdtemp(join(tmpdir(), "create-test-"));
    tempDirs.push(base);
    await writeFile(join(base, "existing.txt"), "");

    await expect(ensureTargetDirectory(base, {})).rejects.toThrow("Target directory is not empty");
  });

  test("succeeds on non-empty directory with force", async () => {
    const base = await mkdtemp(join(tmpdir(), "create-test-"));
    tempDirs.push(base);
    await writeFile(join(base, "existing.txt"), "");

    await expect(ensureTargetDirectory(base, { force: true })).resolves.toBeUndefined();
  });
});

describe("createVuloomApp", () => {
  test("scaffolds the installed vuloom version into the template package.json", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "create-vuloom-test-"));
    tempDirs.push(cwd);

    const installedVuloomVersion = await readInstalledPackageVersion("vuloom");

    await createVuloomApp({ cwd, target: "my-app" });

    const packageJson = JSON.parse(
      await readFile(join(cwd, "my-app", "package.json"), "utf8"),
    ) as { dependencies?: Record<string, string> };

    expect(packageJson.dependencies?.vuloom).toBe(`^${installedVuloomVersion}`);
  });

  test("scaffolds the installed sevok version into the template package.json", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "create-vuloom-test-"));
    tempDirs.push(cwd);

    const installedSevokVersion = await readInstalledPackageVersion("vuloom", "sevok");

    await createVuloomApp({ cwd, target: "my-app" });

    const packageJson = JSON.parse(
      await readFile(join(cwd, "my-app", "package.json"), "utf8"),
    ) as { dependencies?: Record<string, string> };

    expect(packageJson.dependencies?.sevok).toBe(`^${installedSevokVersion}`);
  });

  test("scaffolds server templates against the current vuloom/server surface", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "create-vuloom-test-"));
    tempDirs.push(cwd);

    await createVuloomApp({ cwd, target: "my-app" });

    const appRoot = join(cwd, "my-app");
    const packageJson = JSON.parse(await readFile(join(appRoot, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
    };
    const contextSource = await readFile(join(appRoot, "server", "context.ts"), "utf8");
    const traceSource = await readFile(join(appRoot, "server", "middleware", "server-trace.ts"), "utf8");
    const routeTraceSource = await readFile(join(appRoot, "server", "middleware", "server-trace-route.ts"), "utf8");
    const pingSource = await readFile(join(appRoot, "server", "routes", "api", "ping.ts"), "utf8");

    expect(packageJson.dependencies).toHaveProperty("vuloom");
    expect(packageJson.dependencies).toHaveProperty("sevok");
    expect(packageJson.dependencies).toHaveProperty("vue");
    expect(packageJson.dependencies).toHaveProperty("vue-router");

    expect(contextSource).toContain('from "vuloom/server"');
    expect(contextSource).toContain("createContextKey");

    expect(traceSource).toContain('from "vuloom/server"');
    expect(traceSource).toContain("ctx.request");
    expect(traceSource).toContain("ctx.get(serverTraceKey)");
    expect(traceSource).toContain("return next(ctx)");

    expect(routeTraceSource).toContain('from "vuloom/server"');
    expect(routeTraceSource).toContain("ctx.request");
    expect(routeTraceSource).toContain("ctx.get(serverTraceKey)");
    expect(routeTraceSource).toContain("return next(ctx)");

    expect(pingSource).toContain('from "vuloom/server"');
    expect(pingSource).toContain("GET(ctx: InvocationContext)");
    expect(pingSource).toContain("ctx.request.url");
    expect(pingSource).toContain("ctx.get(serverTraceKey)");
    expect(pingSource).toContain("return Response.json(");
  });

  test("scaffolds app route templates against the current vuloom/app route conventions", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "create-vuloom-test-"));
    tempDirs.push(cwd);

    await createVuloomApp({ cwd, target: "my-app" });

    const appRoot = join(cwd, "my-app");
    const readmeSource = await readFile(join(appRoot, "README.md"), "utf8");
    const rootPageSource = await readFile(join(appRoot, "app", "pages", "index", "page.ts"), "utf8");
    const rootLoaderSource = await readFile(join(appRoot, "app", "pages", "index", "loader.ts"), "utf8");
    const rootActionSource = await readFile(join(appRoot, "app", "pages", "index", "action.ts"), "utf8");
    const rootLoadingSource = await readFile(join(appRoot, "app", "pages", "index", "loading.ts"), "utf8");
    const blogMiddlewareSource = await readFile(join(appRoot, "app", "pages", "blog", "middleware.ts"), "utf8");

    await expect(readFile(join(appRoot, "app", "pages", "page.ts"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(join(appRoot, "app", "pages", "loader.ts"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(join(appRoot, "app", "pages", "action.ts"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(join(appRoot, "app", "pages", "loading.ts"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(join(appRoot, "app", "pages", "blog", "_middleware.ts"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });

    expect(rootPageSource).toContain('from "vuloom/app"');
    expect(rootLoaderSource).toContain("Hello from the root page loader.");
    expect(rootActionSource).toContain("Saved a greeting");
    expect(rootLoadingSource).toContain("route:");
    expect(rootLoadingSource).not.toContain("routeId:");
    expect(blogMiddlewareSource).toContain('export default ["blog-trace"]');

    expect(readmeSource).toContain("`app/pages/index/page.ts`");
    expect(readmeSource).toContain("`app/pages/index/loader.ts`");
    expect(readmeSource).toContain("`app/pages/index/loading.ts`");
    expect(readmeSource).toContain("`app/pages/index/action.ts`");
    expect(readmeSource).toContain("`app/pages/blog/middleware.ts`");
    expect(readmeSource).not.toContain("`app/pages/page.ts`");
    expect(readmeSource).not.toContain("`app/pages/blog/_middleware.ts`");
  });
});
