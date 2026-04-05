#!/usr/bin/env node

import process from "node:process";
import { createPhialApp, parseArgs, printHelp, printNextSteps } from "../dist/index.js";

try {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.help) {
    printHelp();
    process.exit(0);
  }

  const result = await createPhialApp(parsed);
  printNextSteps(result);
} catch (error) {
  console.error(`[create-phial] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
