// 📖 Docs: obsidian/meta/optimization-history.md → "The studio HDRI decodes in a worker"

import { HalfFloatType } from "three";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";

/**
 * Decodes the studio EXR off the main thread. DWAB decompression is pure
 * JavaScript — 533 ms of one task on a 4× throttled phone, in the middle of
 * the hero's entrance. This runs the very same `EXRLoader.parse` and transfers
 * the half-float pixels back; `studio-hdri.ts` applies them exactly as the
 * loader's own `load()` does.
 */
self.onmessage = async ({ data: url }: MessageEvent<string>) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: ${response.status}`);
    const loader = new EXRLoader();
    loader.setDataType(HalfFloatType);
    const { width, height, data, format, colorSpace, type } = loader.parse(
      await response.arrayBuffer(),
    );
    if (!data) throw new Error(`${url}: no pixel data`);
    self.postMessage(
      { ok: true, texData: { width, height, data, format, colorSpace, type } },
      { transfer: [data.buffer] },
    );
  } catch (error) {
    self.postMessage({ ok: false, error: String(error) });
  }
};
