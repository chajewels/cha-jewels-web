/**
 * The curve the whole site eases on — `cubic-bezier(.16, 1, .3, 1)` — solved in
 * JS so scroll-driven values can use the same shape the CSS transitions do.
 *
 * A cubic bezier gives y as a function of the parameter, not of x, so reading it
 * at a given x means finding the parameter first. Newton converges in a handful
 * of steps on a curve this well behaved; the bisection is a guard for the flat
 * stretch near the end where the derivative approaches zero.
 */
const bezier = (x1: number, y1: number, x2: number, y2: number) => {
  const a = (p: number, q: number) => 1 - 3 * q + 3 * p;
  const b = (p: number, q: number) => 3 * q - 6 * p;
  const c = (p: number) => 3 * p;

  const at = (t: number, p: number, q: number) =>
    ((a(p, q) * t + b(p, q)) * t + c(p)) * t;

  const slope = (t: number, p: number, q: number) =>
    3 * a(p, q) * t * t + 2 * b(p, q) * t + c(p);

  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    let t = x;

    for (let i = 0; i < 8; i++) {
      const d = slope(t, x1, x2);
      if (Math.abs(d) < 1e-6) break;
      const error = at(t, x1, x2) - x;
      if (Math.abs(error) < 1e-6) return at(t, y1, y2);
      t -= error / d;
    }

    let low = 0;
    let high = 1;
    t = x;

    while (high - low > 1e-6) {
      if (at(t, x1, x2) > x) high = t;
      else low = t;
      t = (low + high) / 2;
    }

    return at(t, y1, y2);
  };
};

export const easeSite = bezier(0.16, 1, 0.3, 1);

/** Zero velocity at both ends — what makes each state read as a rest point. */
export const smoothstep = (t: number) => t * t * (3 - 2 * t);

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const lerp = (from: number, to: number, t: number) =>
  from + (to - from) * t;

/**
 * A sub-range of a larger progress, eased on the site curve. Elements that come
 * in one after another are each given their own slice of the same 0…1.
 */
export const stage = (progress: number, from: number, to: number) =>
  easeSite(clamp01((progress - from) / (to - from)));
