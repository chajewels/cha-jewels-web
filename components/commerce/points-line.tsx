"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { tr, type Lang } from "@/lib/i18n";
import { pointsLineAction } from "@/lib/points-actions";
import { formatPoints, type PointsLine as Line } from "@/lib/points-line";

/**
 * "Earn 3,000 points with this piece at Radiant (2×)." under the price, for a
 * signed-in customer (owner request 2026-10-03). The product page is cached
 * for everyone, so the line is fetched after the page loads; until then, and
 * whenever there is nothing to show, it renders nothing — no placeholder, no
 * layout jump for signed-out visitors. Figures are the Hub's (lib/points-line).
 */
export function PointsLine({ variantId, lang }: { variantId: string; lang: Lang }) {
  const [line, setLine] = useState<Line>(null);
  useEffect(() => {
    let live = true;
    pointsLineAction(variantId).then((l) => { if (live) setLine(l); }).catch(() => {});
    return () => { live = false; };
  }, [variantId]);
  if (!line) return null;

  const t = tr(lang);
  if (line.kind === "join") {
    return (
      <p className="text-[13px] leading-relaxed text-charcoal/80" data-testid="points-line">
        {t("product", "pointsJoin", { points: formatPoints(line.points) })}{" "}
        <Link href="/loyalty/join" className="whitespace-nowrap font-medium text-gold-dark underline underline-offset-4">
          {t("product", "pointsJoinCta")}
        </Link>
      </p>
    );
  }
  const vars = { points: formatPoints(line.points), tier: line.tier, mult: String(line.multiplier) };
  return (
    <p className="text-[13px] leading-relaxed text-charcoal/80" data-testid="points-line">
      <span aria-hidden="true" className="mr-1.5 text-gold-dark">✦</span>
      {t("product", line.upgraded ? "pointsEarnUp" : "pointsEarn", vars)}
      {line.bonus > 0 && <> {t("product", "pointsBonus", { bonus: formatPoints(line.bonus) })}</>}
    </p>
  );
}
