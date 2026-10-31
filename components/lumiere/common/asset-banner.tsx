"use client";

/**
 * THE ASSET ERROR BANNER (docs/tasks/lumiere-p0-report.md §9a): a fixed red
 * strip naming every Lumière asset that failed to load — a model, the studio
 * EXR, an image — so a reviewer on the preview sees a broken path instead of
 * a silent poster.
 *
 * PREVIEW AND LOCAL ONLY: it renders nothing when
 * `NEXT_PUBLIC_VERCEL_ENV === "production"`. In production a failed asset
 * fails quietly to its poster: the scene's `catch` marks its ready gate, the
 * poster stays, nothing is drawn, one `console.error` line.
 *
 * Scenes and images report through `reportAssetError(url, detail)`; the
 * banner is mounted once (home, P2) and lists what it has been told.
 */

import { useSyncExternalStore } from "react";

interface AssetFailure {
  url: string;
  detail: string;
}

const failures: AssetFailure[] = [];
const listeners = new Set<() => void>();
let snapshot: readonly AssetFailure[] = failures;

export const isProductionDeployment = (): boolean => process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

export const reportAssetError = (url: string, detail: unknown): void => {
  const message = detail instanceof Error ? detail.message : String(detail ?? "failed to load");
  console.error(`[lumiere] asset failed: ${url} — ${message}`);
  if (isProductionDeployment()) return;
  if (failures.some((f) => f.url === url)) return;
  failures.push({ url, detail: message });
  snapshot = [...failures];
  listeners.forEach((listener) => listener());
};

/** Tests only. */
export const resetAssetErrors = (): void => {
  failures.length = 0;
  snapshot = [];
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const EMPTY: readonly AssetFailure[] = [];

export const AssetBanner = () => {
  const list = useSyncExternalStore(subscribe, () => snapshot, () => EMPTY);
  if (isProductionDeployment() || list.length === 0) return null;
  return (
    <div
      role="alert"
      data-testid="lumiere-asset-banner"
      className="fixed inset-x-0 top-0 z-[100] bg-garnet px-4 py-2 font-mono text-[12px] leading-snug text-white"
    >
      <strong className="mr-2 uppercase tracking-wide">Lumière asset failed (preview only)</strong>
      <ul className="inline list-none">
        {list.map((f) => (
          <li key={f.url} className="inline after:content-['_·_'] last:after:content-none">
            <code>{f.url}</code> — {f.detail}
          </li>
        ))}
      </ul>
    </div>
  );
};
