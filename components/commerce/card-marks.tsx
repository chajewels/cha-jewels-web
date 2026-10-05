import Image from "next/image";

/**
 * CARD BRAND MARKS (owner 2026-10-05). The official acceptance marks the owner
 * supplied as individual files 2026-10-05, used unmodified (public/images/payment/*), for the brands Square
 * takes ONLINE in Japan: Visa, Mastercard, American Express, JCB, Diners Club
 * and Discover. UnionPay is NOT listed — Square accepts it in person only
 * (owner, and Square's "Supported Payment Methods by Country", JP online row).
 *
 * Each mark sits on its own white chip so it reads the same on the charcoal
 * footer and on white cards; the marks are never recoloured or redrawn.
 * The row carries a text label for screen readers (the caller's sentence that
 * names the brands), and each image keeps its brand name as alt text.
 */
export const CARD_BRANDS = [
  { id: "visa", file: "visa.png", name: "Visa", w: 1920, h: 622 },
  { id: "mastercard", file: "mastercard.svg", name: "Mastercard", w: 152, h: 108 },
  { id: "amex", file: "amex.png", name: "American Express", w: 93, h: 93 },
  { id: "jcb", file: "jcb.png", name: "JCB", w: 220, h: 169 },
  { id: "diners", file: "diners.png", name: "Diners Club International", w: 95, h: 69 },
  { id: "discover", file: "discover.png", name: "Discover", w: 139, h: 89 },
] as const;

const HEIGHT = { sm: "h-6", md: "h-8" } as const;

export function CardMarks({ label, size = "sm", className = "", inline = false }: { label: string; size?: keyof typeof HEIGHT; className?: string; inline?: boolean }) {
  // `inline` renders spans (phrasing content) for use inside a <button>, where a list is not allowed.
  const List = inline ? "span" : "ul";
  const Item = inline ? "span" : "li";
  return (
    <List role={inline ? "list" : undefined} aria-label={label} className={`flex flex-wrap items-center gap-1.5 ${className}`} data-testid="card-marks">
      {CARD_BRANDS.map((b) => (
        <Item key={b.id} role={inline ? "listitem" : undefined} className={`${HEIGHT[size]} flex items-center rounded-[3px] bg-white px-1 py-0.5 ring-1 ring-black/10`}>
          <Image src={`/images/payment/${b.file}`} alt={b.name} width={b.w} height={b.h} unoptimized={b.file.endsWith(".svg")} className="h-full w-auto" />
        </Item>
      ))}
    </List>
  );
}
