"use client";

import { preload } from "react-dom";

import { lumiereFontUrl, type LumiereFontKey } from "@/lib/lumiere/font-urls";

/**
 * HOME-ONLY FONT PRELOAD (report §10 step 4): one `<link rel="preload"
 * as="font">` per hero face, in THIS page's HTML head only.
 *
 * A client component on purpose. Called from the Server Component, the hint
 * travelled in the RSC stream as an `HL` row and reached the browser after
 * hydration — the HTML head carried no link (checked on the built page). The
 * SSR renderer emits a hoistable `<link>` for a `preload()` made while a
 * client component renders — the same path `next/image` uses for its
 * `priority` posters, which do appear in the head — so the call lives here,
 * rendered first in the home. On the client the same call is idempotent.
 */
export const FontPreload = ({ keys }: { keys: LumiereFontKey[] }) => {
  for (const key of keys) {
    preload(lumiereFontUrl(key), { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  }
  return null;
};
