import type { ReactNode } from "react";
import { localePath } from "@/lib/locale";
import Link from "next/link";
import { SocialGlyph } from "@/components/site/social-icons";
import { ProductTrust } from "@/components/catalog/product-trust";
import { CommerceStyle, OrderSlab, type SlabLine } from "@/components/commerce/commerce-ui";
import { Button } from "@/components/ui/button";
import { follow } from "@/lib/settings";
import { tr } from "@/lib/i18n";
import { type Lang } from "@/lib/i18n-core";
import type { PieceImage } from "@/lib/product-media";
import { PageHead, PageSection } from "@/components/lumiere/page/page-head";

/**
 * THE CONFIRMATION LAYOUT (build step 3; comp page-comps/cart-checkout
 * "Confirmation"): the reference and heading, what was said, what happens
 * next, then the actions — and beside it the dark slab with the pieces and
 * the Hub's total, and the trust rows.
 *
 * NO ORANGE ON THIS PAGE (D3-10): nothing here buys. "View this order" is an
 * outline button and Messenger an in-page gold ghost link — the floating
 * button stays hidden on /checkout/*.
 */
export function ConfirmationLayout({ lang, reference, heading, lede, children, slab }: {
  lang: Lang;
  reference: string;
  heading: string;
  lede: ReactNode;
  children: ReactNode;
  slab: { title: string; lines: SlabLine[]; rows: { k: string; v: ReactNode }[]; total: { k: string; v: string; sub?: ReactNode } };
}) {
  const t = tr(lang);
  return (
    <>
      <CommerceStyle />
      <PageHead
        eyebrow={<>{t("complete", "reference")}<span className="icm-ref">{reference}</span></>}
        title={heading}
        lead={lede}
      />
      <PageSection tone="sheet" className="icm-confirm">
        <div className="icm-cart">
          <div className="min-w-0">{children}</div>
          <div className="icm-sticky grid gap-4">
            <OrderSlab {...slab} />
            <div className="icm-trust"><ProductTrust lang={lang} only={["pay", "ship", "returns"]} /></div>
          </div>
        </div>
      </PageSection>
    </>
  );
}

/** The confirmation's two quiet actions: outline to the order, gold ghost to Messenger (or /contact when the Hub has no Messenger link). */
export async function ConfirmationActions({ lang, href, label }: { lang: Lang; href: string; label: string }) {
  const t = tr(lang);
  const messenger = await follow().then((links) => links.find((l) => l.key === "messenger")?.href ?? null, () => null);
  return (
    <div className="mt-2 flex flex-wrap gap-3">
      <Button asChild variant="outline"><Link href={href}>{label}</Link></Button>
      <Button asChild variant="ghost">
        {messenger ? (
          <a href={messenger} target="_blank" rel="noopener noreferrer"><SocialGlyph name="messenger" size={18} />{t("social", "messenger")}</a>
        ) : (
          <Link href={localePath("/contact", lang)}>{t("social", "messenger")}</Link>
        )}
      </Button>
    </div>
  );
}

/** A Hub order or draft line's photo, shown whole and contained (no cut-out is sent on order lines). */
export const linePicture = (url: string | null, alt: string | null = null): PieceImage | null =>
  url ? { kind: "whole", src: url, original: url, alt } : null;
