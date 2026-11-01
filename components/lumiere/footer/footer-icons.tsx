/**
 * The footer's two marks, both from the file and both on `currentColor` so they
 * take the colour of the line they stand in — the separator is white at four
 * tenths between the legal links and solid white between the social ones, which
 * is one icon and two contexts rather than two icons.
 */

/** 1556:763. Drawn pointing up; the field turns it a quarter to the right. */
export const SubmitArrow = () => (
  <svg
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden
    focusable="false"
    className="footer__arrow"
  >
    <path
      d="M1.5 10.5H6.9V1.5M10.5 5.35714L6.9 1.5L3.3 5.35714"
      stroke="currentColor"
    />
  </svg>
);

/** 1556:767 and 1556:771 — a 4 circle, the same in both rows. */
export const Separator = () => (
  <svg
    viewBox="0 0 4 4"
    fill="none"
    aria-hidden
    focusable="false"
    className="footer__dot"
  >
    <circle cx="2" cy="2" r="2" fill="currentColor" />
  </svg>
);
