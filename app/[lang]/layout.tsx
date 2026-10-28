import { notFound } from "next/navigation";
import { isLocale } from "@/lib/locale";

/**
 * THE LOCALE SEGMENT GATE (Phase 2B, map §18). Only `en` and `ja` exist; any
 * other first segment that reaches this dynamic route — /fr/…, /xx, and every
 * unknown single-segment path that no static route claimed — is not found.
 * Rendering happens in the pages below, which re-export the legacy pages:
 * `getLang()` is URL-authoritative (LANG_HEADER), so the same components serve
 * both trees without a second implementation. This layout adds no markup; the
 * root layout keeps the chrome.
 */
export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  if (!isLocale((await params).lang)) notFound();
  return <>{children}</>;
}
