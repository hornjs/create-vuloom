import {
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import {
  basename,
  dirname,
  join,
} from "node:path";

export const DEFAULT_TEMPLATE = "default";

export const TEMPLATE_ALIASES = new Map([
  ["default", "default"],
  ["zero-config", "default"],
]);

export interface TemplateVariables {
  [key: string]: string;
}

export function resolveTemplateName(template: string | undefined) {
  const normalizedTemplate = String(template ?? DEFAULT_TEMPLATE).trim();
  const resolvedTemplate = TEMPLATE_ALIASES.get(normalizedTemplate);

  if (!resolvedTemplate) {
    throw new Error(`Unsupported template: ${normalizedTemplate}`);
  }

  return resolvedTemplate;
}

export async function ensureTemplateExists(templateDir: string) {
  const templateStats = await stat(templateDir).catch(() => null);
  if (!templateStats?.isDirectory()) {
    throw new Error(`Unknown template: ${basename(templateDir)}`);
  }
}

export async function copyTemplateDirectory(sourceDir: string, targetDir: string, variables: TemplateVariables) {
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

export function renderTemplate(source: string, variables: TemplateVariables) {
  return source.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key) => {
    return key in variables ? String(variables[key]) : "";
  });
}
