// Test-only module resolution hook: maps the `@/` path alias (tsconfig paths)
// to files under the repository root so `node --test` can run the TypeScript
// unit tests without a bundler. Files only (never directories).
import { statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const ROOT = process.cwd();
const EXTS = [".ts", ".tsx", ".js", ".mjs", "", "/index.ts", "/index.tsx"];

function isFile(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = join(ROOT, specifier.slice(2));
    for (const ext of EXTS) {
      const candidate = base + ext;
      if (isFile(candidate)) {
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
  }
  return nextResolve(specifier, context);
}
