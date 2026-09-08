import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { ClaimCard } from "@/components/commerce/claim-card";
import type { LiveClaim } from "@/lib/types";
import { claims } from "@/lib/fixtures";
export const dynamic = "force-dynamic";
/** Phase 3 entry point. Reads a live claim by code; checkout wiring lands with the claim_checkout RPC. */
export default async function ClaimPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (process.env.NEXT_PUBLIC_PREVIEW_FIXTURES === "1") { const c = claims.find((x) => x.code === code.toUpperCase()); if (!c) notFound(); return <section className="py-[clamp(48px,7vw,96px)]"><div className="wrap max-w-[640px]"><ClaimCard claim={c} /></div></section>; }
  const sb = await supabaseServer();
  const { data } = await sb.from("live_claims").select("id, code, price_locked, status, expires_at, product_variant_id").eq("code", code.toUpperCase()).single<LiveClaim>();
  if (!data) notFound();
  return <section className="py-[clamp(48px,7vw,96px)]"><div className="wrap max-w-[640px]"><ClaimCard claim={data} /></div></section>;
}
