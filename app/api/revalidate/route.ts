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

/**
 * A slug goes into a PATH, so it is checked rather than interpolated on trust.
 * `..` or a slash would name a path that is not the post's, and revalidating an
 * arbitrary route is a smaller prize than evicting an arbitrary tag but it is
 * the same mistake. Hub slugs are lowercase words and hyphens.
 *
 * `productSlug` and `collectionSlug` above are NOT checked, and that is left
 * alone deliberately rather than overlooked: they predate this and the
 * unconditional `revalidateTag("catalog")` already covers every page they name,
 * so tightening them is a change with a behaviour risk and no gain. Worth doing
 * on its own, not folded into a posts PR.
 */
const isSlug = (value: unknown): value is string =>
  typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,127}$/.test(value);

/** Called by the Hub (Lovable edge function `notify_website`) when a product, variant, stock, post or site setting changes. */
export async function POST(req: Request) {
  if (req.headers.get("x-revalidate-secret") !== process.env.REVALIDATE_SECRET) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { productSlug?: string; collectionSlug?: string; postSlug?: string; tag?: string };
  revalidatePath("/");
  if (body.productSlug) revalidatePath(`/products/${body.productSlug}`);
  if (body.collectionSlug) revalidatePath(`/collections/${body.collectionSlug}`);
  // A post moves TWO pages: its own, and the list it appears in. The list is
  // revalidated for a new post as well as an edited one, which is why it is not
  // conditional on the slug being one we already know.
  if (isSlug(body.postSlug)) {
    revalidatePath("/blog");
    revalidatePath(`/blog/${body.postSlug}`);
  }
  revalidateTag("catalog");
  // `tag` is ADDITIVE to the catalog bust above, not a replacement for it: the
  // Hub has always been able to POST a bare body and mean "the catalog moved",
  // and a settings notification must not quietly stop doing that.
  const tag = TAGS.find((t) => t === body.tag);
  if (tag) revalidateTag(tag);
  // An unrecognised tag or slug is REPORTED rather than swallowed — a Hub that
  // starts sending "settings" instead of "content", or a slug this refuses to
  // put in a path, should find that out from the response and not from a page
  // that never updates. Same reason both are named rather than one flag.
  return NextResponse.json({
    ok: true,
    ...(body.tag && !tag ? { ignoredTag: body.tag } : {}),
    ...(body.postSlug !== undefined && !isSlug(body.postSlug) ? { ignoredPostSlug: String(body.postSlug).slice(0, 64) } : {}),
  });
}
