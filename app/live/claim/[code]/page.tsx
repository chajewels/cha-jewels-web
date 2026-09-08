import { notFound } from "next/navigation";
import { hub } from "@/lib/hub-api";
import { ClaimCard } from "@/components/commerce/claim-card";
export const dynamic = "force-dynamic";
/** Phase 3 entry point. Reads a live claim by code; checkout wiring lands with POST /claims/:code/checkout. */
export default async function ClaimPage({ params }: { params: Promise<{ code: string }> }) {
  const claim = await hub.claim((await params).code);
  if (!claim) notFound();
  return <section className="py-[clamp(48px,7vw,96px)]"><div className="wrap max-w-[640px]"><ClaimCard claim={claim} /></div></section>;
}
