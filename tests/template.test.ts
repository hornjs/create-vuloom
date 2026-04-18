import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp, readFile } from "node:fs/promises";
import { afterEach, describe, expect, test } from "vitest";
import {
  DEFAULT_TEMPLATE,
  TEMPLATE_ALIASES,
  copyTemplateDirectory,
  ensureTemplateExists,
  renderTemplate,
  resolveTemplateName,
} from "../src/template.ts";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("DEFAULT_TEMPLATE / TEMPLATE_ALIASES", () => {
  test("default template is 'default'", () => {
    expect(DEFAULT_TEMPLATE).toBe("default");
  });

  test("zero-config resolves to default", () => {
    expect(TEMPLATE_ALIASES.get("zero-config")).toBe("default");
  });
});

describe("resolveTemplateName", () => {
  test("resolves 'default'", () => {
    expect(resolveTemplateName("default")).toBe("default");
  });

  test("resolves 'zero-config' to 'default'", () => {
    expect(resolveTemplateName("zero-config")).toBe("default");
  });

  test("falls back to DEFAULT_TEMPLATE when undefined", () => {
    expect(resolveTemplateName(undefined)).toBe("default");
  });

  test("throws on unknown template", () => {
    expect(() => resolveTemplateName("unknown")).toThrow("Unsupported template: unknown");
  });
});

describe("ensureTemplateExists", () => {
  test("resolves when directory exists", async () => {
    const dir = await mkdtemp(join(tmpdir(), "tpl-test-"));
    tempDirs.push(dir);
    await expect(ensureTemplateExists(dir)).resolves.toBeUndefined();
  });

  test("throws when directory does not exist", async () => {
    await expect(ensureTemplateExists("/nonexistent/path/xyz")).rejects.toThrow("Unknown template:");
  });
});

describe("renderTemplate", () => {
  test("replaces variables", () => {
    expect(renderTemplate("Hello {{ name }}!", { name: "Vuloom" })).toBe("Hello Vuloom!");
  });

  test("replaces multiple occurrences", () => {
    expect(renderTemplate("{{ a }} and {{ a }}", { a: "X" })).toBe("X and X");
  });

  test("leaves unknown variables empty", () => {
    expect(renderTemplate("{{ unknown }}", {})).toBe("");
  });

  test("handles extra whitespace in delimiters", () => {
    expect(renderTemplate("{{  name  }}", { name: "ok" })).toBe("ok");
  });
});

describe("copyTemplateDirectory", () => {
  test("copies files with variable substitution", async () => {
    const src = await mkdtemp(join(tmpdir(), "tpl-src-"));
    const dst = await mkdtemp(join(tmpdir(), "tpl-dst-"));
    tempDirs.push(src, dst);

    await writeFile(join(src, "README.md"), "Project: {{ projectName }}");

    await copyTemplateDirectory(src, dst, { projectName: "my-app" });

    const content = await readFile(join(dst, "README.md"), "utf8");
    expect(content).toBe("Project: my-app");
  });

  test("renames _gitignore to .gitignore", async () => {
    const src = await mkdtemp(join(tmpdir(), "tpl-src-"));
    const dst = await mkdtemp(join(tmpdir(), "tpl-dst-"));
    tempDirs.push(src, dst);

    await writeFile(join(src, "_gitignore"), "node_modules");

    await copyTemplateDirectory(src, dst, {});

    const content = await readFile(join(dst, ".gitignore"), "utf8");
    expect(content).toBe("node_modules");
  });

  test("copies nested directories recursively", async () => {
    const src = await mkdtemp(join(tmpdir(), "tpl-src-"));
    const dst = await mkdtemp(join(tmpdir(), "tpl-dst-"));
    tempDirs.push(src, dst);

    await mkdir(join(src, "nested"));
    await writeFile(join(src, "nested", "file.ts"), "export {}");

    await copyTemplateDirectory(src, dst, {});

    const content = await readFile(join(dst, "nested", "file.ts"), "utf8");
    expect(content).toBe("export {}");
  });
});
