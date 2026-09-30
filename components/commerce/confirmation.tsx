import type { ReactNode } from "react";
import Link from "next/link";
import { SocialGlyph } from "@/components/site/social-icons";
import { ProductTrust } from "@/components/catalog/product-trust";
import { CommerceStyle, OrderSlab, type SlabLine } from "@/components/commerce/commerce-ui";
import { Button } from "@/components/ui/button";
import { follow } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n";
import type { PieceImage } from "@/lib/product-media";

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
    <section className="pb-24 pt-[clamp(28px,5vw,56px)]">
      <CommerceStyle />
      <div className="wrap grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark before:h-px before:w-8 before:bg-gold-dark">
            {t("complete", "reference")}
            <span className="font-mono text-[13px] normal-case tracking-[0.04em] text-charcoal-deep">{reference}</span>
          </p>
          <h1 className="mb-3.5 mt-3 text-[clamp(32px,4.4vw,56px)]">{heading}</h1>
          <div className="max-w-[60ch] text-[17px] leading-relaxed text-charcoal-deep">{lede}</div>
          {children}
        </div>
        <div className="grid gap-4">
          <OrderSlab {...slab} />
          <div className="border border-hairline bg-white px-4"><ProductTrust lang={lang} only={["pay", "ship", "returns"]} /></div>
        </div>
      </div>
    </section>
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
          <Link href="/contact">{t("social", "messenger")}</Link>
        )}
      </Button>
    </div>
  );
}

/** A Hub order or draft line's photo, shown whole and contained (no cut-out is sent on order lines). */
export const linePicture = (url: string | null, alt: string | null = null): PieceImage | null =>
  url ? { kind: "whole", src: url, original: url, alt } : null;
