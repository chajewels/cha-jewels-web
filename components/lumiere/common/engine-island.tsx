"use client";

import { useEffect } from "react";

import { NearIsland } from "./near-island";

/**
 * Mounts a DOM ENGINE over server-rendered markup once it is near the
 * viewport — the port pattern for the GetLayers sections (report §7): the
 * section's HTML is on the server; its motion is a plain module (no React)
 * that binds to that HTML by `data-*` hooks, loaded with `import()` only when
 * the island is near. The engine's chunk is therefore never in the first load.
 *
 * `engine` names the module; `target` is the element the engine binds to
 * (found by id, so the island can sit anywhere in the section).
 */
export type EngineName = "spotlight" | "colonnade";

const load = async (engine: EngineName): Promise<(root: HTMLElement) => { destroy(): void }> => {
  switch (engine) {
    case "spotlight":
      return (await import("@/components/lumiere/arrivals/spotlight-engine")).mountSpotlight;
    case "colonnade":
      return (await import("@/components/lumiere/why/colonnade-engine")).mountColonnade;
  }
};

const Mount = ({ engine, target }: { engine: EngineName; target: string }) => {
  useEffect(() => {
    let cancelled = false;
    let handle: { destroy(): void } | null = null;
    const root = document.getElementById(target);
    if (!root) return;
    load(engine).then((mount) => {
      if (cancelled) return;
      handle = mount(root);
    });
    return () => {
      cancelled = true;
      handle?.destroy();
    };
  }, [engine, target]);
  return null;
};

export interface EngineIslandProps {
  engine: EngineName;
  /** The id of the element the engine binds to. */
  target: string;
  margin?: string;
}

export const EngineIsland = ({ engine, target, margin }: EngineIslandProps) => (
  <NearIsland margin={margin}>
    <Mount engine={engine} target={target} />
  </NearIsland>
);
