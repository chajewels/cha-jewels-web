import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/queries/products";
import { isSlug, VIEWED_MAX } from "@/lib/recently-viewed";

/**
 * The pieces for "Recently viewed" (components/catalog/recently-viewed.tsx).
 * The browser keeps slugs only (lib/recently-viewed.ts); every card is built
 * from the Hub's answer here, so prices, the Sale strike, Sold and the origin
 * badge are always current. The Hub API key stays on the server.
 *
 * GET ?slugs=a,b,c (at most 12; more is a 400). An invalid slug is ignored, a
 * piece the Hub no longer publishes simply drops out, and the order asked for
 * is kept. `no-store`: the list is per visitor.
 */
export async function GET(req: Request) {
  const headers = { "cache-control": "no-store" };
  const raw = (new URL(req.url).searchParams.get("slugs") ?? "").split(",").filter(Boolean);
  if (raw.length > VIEWED_MAX) return NextResponse.json({ error: "too_many_slugs" }, { status: 400, headers });
  const slugs = [...new Set(raw.filter(isSlug))];
  const found = await Promise.all(slugs.map((s) => getProductBySlug(s).catch(() => null)));
  return NextResponse.json({ products: found.filter((p) => p != null) }, { headers });
}
