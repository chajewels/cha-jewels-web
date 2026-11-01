import type { ReactNode } from "react";

/**
 * A HEADING THAT RESOLVES WORD BY WORD (P4: "letter-reveal on headings, real
 * text in the HTML"). The text is plain text in the document — the `<h1>`'s
 * `textContent` is the string, spaces and all, for crawlers and screen readers —
 * with each word (a segment, for Japanese: `Intl.Segmenter` finds the phrase
 * breaks a reader would) in an inline-block span carrying its index. The
 * entrance is CSS only (app/lumiere/pages.css, `.lm-w`): where the browser has
 * scroll-driven animations the words come up out of a blur as the heading
 * enters the viewport (a view timeline; a heading already on screen at load is
 * simply at rest — no LCP delay, nothing hidden); elsewhere they come up on
 * load, quickly. Reduced motion: no animation (the base rule), the final state.
 *
 * Only a string is split; anything else is returned untouched, so it is safe
 * around any child. A Server Component with no state: usable from a client
 * component too (the output is identical on both sides).
 */
const CJK = /[぀-ヿ㐀-鿿]/;

const segment = (text: string): string[] => {
  if (CJK.test(text) && typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter("ja", { granularity: "word" }).segment(text), (s) => s.segment);
  }
  return text.split(/(\s+)/).filter((s) => s !== "");
};

export function Reveal({ children }: { children: ReactNode }) {
  if (typeof children !== "string" || children.length === 0) return <>{children}</>;
  let n = 0;
  return (
    <>
      {segment(children).map((part, i) =>
        /^\s+$/.test(part) ? (
          part
        ) : (
          <span key={i} className="lm-w" style={{ ["--i" as string]: n++ }}>
            {part}
          </span>
        ),
      )}
    </>
  );
}
