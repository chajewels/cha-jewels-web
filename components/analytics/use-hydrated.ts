"use client";
import { useSyncExternalStore } from "react";

/**
 * FALSE ON THE SERVER AND DURING HYDRATION, TRUE AFTER.
 *
 * analyticsEnabled() (lib/analytics.ts) reads `window.location`, so it answers
 * false on the server and true in a browser on the production host. Rendered
 * straight into the root layout, that made the browser's first render differ
 * from the server HTML on every production page: the server sent nothing where
 * the browser rendered <Analytics/>, <SpeedInsights/> (a Suspense boundary)
 * and the Metricool <Script/>, React lost its place in the markup and threw
 * error #418 ("the server rendered text didn't match the client"), rebuilding
 * the whole page on the client.
 *
 * useSyncExternalStore is React's own answer: during hydration it uses the
 * server snapshot (false), so the first client render matches the HTML, then
 * it re-renders at once with the client snapshot (true). The analytics mount
 * one render later, still before the browser is idle — no event is lost, and
 * lib/analytics.ts waits for the queue in any case.
 */
const subscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
