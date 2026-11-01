// Resolve hooks for the security batch 2 harness (tests/security-batch2.test.mjs).
// Registered AFTER tests/register-aliases.mjs, so these run first:
//  - "@/lib/hub-api" is the REAL client (the shared alias stub replaces it with
//    `{}`); its network is a fetch the harness replaces.
//  - next/headers, next/cache, next/server, next/navigation and the Supabase
//    server client are small stand-ins driven from globalThis.__sb2 (Next's own
//    modules need a request context and do not resolve under plain node ESM).
//  - extensionless relative imports inside lib/ ("./i18n") resolve to .ts.
// Test-only; the app build never sees this.
import { existsSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const ROOT = process.cwd();
const data = (src) => ({ url: `data:text/javascript,${encodeURIComponent(src)}`, shortCircuit: true });

const STUBS = {
  "next/headers": `
    const s = () => globalThis.__sb2;
    export async function headers() { return new Headers(s().headers ?? {}); }
    export async function cookies() {
      const jar = s().cookies ?? (s().cookies = new Map());
      return { get: (n) => (jar.has(n) ? { name: n, value: jar.get(n) } : undefined), getAll: () => [...jar].map(([name, value]) => ({ name, value })), set: (n, v) => { jar.set(n, typeof v === "object" ? v.value : v); }, delete: (n) => jar.delete(n) };
    }`,
  "next/cache": `
    export function revalidatePath(p) { (globalThis.__sb2.revalidated ??= []).push(["path", p]); }
    export function revalidateTag(t) { (globalThis.__sb2.revalidated ??= []).push(["tag", t]); }`,
  "next/navigation": `export function redirect(p) { const e = new Error("NEXT_REDIRECT"); e.digest = "NEXT_REDIRECT;" + p; throw e; } export function notFound() { throw new Error("NEXT_NOT_FOUND"); }`,
  "next/server": `
    export class NextResponse extends Response {
      constructor(body, init) { super(body, init); const self = this; this.cookies = { set(n, v) { self.headers.append("set-cookie", n + "=" + v); } }; }
      static json(body, init) { return new NextResponse(JSON.stringify(body), { ...(init ?? {}), headers: { "content-type": "application/json" } }); }
    }
    export function after(fn) { try { const r = typeof fn === "function" ? fn() : fn; if (r && r.catch) r.catch(() => {}); } catch {} }`,
  "@/lib/supabase/server": `
    export async function supabaseServer() {
      const s = globalThis.__sb2;
      return { auth: {
        getSession: async () => ({ data: { session: s.jwt ? { access_token: s.jwt } : null } }),
        getUser: async () => ({ data: { user: s.user ?? null } }),
        signOut: async () => ({ error: null }),
      } };
    }`,
};

function tryFile(base) {
  for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
    const f = base + ext;
    if (ext === "" ? /\.(m?js|ts|tsx|json)$/.test(f) && existsSync(f) : existsSync(f)) return pathToFileURL(f).href;
  }
  return null;
}

export async function resolve(specifier, context, next) {
  if (specifier in STUBS) return data(STUBS[specifier]);
  if (specifier === "@/lib/hub-api") return { url: pathToFileURL(join(ROOT, "lib/hub-api.ts")).href, shortCircuit: true };
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const parent = fileURLToPath(context.parentURL);
    if (parent.startsWith(ROOT) && !parent.includes("node_modules")) {
      const hit = tryFile(join(dirname(parent), specifier));
      if (hit) return { url: hit, shortCircuit: true };
    }
  }
  return next(specifier, context);
}
