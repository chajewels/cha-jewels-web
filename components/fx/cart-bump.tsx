"use client";
import { useEffect, useRef } from "react";
import { DUR, EASE_LUX } from "@/lib/motion";
import { REDUCED } from "@/components/fx/media";

/** Fired by AddToCart once the Server Action has actually returned. */
export const CART_ADDED = "cj:cart-added";

/**
 * The header's bag icon, bumping once when a piece lands in the cart.
 *
 * Wraps the icon inside the (server) CartButton. It listens for CART_ADDED,
 * which components/commerce/add-to-cart.tsx dispatches only after the add has
 * succeeded — never optimistically. One small scale and lift on the Web
 * Animations API, no stylesheet (the header is on every page). Reduced
 * motion: no bump; the count still changes.
 */
export function CartBump({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const bump = () => {
      const el = ref.current;
      if (!el || typeof el.animate !== "function" || window.matchMedia(REDUCED).matches) return;
      el.animate(
        [{ transform: "none" }, { transform: "translateY(-3px) scale(1.28)" }, { transform: "none" }],
        { duration: DUR.image * 500, easing: `cubic-bezier(${EASE_LUX.join(",")})` },
      );
    };
    window.addEventListener(CART_ADDED, bump);
    return () => window.removeEventListener(CART_ADDED, bump);
  }, []);
  return <span ref={ref} className="inline-flex">{children}</span>;
}
