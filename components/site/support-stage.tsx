import { SocialGlyph } from "@/components/site/social-icons";

/**
 * The parts of the supporting pages (build step 6) that the client error
 * boundary (app/error.tsx) also draws, kept apart from support-ui.tsx so the
 * boundary does not pull the product card into its bundle. No server imports.
 */

/** The view's one orange action: open Messenger (an m.me link, as the floating button). */
export function MessengerCta({ href, label, className = "" }: { href: string; label: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`btn-press inline-flex min-h-12 items-center justify-center gap-2.5 rounded-sm bg-orange px-6 py-3 text-[15px] font-medium text-charcoal-deep hover:bg-orange-hover ${className}`}
    >
      <SocialGlyph name="messenger" size={18} />
      {label}
    </a>
  );
}

/** The small caps label used across these pages. `dark` for the stage bands. */
export function Eyebrow({ children, dark = false, rule = false, className = "" }: { children: React.ReactNode; dark?: boolean; rule?: boolean; className?: string }) {
  return (
    <p className={`flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.05em] ${rule ? (dark ? "before:h-px before:w-7 before:bg-gold" : "before:h-px before:w-7 before:bg-gold-dark") : ""} ${dark ? "text-gold-pale" : "text-gold-dark"} ${className}`}>
      {children}
    </p>
  );
}

/**
 * The hero's dark stage with NO piece on it (404 and the error page): the
 * pool, a soft glow on an empty floor line, and an outline code ("404") or
 * nothing. The page's own words sit under it.
 */
export function EmptyStage({ code, title, lede, children }: { code?: string; title: string; lede: string; children?: React.ReactNode }) {
  return (
    <section className="band-dark relative overflow-hidden bg-charcoal-deep text-chalk">
      <div aria-hidden="true" className="cs-pool" />
      <div className="wrap relative grid min-h-[calc(100svh-68px-120px)] content-center py-16 text-center sm:py-20">
        <div aria-hidden="true" className="relative mx-auto mb-9 h-[170px] w-full max-w-[520px] sm:h-[200px]">
          <span className="absolute bottom-[31px] left-1/2 h-[120px] w-[260px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_100%,rgb(201_162_39/.22),transparent_70%)]" />
          {code && (
            <span className="cj-fig absolute inset-x-0 bottom-[42px] font-display text-[72px] leading-none tracking-[0.04em] text-transparent [-webkit-text-stroke:1px_rgb(232_210_138/.55)] sm:text-[96px]">
              {code}
            </span>
          )}
          <span className="absolute inset-x-[6%] bottom-[30px] h-px bg-[linear-gradient(90deg,rgb(201_162_39/0),rgb(201_162_39/.55)_25%,rgb(232_210_138/.75)_50%,rgb(201_162_39/.55)_75%,rgb(201_162_39/0))]" />
        </div>
        <h1 className="mx-auto max-w-[22ch] text-[clamp(30px,4.2vw,52px)] leading-[1.12] text-gold-pale [:lang(ja)_&]:text-[clamp(24px,3vw,38px)] [:lang(ja)_&]:leading-[1.45] [:lang(ja)_&]:[word-break:auto-phrase]">
          {title}
        </h1>
        <p className="mx-auto mt-[18px] max-w-[60ch] text-[17px] leading-[1.75] text-chalk/85 [:lang(ja)_&]:text-[15.5px]">{lede}</p>
        {children}
      </div>
    </section>
  );
}

