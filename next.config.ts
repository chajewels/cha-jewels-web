import type { NextConfig } from "next";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { OPTIMIZED_IMAGE_HOSTS } from "./lib/image-hosts";

// LUMIÈRE PLACEHOLDER BELT (docs/tasks/lumiere-p0-report.md §9). A PRODUCTION
// build (Vercel's VERCEL_ENV=production, i.e. a deploy of `main`) fails here,
// before webpack starts, while any Lumière placeholder is still referenced or
// still stored under public/lumiere/placeholder/. Evaluated by `next build`
// itself, so it does not depend on the Build Command running `prebuild`, and
// it fails the BUILD rather than a page at runtime (a module imported only by
// client components is never evaluated during the build, so the registry's
// own throw alone would surface as a 500). Previews and local builds: no-op.
if (process.env.VERCEL_ENV === "production" && process.env.NEXT_PHASE === "phase-production-build") {
  const guard = spawnSync(process.execPath, [path.join(__dirname, "scripts/check-placeholders.mjs"), "--strict"], { stdio: "inherit" });
  if (guard.status !== 0) throw new Error("next.config: Lumière placeholder content must not ship to production (scripts/check-placeholders.mjs --strict failed).");
}

const config: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    // The review form (/review/[token]) sends up to four photos through a
    // Server Action, whose default body limit is 1 MB. The photos are shrunk
    // in the browser first and the whole set is capped at 4 MB
    // (lib/reviews.ts, REVIEW_BODY_LIMIT_BYTES); this leaves room for the text
    // and stays under the hosting platform's own 4.5 MB request cap.
    serverActions: { bodySizeLimit: "4.4mb" },
  },
  images: {
    // The hosts come from lib/image-hosts.ts, which the components read too, so
    // the optimiser and the <Image>/<img> decision can never disagree. The Hub
    // host used to be `**.supabase.co`, which is every Supabase project on the
    // internet: the optimiser would happily fetch and re-serve any of them.
    // It is the Hub's own project now, restricted to its public storage path.
    remotePatterns: OPTIMIZED_IMAGE_HOSTS.map(({ hostname, pathname }) => ({
      protocol: "https" as const,
      hostname,
      ...(pathname ? { pathname } : {}),
    })),
    // Default ladder plus 80. Search suggestion thumbnails are a 40px box, and
    // a 40px box on a 2x screen wants 80 — without this the nearest candidate
    // up is 96, so every suggestion row over-fetched by a fifth. These are the
    // widths used for images that carry a `sizes` prop, and all of them must
    // stay below the smallest deviceSize (640).
    imageSizes: [16, 32, 48, 64, 80, 96, 128, 256, 384],
    // The default ladder plus two phone rungs (412, 480): a full-bleed photo
    // on a 1× phone used to fetch the 640 candidate (P2b; AVIF first, WebP
    // second — `formats` below).
    deviceSizes: [412, 480, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    formats: ["image/avif", "image/webp"],
  },
  // The Gold Guide was merged into the jewelry guide (owner 2026-10-27): its
  // old address lands on the section that holds its content. Permanent (308);
  // runs before middleware, so no page or language logic is involved.
  async redirects() {
    return [{ source: "/gold-guide", destination: "/jewelry-guide#metals", permanent: true }];
  },
  // React #418 (the SEO record's hydration error): Next 15's bundled React
  // 19.2 replays a suspended element during hydration without rewinding the
  // hydration cursor (react/react#37584, fixed in react-dom 19.3.0). This
  // loader copies React 19.3's own fix into the bundled react-dom client, and
  // FAILS the build if it cannot find the exact place — never a silent no-op.
  // A React that already has the fix is left unchanged. Remove when Next is
  // upgraded (scripts/react-hydration-replay-fix.cjs explains).
  webpack(webpackConfig) {
    webpackConfig.module.rules.push({
      test: /[\\/]next[\\/]dist[\\/]compiled[\\/]react-dom(?:-experimental)?[\\/]cjs[\\/]react-dom-client\.(?:production|development)\.js$/,
      use: [{ loader: path.join(__dirname, "scripts/react-hydration-replay-fix.cjs") }],
    });
    return webpackConfig;
  },
};
export default config;
