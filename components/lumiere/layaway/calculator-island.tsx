"use client";

import dynamic from "next/dynamic";

import type { Lang } from "@/lib/i18n";
import { NearIsland } from "@/components/lumiere/common/near-island";

/**
 * The layaway calculator as a LAZY CLIENT ISLAND (report §10): the form, its
 * Hub quote and the digit roll arrive only as the band nears the viewport,
 * and not in the server HTML — a calculator is a tool, not copy. Until the
 * chunk lands a same-size shell holds the column so nothing below it moves.
 *
 * The component is the existing LayawayCalculator with `variant="lumiere"`
 * (components/commerce/layaway-calculator.tsx): the same state, the same
 * `hub.layawayQuote`, the same fail-closed rules; only the surface and the
 * figures' entrance differ.
 */
const LayawayCalculator = dynamic(
  () => import("@/components/commerce/layaway-calculator").then((m) => m.LayawayCalculator),
  { ssr: false, loading: () => <div className="layaway__calc-shell" aria-hidden="true" /> },
);

export interface CalculatorIslandProps {
  lang: Lang;
  header: { title: string; sub: string; chip: string };
  cta: { label: string; href: string };
}

export const CalculatorIsland = ({ lang, header, cta }: CalculatorIslandProps) => (
  <NearIsland fallback={<div className="layaway__calc-shell" aria-hidden="true" />}>
    <LayawayCalculator lang={lang} header={header} cta={cta} variant="lumiere" />
  </NearIsland>
);
