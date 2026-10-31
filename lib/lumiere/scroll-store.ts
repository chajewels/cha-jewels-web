// Ported from the Lumière reference (src/hooks/smooth-scroll/use-scroll.ts).
// `import type` only: this module never pulls Lenis into a bundle by itself, so
// the scroll lock (lib/scroll-lock.ts) and the preloader can read it from any
// client component without dragging the library into pages that never create
// an instance (/checkout, /account, /login, /auth — D-13).
import type Lenis from "lenis";
import { create } from "zustand";

export interface UseScroll {
  lenis: Lenis | null;
  setLenis: (lenis: Lenis | null) => void;
  isEnableScroll: boolean;
  start: () => void;
  stop: () => void;
}

export const useScroll = create<UseScroll>((set) => ({
  lenis: null,
  setLenis: (lenis) => set({ lenis }),
  isEnableScroll: true,
  start: () => set({ isEnableScroll: true }),
  stop: () => set({ isEnableScroll: false }),
}));
