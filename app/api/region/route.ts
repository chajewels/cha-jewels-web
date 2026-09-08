import { NextResponse } from "next/server";
import { REGION_COOKIE } from "@/lib/region";
export async function POST(req: Request) {
  const { region } = (await req.json()) as { region?: string };
  if (region !== "JP" && region !== "PH") return NextResponse.json({ ok: false }, { status: 400 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(REGION_COOKIE, region, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}
