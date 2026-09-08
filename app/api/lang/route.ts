import { NextResponse } from "next/server";
import { LANG_COOKIE } from "@/lib/i18n";
export async function POST(req: Request) {
  const { lang } = (await req.json()) as { lang?: string };
  if (lang !== "ja" && lang !== "en") return NextResponse.json({ ok: false }, { status: 400 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}
