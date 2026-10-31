"use client";

/**
 * What the preloader waits on besides the hero's images and the webfonts.
 *
 * The reference hard-wired its two 3D scenes (`whenPendantReady`,
 * `whenRingsReady`). Here the scenes arrive in P2, so they register
 * themselves: `registerReadyGate("pendant", promise)` from the scene module,
 * and the preloader counts every registered gate, each capped at `capMs`
 * (a slow GPU never holds the site). A gate registered after the preloader
 * has started counting is simply not waited for — the curtain is already
 * timing itself (D-9: hard cap 4 s).
 */
const gates = new Map<string, Promise<unknown>>();

export const registerReadyGate = (name: string, ready: Promise<unknown>): void => {
  gates.set(name, ready.catch(() => undefined));
};

export const readyGateNames = (): string[] => [...gates.keys()];

/** Every registered gate, each settled no later than `capMs` from now. */
export const whenGatesReady = (capMs: number): Promise<unknown>[] =>
  [...gates.values()].map(
    (gate) =>
      new Promise<void>((resolve) => {
        const cap = setTimeout(resolve, capMs);
        gate.then(
          () => { clearTimeout(cap); resolve(); },
          () => { clearTimeout(cap); resolve(); },
        );
      }),
  );

/** Tests only. */
export const resetReadyGates = (): void => gates.clear();
