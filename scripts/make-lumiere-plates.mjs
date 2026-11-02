// Makes the two blurred philosophy backdrop plates from an EXISTING Cha Jewels photograph
// (public/images/home/pomelli-hero.webp, gold chains on green velvet). The backdrop is a blur stretched over its frame
// (components/lumiere/philosophy, `object-fit: fill`), so each plate is a small blurred cover-crop already stretched to
// its frame's aspect: 0.81 from 1024 px up, 0.2847 below. Run: node scripts/make-lumiere-plates.mjs
import sharp from "sharp";

const SRC = "public/images/home/pomelli-hero.webp";
const PLATES = [
  { out: "public/images/home/philosophy-backdrop.webp", width: 480, height: 590 },
  { out: "public/images/home/philosophy-backdrop-narrow.webp", width: 240, height: 843 },
];
for (const { out, width, height } of PLATES) {
  await sharp(SRC).resize(width, height, { fit: "cover", position: "centre" }).blur(10).webp({ quality: 62 }).toFile(out);
  console.log("wrote", out, `${width}x${height}`);
}
