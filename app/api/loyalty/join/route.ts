import { NextResponse } from "next/server";
import { z } from "zod";
import { hub } from "@/lib/hub-api";
const Body = z.object({ name: z.string().min(1).max(120), contact: z.string().min(5).max(160), region: z.enum(["JP", "PH", "OTHER"]), lang: z.enum(["ja", "en"]) });
/** Forwards a signup to the Hub. The Hub converts signups to customers; the tier itself comes from loyalty_ledger. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  try { await hub.loyaltyJoin(parsed.data); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ ok: false }, { status: 502 }); }
}
