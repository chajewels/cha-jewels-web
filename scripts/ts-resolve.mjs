// Lets a plain `node scripts/*.mjs` import this repo's TypeScript modules.
//
// Node 22.6+ strips the TYPES for us, which is what scripts/check-faq.mjs
// already relies on. What it does not do is resolve the two specifier styles
// this codebase writes, because both are a bundler's job everywhere else:
//
//   "./layaway-availability"   extensionless, so Node ESM will not guess ".ts"
//   "@/lib/i18n"               the tsconfig path alias, which Node knows nothing of
//
// lib/content/faq.ts happens to need neither — its imports are all `import
// type`, which vanishes before resolution ever runs. lib/blog.ts imports
// layawayOffered for real, so it needs this.
//
// A SHIM, NOT A BUILD STEP, and deliberately: the alternative is a bundler in
// the middle of a gate whose whole job is to prove that two renderings of the
// same words are identical. A gate with a compiler in it is a gate that can
// disagree with the app for reasons that have nothing to do with the words.
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The extensions tsconfig would try, in the order it tries them. */
const TRIED = [".ts", ".tsx", "/index.ts", "/index.tsx"];

registerHooks({
  resolve(specifier, context, next) {
    // "@/x" → "<repo>/x", the one alias in tsconfig.json.
    const path = specifier.startsWith("@/")
      ? join(root, specifier.slice(2))
      : specifier.startsWith(".") && context.parentURL?.startsWith("file:")
        ? resolve(dirname(fileURLToPath(context.parentURL)), specifier)
        : null;
    if (path) {
      // An explicit extension that exists is already resolvable; only fill in
      // the one the source left out.
      if (!existsSync(path)) {
        for (const ext of TRIED) {
          if (existsSync(path + ext)) return { url: pathToFileURL(path + ext).href, shortCircuit: true };
        }
      } else if (specifier.startsWith("@/")) {
        return { url: pathToFileURL(path).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});
