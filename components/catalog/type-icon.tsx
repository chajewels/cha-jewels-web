import { Watch, Wallet } from "lucide-react";
import type { TypeIconName } from "@/lib/type-icons";

type IconProps = { className?: string; strokeWidth?: number };

/**
 * A product type's line icon (lib/type-icons.ts picks which), in the style of
 * the Collections menu's category icons (components/site/category-thumb.tsx):
 * lucide's line, gold-dark, no brand logos. Lucide has a watch and a wallet;
 * the bag and the generic accessory (a hang tag) are drawn here on
 * the same 24 grid with round caps. Decorative: the tile's own title names
 * the type.
 */
export function TypeIcon({ icon, className, strokeWidth = 1.5 }: IconProps & { icon: TypeIconName }) {
  const p = { className, strokeWidth, "aria-hidden": true as const };
  if (icon === "watch") return <Watch {...p} />;
  if (icon === "wallet") return <Wallet {...p} />;
  if (icon === "bag") return <Line {...p}><path d="M4.5 9h15l-1.2 10.2a2 2 0 0 1-2 1.8H7.7a2 2 0 0 1-2-1.8z" /><path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2M10.5 13h3" /></Line>;
  return <Line {...p}><path d="M7 10 12 5.5l5 4.5v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z" /><circle cx="12" cy="10" r="1.3" /><path d="M12 8.7C12 5.5 13.8 3 17 3" /></Line>;
}

function Line({ children, className, strokeWidth, ...rest }: IconProps & { children: React.ReactNode; "aria-hidden": true }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
      {children}
    </svg>
  );
}

/**
 * The icon on its well, filling the tile's image box (which keeps its own size
 * and shape). On a chalk surface (the menu, the drawer) the well is white with
 * a hairline, exactly like the category icon beside it; on a white card it is
 * chalk. Gold-dark on either passes AA (4.59:1 on chalk).
 */
export function TypeIconWell({ icon, iconClassName = "h-6 w-6", on = "white" }: { icon: TypeIconName; iconClassName?: string; on?: "white" | "chalk" }) {
  return (
    <span className={`grid h-full w-full place-items-center text-gold-dark ${on === "chalk" ? "rounded-sm border border-hairline bg-white" : "bg-chalk"}`}>
      <TypeIcon icon={icon} className={iconClassName} />
    </span>
  );
}
