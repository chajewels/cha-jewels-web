import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { CART_COOKIE, CART_COOKIE_OPTIONS, readCart, serializeCart } from "@/lib/cart";
import { mergeSavedCart } from "@/lib/cart-sync";
import { sameLines } from "@/lib/cart-merge";
import { getLang } from "@/lib/i18n-server";

/**
 * /cart/restore — the link in every cart reminder email.
 *
 * Signed in: the saved cart is merged into this browser's cookie (cookie ∪
 * saved, larger quantity wins) and the customer lands on /cart. That is what
 * makes a reminder opened on another device show the pieces she left.
 * Signed out: /login first, then back here.
 *
 * Every outcome is a redirect; a Hub failure just shows the cart as it was.
 * Nothing is reserved by this step — the cart never holds a piece.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  let jwt: string | undefined;
  try {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getSession();
    jwt = data.session?.access_token;
  } catch { jwt = undefined; }
  if (!jwt) return NextResponse.redirect(new URL("/login?next=%2Fcart%2Frestore", origin));

  const res = NextResponse.redirect(new URL("/cart", origin));
  try {
    const cookieLines = await readCart();
    const merged = await mergeSavedCart(jwt, cookieLines, await getLang());
    if (merged && !sameLines(merged, cookieLines)) {
      const value = serializeCart(merged);
      if (value === null) res.cookies.delete(CART_COOKIE);
      else res.cookies.set(CART_COOKIE, value, CART_COOKIE_OPTIONS);
    }
  } catch { /* the cart as it was */ }
  return res;
}
