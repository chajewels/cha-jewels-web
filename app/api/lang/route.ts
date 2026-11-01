import { NextResponse } from "next/server";
import { LANG_COOKIE } from "@/lib/i18n";
export async function POST(req: Request) {
  // W-08: a body that is not JSON, or not an object, is a 400 like a wrong
  // value — before, it threw and answered 500.
  const body: unknown = await req.json().catch(() => null);
  const lang = body && typeof body === "object" && !Array.isArray(body) ? (body as { lang?: unknown }).lang : undefined;
  if (lang !== "ja" && lang !== "en") return NextResponse.json({ ok: false }, { status: 400 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}
