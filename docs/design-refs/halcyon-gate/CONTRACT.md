# halcyon-gate — contract (GetLayers scene, materialized 2026-11-01, `target: next`)

- mutable: skin
- preserve: motion, composition
- notes (verbatim): The core trick is one worldColor() sampled straight for sky and mirrored below the horizon for sea — preserve the reflection mechanic and the true-perspective water plane. Palette is the sky/sun/cloud/water/gold stops; retint via those only, never the GLSL. horizon/ringX/ringR/tube frame the composition. Cursor leaves a perspective ripple trail (no click, no scroll). Renders straight — no bloom. This is a rare light-tone outdoor scene.
- driver: ambient · cost: medium · liveRebuild: False · assets: none (a single fragment shader)
- colour params (tint through these only): colSkyTop, colSkyHorizon, colSun, colCloudLit, colCloudDark, colWaterDeep, colGoldLight, colGoldDark
- preview: https://www.getlayers.ai/?layer=halcyon-gate
- sourceRef: scenes/halcyon-gate.html (saved beside this file as `halcyon-gate.html`, verbatim)

Default CONFIG (the "Default" roll, amber/light/vivid):

```json
{
  "colSkyTop": "#5fb4ec",
  "colSkyHorizon": "#ffdca6",
  "colSun": "#fff7e6",
  "colCloudLit": "#fff1da",
  "colCloudDark": "#a9a3b4",
  "colWaterDeep": "#1a5790",
  "colGoldLight": "#ffe49a",
  "colGoldDark": "#9a7330",
  "horizon": 0.47,
  "sunX": 0.5,
  "sunY": 0.58,
  "sunGlow": 0.24,
  "sunCore": 0.08,
  "sunBright": 1.6,
  "cloudScale": 4.1,
  "cloudSpeed": 0.074,
  "cloudCover": 0.35,
  "cloudSoft": 0.19,
  "cloudOpacity": 0.4,
  "ringX": 0.5,
  "ringR": 0.36,
  "tube": 0.004,
  "goldSpec": 1.26,
  "goldRim": 0,
  "camHeight": 0.135,
  "waveScale": 1.8,
  "waveDetail": 0.92,
  "waveSpeed": 0.42,
  "waveAmp": 0.028,
  "stretch": 0.6,
  "edgePos": 0.035,
  "edgeSoft": 0.015,
  "ripFreq": 38,
  "ripDecay": 2.2,
  "ripSize": 2.5,
  "ripAmp": 0.54,
  "reflLow": 0,
  "reflHigh": 1,
  "reflFall": 12,
  "sparkle": 0,
  "brightness": 1,
  "grain": 0,
  "mouseLerp": 0.63
}
```

The port lives in `components/lumiere/layaway/gate-scene.tsx` (P3): the shader and its uniforms verbatim, the CONFIG merged with the Lumière tint (warm brass on cream — `docs/design-refs/halcyon-gate/TINT.md`), the dev panel, Google Fonts and `localStorage` not ported; mounted when the layaway band nears, paused off screen and when the tab is hidden, the poster under D-10's budget and reduced motion.
