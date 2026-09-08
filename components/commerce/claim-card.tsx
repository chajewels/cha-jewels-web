import { formatMoney } from "@/lib/utils";
type Claim = { id: string; code: string; price_locked: number; status: string; expires_at: string };
export function ClaimCard({ claim }: { claim: Claim }) {
  const expired = claim.status !== "held" || new Date(claim.expires_at) < new Date();
  return (
    <div className="border border-gold bg-velvet-deep p-6">
      <p className="text-xs text-champagne/55">Claim code</p>
      <p className="font-display text-3xl text-gold-pale">{claim.code}</p>
      <p className="mt-4 text-champagne/80">Price locked at <b className="text-champagne">{formatMoney(claim.price_locked)}</b>.</p>
      {expired
        ? <p className="mt-4 border border-garnet p-3 text-sm">This hold has ended and the piece is back on sale. Message the team if you still want it.</p>
        : <p className="mt-4 text-sm text-champagne/70">Held until {new Date(claim.expires_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} JST. Checkout opens in Phase 2.</p>}
    </div>
  );
}
