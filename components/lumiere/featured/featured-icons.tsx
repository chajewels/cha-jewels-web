/**
 * The block's four glyphs, traced from 1443:53 and drawn in `currentColor` so
 * each one takes the colour of the text it sits beside rather than carrying its
 * own. Sizes come from the call site: Figma gives the cart 13, the scroll cue
 * 10, the separators 4, and the crosses their own 314x316 frame.
 */

/** A shopping bag, beside "Add to cart". */
export const CartIcon = () => (
  <svg
    viewBox="0 0 13 13"
    fill="none"
    aria-hidden
    focusable="false"
    className="block size-full"
  >
    <path
      d="M3.77 3.28V2.6a2.73 2.73 0 0 1 5.46 0v.68h2.02c.3 0 .55.25.53.55l-.5 8.02a.54.54 0 0 1-.54.5H2.26a.54.54 0 0 1-.54-.5l-.5-8.02c-.02-.3.23-.55.53-.55H3.77Zm1.08 0h3.3V2.6a1.65 1.65 0 0 0-3.3 0v.68Z"
      fill="currentColor"
    />
  </svg>
);

/** The circular arrow on the scroll cue. */
export const ScrollCueIcon = () => (
  <svg
    viewBox="0 0 10 10"
    fill="none"
    aria-hidden
    focusable="false"
    className="block size-full"
  >
    <path
      d="M8.22172 1.1763L8.87318 1.07542C9.12018 1.03695 9.28919 0.805527 9.25072 0.558556C9.21226 0.311584 8.98083 0.142546 8.73384 0.181015L6.94546 0.457888C6.69851 0.495933 6.52918 0.726957 6.56722 0.973907L6.84412 2.76245C6.88235 3.00944 7.11355 3.17867 7.36054 3.14043C7.60753 3.1022 7.77676 2.871 7.73853 2.62401L7.61865 1.84859C9.34166 3.28657 9.57272 5.84904 8.13477 7.57206C6.69682 9.29507 4.13432 9.52613 2.41131 8.08816C0.688297 6.65018 0.457231 4.08771 1.89518 2.3647C2.27754 1.90656 2.75611 1.53825 3.29688 1.28594C3.83765 1.03364 4.42735 0.903527 5.02409 0.904859C5.27394 0.904859 5.47649 0.702315 5.47649 0.452459C5.47649 0.202603 5.27394 5.94006e-05 5.02409 5.94006e-05C2.26272 -0.0132583 0.0133771 2.21451 5.94005e-05 4.97591C-0.0132583 7.7373 2.21451 9.98664 4.9759 9.99995C7.7373 10.0133 9.98663 7.7855 9.99995 5.02411C10.0035 4.29164 9.84604 3.56735 9.53876 2.90244C9.23148 2.23754 8.78186 1.64827 8.22172 1.1763Z"
      fill="currentColor"
    />
  </svg>
);

/** The separator between materials. */
export const MaterialDot = () => (
  <svg
    viewBox="0 0 4 4"
    fill="none"
    aria-hidden
    focusable="false"
    className="block size-full"
  >
    <circle cx="2" cy="2" r="2" fill="currentColor" />
  </svg>
);

/**
 * The four faint crosses behind the ring. One path, four times — Figma repeats
 * the same 17x17 glyph at the corners of a 314x316 field.
 */
const CROSS =
  "M8.5 0c.638 0 1.154.517 1.154 1.155v6.19h6.19c.639 0 1.156.517 1.156 1.155s-.517 1.155-1.155 1.155h-6.19v6.19c0 .638-.517 1.155-1.155 1.155s-1.155-.517-1.155-1.155v-6.19h-6.19C.517 9.655 0 9.138 0 8.5s.517-1.155 1.155-1.155h6.19v-6.19C7.345.517 7.862 0 8.5 0Z";

/**
 * Four marks at the corners of a field, not one drawing of a field with marks
 * in it. Held as a single 314x316 SVG, the glyph could only grow with the
 * field: below the design width the field follows a panel twice as wide as it
 * is tall, and the marks came out half again the size they are at 1440. Each
 * mark carries its own size now, and the field is free to be whatever shape the
 * panel leaves it.
 */
export const CrossesDecor = () => (
  <>
    {["tl", "tr", "bl", "br"].map((corner) => (
      <svg
        key={corner}
        viewBox="0 0 17 17"
        fill="none"
        aria-hidden
        focusable="false"
        className={`featured__cross featured__cross--${corner}`}
      >
        <path d={CROSS} fill="currentColor" fillOpacity="0.2" />
      </svg>
    ))}
  </>
);
