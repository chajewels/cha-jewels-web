/**
 * Loads the scene libraries in stages, one task each.
 *
 * `import("…/pendant-scene")` fetches three.js, the GLTF/EXR loaders, meshopt
 * and three-mesh-bvh together and then EVALUATES them in one go — on a 4×
 * throttled phone one 110–200 ms task (Lighthouse "long-tasks", P2 part A),
 * all of it counted against Total Blocking Time. Awaiting each library on its
 * own, with a yield to the main thread between them, turns that into three
 * shorter tasks separated by frames the page can use for input and paint. The
 * chunks are the same (webpack already splits three.js into its own
 * "lib" chunk); only the order and the pauses change.
 *
 * Idempotent: a second call resolves on the module cache.
 */
const yieldToMain = (): Promise<void> =>
  new Promise((resolve) => {
    const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
    if (typeof scheduler?.yield === "function") {
      scheduler.yield().then(resolve, () => resolve());
      return;
    }
    setTimeout(resolve, 0);
  });

export const loadSceneLibraries = async (): Promise<void> => {
  await import("three");
  await yieldToMain();
  await import("three/addons/loaders/GLTFLoader.js");
  await yieldToMain();
  await import("three-mesh-bvh");
  await yieldToMain();
};
