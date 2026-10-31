// 📖 Docs: obsidian/frontend/utils.md

import { BufferAttribute, Color, Vector3, type BufferGeometry } from "three";

import type { GemOptions } from "./pendant/gem-material";

/**
 * Materials shared by every jewelry scene on the site — the hero pendant and
 * the featured rings — so a diamond or a gold reads the same wherever it is.
 *
 * Gem values stay physical: real IORs and real dispersion. The photographic
 * look (the locomotive.ca ring) comes from what the stones see — a photographed
 * room (`studio-hdri.ts`), read as a finite sphere around the stone, through
 * facets with a faint polish waviness — not from exaggerated optics. Pushing
 * dispersion, saturation and grain, or lighting stones with procedural strips,
 * made them look computer-generated (ADR-0021).
 *
 * `blur` is the mip level at a 512 cube; `gemBlur()` rescales it for the cube
 * actually sampled, so the softness is the same on every device.
 */

/** A gem's look, before the device budget sets bounces and the cube sets blur. */
export type GemPreset = Omit<GemOptions, "bounces">;

export interface MetalPreset {
  color: Color;
  roughness: number;
}

/**
 * Blender's gold (1.0, 0.7, 0.26 at roughness 0.14), deepened: in front of the
 * cream studio, AgX left the Blender value reading beige.
 */
export const YELLOW_GOLD: MetalPreset = {
  color: new Color(1.0, 0.64, 0.2),
  roughness: 0.16,
};

export const ROSE_GOLD: MetalPreset = {
  color: new Color(0.96, 0.58, 0.46),
  roughness: 0.14,
};

export const WHITE_GOLD: MetalPreset = {
  color: new Color(0.86, 0.86, 0.88),
  roughness: 0.1,
};

export const DIAMOND: GemPreset = {
  ior: 2.42,
  tint: new Color(1, 1, 1),
  absorption: new Vector3(0, 0, 0),
  /** Physical diamond: ~0.044 between red and blue (2.407 → 2.451). */
  dispersion: 0.044,
  fire: 1.0,
  /** Lit facets flare white. */
  highlight: 0.35,
  sparkle: { amount: 0.05, scale: 120 },
  blur: { refraction: 1.2, reflection: 1.6 },
  /** About a stone set's own size, centred on the set. */
  roomRadius: 2.0,
  polish: { amount: 0.03, scale: 12 },
  envYaw: 2.1,
  /** Higher ceiling: a colourless stone can take the window's flare. */
  envKnee: 6,
  /** A trace of the room's warmth, so white stones sit with the gold. */
  envSaturation: 0.3,
  intensity: 1.8,
};

/**
 * Coloured stones see the room in grey (`envSaturation` 0): the room's own
 * colours, mixed through a tinted stone, read as mud — see ADR-0021.
 */
const COLOURED_STONE = {
  fire: 1.0,
  highlight: 0.15,
  sparkle: { amount: 0.04, scale: 40 },
  blur: { refraction: 2.4, reflection: 2.6 },
  roomRadius: 2.0,
  polish: { amount: 0.06, scale: 1.6 },
  envYaw: 2.1,
  envKnee: 2.5,
  envSaturation: 0,
} as const;

/** Yellow-green peridot (Blender: base 0.32/0.56/0.02, absorption colour 0.42/0.78/0.04). */
export const PERIDOT: GemPreset = {
  ...COLOURED_STONE,
  ior: 1.67,
  tint: new Color(0.32, 0.56, 0.02),
  absorption: new Vector3(0.58, 0.22, 0.96).multiplyScalar(2.2),
  dispersion: 0.02,
  intensity: 1.7,
};

/** Teal sapphire (Blender: base 0.0/0.32/0.34, absorption colour 0.05/0.5/0.55). */
export const TEAL_SAPPHIRE: GemPreset = {
  ...COLOURED_STONE,
  ior: 1.77,
  tint: new Color(0.0, 0.32, 0.34),
  absorption: new Vector3(0.95, 0.5, 0.45).multiplyScalar(2.6),
  dispersion: 0.018,
  intensity: 1.8,
};

/** Reference cube size the `blur` mip levels are tuned at. */
const BLUR_REFERENCE_SIZE = 512;

export const gemBlur = (
  blur: { refraction: number; reflection: number },
  cubeSize: number,
): { refraction: number; reflection: number } => {
  const shift = Math.log2(cubeSize / BLUR_REFERENCE_SIZE);
  return {
    refraction: Math.max(0, blur.refraction + shift),
    reflection: Math.max(0, blur.reflection + shift),
  };
};

/** Geometry may arrive quantised (meshopt); the BVH wants plain floats. */
export const toFloatPositions = (geometry: BufferGeometry): void => {
  const source = geometry.getAttribute("position");
  if (source.array instanceof Float32Array && !source.normalized) return;
  const values = new Float32Array(source.count * 3);
  for (let i = 0; i < source.count; i += 1) {
    values[i * 3] = source.getX(i);
    values[i * 3 + 1] = source.getY(i);
    values[i * 3 + 2] = source.getZ(i);
  }
  geometry.setAttribute("position", new BufferAttribute(values, 3));
};
