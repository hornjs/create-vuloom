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

  test("scaffolds server templates against the current phial/server surface", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "create-phial-test-"));
    tempDirs.push(cwd);

    await createPhialApp({
      cwd,
      target: "my-app",
    });

    const appRoot = join(cwd, "my-app");
    const packageJson = JSON.parse(await readFile(join(appRoot, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
    };
    const contextSource = await readFile(join(appRoot, "server", "context.ts"), "utf8");
    const traceSource = await readFile(
      join(appRoot, "server", "middleware", "server-trace.ts"),
      "utf8",
    );
    const routeTraceSource = await readFile(
      join(appRoot, "server", "middleware", "server-trace-route.ts"),
      "utf8",
    );
    const pingSource = await readFile(join(appRoot, "server", "routes", "api", "ping.ts"), "utf8");

    expect(packageJson.dependencies).toHaveProperty("phial");
    expect(packageJson.dependencies).toHaveProperty("sevok");
    expect(packageJson.dependencies).toHaveProperty("vue");
    expect(packageJson.dependencies).toHaveProperty("vue-router");

    expect(contextSource).toContain('from "phial/server"');
    expect(contextSource).toContain("createContextKey");

    expect(traceSource).toContain('from "phial/server"');
    expect(traceSource).toContain("ctx.request");
    expect(traceSource).toContain("ctx.get(serverTraceKey)");
    expect(traceSource).toContain("return next(ctx)");

    expect(routeTraceSource).toContain('from "phial/server"');
    expect(routeTraceSource).toContain("ctx.request");
    expect(routeTraceSource).toContain("ctx.get(serverTraceKey)");
    expect(routeTraceSource).toContain("return next(ctx)");

    expect(pingSource).toContain('from "phial/server"');
    expect(pingSource).toContain("GET(ctx: InvocationContext)");
    expect(pingSource).toContain("ctx.request.url");
    expect(pingSource).toContain("ctx.get(serverTraceKey)");
    expect(pingSource).toContain("return Response.json(");
  });

  test("scaffolds app route templates against the current phial/app route conventions", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "create-phial-test-"));
    tempDirs.push(cwd);

    await createPhialApp({
      cwd,
      target: "my-app",
    });

    const appRoot = join(cwd, "my-app");
    const readmeSource = await readFile(join(appRoot, "README.md"), "utf8");
    const rootPageSource = await readFile(join(appRoot, "app", "pages", "index", "page.ts"), "utf8");
    const rootLoaderSource = await readFile(
      join(appRoot, "app", "pages", "index", "loader.ts"),
      "utf8",
    );
    const rootActionSource = await readFile(
      join(appRoot, "app", "pages", "index", "action.ts"),
      "utf8",
    );
    const rootLoadingSource = await readFile(
      join(appRoot, "app", "pages", "index", "loading.ts"),
      "utf8",
    );
    const blogMiddlewareSource = await readFile(
      join(appRoot, "app", "pages", "blog", "middleware.ts"),
      "utf8",
    );

    await expect(readFile(join(appRoot, "app", "pages", "page.ts"), "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(
      readFile(join(appRoot, "app", "pages", "loader.ts"), "utf8"),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(
      readFile(join(appRoot, "app", "pages", "action.ts"), "utf8"),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(
      readFile(join(appRoot, "app", "pages", "loading.ts"), "utf8"),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(
      readFile(join(appRoot, "app", "pages", "blog", "_middleware.ts"), "utf8"),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });

    expect(rootPageSource).toContain('from "phial/app"');
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
