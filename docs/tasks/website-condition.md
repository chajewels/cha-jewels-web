# Task for Claude Code — cha-jewels-web: show product condition (New / Preloved)

Repo `chajewels/cha-jewels-web`, branch `main`. Follow CLAUDE.md. Push to main; Vercel deploys.

The Hub API now returns `condition: "New" | "Preloved"` on every product (see `supabase/contracts/api.md`; add the field there).

1. `lib/types.ts`: add `condition: "New" | "Preloved"` to `Product` (optional for fixture compatibility: `condition?: …`). Set it on the fixture products in `lib/fixtures.ts` (make R-style rings `Preloved`, the rest `New`).
2. `components/catalog/condition-badge.tsx`: renders nothing for New; for Preloved renders a small outlined tag. JA `プレラブド · 日本で真贋確認済み` / EN `Preloved · authenticated in Japan`. Use the same border/text style as `KaratBadge`.
3. Product card: show the badge above the name when Preloved. Product page: show it next to `KaratBadge`.
4. Product JSON-LD (`components/site/json-ld.tsx`): add `itemCondition` = `https://schema.org/UsedCondition` for Preloved, `NewCondition` otherwise.
5. Collections page (`app/collections/[slug]/page.tsx`): add a client-free filter via query string `?condition=preloved|new` — links at the top of the list: すべて / 新品 / プレラブド (EN All / New / Preloved). Filter in the server component; keep ISR.

Done when `npm run check:terms` and `npm run typecheck` pass and, in fixture mode, `/collections/rings?condition=preloved` shows only Preloved pieces with the badge.
