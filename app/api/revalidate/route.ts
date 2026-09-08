import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
/** Called by the Hub (Lovable edge function `notify_website`) when a product, variant or stock changes. */
export async function POST(req: Request) {
  if (req.headers.get("x-revalidate-secret") !== process.env.REVALIDATE_SECRET) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { productSlug?: string; collectionSlug?: string };
  revalidatePath("/");
  if (body.productSlug) revalidatePath(`/products/${body.productSlug}`);
  if (body.collectionSlug) revalidatePath(`/collections/${body.collectionSlug}`);
  revalidateTag("catalog");
  return NextResponse.json({ ok: true });
}
