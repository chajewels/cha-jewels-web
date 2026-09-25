import { Mail } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";
import type { SocialKey, SocialLink } from "@/lib/types";

/**
 * A row of circular icon buttons, one per link. Each is a plain anchor that
 * opens in a new tab; the icon is the whole label visually and the i18n
 * `social.<key>` string is the accessible name, so nothing here renders an
 * address as text.
 *
 * Two tones, because the row sits on the charcoal footer and on white cards:
 *   dark   ring chalk/40 (3.57:1 on charcoal-deep), glyph chalk/75
 *   light  ring charcoal/60 (3.55 on chalk, 3.69 on white), glyph charcoal-deep
 * A hairline ring on light was the first draft and measures 1.16:1 — below the
 * 3:1 a component boundary needs — so the light ring is the same charcoal/60
 * edge inputs and gallery arrows use. Both rings and both glyphs are rows in
 * scripts/check-contrast.mjs.
 *
 * The glyphs are simple monochrome outlines drawn in currentColor. No brand
 * icon font is loaded: four paths cost nothing and cannot go missing.
 */
export function SocialIcons({ items, tone, lang, className = "" }: {
  items: SocialLink[];
  tone: "light" | "dark";
  lang: Lang;
  className?: string;
}) {
  const t = tr(lang);
  // An empty list is "the Hub holds no social links", which renders as nothing
  // rather than as an empty <ul> the callers would still have put a heading on.
  if (items.length === 0) return null;
  const ring = tone === "dark"
    ? "border-chalk/40 text-chalk/75 hover:border-chalk hover:text-chalk focus-visible:outline-gold-pale"
    : "border-charcoal/60 text-charcoal-deep hover:border-gold-dark hover:text-gold-dark focus-visible:outline-gold-dark";
  return (
    <ul className={`flex flex-wrap gap-3 ${className}`}>
      {items.map((it) => (
        <li key={`${it.key}-${it.href}`}>
          <a
            href={it.href}
            target="_blank"
            rel="noopener"
            aria-label={t("social", it.key)}
            className={`grid h-10 w-10 place-items-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${ring}`}
          >
            <SocialGlyph name={it.key} />
          </a>
        </li>
      ))}
    </ul>
  );
}

/** The glyphs, exported so the floating Messenger button draws the same one. */
export function SocialGlyph({ name, size = 18 }: { name: SocialKey; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "email":
      return <Mail size={size} strokeWidth={1.6} aria-hidden="true" />;
    case "facebook":
      // The "f": a stem with a crossbar and a hooked top.
      return (
        <svg {...common}>
          <path d="M14 8.5V6.8c0-1 .6-1.6 1.6-1.6H17.5V2.5h-2.7C11.9 2.5 10.6 4.3 10.6 7v1.5H8v3.3h2.6V21.5h3.4v-9.7h2.8l.5-3.3H14Z" />
        </svg>
      );
    case "messenger":
      // Speech bubble with the bolt.
      return (
        <svg {...common}>
          <path d="M12 3C7 3 3 6.7 3 11.3c0 2.5 1.2 4.7 3.1 6.2V21l3-1.7c.9.3 1.9.4 2.9.4 5 0 9-3.7 9-8.4S17 3 12 3Z" />
          <path d="m7.5 13.5 3-3.2 2.5 2.4 3.5-3.2" />
        </svg>
      );
    case "whatsapp":
      // Bubble with a tail and the handset.
      return (
        <svg {...common}>
          <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z" />
          <path d="M9.2 8.6c.2-.4.5-.4.8-.4h.5l.7 1.7-.6.8c.5 1 1.4 1.9 2.4 2.4l.8-.6 1.7.7v.6c0 .3-.1.6-.4.8-.6.5-1.4.6-2.1.3-2-.8-3.6-2.4-4.4-4.4-.3-.7-.2-1.5.6-1.9Z" />
        </svg>
      );
    case "line":
      // Rounded bubble with a tail and three dots.
      return (
        <svg {...common}>
          <path d="M12 3.5c-5 0-9 3.3-9 7.3 0 3.6 3.2 6.6 7.5 7.2l-.3 2.5 3.3-2.4c4.4-.5 7.5-3.6 7.5-7.3 0-4-4-7.3-9-7.3Z" />
          <path d="M8 10.8h.01M12 10.8h.01M16 10.8h.01" strokeWidth={2.4} />
        </svg>
      );
  }
}
