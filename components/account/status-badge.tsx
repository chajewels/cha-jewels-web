import { toneClass, type Tone } from "@/lib/order-status";

/**
 * The status badge the four account pages share — orders and layaway, list and
 * detail. All four rendered the same span, so a change to how a status reads
 * meant four edits and four chances to miss one.
 *
 * The dot repeats the tone the border and text colour already carry, which is
 * the point: the colours differ by hue more than by lightness, so a customer
 * who cannot separate gold from teal had only the wording to go on. The dot
 * adds a second, non-colour channel — position and presence — and the wording
 * stays authoritative either way. It is aria-hidden because it says nothing
 * the adjacent text does not.
 *
 * `Tone` and `Surface` are imported rather than restated; lib/order-status.ts
 * is the one place those unions are written.
 */
const dot: Record<Tone, string> = {
  good: "bg-gold-dark",
  /**
   * An ORANGE FILL INSIDE A CHARCOAL-DEEP RING, and the ring is load-bearing
   * rather than decorative: orange on chalk measures 1.81:1, under the 3.0 a
   * non-text indicator needs, while the ring is 14.57. Drop the ring and the
   * dot stops being perceivable — the contrast gate has a row for the ring.
   */
  pending: "bg-orange ring-1 ring-charcoal-deep",
  /** Hollow: absence of fill is the third channel, after hue and the wording. */
  dead: "border border-charcoal/70",
};

export function StatusBadge({ tone, text }: { tone: Tone; text: string }) {
  return (
    <span className={`inline-flex items-center gap-2 border px-3 py-1 text-xs ${toneClass(tone)}`}>
      <i aria-hidden="true" className={`h-1.5 w-1.5 rotate-45 ${dot[tone]}`} />
      {text}
    </span>
  );
}
