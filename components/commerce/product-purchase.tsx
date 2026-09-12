"use client";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { showroomCopy } from "@/lib/i18n-showroom";
import { formatMoney } from "@/lib/utils";
import { AddToCart } from "./add-to-cart";

/** One purchase control moves into the mobile bar; it retains one shared action state. */
export function ProductPurchase({ variantId, slug, stockQty, price, lang }: {
  variantId: string; slug: string; stockQty: number; price: number; lang: Lang;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [floating, setFloating] = useState(false);
  useEffect(() => {
    if (!anchor.current || !("IntersectionObserver" in window)) return;
    const target = anchor.current;
    const footer = document.querySelector("footer");
    let anchorVisible = true;
    let footerVisible = false;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === target) anchorVisible = entry.isIntersecting;
        if (entry.target === footer) footerVisible = entry.isIntersecting;
      }
      setFloating(!anchorVisible && !footerVisible);
    }, { threshold: 0 });
    observer.observe(target);
    if (footer) observer.observe(footer);
    return () => observer.disconnect();
  }, []);
  return <div ref={anchor} className="mt-6 min-h-[104px]">
    <div className={floating ? "fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-velvet-deep p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,.2)] md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none" : "border-t border-rule pt-4"}>
      <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs text-champagne/75">{showroomCopy[lang].purchase}</p><p className="mt-1 text-lg text-gold-pale">{formatMoney(price)}</p></div>
        <AddToCart variantId={variantId} slug={slug} stockQty={stockQty} lang={lang} />
      </div>
    </div>
  </div>;
}
