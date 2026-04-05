import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_ROOT = resolve(PACKAGE_ROOT, "../templates");
const DEFAULT_TEMPLATE = "default";
const TEMPLATE_ALIASES = new Map([
  ["default", "default"],
  ["zero-config", "default"],
]);

export interface CreatePhialAppOptions {
  cwd?: string;
  target?: string;
  template?: string;
  packageManager?: string;
  install?: boolean;
  force?: boolean;
}

export interface CreatePhialAppResult {
  targetDir: string;
  packageManager: string;
  install: boolean;
}

export async function createPhialApp(options: CreatePhialAppOptions = {}): Promise<CreatePhialAppResult> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const targetArg = options.target ?? "phial-app";
  const targetDir = resolve(cwd, targetArg);
  const template = resolveTemplateName(options.template);
  const templateDir = resolve(TEMPLATE_ROOT, template);
  const packageManager = options.packageManager ?? detectPackageManager();
  const install = options.install ?? false;
  const force = options.force ?? false;

  await ensureTemplateExists(templateDir);
  await ensureTargetDirectory(targetDir, {
    force,
  });

  const packageName = toPackageName(basename(targetDir));
  const phialVersion = await readInstalledPhialVersion();
  const variables = {
    packageManager,
    packageName,
    projectName: basename(targetDir),
    phialVersion: `^${phialVersion}`,
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

export interface ParsedArgs {
  help?: boolean;
  target?: string;
  template?: string;
  packageManager?: string;
  install?: boolean;
  force?: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const args = [...argv];
  const options: ParsedArgs = {
    template: DEFAULT_TEMPLATE,
    packageManager: detectPackageManager(),
    install: false,
    force: false,
  };

  while (args.length > 0) {
    const token = args.shift();

    if (!token) {
      continue;
    }

    if (token === "--help" || token === "-h") {
      return {
        help: true,
      };
    }

    if (token === "--install") {
      options.install = true;
      continue;
    }

    if (token === "--no-install") {
      options.install = false;
      continue;
    }

    if (token === "--force") {
      options.force = true;
      continue;
    }

    if (token === "--template") {
      const value = args.shift();
      if (!value) {
        throw new Error("Missing value for --template");
      }

      options.template = value;
      continue;
    }

    if (token === "--package-manager") {
      const value = args.shift();
      if (!value) {
        throw new Error("Missing value for --package-manager");
      }

      options.packageManager = normalizePackageManager(value);
      continue;
    }

    if (token.startsWith("--")) {
      throw new Error(`Unknown option: ${token}`);
    }

    if (!options.target) {
      options.target = token;
      continue;
    }

    throw new Error(`Unexpected argument: ${token}`);
  }

  return options;
}

export function printHelp() {
  console.log(
    [
      "Usage: create-phial <project-dir> [options]",
      "",
      "Options:",
      "  --template <name>         Scaffold template name. Supported: default, zero-config",
      "  --package-manager <name>  Package manager to suggest/install with: pnpm, npm, yarn, bun",
      "  --install                 Install dependencies after scaffolding",
      "  --force                   Allow writing into a non-empty target directory",
      "  -h, --help                Show this help message",
    ].join("\n"),
  );
}

export function printNextSteps(result: CreatePhialAppResult, cwd: string = process.cwd()) {
  const relativeTarget = relative(cwd, result.targetDir) || ".";
  const packageManager = result.packageManager;
  const lines = ["", `Scaffolded Phial app in ${result.targetDir}`, "", "Next steps:"];

  if (relativeTarget !== ".") {
    lines.push(`  cd ${relativeTarget}`);
  }

  if (!result.install) {
    lines.push(`  ${formatInstallCommand(packageManager)}`);
  }

  lines.push(`  ${formatRunCommand(packageManager, "dev")}`);

  console.log(lines.join("\n"));
}

async function ensureTemplateExists(templateDir: string) {
  const templateStats = await stat(templateDir).catch(() => null);
  if (!templateStats?.isDirectory()) {
    throw new Error(`Unknown template: ${basename(templateDir)}`);
  }
}

interface EnsureTargetDirectoryOptions {
  force?: boolean;
}

async function ensureTargetDirectory(targetDir: string, options: EnsureTargetDirectoryOptions) {
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

interface TemplateVariables {
  [key: string]: string;
}

async function copyTemplateDirectory(sourceDir: string, targetDir: string, variables: TemplateVariables) {
  const entries = await readdir(sourceDir, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry.name);
    let targetPath = join(targetDir, entry.name);

    // Rename _gitignore to .gitignore
    if (entry.name === "_gitignore") {
      targetPath = join(targetDir, ".gitignore");
    }

    if (entry.isDirectory()) {
      await mkdir(targetPath, {
        recursive: true,
      });
      await copyTemplateDirectory(sourcePath, targetPath, variables);
      continue;
    }

    const source = await readFile(sourcePath, "utf8");
    const output = renderTemplate(source, variables);

    await mkdir(dirname(targetPath), {
      recursive: true,
    });
    await writeFile(targetPath, output);
  }
}

function renderTemplate(source: string, variables: TemplateVariables) {
  return source.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key) => {
    return key in variables ? String(variables[key]) : "";
  });
}

function resolveTemplateName(template: string | undefined) {
  const normalizedTemplate = String(template ?? DEFAULT_TEMPLATE).trim();
  const resolvedTemplate = TEMPLATE_ALIASES.get(normalizedTemplate);

  if (!resolvedTemplate) {
    throw new Error(`Unsupported template: ${normalizedTemplate}`);
  }

  return resolvedTemplate;
}

function normalizePackageManager(value: string) {
  switch (value) {
    case "pnpm":
    case "npm":
    case "yarn":
    case "bun":
      return value;
    default:
      throw new Error(`Unsupported package manager: ${value}`);
  }
}

function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent ?? "";

  if (userAgent.startsWith("pnpm/")) {
    return "pnpm";
  }

  if (userAgent.startsWith("yarn/")) {
    return "yarn";
  }

  if (userAgent.startsWith("bun/")) {
    return "bun";
  }

  return "npm";
}

function formatInstallCommand(packageManager: string) {
  return `${packageManager} install`;
}

function formatRunCommand(packageManager: string, scriptName: string) {
  if (packageManager === "npm") {
    return `npm run ${scriptName}`;
  }

  if (packageManager === "bun") {
    return `bun run ${scriptName}`;
  }

  return `${packageManager} ${scriptName}`;
}

function toPackageName(projectName: string) {
  const normalized = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[._-]+/, "")
    .replace(/[._-]+$/, "");

  return normalized || "phial-app";
}

async function installProjectDependencies(targetDir: string, packageManager: string) {
  const command = packageManager;
  const args = packageManager === "npm" ? ["install"] : ["install"];

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: targetDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${packageManager} install failed with exit code ${code ?? "null"}`));
    });

    child.on("error", rejectPromise);
  });
}

async function readInstalledPhialVersion() {
  const require = createRequire(import.meta.url);
  const packageJsonPath = require.resolve("phial/package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));

  if (typeof packageJson.version !== "string" || packageJson.version.length === 0) {
    throw new Error(`Installed phial package is missing a version: ${packageJsonPath}`);
  }

  return packageJson.version;
}
