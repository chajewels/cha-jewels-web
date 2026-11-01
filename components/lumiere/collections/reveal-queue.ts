// 📖 Docs: obsidian/frontend/utils.md

/**
 * One-by-one entrances across independent components.
 *
 * Each caller asks for a slot when its own element comes into view and gets
 * back how long to wait: never less than `gap` after the previous slot, and
 * no wait at all once the queue has drained. So cards seen together enter in
 * the order they were seen, a beat apart, and a card scrolled to later enters
 * at once rather than queueing behind ones that already arrived.
 */
let lastSlot = Number.NEGATIVE_INFINITY;

export const takeRevealSlot = (gap: number): number => {
  const now = performance.now();
  const slot = Math.max(now, lastSlot + gap);
  lastSlot = slot;
  return slot - now;
};
