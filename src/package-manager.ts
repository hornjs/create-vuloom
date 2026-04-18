import { spawn } from "node:child_process";
import process from "node:process";

export function detectPackageManager() {
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

export function normalizePackageManager(value: string) {
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

export function formatInstallCommand(packageManager: string) {
  return `${packageManager} install`;
}

export function formatRunCommand(packageManager: string, scriptName: string) {
  if (packageManager === "npm") {
    return `npm run ${scriptName}`;
  }

  if (packageManager === "bun") {
    return `bun run ${scriptName}`;
  }

  return `${packageManager} ${scriptName}`;
}

export async function installProjectDependencies(targetDir: string, packageManager: string) {
  const command = packageManager;
  const args = ["install"];

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
