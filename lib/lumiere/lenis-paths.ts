/**
 * Where Lenis smooth scroll is mounted (owner decision D-13,
 * docs/tasks/lumiere-p0-report.md §3.2): every public page, and never the
 * transactional ones — `/checkout/**`, `/account/**`, `/login`, `/auth/**`.
 * A locale prefix (`/en`, `/ja`) is stripped first so a future localised
 * private route is covered the same way. Prefixes match on a segment
 * boundary: `/accounting` is a public page.
 *
 * Pure, so tests/lumiere-lenis-paths.test.mjs can prove the list.
 */
const LENIS_OFF = ["/checkout", "/account", "/login", "/auth"] as const;

const stripLocale = (pathname: string): string => pathname.replace(/^\/(?:en|ja)(?=\/|$)/, "") || "/";
/** `usePathname()` carries no query or hash; a caller passing a full URL path is handled the same. */
const stripQuery = (pathname: string): string => pathname.replace(/[?#].*$/, "");

export const lenisAllowed = (pathname: string | null | undefined): boolean => {
  if (!pathname) return true;
  const path = stripLocale(stripQuery(pathname));
  return !LENIS_OFF.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
};
