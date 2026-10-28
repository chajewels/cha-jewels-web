"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { SwitchTargets } from "@/lib/locale-nav";

/**
 * THE SWITCHER'S DESTINATIONS FOR THE PAGE ON SCREEN (found 2026-10-28).
 *
 * The layout computes `switchTargets` from the request path, but the root
 * layout is not re-rendered by a client-side navigation: after clicking from
 * /en/about to /en/faq the props still described /en/about, and the JA control
 * sent the reader to /ja/about. So the props are the answer only for the page
 * the document was loaded on — which is also all a crawler ever sees. Once the
 * path changes, the same `switchTargets` rule answers again through
 * /api/switch-targets (content eligibility included: an English-only post's JA
 * entry is still the Japanese home, never a 404, never layaway).
 *
 * ONE REQUEST PER PATH. The header, its phone variant, the footer and the
 * drawer each render a switcher; the module-level cache makes them share one
 * fetch, and Back/Forward to a path already seen costs nothing.
 *
 * `null` means "not known for this path yet" (the answer is in flight, or the
 * request failed). The switcher then offers each language's HOME — a page that
 * always exists — rather than a destination that belonged to another page.
 */
const answers = new Map<string, Promise<SwitchTargets | null>>();

function load(path: string): Promise<SwitchTargets | null> {
  let answer = answers.get(path);
  if (!answer) {
    answer = fetch(`/api/switch-targets?path=${encodeURIComponent(path)}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? (r.json() as Promise<SwitchTargets>) : null))
      .catch(() => null);
    answers.set(path, answer);
    // A failed answer is not kept: the next visit to this path asks again.
    answer.then((a) => { if (!a) answers.delete(path); });
  }
  return answer;
}

export function useSwitchTargets(initial: SwitchTargets | undefined): SwitchTargets | null | undefined {
  const pathname = usePathname();
  // The path the props were computed for: the path this document was rendered on.
  const [loadedOn] = useState(pathname);
  const [fresh, setFresh] = useState<{ path: string; targets: SwitchTargets | null } | null>(null);
  const onLoadedPage = pathname === loadedOn;

  useEffect(() => {
    if (onLoadedPage) return;
    let live = true;
    load(pathname).then((targets) => { if (live) setFresh({ path: pathname, targets }); });
    return () => { live = false; };
  }, [pathname, onLoadedPage]);

  if (onLoadedPage) return initial;
  return fresh?.path === pathname ? fresh.targets : null;
}
