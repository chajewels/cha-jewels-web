// Resolve hooks for tests/register-aliases.mjs.
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const ROOT = process.cwd();
const STUBS = {
  "server-only": "export {};",
  "@/lib/hub-api": "export const hub = {}; export const SECONDARY_TIMEOUT_MS = 0;",
};

export async function resolve(specifier, context, next) {
  if (specifier in STUBS) return { url: `data:text/javascript,${encodeURIComponent(STUBS[specifier])}`, shortCircuit: true };
  if (specifier.startsWith("@/")) {
    const base = join(ROOT, specifier.slice(2));
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      if (existsSync(base + ext)) return { url: pathToFileURL(base + ext).href, shortCircuit: true };
    }
  }
  return next(specifier, context);
}
