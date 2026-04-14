#!/usr/bin/env node

import process from "node:process";
import { createVuloomApp, parseArgs, printHelp, printNextSteps } from "../dist/index.js";

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
