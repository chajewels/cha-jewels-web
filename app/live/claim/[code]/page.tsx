import { notFound } from "next/navigation";
import { hub } from "@/lib/hub-api";
import { ClaimCard } from "@/components/commerce/claim-card";
import { getLang } from "@/lib/i18n-server";
export const dynamic = "force-dynamic";
/** Phase 3 entry point. Reads a live claim by code; checkout wiring lands with POST /claims/:code/checkout. */
export default async function ClaimPage({ params }: { params: Promise<{ code: string }> }) {
  const [claim, lang] = await Promise.all([hub.claim((await params).code), getLang()]);
  if (!claim) notFound();
  return <section className="py-[clamp(48px,7vw,96px)]"><div className="wrap max-w-[640px]"><ClaimCard claim={claim} lang={lang} /></div></section>;
}
