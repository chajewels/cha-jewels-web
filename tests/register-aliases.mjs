// Lets a unit test import a lib/ module that uses the "@/…" path alias
// (tsconfig "paths") under plain `node --test`: resolves "@/x" to ./x.ts, and
// stands in for the two server-only imports a pure function never touches —
// the "server-only" marker and the Hub client (lib/hub-api.ts, which needs
// Next.js and the network). Test-only; the app build never sees this.
import { register } from "node:module";

register("./alias-hooks.mjs", import.meta.url);
