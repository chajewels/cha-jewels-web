"use client";

import { useEffect, useState } from "react";

/** The key the review form writes when this browser has just sent the review. */
export const reviewSentKey = (token: string) => `cj-review-sent:${token}`;

/**
 * "ALREADY USED" OR "THANK YOU" ON /review/[token].
 *
 * Found in the live test (2026-09-30): after Send, the Server Action's reply
 * re-renders the page on the server, the link now reads "used", and the form
 * (with its thank-you) is replaced by "This link has already been used" — the
 * customer who just wrote a review was told it could not be sent.
 *
 * The server cannot tell the sender from anyone else holding the link, so the
 * browser remembers it: the form writes a per-link flag to sessionStorage on
 * success, and this shows the thank-you instead of "already used" in that
 * browser for the rest of the visit. Everyone else still gets "already used".
 * Storage can be blocked (private mode); then this falls back to "already
 * used", which is still true.
 */
export function ReviewUsedOrThanks({ token, usedH, usedP, thanksH, thanksP }: { token: string; usedH: string; usedP: string; thanksH: string; thanksP: string }) {
  const [sent, setSent] = useState(false);
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(reviewSentKey(token)) === "1") setSent(true);
    } catch {
      /* storage blocked: keep "already used" */
    }
  }, [token]);
  return (
    <div role={sent ? "status" : undefined} className="grid gap-5">
      <h1 className="text-[clamp(26px,3vw,36px)] leading-tight text-charcoal-deep [:lang(ja)_&]:text-[clamp(22px,2.6vw,30px)] [:lang(ja)_&]:leading-[1.45]">{sent ? thanksH : usedH}</h1>
      <p className="text-[16px] leading-[1.75] text-charcoal/85">{sent ? thanksP : usedP}</p>
    </div>
  );
}
