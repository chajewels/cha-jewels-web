// 📖 Docs: obsidian/frontend/utils.md

import {
  Color,
  NeutralToneMapping,
  Box3,
  Group,
  MeshPhysicalMaterial,
  OrthographicCamera,
  Scene,
  Sphere,
  Vector3,
  WebGLRenderer,
  type Material,
  type Mesh,
  type Object3D,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

import type { SceneBudget } from "@/lib/scene/device";
import {
  DIAMOND,
  PERIDOT,
  TEAL_SAPPHIRE,
  gemBlur,
  toFloatPositions,
  type GemPreset,
  type MetalPreset,
} from "@/lib/scene/jewelry-presets";
import {
  createGemMaterial,
  type GemMaterial,
} from "@/lib/scene/pendant/gem-material";
import {
  STUDIO_HDRI_URL,
  loadHdriCube,
  type HdriCube,
} from "@/lib/scene/pendant/studio-hdri";
import {
  DARK_STUDIO,
  createStudioEnvironment,
  type StudioEnvironment,
} from "@/lib/scene/pendant/studio-environment";

/**
 * The featured block's five rings (`assets-source/rings.blend`, exported to
 * `public/models/rings/`) drawn in one canvas over the stage panel.
 *
 * The scene does not decide where a ring is: the carousel does (its slot
 * trajectory, the same one that moves the posters), and hands every frame a
 * screen position, a size, an opacity and a spin per ring. The scene only draws
 * them there — so the 3D rings and the DOM posters under them can never
 * disagree.
 */

/** Where one ring is this frame, in CSS pixels of the canvas. */
export interface RingSlotState {
  /** Centre, from the canvas's top-left. */
  cx: number;
  cy: number;
  /** Diameter of the ring's bounding sphere on screen. */
  size: number;
  opacity: number;
  /** Turn about the ring's own vertical axis, radians, added to its resting view. */
  spin: number;
}

/**
 * The resting three-quarter view: turned `yaw` about the ring's vertical axis
 * and tipped `tilt` toward the viewer. MUST match the `Ring_0X_Poster` cameras
 * in `assets-source/rings.blend` (BASE_YAW / BASE_TILT), or the posters and the
 * 3D rings will not line up when the canvas fades in over them.
 */
export const RING_REST_VIEW = { yaw: 0.55, tilt: 0.3 } as const;

/** One ring to load, with its own lean on top of the shared rest view (radians). */
export interface RingSource {
  url: string;
  /** Sideways tip in the picture, anticlockwise positive. */
  roll: number;
  /** Added to the rest view's tilt: more (+) or less (-) of the ring's top. */
  pitch: number;
}

/** Blender gem material names → what to build for them. */
const GEMS: Record<string, { preset: GemPreset; coloured: boolean }> = {
  Diamond: { preset: DIAMOND, coloured: false },
  Peridot: { preset: PERIDOT, coloured: true },
  Teal_Sapphire: { preset: TEAL_SAPPHIRE, coloured: true },
};

/**
 * The rings' own metals. The shared presets are set for the hero: its cream
 * studio and AgX, which desaturates, so they are deepened to survive it. Here
 * the set is black and the tone mapping is Neutral, which keeps base colours
 * as they are — so these go back to measured values (physicallybased.info:
 * gold 1.0 / 0.77 / 0.34; rose gold between gold and copper, pinker than
 * either), and run more polished: in the black-tent set a band must hold the
 * strip lights as crisp lines, and at the shared 0.14–0.16 they smeared.
 */
const RING_METALS: Record<string, MetalPreset> = {
  Yellow_Gold: {
    color: new Color(1.0, 0.69, 0.28),
    roughness: 0.07,
  },
  Rose_Gold: { color: new Color(0.96, 0.67, 0.57), roughness: 0.07 },
  White_Gold: { color: new Color(0.86, 0.86, 0.87), roughness: 0.05 },
};

/** A typical ring's bounding radius, model units — sets the world scale. */
const REFERENCE_RADIUS = 1.3;
const CAMERA_DEPTH = 50;
const HIDDEN_BELOW = 0.005;

interface RingEntry {
  outer: Group;
  spin: Group;
  radius: number;
  metals: MeshPhysicalMaterial[];
  /** The metal's fade, shared by every metal material on the ring. */
  fade: { value: number };
  gems: GemMaterial[];
}

/**
 * Multiplies a material's final colour by `fade`, after tone mapping — the
 * same as the gems' alpha over the black panel, so metal and stones dim
 * together. Fading the reflections instead (`envMapIntensity`) did not: the
 * highlights run far past 1, so at 15% they still tone-mapped near white,
 * and the band stayed bright while its stones disappeared.
 */
const fadeAfterToneMapping = (
  material: MeshPhysicalMaterial,
  fade: { value: number },
): void => {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRingFade = fade;
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "uniform float uRingFade;\nvoid main() {")
      .replace(
        "#include <dithering_fragment>",
        "#include <dithering_fragment>\n  gl_FragColor.rgb *= uRingFade;",
      );
  };
};

const isMesh = (object: Object3D): object is Mesh =>
  (object as Mesh).isMesh === true;

/** Lets the browser paint (and handle input) between steps of the build. */
const yieldTask = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

export class RingsScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera();
  private environment: StudioEnvironment | null = null;
  private hdri: HdriCube | null = null;
  private readonly rings: RingEntry[] = [];
  private width = 1;
  private height = 1;
  /** CSS pixels per model unit, from the centre slot's size. */
  private unitPx = 100;

  private constructor(
    canvas: HTMLCanvasElement,
    private readonly budget: SceneBudget,
  ) {
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    // Neutral, not the hero's AgX: AgX greys saturated highlights, which on a
    // black ground turned the gold to brown. Neutral (Khronos' tone mapper for
    // product renders) keeps a metal's own colour through to its highlights.
    this.renderer.toneMapping = NeutralToneMapping;
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, budget.maxPixelRatio),
    );
    this.camera.near = 0.1;
    this.camera.far = CAMERA_DEPTH * 2;
    this.camera.position.set(0, 0, CAMERA_DEPTH);
  }

  /** Loads every ring, builds materials and compiles before resolving. */
  static async create(
    canvas: HTMLCanvasElement,
    budget: SceneBudget,
    sources: readonly RingSource[],
  ): Promise<RingsScene> {
    const instance = new RingsScene(canvas, budget);
    // The studio's PMREM build compiles and renders synchronously: in the
    // constructor it made one ~90 ms task with the context creation (4× phone,
    // mid-scroll). Its own task now; the rings follow one per task (load).
    await yieldTask();
    instance.environment = createStudioEnvironment(instance.renderer, DARK_STUDIO);
    instance.scene.environment = instance.environment.radiance;
    await yieldTask();
    await instance.load(sources);
    return instance;
  }

  private async load(sources: readonly RingSource[]): Promise<void> {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const [hdri, ...gltfs] = await Promise.all([
      loadHdriCube(this.renderer, STUDIO_HDRI_URL, this.budget.gemCubeSize),
      ...sources.map((source) => loader.loadAsync(source.url)),
    ]);
    this.hdri = hdri;

    for (const [index, gltf] of gltfs.entries()) {
      const pose = sources[index];
      const model = gltf.scene;
      model.updateMatrixWorld(true);
      const bounds = new Box3().setFromObject(model);
      const sphere = bounds.getBoundingSphere(new Sphere());
      model.position.sub(bounds.getCenter(new Vector3()));

      const spin = new Group();
      spin.rotation.y = RING_REST_VIEW.yaw;
      spin.add(model);
      const tilt = new Group();
      tilt.rotation.x = RING_REST_VIEW.tilt + pose.pitch;
      tilt.add(spin);
      // Roll is outermost, about the view axis: it tips the whole picture of
      // the ring, the way the poster camera's roll does.
      const roll = new Group();
      roll.rotation.z = pose.roll;
      roll.add(tilt);
      const outer = new Group();
      outer.add(roll);
      outer.visible = false;
      this.scene.add(outer);

      const entry: RingEntry = {
        outer,
        spin,
        radius: sphere.radius,
        metals: [],
        fade: { value: 1 },
        gems: [],
      };
      const metalByName = new Map<string, MeshPhysicalMaterial>();
      const replaced: Material[] = [];

      model.traverse((object) => {
        if (!isMesh(object)) return;
        const source = object.material as Material;
        replaced.push(source);
        const gem = GEMS[source.name];
        if (gem) {
          toFloatPositions(object.geometry);
          const material = createGemMaterial(object.geometry, hdri.cube, {
            ...gem.preset,
            bounces: gem.coloured
              ? this.budget.emeraldBounces
              : this.budget.diamondBounces,
            dispersion: this.budget.gemDispersion ? gem.preset.dispersion : 0,
            blur: gemBlur(gem.preset.blur, hdri.size),
          });
          // Faded by uniform only — see GemMaterial.setOpacity.
          material.material.transparent = true;
          material.attach(object);
          object.material = material.material;
          entry.gems.push(material);
          return;
        }
        const preset = RING_METALS[source.name] ?? RING_METALS.Yellow_Gold;
        let metal = metalByName.get(source.name);
        if (!metal) {
          // Opaque, faded toward black — the panel behind is black, so it
          // reads as the same fade — not by alpha: a see-through band showed
          // its own far side through the near one, like smoked glass.
          metal = new MeshPhysicalMaterial({
            color: preset.color,
            metalness: 1,
            roughness: preset.roughness,
          });
          fadeAfterToneMapping(metal, entry.fade);
          metalByName.set(source.name, metal);
          entry.metals.push(metal);
        }
        object.material = metal;
      });
      replaced.forEach((material) => material.dispose());
      this.rings.push(entry);
      // One ring per task: the five built in one go were a ~200 ms main-thread
      // task on a 4× phone, landing mid-scroll in the collections block (the
      // load starts 1.5 screens ahead). Same build, split.
      await yieldTask();
    }

    // Compile with every ring shown, so no program is built mid-scroll
    // (optimize-3d-scene §3).
    this.rings.forEach((ring) => (ring.outer.visible = true));
    await this.renderer.compileAsync(this.scene, this.camera);
    this.rings.forEach((ring) => (ring.outer.visible = false));
  }

  /**
   * Canvas size in CSS pixels, and the on-screen diameter of a ring sitting in
   * the centre slot — which fixes how many pixels a model unit is.
   */
  setSize(width: number, height: number, centreSize: number): void {
    if (width <= 0 || height <= 0 || centreSize <= 0) return;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.unitPx = centreSize / (2 * REFERENCE_RADIUS);
    const halfWidth = width / 2 / this.unitPx;
    const halfHeight = height / 2 / this.unitPx;
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
  }

  render(slots: readonly RingSlotState[]): void {
    this.rings.forEach((ring, index) => {
      const slot = slots[index];
      if (!slot || slot.opacity < HIDDEN_BELOW) {
        ring.outer.visible = false;
        return;
      }
      ring.outer.visible = true;
      ring.outer.position.set(
        (slot.cx - this.width / 2) / this.unitPx,
        (this.height / 2 - slot.cy) / this.unitPx,
        0,
      );
      ring.outer.scale.setScalar(slot.size / (2 * ring.radius) / this.unitPx);
      ring.spin.rotation.y = RING_REST_VIEW.yaw + slot.spin;
      ring.fade.value = slot.opacity;
      ring.gems.forEach((gem) => gem.setOpacity(slot.opacity));
    });
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.scene.traverse((object) => {
      if (isMesh(object)) object.geometry.dispose();
    });
    this.rings.forEach((ring) => {
      ring.metals.forEach((metal) => metal.dispose());
      ring.gems.forEach((gem) => gem.dispose());
    });
    this.environment?.dispose();
    this.hdri?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
