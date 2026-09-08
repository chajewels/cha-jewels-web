import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
const Body = z.object({ name: z.string().min(1).max(120), contact: z.string().min(5).max(160), region: z.enum(["JP", "PH", "OTHER"]), lang: z.enum(["ja", "en"]) });
/** Writes a signup to loyalty_signups. The Hub converts signups to customers and sets tier Glimmer via award_points on first purchase. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  if (process.env.NEXT_PUBLIC_PREVIEW_FIXTURES === "1") return NextResponse.json({ ok: true, preview: true });
  const sb = await supabaseServer();
  const { error } = await sb.from("loyalty_signups").insert(parsed.data);
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
