import { dict } from "@/lib/i18n";
import { type Lang } from "@/lib/i18n-core";

/** "3 pieces available" as a Lumière pill for a bone head (the dark band's CountLine is white-on-black). Same dictionary strings. */
export function CountTag({ available, lang }: { available: number; lang: Lang }) {
  const tpl = (available === 1 ? dict.collection.availableOne : dict.collection.available)[lang];
  const [pre, post] = tpl.split("{n}");
  return (
    <span className="lm-tag" style={{ minHeight: 36, padding: "0 16px", fontSize: 13 }}>
      {pre}<b className="font-display mx-1.5 text-xl font-normal [font-variant-numeric:lining-nums_tabular-nums]">{available}</b>{post}
    </span>
  );
}
