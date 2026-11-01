# halcyon-gate — the Lumière tint (P3 item 5)

The scene is retinted THROUGH ITS CONFIG ONLY (the contract: "palette is the sky/sun/cloud/water/gold
stops; retint via those only, never the GLSL"). The eight colour stops, mapped onto the Lumière palette
(`app/lumiere/tokens.css`) and the site's gold (`tailwind.config.ts` gold / gold-dark / gold-pale):

| key | default (golden-hour sea) | Lumière (warm brass on cream) | from |
|---|---|---|---|
| `colSkyTop` | `#5fb4ec` | `#ece4d8` | the paper, a step warmer than `--raw-color-bone-100` so the sun reads against it |
| `colSkyHorizon` | `#ffdca6` | `#e2d0b2` | warm cream between the paper and the gold |
| `colSun` | `#fff7e6` | `#f6e4c0` | a warm gold-white: a white sun over a cream sky blew the plate out (first screenshot) |
| `colCloudLit` | `#fff1da` | `#f6efe3` | the paper, lit |
| `colCloudDark` | `#a9a3b4` | `#cdbda2` | the paper's shadow, warm |
| `colWaterDeep` | `#1a5790` | `#5f4319` | brass, deep (darker than gold-dark `#8A6B12`, the bronze of the badge's ground) |
| `colGoldLight` | `#ffe49a` | `#e8c37d` | the tier medallions' gold ring |
| `colGoldDark` | `#9a7330` | `#8a6b12` | gold-dark |

Numbers kept at the default roll but for those that frame the band's plate and tame the light on a pale sky:
`ringX 0.5`, `ringR 0.34`, `horizon 0.5` (the ring reads whole in a 4:5 plate), `sunY 0.6`, `sunGlow 0.2`,
`sunCore 0.06`, `sunBright 0.55` (the default 1.6 is for a blue sky), `reflHigh 0.85`, `sparkle 0.35` (a
little glitter on brass water), `grain 0.02` (paper), `brightness 0.96`. The entrance animates two CONFIG values from the GetLayers
reveal choreography for this scene ("drops the camera from high above the sea … out of a white-out"):
`camHeight` 0.4 → 0.135 and `brightness` 1.9 → 1 over 2.8 s (ease-out expo), driven from
`components/lumiere/layaway/gate-scene.tsx`, not from the shader.
