/**
 * THE THREE STEPS' ILLUSTRATIONS (P4 item 2: "steps with real visuals — no
 * empty grey 01 squares"). Original line art in one stroke weight, drawn in
 * the current colour (the brass of the band): a tagged piece set aside, a
 * calendar whose months fill in, a parcel with its ribbon. Decorative:
 * `aria-hidden`; the step's title and copy carry the meaning.
 */
const common = { viewBox: "0 0 64 64", width: 64, height: 64, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

/** 1 — reserve with a deposit: a ring on its tag, set aside. */
const Reserve = () => (
  <svg {...common}>
    <path d="M10 22h30l14 10-14 10H10a3 3 0 0 1-3-3V25a3 3 0 0 1 3-3Z" />
    <circle cx="46" cy="32" r="2" />
    <circle cx="22" cy="33" r="7" />
    <circle cx="29" cy="33" r="7" />
    <path d="M15 12c4 3 8 5 13 6" />
    <path d="M36 52v-4m-6 4h12" opacity=".55" />
  </svg>
);

/** 2 — spread the balance: a calendar whose months fill one by one. */
const Spread = () => (
  <svg {...common}>
    <rect x="9" y="13" width="46" height="42" rx="6" />
    <path d="M9 25h46M21 8v10M43 8v10" />
    {[0, 1, 2, 3].map((r) =>
      [0, 1, 2].map((c) => {
        const k = r * 3 + c;
        return <circle key={k} cx={22 + c * 10} cy={33 + r * 6} r={k < 6 ? 2.1 : 1.1} fill={k < 6 ? "currentColor" : "none"} opacity={k < 6 ? 1 : 0.55} />;
      }),
    )}
  </svg>
);

/** 3 — the piece ships: a parcel with a ribbon. */
const Ship = () => (
  <svg {...common}>
    <path d="M9 24 32 12l23 12v26L32 62 9 50V24Z" transform="translate(0 -6)" />
    <path d="M9 18l23 12 23-12M32 30v26" transform="translate(0 0)" opacity=".9" />
    <path d="M22 11l23 12" opacity=".55" />
    <path d="M26 31c-4-7 2-11 6-5 4-6 10-2 6 5" transform="translate(0 -15)" />
  </svg>
);

export const StepVisual = ({ step }: { step: 1 | 2 | 3 }) => (step === 1 ? <Reserve /> : step === 2 ? <Spread /> : <Ship />);
