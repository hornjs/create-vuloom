import {
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  copyTemplateDirectory,
  ensureTemplateExists,
  resolveTemplateName,
} from "./template.ts";
import {
  detectPackageManager,
  formatInstallCommand,
  formatRunCommand,
  installProjectDependencies,
} from "./package-manager.ts";

const PACKAGE_ROOT = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_ROOT = resolve(PACKAGE_ROOT, "../templates");

export interface CreateVuloomAppOptions {
  cwd?: string;
  target?: string;
  template?: string;
  packageManager?: string;
  install?: boolean;
  force?: boolean;
}

export interface CreateVuloomAppResult {
  targetDir: string;
  packageManager: string;
  install: boolean;
}

export async function createVuloomApp(options: CreateVuloomAppOptions = {}): Promise<CreateVuloomAppResult> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const targetArg = options.target ?? "vuloom-app";
  const targetDir = resolve(cwd, targetArg);
  const template = resolveTemplateName(options.template);
  const templateDir = resolve(TEMPLATE_ROOT, template);
  const packageManager = options.packageManager ?? detectPackageManager();
  const install = options.install ?? false;
  const force = options.force ?? false;

  await ensureTemplateExists(templateDir);
  await ensureTargetDirectory(targetDir, { force });

  const variables = resolveTemplateVariables(targetDir, packageManager);

  await copyTemplateDirectory(templateDir, targetDir, variables);
  await resolveLatestDependencies(join(targetDir, "package.json"));

  if (install) {
    await installProjectDependencies(targetDir, packageManager);
  }

  return {
    targetDir,
    packageManager,
    install,
  };
}

export function resolveTemplateVariables(targetDir: string, packageManager: string) {
  return {
    packageManager,
    packageName: toPackageName(basename(targetDir)),
    projectName: basename(targetDir),
    buildCommand: formatRunCommand(packageManager, "build"),
    devCommand: formatRunCommand(packageManager, "dev"),
    startCommand: formatRunCommand(packageManager, "start"),
    installCommand: formatInstallCommand(packageManager),
  };
}

export async function resolveLatestDependencies(packageJsonPath: string) {
  const pkg = JSON.parse(await readFile(packageJsonPath, "utf8"));

  const entries = Object.entries(pkg["dependencies"] ?? {})
    .filter(([, version]) => version === "latest")
    .map(([name]) => name);

  await Promise.all(
    entries.map(async (name) => {
      const version = await resolveInstalledPackageVersion(name);
      if (version !== null) {
        pkg["dependencies"][name] = `^${version}`;
      }
    }),
  );

  await writeFile(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
}

async function resolveInstalledPackageVersion(name: string): Promise<string | null> {
  // 1. Prefer vuloom's context — ensures version compatibility with the framework
  //    Skip if name is vuloom itself to avoid resolving vuloom/vuloom
  if (name !== "vuloom") {
    try {
      return await readInstalledPackageVersion("vuloom", name);
    } catch { }
  }

  // 2. Fall back to create-vuloom's own context (e.g. vuloom itself)
  try {
    return await readInstalledPackageVersion(name);
  } catch {}

  // 3. Last resort: ask the npm registry for the published latest version
  try {
    return await fetchLatestPublishedVersion(name);
  } catch {}

  return null;
}

async function fetchLatestPublishedVersion(name: string): Promise<string> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);
  const { stdout } = await execFileAsync("npm", ["view", name, "version"]);
  const version = stdout.trim();

  if (!version) {
    throw new Error(`npm view returned no version for ${name}`);
  }

  return version;
}

interface EnsureTargetDirectoryOptions {
  force?: boolean;
}

export async function ensureTargetDirectory(targetDir: string, options: EnsureTargetDirectoryOptions) {
  const targetStats = await stat(targetDir).catch(() => null);

  if (!targetStats) {
    await mkdir(targetDir, {
      recursive: true,
    });
    return;
  }

  if (!targetStats.isDirectory()) {
    throw new Error(`Target path is not a directory: ${targetDir}`);
  }

  const entries = await readdir(targetDir);
  if (entries.length > 0 && !options.force) {
    throw new Error(`Target directory is not empty: ${targetDir}. Use --force to continue.`);
  }
}

export function toPackageName(projectName: string) {
  const normalized = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[._-]+/, "")
    .replace(/[._-]+$/, "");

  return normalized || "vuloom-app";
}

export async function readInstalledPackageVersion(...chain: [string, ...string[]]) {
  let resolveFrom = import.meta.url;

  for (const packageName of chain.slice(0, -1)) {
    resolveFrom = createRequire(resolveFrom).resolve(`${packageName}/package.json`);
  }

  const packageName = chain[chain.length - 1];
  const packageJsonPath = createRequire(resolveFrom).resolve(`${packageName}/package.json`);
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));

  if (typeof packageJson.version !== "string" || packageJson.version.length === 0) {
    throw new Error(`Installed ${packageName} package is missing a version: ${packageJsonPath}`);
  }

  return packageJson.version as string;
}
