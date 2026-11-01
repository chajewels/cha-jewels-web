"use client";

/**
 * WHEN THE SCENES MAY BUILD (P2b, the third approved closer; D-10's device
 * budget is unchanged — this is only WHEN, never whether).
 *
 * Both 3D scenes used to start as the page hydrated, so their chunks'
 * evaluation and the build's GPU work (110–200 ms tasks on a 4× phone) fell
 * inside Lighthouse's time-to-interactive window and were counted against
 * Total Blocking Time. Now a scene waits for the curtain to lift, then for the
 * earlier of the visitor's first interaction (a pointer, a key, a wheel, a
 * touch — the page is theirs by then) or `QUIET_MS` of quiet, then for an
 * idle slot. Until then the posters stand (the Cycles renders framed as the
 * scenes frame themselves).
 */
import { usePreloadStore } from "@/lib/lumiere/preload-store";

export const QUIET_MS = 5000;
const IDLE_TIMEOUT_MS = 2000;

const whenIdle = (run: () => void): void => {
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS });
  else setTimeout(run, 50);
};

const whenLifted = (): Promise<void> =>
  new Promise((resolve) => {
    if (usePreloadStore.getState().hasLoaded) {
      resolve();
      return;
    }
    const unsubscribe = usePreloadStore.subscribe((state) => {
      if (state.hasLoaded) {
        unsubscribe();
        resolve();
      }
    });
  });

const INTERACTIONS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

const whenQuietOrTouched = (): Promise<void> =>
  new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      INTERACTIONS.forEach((event) => window.removeEventListener(event, finish));
      resolve();
    };
    const timer = setTimeout(finish, QUIET_MS);
    INTERACTIONS.forEach((event) => window.addEventListener(event, finish, { passive: true }));
  });

let pending: Promise<void> | null = null;

/** Resolves once a scene may build: after the lift, after quiet or a touch, in idle. */
export const whenAfterTTI = (): Promise<void> => {
  if (!pending) {
    pending = whenLifted()
      .then(whenQuietOrTouched)
      .then(() => new Promise<void>((resolve) => whenIdle(resolve)));
  }
  return pending;
};
