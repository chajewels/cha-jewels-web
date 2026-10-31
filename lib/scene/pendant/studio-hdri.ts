// 📖 Docs: obsidian/frontend/utils.md

import {
  ClampToEdgeWrapping,
  DataTexture,
  EquirectangularReflectionMapping,
  LinearFilter,
  HalfFloatType,
  LinearMipmapLinearFilter,
  WebGLCubeRenderTarget,
  type ColorSpace,
  type CubeTexture,
  type PixelFormat,
  type Texture,
  type WebGLRenderer,
} from "three";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";

/**
 * A photographed room for the stones to see — what gives the locomotive.ca
 * ring its photographic facets. A procedural room, however tuned, is too clean:
 * whole facets came out as one flat fill. A real room carries uneven light,
 * falloff and texture everywhere, and every facet picks that up.
 *
 * Poly Haven `hotel_room` by Greg Zaal, CC0. It is the 1K, DWAB-compressed copy
 * Blender ships as `datafiles/studiolights/world/interior.exr` (189 KB). A
 * bright, warm room with a large window: `studio_small_01` was tried first, and
 * it is a black studio with two lamps — the stones went near-black against the
 * cream page.
 */
export const STUDIO_HDRI_URL = "/lumiere/shared/env/hotel-room.exr";

export interface HdriCube {
  cube: CubeTexture;
  size: number;
  dispose: () => void;
}

/**
 * Decoded rooms, by URL, for the life of the page. The EXR is decoded in
 * JavaScript — DWAB decompression, about 135 ms on a desktop, 533 ms on a 4×
 * phone (now in a worker, below) —
 * and both scenes (the hero pendant and the featured rings) read the same room.
 * The rings load as the hero's last frame scrolls by, so a second decode landed
 * as a visible hitch in the middle of the hero card's growth. Decoded once, the
 * second scene only uploads it.
 *
 * The cached texture is CPU data shared between renderers: each bake below
 * calls `dispose()` on it, which frees that renderer's GPU copy only — the
 * decoded pixels stay, and the next renderer uploads its own.
 */
const decoded = new Map<string, Promise<Texture>>();

/** What the worker sends back: `EXRLoader.parse`'s result, minus the header. */
interface ExrTexData {
  width: number;
  height: number;
  data: Uint16Array | Float32Array;
  format: PixelFormat;
  colorSpace: ColorSpace;
  type: DataTexture["type"];
}

/**
 * The decode itself runs in a worker (`exr-decode.worker.ts`): on a 4× phone
 * it was a 533 ms main-thread task inside the hero's entrance. The same parse,
 * applied here as the loader's own `_applyTexData` does (clamp, linear
 * filters, anisotropy 1, the parse's format / type / colour space), so the
 * texture is the one `loadAsync` made. No worker (or it fails) → the old main-thread path.
 */
const decodeInWorker = (url: string): Promise<Texture> =>
  new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./exr-decode.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.onmessage = ({
      data,
    }: MessageEvent<{ ok: boolean; texData?: ExrTexData; error?: string }>) => {
      worker.terminate();
      if (!data.ok || !data.texData) {
        reject(new Error(data.error ?? "EXR worker failed"));
        return;
      }
      const { width, height, format, type, colorSpace } = data.texData;
      const texture = new DataTexture(
        data.texData.data,
        width,
        height,
        format,
        type,
        undefined,
        ClampToEdgeWrapping,
        ClampToEdgeWrapping,
        LinearFilter,
        LinearFilter,
        1,
        colorSpace,
      );
      texture.needsUpdate = true;
      resolve(texture);
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message));
    };
    worker.postMessage(new URL(url, location.href).href);
  });

const decodeOnMainThread = (url: string): Promise<Texture> => {
  const loader = new EXRLoader();
  loader.setDataType(HalfFloatType);
  return loader.loadAsync(url);
};

const decodeExr = (url: string): Promise<Texture> => {
  const cached = decoded.get(url);
  if (cached) return cached;
  const pending = (
    typeof Worker === "undefined"
      ? decodeOnMainThread(url)
      : decodeInWorker(url).catch(() => decodeOnMainThread(url))
  ).then((texture) => {
    texture.mapping = EquirectangularReflectionMapping;
    return texture;
  });
  // A failed load is not cached: the next scene may try again.
  pending.catch(() => decoded.delete(url));
  decoded.set(url, pending);
  return pending;
};

/** Loads an equirectangular EXR and bakes it into a mipmapped cube of `size`. */
export const loadHdriCube = async (
  renderer: WebGLRenderer,
  url: string,
  size: number,
): Promise<HdriCube> => {
  const texture = await decodeExr(url);

  const target = new WebGLCubeRenderTarget(size, {
    type: HalfFloatType,
    generateMipmaps: true,
    minFilter: LinearMipmapLinearFilter,
  });
  target.fromEquirectangularTexture(renderer, texture);
  // Frees this renderer's upload only; the decoded pixels stay cached.
  texture.dispose();

  return { cube: target.texture, size, dispose: () => target.dispose() };
};
