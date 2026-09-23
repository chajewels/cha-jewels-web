// The animation feature set for LazyMotion, in its own module so it is split
// into its own chunk and fetched after hydration rather than with the page —
// see components/fx/motion-provider.tsx.
export { domAnimation as default } from "motion/react";
