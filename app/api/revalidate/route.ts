import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Cache tags the Hub is allowed to bust.
 *
 * AN ALLOW-LIST, NOT A PASS-THROUGH. The body of this request decides what the
 * server does with its cache, and the only thing standing between it and the
 * internet is one shared secret. A `tag` taken at face value would let anyone
 * who ever sees that secret evict anything the site caches by name — including
 * "fx" and the per-customer reads — as fast as they can POST. Two names are
 * what the Hub actually needs, so two names are what it gets.
 *
 *   catalog  products, variants, stock, collections, categories
 *   content  the owner-editable site settings (GET /content/settings)
 *
 * They are separate on purpose: a price change and a footer edit are different
 * events, and neither should throw away the other's cache.
 */
const TAGS = ["catalog", "content"] as const;

/** Called by the Hub (Lovable edge function `notify_website`) when a product, variant, stock or site setting changes. */
export async function POST(req: Request) {
  if (req.headers.get("x-revalidate-secret") !== process.env.REVALIDATE_SECRET) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { productSlug?: string; collectionSlug?: string; tag?: string };
  revalidatePath("/");
  if (body.productSlug) revalidatePath(`/products/${body.productSlug}`);
  if (body.collectionSlug) revalidatePath(`/collections/${body.collectionSlug}`);
  revalidateTag("catalog");
  // `tag` is ADDITIVE to the catalog bust above, not a replacement for it: the
  // Hub has always been able to POST a bare body and mean "the catalog moved",
  // and a settings notification must not quietly stop doing that.
  const tag = TAGS.find((t) => t === body.tag);
  if (tag) revalidateTag(tag);
  // An unrecognised tag is reported rather than swallowed — a Hub that starts
  // sending "settings" instead of "content" should find that out from the
  // response, not from a footer that never updates.
  return NextResponse.json({ ok: true, ...(body.tag && !tag ? { ignoredTag: body.tag } : {}) });
}
