import type { Metadata } from "next";
import { LegalDoc } from "@/components/site/legal-doc";
import { termsSections } from "@/lib/content/legal";

export const metadata: Metadata = {
  title: "利用規約 / Terms of sale",
  description: "Prices, layaway, claims from Live, shipping, returns, repairs and governing law.",
};

export default function TermsPage() {
  return <LegalDoc titleJa="利用規約" titleEn="Terms of sale" sections={termsSections} />;
}
