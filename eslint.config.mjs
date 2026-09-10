import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

// eslint-config-next 15 still ships eslintrc-style configs, so they are bridged
// with FlatCompat. eslint and eslint-config-next were already devDependencies —
// only this config file was missing, which is why `next lint` prompted
// interactively and would have hung CI.
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
