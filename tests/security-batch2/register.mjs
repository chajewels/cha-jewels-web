// Registers tests/security-batch2/hooks.mjs (after tests/register-aliases.mjs). Test-only.
import { register } from "node:module";
register("./hooks.mjs", import.meta.url);
