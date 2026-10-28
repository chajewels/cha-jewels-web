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
 *
 * WHICH PAGE THE PROPS DESCRIBE is the page this DOCUMENT was loaded on,
 * recorded once when this module first runs in the browser — not the path at
 * the moment a switcher mounts. The phone drawer mounts its switcher only when
 * opened, so "first render" there can be several client navigations after the
 * layout computed its answer (found in review 2026-10-28). A full page load
 * runs the module afresh, with props for the new page.
 *
 * NO OLD ANSWER CAN LAND ON A NEWER PAGE: each answer is applied only while its
 * path is still the one on screen (the effect's cleanup), and only read back
 * for the path it was asked for.
 */
const answers = new Map<string, Promise<SwitchTargets | null>>();

/** The path of the document the layout rendered (null during the server render, where the props are always right). */
const documentPath = typeof window === "undefined" ? null : window.location.pathname;

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

/** usePathname() is decoded; location.pathname is percent-encoded. Compare them decoded. */
function samePath(a: string, b: string): boolean {
  if (a === b) return true;
  try { return decodeURIComponent(a) === decodeURIComponent(b); } catch { return false; }
}

export function useSwitchTargets(initial: SwitchTargets | undefined): SwitchTargets | null | undefined {
  const pathname = usePathname();
  const [fresh, setFresh] = useState<{ path: string; targets: SwitchTargets | null } | null>(null);
  const onLoadedPage = documentPath === null || samePath(pathname, documentPath);

  useEffect(() => {
    if (onLoadedPage) return;
    let live = true;
    load(pathname).then((targets) => { if (live) setFresh({ path: pathname, targets }); });
    return () => { live = false; };
  }, [pathname, onLoadedPage]);

  if (onLoadedPage) return initial;
  return fresh?.path === pathname ? fresh.targets : null;
}
