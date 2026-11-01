// Ported from the Lumière reference (src/stores/preload-store.ts). The
// reference's robot form (always "loaded") is not ported, so `useHasLoaded`
// is the store's flag alone.
"use client";

import { create } from "zustand";

interface PreloadStore {
  /**
   * True once every asset the gate waits on has landed — the moment the gate
   * starts to lift, not the moment it finishes leaving.
   *
   * The hero's entrance hangs off this. It cannot hang off mount: the gate
   * covers the page while eleven photographs decode, and a reveal that ran
   * there would already be over by the time anyone saw it.
   *
   * Pages without the preloader (every inner page; the home on a repeat visit
   * in the same session, D-9) set it at once — see `components/lumiere/common/preloader.tsx`.
   */
  hasLoaded: boolean;
  /**
   * The curtain lifted BEFORE React hydrated (the inline cap in
   * components/lumiere/common/preloader.tsx, P2b): the hero is already on
   * screen at rest, drawn by CSS, so every entrance must land at once rather
   * than play — a reveal that replayed on hydration would be a flash.
   */
  liftedEarly: boolean;
  setLoaded: (options?: { early?: boolean }) => void;
}

export const usePreloadStore = create<PreloadStore>((set) => ({
  hasLoaded: false,
  liftedEarly: false,
  setLoaded: (options) => set({ hasLoaded: true, liftedEarly: options?.early === true }),
}));

/** True when the curtain lifted before hydration — every entrance is immediate. */
export const useLiftedEarly = (): boolean => usePreloadStore((state) => state.liftedEarly);

/** True once the preloader has begun to lift (or was never shown). */
export const useHasLoaded = (): boolean => usePreloadStore((state) => state.hasLoaded);
