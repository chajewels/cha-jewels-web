# Softer wording for unsupported claims (DP-10, owner-approved 2026-11-02) — PREPARED, NOT APPLIED

**Rule:** no evidence was supplied for these claims, so nothing is asserted as fact and nothing is invented. Each row gives the current text, the evidence status (from `GUIDE-TRUST-CONTENT-REVIEW-2026-11-01.md` §2) and a softer replacement that stays true without the missing evidence. **If you supply the evidence, keep the current wording instead.** Not applied to the site: several of these lines live in files the Lumière redesign also rewrites (`lib/i18n*`, `app/about/page.tsx`), so applying them now would collide with that work; they are applied in one commit after you confirm, on top of whichever redesign state is current. JA replacements are drafts for the owner's review.

| OD | Where | Current | Evidence | Softer replacement (EN / JA) |
|---|---|---|---|---|
| CT-1 | About | "sourced in Japan" | an owner-published fact, no document | keep as approved wording, or: "Pieces we offer are sourced through Japan" |
| CT-2 | `lib/content/about.ts:149,153` | "Certified diamond jewelry"; "…and certification assistance" | the FAQ says certification only when the listing states it | "Diamond jewelry (with a certificate where the listing states one)"; "Jewelry resizing, polishing, and help with certificates where available" / 「ダイヤモンドジュエリー（鑑定書は商品ページに記載がある場合のみ）」 |
| CT-3 | `lib/content/jewelry-guide.ts:390` | "The most common platinum for jewelry in Japan." | no source | "A platinum purity widely used in jewelry." / 「ジュエリーに広く使われるプラチナの純度です。」 |
| CT-4a | `lib/content/shopping-guide.ts:105` | "10% consumption tax… no revenue stamp is affixed" | tax rate is statutory; "no stamp" not evidenced | "Every amount includes consumption tax. Receipts are issued electronically." / 「金額はすべて税込です。領収書は電子発行です。」 |
| CT-4b | `shopping-guide.ts:90` | "the coupon comes off first" | not evidenced in the Hub text | "If you use a coupon and points on the same order, they are applied as shown at checkout." / 「クーポンとポイントを同じご注文で使う場合は、ご注文手続きの画面に表示のとおり適用されます。」 |
| CT-4c | shopping guide | unconditional free shipping from ¥8,000 vs FAQ "may apply to eligible orders" | the FAQ is the narrower statement | use the FAQ phrasing in both places: "Free shipping may apply to eligible orders" |
| CT-5a | `shopping-guide.ts:51`; `jewelry-guide.ts:398`; `lib/i18n.ts:202,352` | "Every preloved piece is authenticated…" / "Every piece is checked individually in Japan before it is offered" | no process document for "every" | "Preloved pieces are authenticated and their hallmarks checked in Japan before we list them." / "We check pieces in Japan before we offer them." / 「プレラブド品は、掲載前に日本で真贋と刻印を確認しています。」 |
| CT-5b | About `listingLabel` (`about.ts:179`) | "What every listing states" | purity and weight are nullable in the contract | "What a listing states, where applicable" / 「各商品ページの記載項目（該当する場合）」 |
| CT-6 | `lib/i18n.ts:227` and the About product list | preloved watches offered | stock not visible | keep only if watches are stocked; otherwise remove the word "watches" from that line |

**Also awaiting your evidence (not wording):** G4 registered-name form against the registration certificate; G2 the legal pages' `sales@` address equals the Hub contact email; X7 branch-alias protection. Without them these stay recorded as UNVERIFIED.
