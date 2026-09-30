/**
 * Shared parts of the brand and programme pages (build step 5; comp
 * page-comps/brand-programmes): About, Why Cha Jewels, Affiliations, Layaway,
 * Loyalty and Wholesale. Presentational only, no data reads. They reuse the
 * step 6 surfaces: the hero's dark stage (`.cs-pool`, app/globals.css) and the
 * dark band (`.band-dark` on charcoal-deep), with the type scale of the
 * supporting pages. Every text/surface pair here is registered in
 * scripts/check-contrast.mjs ("STEP 5 BRAND PAGES").
 */

/** Section rhythm: the comp's `.sec` (88px, 56px on a phone) and `.sec-s`. */
export const SEC = "py-14 sm:py-[88px]";
export const SEC_S = "py-10 sm:py-14";

/** Page title. Japanese is set smaller and breaks between phrases only. */
export const H_DISPLAY =
  "text-[clamp(36px,5vw,64px)] leading-[1.08] [:lang(ja)_&]:text-[clamp(28px,3.6vw,46px)] [:lang(ja)_&]:leading-[1.4] [:lang(ja)_&]:[word-break:auto-phrase]";
/** A section heading. */
export const H_HEAD =
  "text-[clamp(28px,3.4vw,44px)] leading-[1.12] [:lang(ja)_&]:text-[clamp(22px,2.6vw,32px)] [:lang(ja)_&]:leading-[1.45] [:lang(ja)_&]:[word-break:auto-phrase]";
/** A card or row title. */
export const H_TITLE =
  "text-[clamp(20px,2.2vw,26px)] leading-[1.25] [:lang(ja)_&]:text-[clamp(18px,1.8vw,21px)] [:lang(ja)_&]:leading-[1.55] [:lang(ja)_&]:[word-break:auto-phrase]";
/** Lede paragraph, light surface and dark surface. */
export const LEDE = "max-w-[60ch] text-[17px] leading-[1.75] text-charcoal/85 [:lang(ja)_&]:text-[15.5px] [:lang(ja)_&]:leading-[1.95]";
export const LEDE_DARK = "max-w-[60ch] text-[17px] leading-[1.75] text-chalk/85 [:lang(ja)_&]:text-[15.5px] [:lang(ja)_&]:leading-[1.95]";

/** The hero's dark stage: the warm pool of light and a gold floor line at its foot. */
export function StageBand({ children, className = "", as: Tag = "section" }: { children: React.ReactNode; className?: string; as?: "section" | "div" }) {
  return (
    <Tag className={`band-dark relative overflow-hidden bg-charcoal-deep text-chalk ${className}`}>
      <div aria-hidden="true" className="cs-pool" />
      <div className="relative">{children}</div>
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,rgb(201_162_39/0),rgb(201_162_39/.55)_25%,rgb(232_210_138/.75)_50%,rgb(201_162_39/.55)_75%,rgb(201_162_39/0))]" />
    </Tag>
  );
}

/** A plain dark band (the comp's `.band-dark`): charcoal-deep, no pool. */
export function DarkBand({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`band-dark bg-charcoal-deep text-chalk ${className}`}>{children}</section>;
}

/** The small caps label inside a ledger cell or a card. */
export function Label({ children, dark = false, className = "" }: { children: React.ReactNode; dark?: boolean; className?: string }) {
  return (
    <span className={`block text-[11px] font-semibold uppercase tracking-[0.14em] [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.05em] ${dark ? "text-gold-pale" : "text-gold-dark"} ${className}`}>
      {children}
    </span>
  );
}
