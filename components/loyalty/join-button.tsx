"use client";

import { useState } from "react";
import Link from "next/link";
import { dict, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { joinLoyaltyAction } from "@/lib/loyalty-actions";
import type { EnrolOutcome } from "@/lib/loyalty-actions";

/**
 * Joining from /loyalty/join.
 *
 * This replaces a form that collected a name, a contact and a region and posted
 * them to a lead table — it enrolled nobody and told the customer "You are in"
 * regardless. The page is behind sign-in now, so the Hub already knows who this
 * is: the only thing left to collect is the decision, which is one button.
 *
 * Every outcome the server can return is rendered. `recorded` is the one worth
 * reading twice: the enrolment itself failed, the attempt was written down, and
 * the Hub has raised a staff bell — so the honest thing to tell the customer is
 * that a person will finish it, not that they are a member.
 */
export function JoinButton({ lang }: { lang: Lang }) {
  const c = dict.loyalty;
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<EnrolOutcome["state"] | null>(null);

  async function join() {
    setBusy(true);
    setOutcome(null);
    // joinLoyaltyAction never throws — every failure comes back as a state.
    const result = await joinLoyaltyAction();
    setOutcome(result.state);
    // Only `lost` is worth retrying: the other three are settled answers.
    setBusy(result.state !== "lost");
  }

  const box = "border border-hairline bg-white p-6 text-charcoal-deep";

  if (outcome === "enrolled") {
    return <div className={box}>{c.ok[lang]}</div>;
  }
  if (outcome === "already") {
    return (
      <div className={box}>
        {c.alreadyMember[lang]}{" "}
        <Link href="/account" className="underline hover:text-charcoal-deep">
          {dict.nav.account[lang]}
        </Link>
      </div>
    );
  }
  if (outcome === "recorded") {
    return <div className={box}>{c.joinFailed[lang]}</div>;
  }

  return (
    <div className="grid gap-4 border border-hairline bg-white p-6 text-sm">
      <Button type="button" onClick={join} disabled={busy}>
        {c.submit[lang]}
      </Button>
      {outcome === "lost" && <p className="text-garnet">{c.err[lang]}</p>}
      <p className="text-xs text-charcoal/70">
        {c.consent[lang]}{" "}
        <a href="/legal/terms" className="underline hover:text-gold-dark">{dict.footer.sale[lang]}</a>
        {" · "}
        <a href="/legal/privacy" className="underline hover:text-gold-dark">{dict.footer.privacy[lang]}</a>
      </p>
    </div>
  );
}
