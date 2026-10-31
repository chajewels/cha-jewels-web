"use client";

import { createContext, useContext } from "react";

import type { LumiereFeaturedContent } from "@/lib/content/lumiere-home";

export const FeaturedContentContext = createContext<LumiereFeaturedContent | null>(null);

export const useFeaturedContent = (): LumiereFeaturedContent => {
  const value = useContext(FeaturedContentContext);
  if (!value) throw new Error("useFeaturedContent must be called inside <FeaturedSection>.");
  return value;
};
