"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * One-line notice driven by `?notice=<key>` (e.g. the sign-out redirect lands
 * on `/?notice=signed_out`). Shown for a few seconds under the header, then
 * gone; the query param is stripped at once so a reload or a shared link does
 * not repeat it. The status region stays mounted so assistive tech announces
 * the text when it appears.
 */
export function FlashNotice({ messages }: { messages: Record<string, string> }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const key = params.get("notice");
  const text = key ? messages[key] : undefined;
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    if (!text) return;
    setShown(text);
    const rest = new URLSearchParams(params.toString());
    rest.delete("notice");
    const qs = rest.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [text, params, pathname, router]);

  useEffect(() => {
    if (!shown) return;
    const timer = setTimeout(() => setShown(null), 5000);
    return () => clearTimeout(timer);
  }, [shown]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[68px] z-30 flex justify-center px-4">
      {shown && (
        <p className="pointer-events-auto mt-3 rounded-sm border border-gold bg-velvet-deep px-5 py-2.5 text-sm text-gold-pale shadow-[0_10px_30px_rgba(0,0,0,0.45)]">{shown}</p>
      )}
    </div>
  );
}
