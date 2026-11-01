"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Lang } from "@/lib/i18n";
import type { LumiereHeroContent } from "@/lib/content/lumiere-home";

/** A labelled destination in the header's primary row (D-18). */
export interface HeroNavLink {
  label: string;
  href: string;
}

/**
 * The chrome the hero's header carries on this site (report §8): the D-18
 * labels, the site's own controls rendered on the server and handed down as
 * nodes (the live cart count, the account menu, the language toggle, the
 * search), and every destination the phone menu lists.
 */
export interface HeroChrome {
  /** Desktop labels, left of the wordmark: Collections · Blog · About · Layaway (EN) / Jewelry Guide (JA). */
  nav: HeroNavLink[];
  /** Right group, in order: the language toggle (JA first), account, cart, search. */
  utilities: { langSwitcher: ReactNode; account: ReactNode; cart: ReactNode; search: ReactNode };
  /** The phone menu: every existing link, in groups. */
  menu: { title: string; links: HeroNavLink[] }[];
  homeHref: string;
  /** Preview-only demo mode (lib/hero-demo.ts): the review label on the hero. */
  demo?: { label: string };
  labels: { home: string; menu: string; openMenu: string; closeMenu: string; primary: string; account: string; collectionsIndex: string };
}

export interface HeroContentValue {
  lang: Lang;
  content: LumiereHeroContent;
  chrome: HeroChrome;
}

export const HeroContentContext = createContext<HeroContentValue | null>(null);

export const useHeroContent = (): HeroContentValue => {
  const value = useContext(HeroContentContext);
  if (!value) throw new Error("useHeroContent must be called inside <HeroStage>.");
  return value;
};
