#!/usr/bin/env node

import process from "node:process";
import { createVuloomApp } from "./create.ts";
import { parseArgs, printHelp, printNextSteps } from "./cli.ts";

export * from "./create.ts";
export * from "./cli.ts";
export * from "./template.ts";
export * from "./package-manager.ts";

try {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.help) {
    printHelp();
    process.exit(0);
  }

  const result = await createVuloomApp(parsed);
  printNextSteps(result);
} catch (error) {
  console.error(`[create-vuloom] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
