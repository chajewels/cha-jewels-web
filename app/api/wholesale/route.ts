import { NextResponse } from "next/server";
import { z } from "zod";
import { hub } from "@/lib/hub-api";
/** Forwards a wholesale lead to the Hub, which writes it to wholesale_inquiries. */
const Body = z.object({
  name: z.string().min(1).max(200),
  business: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(60).optional(),
  market: z.enum(["JP", "PH", "BOTH", "OTHER"]),
  volume: z.enum(["TEST", "20_50", "50_200", "200_PLUS"]),
  notes: z.string().max(2000).optional(),
  lang: z.enum(["ja", "en"]),
});
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  // Empty optional fields arrive as "" from FormData; drop them rather than
  // sending blanks the Hub would store as empty strings.
  const { phone, notes, ...rest } = parsed.data;
  const body = { ...rest, ...(phone ? { phone } : {}), ...(notes ? { notes } : {}) };
  try { await hub.wholesaleInquiry(body); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ ok: false }, { status: 502 }); }
}
