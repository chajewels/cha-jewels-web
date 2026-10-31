// 📖 Docs: obsidian/frontend/utils.md

import {
  AdditiveBlending,
  BackSide,
  Color,
  CubeCamera,
  DoubleSide,
  HalfFloatType,
  Mesh,
  PMREMGenerator,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLCubeRenderTarget,
  type Texture,
  type WebGLRenderer,
} from "three";

/**
 * Studio lighting for polished metal, built as geometry and baked into a
 * prefiltered cube. Two rigs: `LIGHT_STUDIO` is the Blender preview studio
 * (`assets-source/pendant-emerald.blend`, collection `Preview_Lighting`), so
 * the hero's gold reflects the room its Cycles renders were lit by;
 * `DARK_STUDIO` is a black-tent set for the featured rings on their black
 * panel. The world ramp
 * carries soft, uneven variation and the panels are feathered softboxes, so the
 * metal picks up gradients rather than flat bands.
 *
 * Coordinates are Blender's converted to three's Y-up: (x, y, z) → (x, z, -y).
 * Area-light radiance is Blender's `power / (π · area)`; emissive planes keep
 * their Blender strength.
 */

interface Panel {
  position: [number, number, number];
  size: [number, number];
  radiance: number;
  color: [number, number, number];
}

const WARM: [number, number, number] = [1, 0.95, 0.88];
const WHITE: [number, number, number] = [1, 1, 1];

const area = (
  position: [number, number, number],
  side: number,
  watts: number,
  color: [number, number, number] = WARM,
): Panel => ({
  position,
  size: [side, side],
  radiance: watts / (Math.PI * side * side),
  color,
});

/** A lighting set: the room's ramp, the lights in it, and how the cube is baked. */
export interface StudioRig {
  panels: readonly Panel[];
  sky: {
    low: Color;
    high: Color;
    lowAt: number;
    highAt: number;
    strength: number;
    /** ± brightness swing of the room's soft bands and cloudiness. */
    variation: number;
  };
  /** Brightness of the panels over their stated radiance. */
  panelGain: number;
  /** Cube face size. The thinnest panel must stay a few texels wide at this size. */
  cubeSize: number;
  /**
   * Width of a softbox's feathered border, as a share of its side. A wide
   * feather reads as a diffused box; a narrow one as a crisp strip light.
   */
  feather: number;
}

const SKY_RADIUS = 50;

/**
 * The Blender preview studio — the cream room the pendant's Cycles renders were
 * lit in. The `power / (π · area)` rule leaves it about a fifth darker than
 * Cycles draws it, hence the gain, matched by eye against the gold in the
 * posters.
 */
export const LIGHT_STUDIO: StudioRig = {
  panels: [
    area([-4, 5, 6], 3, 900), // Key
    area([5, 1, 5], 4, 350, [1, 0.9, 0.8]), // Fill
    area([2, 4, -5], 3, 500), // Rim
    area([0, 7, 2], 2, 400), // Top
    area([-2.5, 1.5, 8], 0.6, 250, WHITE), // Spark_L
    area([2.8, -1, 7], 0.6, 250, WHITE), // Spark_R
    { position: [0, 3, 7], size: [5, 1.5], radiance: 6, color: WHITE }, // Softbox_Front
    { position: [-6, 1, 4], size: [1.5, 6], radiance: 5, color: WHITE }, // Softbox_Left
    { position: [6, 0, 3], size: [1.5, 6], radiance: 4, color: WHITE }, // Softbox_Right
  ],
  // Blender world: colour ramp on the view direction's height, strength 1.2.
  sky: {
    low: new Color(0.18, 0.15, 0.12),
    high: new Color(1.0, 0.92, 0.8),
    lowAt: 0.3,
    highAt: 0.7,
    strength: 1.2,
    variation: 0.4,
  },
  panelGain: 1.2,
  cubeSize: 256,
  feather: 0.25,
};

/**
 * A jewelry photographer's black-tent set, for metal shown on black.
 *
 * Polished metal has no colour of its own to show — it shows the room, tinted.
 * In the cream studio it saw light almost everywhere, so a band came out one
 * even, milky tone and read as plastic. Here the room is nearly black and the
 * light comes from a handful of large softboxes and two tall strips, with dark
 * gaps between them: the metal flares where it faces a light and goes deep
 * where it faces the room, with crisp edges between. That contrast is what
 * reads as polished gold.
 *
 * A first cut with only small lights left most of a band facing darkness and
 * read as bronze, so the boxes are large and one stands in front — the face of
 * the band toward the viewer reflects what is behind the camera. The strips
 * stand either side and a little behind, to run down the band's flanks; a dim
 * low front strip and warm floor keep the underside from going dead.
 */
export const DARK_STUDIO: StudioRig = {
  panels: [
    // In front, high and to the left: the band's face toward the viewer is
    // lit by what is behind the camera, so this is its main highlight.
    { position: [-1.2, 2.6, 8], size: [6, 3], radiance: 4.2, color: WARM }, // Front_Key
    { position: [-5, 3.5, 3.5], size: [4.5, 5], radiance: 4.5, color: WARM }, // Key_L
    { position: [5.5, 1.5, 2], size: [3.5, 6], radiance: 3, color: WARM }, // Soft_R
    { position: [0, 8, 0], size: [9, 7], radiance: 2.6, color: WHITE }, // Overhead
    { position: [-7, 0, -0.5], size: [0.9, 9], radiance: 14, color: WHITE }, // Strip_L
    { position: [7, 0.5, -1], size: [0.9, 9], radiance: 11, color: WHITE }, // Strip_R
    { position: [1, 3, -7], size: [8, 1.4], radiance: 6, color: WHITE }, // Rim
    { position: [3.2, 0.8, 7.5], size: [1.2, 1.2], radiance: 12, color: WHITE }, // Spark
    { position: [0, -2.5, 8], size: [9, 2], radiance: 1, color: WARM }, // Front_Low
    { position: [0, -7, 1], size: [14, 12], radiance: 0.5, color: WARM }, // Floor
  ],
  sky: {
    low: new Color(0.02, 0.016, 0.012),
    high: new Color(0.13, 0.12, 0.105),
    lowAt: -0.4,
    highAt: 0.9,
    strength: 1,
    variation: 0.5,
  },
  panelGain: 1,
  cubeSize: 512,
  feather: 0.12,
};

export interface StudioEnvironment {
  /** Prefiltered radiance of the studio — `scene.environment` for the gold. */
  radiance: Texture;
  dispose: () => void;
}

export const createStudioEnvironment = (
  renderer: WebGLRenderer,
  rig: StudioRig = LIGHT_STUDIO,
): StudioEnvironment => {
  const { sky } = rig;
  const scene = new Scene();
  const disposables: { dispose: () => void }[] = [];

  const skyGeometry = new SphereGeometry(SKY_RADIUS, 48, 24);
  const skyMaterial = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    uniforms: {
      uLow: { value: sky.low },
      uHigh: { value: sky.high },
      uRange: { value: [sky.lowAt, sky.highAt] },
      uStrength: { value: sky.strength },
      uVariation: { value: sky.variation },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDirection;
      void main() {
        vDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    // The Blender world was a clean two-stop ramp. A room that clean leaves
    // whole facets one flat colour, so the ramp now carries a slow, uneven
    // brightness — soft bands and cloudy variation, like light falling across
    // a real studio — that every facet picks up as a gradient.
    fragmentShader: /* glsl */ `
      uniform vec3 uLow;
      uniform vec3 uHigh;
      uniform vec2 uRange;
      uniform float uStrength;
      uniform float uVariation;
      varying vec3 vDirection;

      float hash13(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.zyx + 31.32);
        return fract((p.x + p.y) * p.z);
      }
      float valueNoise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x),
              mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
          mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x),
              mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y),
          f.z);
      }
      float fbm(vec3 p) {
        return valueNoise(p) * 0.55 + valueNoise(p * 2.1) * 0.3 + valueNoise(p * 4.3) * 0.15;
      }

      void main() {
        vec3 d = normalize(vDirection);
        float t = clamp((d.y - uRange.x) / (uRange.y - uRange.x), 0.0, 1.0);
        float cloud = fbm(d * 2.6 + 7.0);
        float bands = 0.5 + 0.5 * sin(d.y * 7.0 + cloud * 3.0);
        float variation = mix(1.0 - uVariation, 1.0 + uVariation, cloud * 0.6 + bands * 0.4);
        gl_FragColor = vec4(mix(uLow, uHigh, t) * uStrength * variation, 1.0);
      }
    `,
  });
  scene.add(new Mesh(skyGeometry, skyMaterial));
  disposables.push(skyGeometry, skyMaterial);

  const origin = new Vector3();
  for (const panel of rig.panels) {
    const geometry = new PlaneGeometry(panel.size[0], panel.size[1]);
    // Soft-edged with a hot centre, like a diffused softbox: a flat, hard
    // rectangle showed up in the stones as a white cut-out.
    const material = softboxMaterial(
      new Color(...panel.color).multiplyScalar(panel.radiance * rig.panelGain),
      rig.feather,
    );
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...panel.position);
    mesh.lookAt(origin);
    scene.add(mesh);
    disposables.push(geometry, material);
  }

  // The studio, prefiltered for the gold — which keeps the look of the Cycles
  // posters. (The stones see a photographed room instead; see studio-hdri.ts.)
  const studioTarget = new WebGLCubeRenderTarget(rig.cubeSize, {
    type: HalfFloatType,
  });
  new CubeCamera(0.1, SKY_RADIUS * 2, studioTarget).update(renderer, scene);
  const pmrem = new PMREMGenerator(renderer);
  const radianceTarget = pmrem.fromCubemap(studioTarget.texture);
  pmrem.dispose();
  studioTarget.dispose();
  disposables.forEach((item) => item.dispose());

  return {
    radiance: radianceTarget.texture,
    dispose: () => radianceTarget.dispose(),
  };
};

/**
 * Additive softbox emitter: feathered edges and a hot centre, like a diffused
 * studio light. A flat, hard-edged rectangle showed up in reflections as a
 * white cut-out.
 */
const softboxMaterial = (color: Color, feather: number): ShaderMaterial =>
  new ShaderMaterial({
    side: DoubleSide,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    uniforms: { uColor: { value: color }, uFeather: { value: feather } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uFeather;
      varying vec2 vUv;
      void main() {
        vec2 offset = vUv - 0.5;
        vec2 edge = min(vUv, 1.0 - vUv);
        float feather = smoothstep(0.0, uFeather, edge.x) * smoothstep(0.0, uFeather, edge.y);
        float falloff = feather * (0.7 + 0.6 * exp(-dot(offset, offset) * 6.0));
        gl_FragColor = vec4(uColor * falloff, 1.0);
      }
    `,
  });
