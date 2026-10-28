import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isSitePath, localeOf } from "@/lib/locale";
import { LEGACY_REDIRECT_HEADER } from "@/lib/legacy-redirect";

/**
 * The dynamic half of Phase 2E-stage-1 (lib/legacy-redirect.ts explains the
 * split). Called by the four dynamic legacy pages AFTER their own data load and
 * notFound() check: on a bare URL `getLang()` is already the redirect language,
 * so a page that got this far has proved it exists in that language — and a
 * page that 404'd never gets here.
 *
 * The header is middleware-owned (a client-sent value is always deleted) and is
 * only ever set on a bare path, so a locale route — which renders these very
 * components through its app/[lang] wrapper — can never redirect: no loop.
 *
 * A REAL HTTP 307. `redirect()` mid-stream degrades to a client-side meta
 * refresh, which Google reads as a PERMANENT redirect. These pages sit under no
 * Suspense boundary or loading.tsx, so the status is still unsent when this
 * runs (the same reason their notFound() answers a real 404); the redirect
 * matrix checks the status code, not the destination alone.
 */
export async function redirectLegacy(): Promise<void> {
  const to = (await headers()).get(LEGACY_REDIRECT_HEADER);
  if (to && isSitePath(to) && localeOf(to)) redirect(to);
}
