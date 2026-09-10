import type { Metadata } from "next";
import { LegalDoc } from "@/components/site/legal-doc";
import { privacySections } from "@/lib/content/legal";

export const metadata: Metadata = {
  title: "プライバシーポリシー / Privacy policy",
  description: "What Cha Jewels collects, why, who else sees it, and how to ask for a copy or a deletion.",
};

export default function PrivacyPage() {
  return <LegalDoc titleJa="プライバシーポリシー" titleEn="Privacy policy" sections={privacySections} />;
}
