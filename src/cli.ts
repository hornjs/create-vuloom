import process from "node:process";
import { relative } from "node:path";
import { DEFAULT_TEMPLATE } from "./template.ts";
import {
  detectPackageManager,
  formatInstallCommand,
  formatRunCommand,
  normalizePackageManager,
} from "./package-manager.ts";
import type { CreateVuloomAppResult } from "./create.ts";

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
      "Usage: create-vuloom <project-dir> [options]",
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

export function printNextSteps(result: CreateVuloomAppResult, cwd: string = process.cwd()) {
  const relativeTarget = relative(cwd, result.targetDir) || ".";
  const packageManager = result.packageManager;
  const lines = ["", `Scaffolded Vuloom app in ${result.targetDir}`, "", "Next steps:"];

  if (relativeTarget !== ".") {
    lines.push(`  cd ${relativeTarget}`);
  }

  if (!result.install) {
    lines.push(`  ${formatInstallCommand(packageManager)}`);
  }

  lines.push(`  ${formatRunCommand(packageManager, "dev")}`);

  console.log(lines.join("\n"));
}
