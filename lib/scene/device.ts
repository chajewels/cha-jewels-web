// 📖 Docs: obsidian/frontend/utils.md

/**
 * Device tiering for WebGL scenes — the one place that decides what "mobile"
 * means. Pixel-ratio caps, ray bounces and the frame budget all read from the
 * tier returned here, so a tuning change happens in exactly one file.
 */

export type SceneTier = "desktop" | "mobile";

export interface SceneBudget {
  tier: SceneTier;
  /** Upper bound for `renderer.setPixelRatio`. */
  maxPixelRatio: number;
  /** Minimum gap between rendered frames, in ms (0 = every rAF). */
  frameGapMs: number;
  /**
   * Internal reflections traced inside the emerald. Kept low on purpose: every
   * extra bounce splits its facets into smaller, harder shards, and an emerald
   * reads as broad, calm facets.
   */
  emeraldBounces: number;
  /** Internal reflections traced inside each diamond. */
  diamondBounces: number;
  /**
   * Trace red / green / blue separately in every stone (rainbow fringes).
   * Triples the gem cost, but the stones are a few percent of the canvas.
   */
  gemDispersion: boolean;
  /** Face size of the cube the stones sample — sharper glints when larger. */
  gemCubeSize: number;
  /** React to the pointer (never on touch — see optimize-3d-scene §11). */
  pointerTilt: boolean;
}

const DESKTOP: SceneBudget = {
  tier: "desktop",
  maxPixelRatio: 2,
  // At most every second frame on a 120 Hz screen (60 fps), every frame at
  // 60 Hz. With the ticker's `<=` test 12 ms lands on 60 where 1000/60 would
  // skip two frames in three. The pendant's sway is slow; drawn 120 times a
  // second it was the whole of the hero's dropped frames (with the gem split).
  frameGapMs: 12,
  emeraldBounces: 4,
  diamondBounces: 5,
  gemDispersion: true,
  gemCubeSize: 512,
  pointerTilt: true,
};

const MOBILE: SceneBudget = {
  tier: "mobile",
  maxPixelRatio: 1.5,
  // No fixed cap on phones (fleet rule): 1000/30 with the ticker's `<=` test
  // drew 24 fps at 120 Hz and 20 at 60 Hz, which reads as choppy.
  frameGapMs: 0,
  emeraldBounces: 3,
  diamondBounces: 3,
  gemDispersion: true,
  gemCubeSize: 256,
  pointerTilt: false,
};

/** Width below which a fine-pointer device is still treated as mobile. */
const MOBILE_MAX_WIDTH = 768;

/** Crawlers and link unfurlers get the static poster, never the scene. */
const BOT_PATTERN =
  /bot|crawler|spider|slurp|crawling|facebookexternalhit|embedly|quora link preview|whatsapp|telegrambot|preview/i;

export const isLikelyBot = (): boolean =>
  typeof navigator !== "undefined" && BOT_PATTERN.test(navigator.userAgent);

/** The gem shader needs integer textures and `texelFetch` — WebGL 2 only. */
export const supportsWebGL2 = (): boolean => {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    const isSupported = context !== null;
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return isSupported;
  } catch {
    return false;
  }
};

export const getSceneBudget = (): SceneBudget => {
  if (typeof window === "undefined") return MOBILE;
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;
  const isNarrow = window.innerWidth < MOBILE_MAX_WIDTH;
  return isCoarse || isNarrow ? MOBILE : DESKTOP;
};

/**
 * Whether a 3D scene is drawn at all (owner decision D-10,
 * docs/tasks/lumiere-p0-report.md §10 step 3): phones keep the live scenes on
 * the mobile budget; the poster stands in for a crawler, a browser without
 * WebGL 2, a visitor who asked for less data (`Save-Data`), a device with
 * 4 GB of memory or less, or reduced motion.
 */
export const shouldRenderScene = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (isLikelyBot() || !supportsWebGL2() || prefersReducedMotion()) return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return false;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memory === "number" && memory <= 4) return false;
  return true;
};

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
