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
 * `Tone` is imported rather than restated; lib/order-status.ts is the one
 * place that union is written.
 */
const dot: Record<Tone, string> = {
  good: "bg-teal",
  pending: "bg-gold-pale",
  dead: "bg-chalk/40",
};

export function StatusBadge({ tone, text }: { tone: Tone; text: string }) {
  return (
    <span className={`inline-flex items-center gap-2 border px-3 py-1 text-xs ${toneClass(tone)}`}>
      <i aria-hidden="true" className={`h-1.5 w-1.5 rotate-45 ${dot[tone]}`} />
      {text}
    </span>
  );
}
