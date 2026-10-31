/**
 * Whether a request path is the home page — `/`, `/en` or `/ja` (with or
 * without a trailing slash, query ignored). The root layout uses it to swap the
 * site chrome for the Lumière home's own (P2: the Lumière header lives inside
 * the pinned hero and the Lumière footer closes the page; P3 puts the Lumière
 * chrome on every page and this switch goes). Pure, so tests can prove it.
 */
export const isHomePath = (path: string | null | undefined): boolean => {
  if (!path) return false;
  const clean = path.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
  return clean === "/" || clean === "/en" || clean === "/ja";
};
