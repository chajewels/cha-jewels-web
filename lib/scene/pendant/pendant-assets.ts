/**
 * The pendant's asset URL, on its own so the hero can name it WITHOUT pulling
 * the scene module in.
 *
 * `hero-pendant.tsx` used to import `PENDANT_MODEL_URL` from pendant-scene.ts
 * for its error banner. A value import is a static edge: webpack placed the
 * whole scene — three.js (357 KB), the gem shaders, meshopt, the BVH — in the
 * home's FIRST LOAD, and the `import()` inside the effect loaded nothing new
 * (P2 part A measured 1.52 MB of script in the route's build manifest). The
 * placeholder path itself is the registry's (lib/lumiere/placeholders.ts, D-16).
 */
export const PENDANT_MODEL_URL = "/lumiere/placeholder/models/pendant-emerald.glb";
