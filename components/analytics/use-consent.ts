"use client";
import { useSyncExternalStore } from "react";
import { CONSENT_CHANGE_EVENT, CONSENT_KEY, readConsent, type AdsConsent } from "@/lib/consent";

/**
 * The visitor's advertising choice, live: "granted", "denied", or "unset".
 *
 * "unknown" on the server and during hydration — the server cannot see
 * localStorage, so rendering anything from it on the first pass would make the
 * browser's markup differ from the server's (the error #418 use-hydrated.ts
 * explains). Follows writes on this page (CONSENT_CHANGE_EVENT) and in other
 * tabs (the storage event).
 */
export type ConsentState = AdsConsent | "unset" | "unknown";

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => { if (e.key === null || e.key === CONSENT_KEY) onChange(); };
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribe, () => readConsent()?.ads ?? "unset", () => "unknown");
}
