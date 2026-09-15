"use client";

import { useEffect } from "react";
import { trackProductView } from "@/lib/analytics";
import type { Lang } from "@/lib/i18n";

/**
 * Records that a piece was looked at. Renders nothing.
 *
 * The de-duplication lives in lib/analytics (a module-scoped set of SKUs), not
 * here, so it holds across a remount, a client-side navigation back to the same
 * piece, and the language toggle — none of which are a second view of the same
 * product. Strict Mode's double-invoked effect is covered by the same set.
 */
export function ProductView({ sku, lang }: { sku: string; lang: Lang }) {
  useEffect(() => { trackProductView(sku, lang); }, [sku, lang]);
  return null;
}
