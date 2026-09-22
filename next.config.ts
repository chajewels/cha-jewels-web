import type { NextConfig } from "next";
import path from "node:path";
import { OPTIMIZED_IMAGE_HOSTS } from "./lib/image-hosts";

const config: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
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
    formats: ["image/avif", "image/webp"],
  },
};
export default config;
