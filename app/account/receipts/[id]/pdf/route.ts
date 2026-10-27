import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { hub, HubError } from "@/lib/hub-api";
import { receiptErrorHref, receiptLang } from "@/lib/receipts";

export const dynamic = "force-dynamic";

/**
 * GET /account/receipts/:id/pdf?lang=ja|en — the receipt PDF, proxied from the
 * Hub so the customer's JWT and HUB_API_KEY never reach the browser. Under
 * /account so the middleware refreshes her session first and sends a
 * signed-out visitor to sign in.
 *
 * The Hub records a download on every call (2nd+ = 再発行); this route only
 * runs when she presses Download. A refusal sends her to /account/receipts
 * with the Hub's code, never to a bare error page.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = receiptLang(req.nextUrl.searchParams.get("lang"));
  const back = (code: string) => NextResponse.redirect(new URL(receiptErrorHref(code), req.nextUrl.origin), 303);

  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getSession();
  const jwt = data.session?.access_token;
  if (!jwt) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent("/account/receipts")}`, req.nextUrl.origin), 303);

  try {
    const res = await hub.receiptPdf(jwt, id, lang);
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": res.headers.get("content-disposition") ?? `attachment; filename="receipt.pdf"`,
        "Cache-Control": "no-store, private",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (e) {
    if (e instanceof HubError) return back(e.code ?? (e.status === 404 ? "not_found" : "failed"));
    return back("failed");
  }
}
