import {
  mkdir,
  readdir,
  readFile,
  stat,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, resolve } from "node:path";
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

  const packageName = toPackageName(basename(targetDir));
  const vuloomVersion = await readInstalledVuloomVersion();
  const variables = {
    packageManager,
    packageName,
    projectName: basename(targetDir),
    vuloomVersion: `^${vuloomVersion}`,
    buildCommand: formatRunCommand(packageManager, "build"),
    devCommand: formatRunCommand(packageManager, "dev"),
    startCommand: formatRunCommand(packageManager, "start"),
    installCommand: formatInstallCommand(packageManager),
  };

  await copyTemplateDirectory(templateDir, targetDir, variables);

  if (install) {
    await installProjectDependencies(targetDir, packageManager);
  }

  return {
    targetDir,
    packageManager,
    install,
  };
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

export async function readInstalledVuloomVersion() {
  const require = createRequire(import.meta.url);
  const packageJsonPath = require.resolve("vuloom/package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));

  if (typeof packageJson.version !== "string" || packageJson.version.length === 0) {
    throw new Error(`Installed vuloom package is missing a version: ${packageJsonPath}`);
  }

  return packageJson.version;
}
