import type { NextConfig } from "next";
import path from "node:path";
import { OPTIMIZED_IMAGE_HOSTS } from "./lib/image-hosts";

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
    formats: ["image/avif", "image/webp"],
  },
};
export default config;
