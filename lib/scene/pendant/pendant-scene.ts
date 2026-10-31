// 📖 Docs: obsidian/frontend/utils.md

import {
  AgXToneMapping,
  Box3,
  Color,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  OrthographicCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

import type { SceneBudget } from "@/lib/scene/device";
import {
  DIAMOND,
  YELLOW_GOLD,
  gemBlur,
  toFloatPositions,
} from "@/lib/scene/jewelry-presets";

import { createGemMaterial, type GemMaterial } from "./gem-material";
import { STUDIO_HDRI_URL, loadHdriCube, type HdriCube } from "./studio-hdri";
import {
  createStudioEnvironment,
  type StudioEnvironment,
} from "./studio-environment";

/**
 * The emerald pendant from `assets-source/pendant-emerald.blend`, exported to
 * `public/models/pendant-emerald.glb`. Materials are rebuilt here to match the
 * Cycles renders the poster images were made from: Blender's values carry over
 * one to one (linear colours, AgX view transform), the gems are ray-traced
 * against their own facets, and everything reflects the same studio.
 */

export const PENDANT_MODEL_URL = "/lumiere/placeholder/models/pendant-emerald.glb";

/** Where the pendant sits in its box, both as fractions of the box. */
export interface PendantFraming {
  /** Halo centre, measured down from the top edge. */
  centre: number;
  /** Halo width over box width. */
  span: number;
}

/**
 * The emerald is this piece's own; diamond, gold and the shared helpers live in
 * `jewelry-presets.ts` so the featured rings read the same.
 */
const EMERALD = {
  ior: 1.58,
  /** Principled base colour. */
  tint: new Color(0.02, 0.58, 0.16),
  /**
   * Volume absorption: (1 - colour) × density, colour (0.05, 0.75, 0.25).
   * Blender's density is 1.4; 1.2 here keeps the stone luminous — in a neutral
   * room nothing else lifts it.
   */
  absorption: new Vector3(0.95, 0.25, 0.75).multiplyScalar(1.2),
  /** Physical emerald: ~0.014 between red and blue. */
  dispersion: 0.014,
  fire: 1.0,
  highlight: 0.15,
  /** Fine photographic grain, ~60 cells across the stone. */
  sparkle: { amount: 0.04, scale: 40 },
  /**
   * Both read well blurred. Refraction: the room's furniture, sharp, showed up
   * inside the stone as odd recognisable islands — blurred it is soft light
   * and shade. Reflection: the table mirrors the window, which sharp showed the
   * curtains and blurred is a soft window glow, as in a jewelry photograph.
   */
  blur: { refraction: 2.4, reflection: 2.6 },
  /** About one stone-width out: enough parallax for every facet to shade. */
  roomRadius: 2.0,
  /** A wave or two across each large facet — the table especially. */
  polish: { amount: 0.06, scale: 1.6 },
  /**
   * Turns the room so its window lights the piece from the side, as a studio
   * key light would. Square in front, the table mirrored the curtains.
   */
  envYaw: 2.1,
  /** Low ceiling: the window must not bleach the green. */
  envKnee: 2.5,
  /** A neutral studio: the stone's own green is the only colour in it. */
  envSaturation: 0,
  intensity: 1.85,
} as const;

/** Object names exported from Blender. */
const NODE = {
  emerald: "Emerald",
  diamonds: ["Halo_Diamonds", "Bail_Diamonds"],
  halo: "Halo_Gallery",
} as const;

/** Idle turn: amplitude (radians) and angular speed (radians / second). */
const IDLE_YAW = { amplitude: 0.2, speed: 0.38 } as const;
const CAMERA_DEPTH = 40;

const isMesh = (object: Object3D): object is Mesh =>
  (object as Mesh).isMesh === true;

export class PendantScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera();
  private readonly pivot = new Group();
  private readonly environment: StudioEnvironment;
  private readonly gems: GemMaterial[] = [];
  private readonly gold: MeshPhysicalMaterial;
  private hdri: HdriCube | null = null;
  private haloWidth = 2;
  private readonly tilt = { yaw: 0, pitch: 0 };
  private isDirty = true;

  private constructor(
    canvas: HTMLCanvasElement,
    private readonly budget: SceneBudget,
    private readonly isAnimated: boolean,
  ) {
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = AgXToneMapping;
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, budget.maxPixelRatio),
    );

    this.environment = createStudioEnvironment(this.renderer);
    this.scene.environment = this.environment.radiance;
    this.gold = new MeshPhysicalMaterial({
      color: YELLOW_GOLD.color,
      metalness: 1,
      roughness: YELLOW_GOLD.roughness,
      envMapIntensity: 1,
    });

    this.camera.near = 0.1;
    this.camera.far = CAMERA_DEPTH * 2;
    this.camera.position.set(0, 0, CAMERA_DEPTH);
    this.scene.add(this.pivot);
  }

  /** Loads, builds and compiles everything; resolves once a frame can be drawn without stalls. */
  static async create(
    canvas: HTMLCanvasElement,
    budget: SceneBudget,
    isAnimated: boolean,
  ): Promise<PendantScene> {
    const instance = new PendantScene(canvas, budget, isAnimated);
    await instance.load();
    return instance;
  }

  private async load(): Promise<void> {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const [gltf, hdri] = await Promise.all([
      loader.loadAsync(PENDANT_MODEL_URL),
      loadHdriCube(this.renderer, STUDIO_HDRI_URL, this.budget.gemCubeSize),
    ]);
    this.hdri = hdri;
    const model = gltf.scene;
    model.updateMatrixWorld(true);

    const halo = model.getObjectByName(NODE.halo);
    if (halo) {
      const size = new Box3().setFromObject(halo).getSize(new Vector3());
      this.haloWidth = size.x;
    }

    const replaced: Material[] = [];
    model.traverse((object) => {
      if (!isMesh(object)) return;
      const previous = object.material;
      replaced.push(...(Array.isArray(previous) ? previous : [previous]));

      const isEmerald = object.name === NODE.emerald;
      const isDiamond = (NODE.diamonds as readonly string[]).includes(
        object.name,
      );
      if (!isEmerald && !isDiamond) {
        object.material = this.gold;
        return;
      }

      toFloatPositions(object.geometry);
      const stone = isEmerald ? EMERALD : DIAMOND;
      const gem = createGemMaterial(object.geometry, hdri.cube, {
        ...stone,
        bounces: isEmerald
          ? this.budget.emeraldBounces
          : this.budget.diamondBounces,
        dispersion: this.budget.gemDispersion ? stone.dispersion : 0,
        blur: gemBlur(stone.blur, hdri.size),
      });
      gem.attach(object);
      object.material = gem.material;
      this.gems.push(gem);
    });
    replaced.forEach((material) => material.dispose());

    this.pivot.add(model);
    // Shaders and buffers are compiled and uploaded here, before the canvas is
    // shown — nothing may compile mid-scroll (optimize-3d-scene §3).
    await this.renderer.compileAsync(this.scene, this.camera);
  }

  /** Size in CSS pixels; the framing comes from the box's CSS custom properties. */
  setSize(width: number, height: number, framing: PendantFraming): void {
    if (width <= 0 || height <= 0) return;
    this.renderer.setSize(width, height, false);

    const unitsPerPx = this.haloWidth / (framing.span * width);
    const halfWidth = (width * unitsPerPx) / 2;
    const halfHeight = (height * unitsPerPx) / 2;
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.position.y = (framing.centre - 0.5) * height * unitsPerPx;
    this.camera.updateProjectionMatrix();
    this.isDirty = true;
  }

  /**
   * The pointer tilt, already smoothed, in radians: `yaw` turns the face toward
   * +x (screen right), `pitch` toward screen up. The tilt is smoothed outside,
   * by the same spring that tilts the card ring, so the two move as one piece.
   */
  setTilt(yaw: number, pitch: number): void {
    if (!this.isAnimated) return;
    this.tilt.yaw = yaw;
    this.tilt.pitch = pitch;
  }

  render(timeMs: number): void {
    if (!this.isAnimated && !this.isDirty) return;

    if (this.isAnimated) {
      const time = timeMs / 1000;
      this.pivot.rotation.y =
        Math.sin(time * IDLE_YAW.speed) * IDLE_YAW.amplitude + this.tilt.yaw;
      // three's +x rotation tips the face down; screen-up pitch is its negative.
      this.pivot.rotation.x = -this.tilt.pitch;
    }

    this.renderer.render(this.scene, this.camera);
    this.isDirty = false;
  }

  dispose(): void {
    this.scene.traverse((object) => {
      if (isMesh(object)) object.geometry.dispose();
    });
    this.gems.forEach((gem) => gem.dispose());
    this.gold.dispose();
    this.environment.dispose();
    this.hdri?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
