// 📖 Docs: obsidian/frontend/utils.md

import {
  Matrix3,
  Matrix4,
  ShaderMaterial,
  Vector3,
  type BufferGeometry,
  type Color,
  type CubeTexture,
  type Mesh,
} from "three";
import {
  BVHShaderGLSL,
  MeshBVH,
  MeshBVHUniformStruct,
} from "three-mesh-bvh";

/**
 * Faceted-gem material: the view ray refracts into the stone, bounces off its
 * inner facets (traced against a BVH of the stone's own triangles) until it can
 * leave, and then samples the studio cube map along the exit direction.
 *
 * Plain `transmission` in three.js refracts once and shows whatever is behind
 * the mesh, which turns a brilliant cut into a grey lens. Tracing the internal
 * reflections is what produces the dark-and-bright facet mosaic.
 *
 * Red, green and blue are traced at separate IORs, so facet edges split into
 * thin colour fringes. The room is a finite sphere around the stone (not at
 * infinity) and the facets carry a faint polish waviness, so each facet holds a
 * gradient rather than one flat fill — the photographic quality of the
 * locomotive.ca ring. `fire`, `highlight` and `sparkle` are optional stylising
 * controls; at 1 / 0 / 0 they are off.
 */

export interface GemOptions {
  ior: number;
  /** Internal reflections traced before giving up. */
  bounces: number;
  /** Surface tint applied to the refracted light (Cycles base colour). */
  tint: Color;
  /** Absorption per world unit travelled (Cycles volume absorption). */
  absorption: Vector3;
  /** IOR spread between red and blue; 0 disables the three-ray trace. */
  dispersion: number;
  /** Saturation boost on the dispersed colour — 1 is physical, higher is more rainbow. */
  fire: number;
  /** How much of the brightest light is added back on top (0 = none). */
  highlight: number;
  /** Surface grain: strength (0–1) and cells per world unit. */
  sparkle: { amount: number; scale: number };
  /**
   * Mip level the environment is read at (0 = sharp). Refraction is read softer
   * than the surface reflection. Callers scale it with the cube size.
   */
  blur: { refraction: number; reflection: number };
  /**
   * Radius of the room around the stone, in world units. Smaller means more
   * parallax, so more variation across each facet; very large approaches the
   * old infinitely-distant room, where a facet was one flat colour.
   */
  roomRadius: number;
  /** Polish waviness: tilt amount (radians-ish) and waves per world unit. */
  polish: { amount: number; scale: number };
  /** Turns the environment about the vertical axis, radians — where the lights fall. */
  envYaw: number;
  /**
   * Soft ceiling on environment radiance: values well below it pass through,
   * values far above it approach it. Keeps a bright window from bleaching a
   * coloured stone.
   */
  envKnee: number;
  /**
   * How much of the room's own colour reaches the stone: 0 = a neutral, grey
   * studio (the stone alone colours the light), 1 = the photograph as shot.
   */
  envSaturation: number;
  /** Multiplier on everything the stone returns. */
  intensity: number;
}

const vertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vLocalPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    // Object-space, but in world-sized units: the GLB may carry quantised
    // positions with the dequantising scale on the node.
    vLocalPosition = position * vec3(
      length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz)
    );
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = /* glsl */ `
  ${BVHShaderGLSL.bvh_struct_definitions}
  ${BVHShaderGLSL.common_functions}
  ${BVHShaderGLSL.bvh_ray_functions}

  uniform BVH bvh;
  uniform samplerCube envMap;
  uniform mat4 uModelMatrix;
  uniform mat4 uModelInverse;
  uniform float uIor;
  uniform float uDispersion;
  uniform float uFire;
  uniform float uHighlight;
  uniform vec2 uSparkle;
  uniform vec3 uTint;
  uniform vec3 uAbsorption;
  uniform float uIntensity;
  uniform vec2 uBlur;
  uniform vec3 uEnvCenter;
  uniform float uEnvRadius;
  uniform vec2 uWave;
  uniform mat3 uEnvRotation;
  uniform float uEnvKnee;
  uniform float uEnvSaturation;
  uniform float uOpacity;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vLocalPosition;

  // Sampled from a blurred mip, not the sharp base level: a real stone sees a
  // soft room, so each facet carries a gradient instead of a hard-edged cut-out.
  // A photographed room holds a window hundreds of times brighter than its
  // walls. Seen through a coloured stone at that level, the tint burns out to
  // white, so radiance rolls off toward uEnvKnee — highlights stay bright but
  // keep the stone's colour.
  //
  // The room's own colours are then pulled toward grey by uEnvSaturation. A
  // furnished room seen through a green stone mixed its yellow chair, wood
  // floor and blue window into olive and brown; jewelry is shot in a neutral
  // studio so the stone alone colours the light.
  vec3 sampleEnv(vec3 direction, float lod) {
    vec3 radiance = textureLod(envMap, uEnvRotation * direction, lod).rgb;
    float peak = max(radiance.r, max(radiance.g, radiance.b));
    radiance *= uEnvKnee / (uEnvKnee + peak);
    float luma = dot(radiance, vec3(0.2126, 0.7152, 0.0722));
    return mix(vec3(luma), radiance, uEnvSaturation);
  }
  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  // Smooth value noise, so the grain reads as glitter rather than pixel static.
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

  // The room is not at infinity. Treat it as a sphere of radius uEnvRadius
  // around the stone and look the cube up toward where the ray actually hits
  // it. Two pixels of one flat facet then leave from different points and see
  // different parts of the room, so the facet carries a gradient instead of a
  // single flat fill. With an infinitely distant room and a parallel
  // (orthographic) view, every pixel of a facet read the same texel.
  vec3 roomLookup(vec3 point, vec3 direction) {
    vec3 offset = point - uEnvCenter;
    float b = dot(offset, direction);
    float c = dot(offset, offset) - uEnvRadius * uEnvRadius;
    float t = -b + sqrt(max(b * b - c, 0.0));
    return normalize(offset + direction * t);
  }

  // Low-frequency waviness on the polished surface: real facets are never
  // optically flat, and the slight wander is what makes their reflections look
  // photographed rather than drawn.
  vec3 polishWave(vec3 p) {
    return vec3(
      valueNoise(p),
      valueNoise(p + vec3(17.1, 3.7, 9.2)),
      valueNoise(p + vec3(5.3, 21.9, 13.4))
    ) - 0.5;
  }

  // Returns the world-space direction the ray leaves the stone in; also the
  // world-space distance it travelled inside and the world point it left from.
  vec3 traceExit(vec3 viewDir, vec3 normal, float ior, out float travelled, out vec3 exitPoint) {
    travelled = 0.0;
    vec3 entry = refract(viewDir, normal, 1.0 / ior);
    vec3 rayOrigin = (uModelInverse * vec4(vWorldPosition, 1.0)).xyz;
    vec3 rayDirection = normalize((uModelInverse * vec4(entry, 0.0)).xyz);
    rayOrigin += rayDirection * 1e-4;

    for (int i = 0; i < BOUNCES; i++) {
      uvec4 faceIndices = uvec4(0u);
      vec3 faceNormal = vec3(0.0, 0.0, 1.0);
      vec3 barycoord = vec3(0.0);
      float side = 1.0;
      float dist = 0.0;
      bool hit = bvhIntersectFirstHit(bvh, rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist);
      if (!hit) break;

      travelled += dist * length((uModelMatrix * vec4(rayDirection, 0.0)).xyz);
      vec3 hitPosition = rayOrigin + rayDirection * dist;
      // faceNormal is flipped to face the incoming ray, so this is the
      // stone-to-air refraction at the far facet.
      vec3 exitDirection = refract(rayDirection, faceNormal, ior);
      if (dot(exitDirection, exitDirection) > 0.0) {
        rayDirection = exitDirection;
        rayOrigin = hitPosition;
        break;
      }
      rayDirection = reflect(rayDirection, faceNormal);
      rayOrigin = hitPosition + rayDirection * 1e-4;
    }

    exitPoint = (uModelMatrix * vec4(rayOrigin, 1.0)).xyz;
    return normalize((uModelMatrix * vec4(rayDirection, 0.0)).xyz);
  }

  // As traceExit, at one index, also reporting the ray inside the stone and
  // the facet it leaves through — so each colour can be split there.
  vec3 traceExitAt(vec3 viewDir, vec3 normal, float ior, out float travelled, out vec3 exitPoint, out vec3 insideDir, out vec3 exitNormal, out bool exited) {
    travelled = 0.0;
    exited = false;
    insideDir = vec3(0.0);
    exitNormal = vec3(0.0, 0.0, 1.0);
    vec3 entry = refract(viewDir, normal, 1.0 / ior);
    vec3 rayOrigin = (uModelInverse * vec4(vWorldPosition, 1.0)).xyz;
    vec3 rayDirection = normalize((uModelInverse * vec4(entry, 0.0)).xyz);
    rayOrigin += rayDirection * 1e-4;

    for (int i = 0; i < BOUNCES; i++) {
      uvec4 faceIndices = uvec4(0u);
      vec3 faceNormal = vec3(0.0, 0.0, 1.0);
      vec3 barycoord = vec3(0.0);
      float side = 1.0;
      float dist = 0.0;
      bool hit = bvhIntersectFirstHit(bvh, rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist);
      if (!hit) break;

      travelled += dist * length((uModelMatrix * vec4(rayDirection, 0.0)).xyz);
      vec3 hitPosition = rayOrigin + rayDirection * dist;
      vec3 exitDirection = refract(rayDirection, faceNormal, ior);
      if (dot(exitDirection, exitDirection) > 0.0) {
        insideDir = rayDirection;
        exitNormal = faceNormal;
        exited = true;
        rayDirection = exitDirection;
        rayOrigin = hitPosition;
        break;
      }
      rayDirection = reflect(rayDirection, faceNormal);
      rayOrigin = hitPosition + rayDirection * 1e-4;
    }

    exitPoint = (uModelMatrix * vec4(rayOrigin, 1.0)).xyz;
    return normalize((uModelMatrix * vec4(rayDirection, 0.0)).xyz);
  }

  // One colour's way out through the exit facet, at its own index; where that
  // colour is held inside (total internal reflection), it leaves with green.
  vec3 splitExit(vec3 insideDir, vec3 exitNormal, float ior, vec3 fallback) {
    vec3 out_ = refract(insideDir, exitNormal, ior);
    if (dot(out_, out_) <= 0.0) return fallback;
    return normalize((uModelMatrix * vec4(out_, 0.0)).xyz);
  }

  vec3 refractedLight(vec3 viewDir, vec3 normal, float ior, out float travelled) {
    vec3 exitPoint;
    vec3 exitDirection = traceExit(viewDir, normal, ior, travelled, exitPoint);
    return sampleEnv(roomLookup(exitPoint, exitDirection), uBlur.x);
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = isOrthographic
      ? normalize(vec3(-viewMatrix[0][2], -viewMatrix[1][2], -viewMatrix[2][2]))
      : normalize(vWorldPosition - cameraPosition);
    if (dot(normal, viewDir) > 0.0) normal = -normal;
    normal = normalize(normal + polishWave(vLocalPosition * uWave.y) * uWave.x);

    float f0 = pow((uIor - 1.0) / (uIor + 1.0), 2.0);
    float cosTheta = clamp(dot(-viewDir, normal), 0.0, 1.0);
    float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
    vec3 reflection = sampleEnv(roomLookup(vWorldPosition, reflect(viewDir, normal)), uBlur.y);

    vec3 refraction;
    #if DISPERSION == 2
      // One path through the stone, at green's index; red and blue part from
      // it at the facet the light leaves through, where the fire is made.
      // A third of the full split's cost (three traces): the diamonds' halo
      // ran at 46–66 fps with it on an M1 Pro, 120 without.
      float travelled;
      vec3 exitPoint;
      vec3 insideDir;
      vec3 exitNormal;
      bool exited;
      vec3 dirG = traceExitAt(viewDir, normal, uIor, travelled, exitPoint, insideDir, exitNormal, exited);
      vec3 dirR = exited ? splitExit(insideDir, exitNormal, uIor - uDispersion, dirG) : dirG;
      vec3 dirB = exited ? splitExit(insideDir, exitNormal, uIor + uDispersion, dirG) : dirG;
      refraction.r = sampleEnv(roomLookup(exitPoint, dirR), uBlur.x).r;
      refraction.g = sampleEnv(roomLookup(exitPoint, dirG), uBlur.x).g;
      refraction.b = sampleEnv(roomLookup(exitPoint, dirB), uBlur.x).b;
      refraction *= exp(-uAbsorption * travelled);
      float luma = dot(refraction, vec3(0.2126, 0.7152, 0.0722));
      refraction = max(mix(vec3(luma), refraction, uFire), 0.0);
    #elif DISPERSION
      // Each channel takes its own path through the stone, and pays its own
      // absorption for it — where the paths part at a facet edge, the light
      // splits into a fringe.
      float travelledR;
      float travelledG;
      float travelledB;
      refraction.r = refractedLight(viewDir, normal, uIor - uDispersion, travelledR).r;
      refraction.g = refractedLight(viewDir, normal, uIor, travelledG).g;
      refraction.b = refractedLight(viewDir, normal, uIor + uDispersion, travelledB).b;
      refraction *= exp(-uAbsorption * vec3(travelledR, travelledG, travelledB));
      float luma = dot(refraction, vec3(0.2126, 0.7152, 0.0722));
      refraction = max(mix(vec3(luma), refraction, uFire), 0.0);
    #else
      float travelled;
      refraction = refractedLight(viewDir, normal, uIor, travelled);
      refraction *= exp(-uAbsorption * travelled);
    #endif
    refraction *= uTint;

    vec3 color = mix(refraction, reflection, fresnel);
    // Lift what is already bright, so lit facets flare against dark ones.
    float peak = max(color.r, max(color.g, color.b));
    color += color * smoothstep(0.5, 1.5, peak) * uHighlight;
    // Grain fixed to the stone: it travels with the facets as the piece turns.
    float grain = valueNoise(vLocalPosition * uSparkle.y) - 0.5;
    color *= 1.0 + grain * 2.0 * uSparkle.x;

    gl_FragColor = vec4(color * uIntensity, uOpacity);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export interface GemMaterial {
  material: ShaderMaterial;
  /** Keeps the model matrices in the uniforms current; call before render. */
  attach: (mesh: Mesh) => void;
  /** Fade the stone (the featured carousel dims its side rings). */
  setOpacity: (opacity: number) => void;
  dispose: () => void;
}

export const createGemMaterial = (
  geometry: BufferGeometry,
  envMap: CubeTexture,
  options: GemOptions,
): GemMaterial => {
  const bvh = new MeshBVH(geometry);
  const bvhStruct = new MeshBVHUniformStruct();
  bvhStruct.updateFrom(bvh);

  const modelMatrix = new Matrix4();
  const modelInverse = new Matrix4();
  // The room is centred on the stone (or, for a merged set, on the set).
  geometry.computeBoundingSphere();
  const localCentre = geometry.boundingSphere?.center.clone() ?? new Vector3();
  const envCentre = new Vector3();

  const material = new ShaderMaterial({
    defines: {
      BOUNCES: Math.max(1, Math.round(options.bounces)),
      // 2 = one trace, colours split at the exit facet (see the shader). The
      // full three-trace split (1) is kept for reference; it cost the halo's
      // ~30 diamonds two thirds of the frame for a 0.66/255 difference.
      DISPERSION: options.dispersion > 0 ? 2 : 0,
    },
    uniforms: {
      bvh: { value: bvhStruct },
      envMap: { value: envMap },
      uModelMatrix: { value: modelMatrix },
      uModelInverse: { value: modelInverse },
      uIor: { value: options.ior },
      uDispersion: { value: options.dispersion },
      uFire: { value: options.fire },
      uHighlight: { value: options.highlight },
      uSparkle: { value: [options.sparkle.amount, options.sparkle.scale] },
      uTint: { value: options.tint },
      uAbsorption: { value: options.absorption },
      uIntensity: { value: options.intensity },
      uBlur: { value: [options.blur.refraction, options.blur.reflection] },
      uEnvCenter: { value: envCentre },
      uEnvRadius: { value: options.roomRadius },
      uWave: { value: [options.polish.amount, options.polish.scale] },
      uEnvRotation: {
        value: new Matrix3().setFromMatrix4(
          new Matrix4().makeRotationY(options.envYaw),
        ),
      },
      uEnvKnee: { value: options.envKnee },
      uEnvSaturation: { value: options.envSaturation },
      uOpacity: { value: 1 },
    },
    vertexShader,
    fragmentShader,
  });

  return {
    material,
    attach: (mesh) => {
      mesh.onBeforeRender = () => {
        modelMatrix.copy(mesh.matrixWorld);
        modelInverse.copy(mesh.matrixWorld).invert();
        envCentre.copy(localCentre).applyMatrix4(mesh.matrixWorld);
      };
    },
    // Only the uniform: flipping `transparent` per frame changes the program
    // key and would recompile mid-scroll. A caller that fades a stone sets
    // `material.transparent = true` once, up front.
    setOpacity: (opacity) => {
      material.uniforms.uOpacity.value = opacity;
    },
    dispose: () => {
      bvhStruct.dispose();
      material.dispose();
    },
  };
};
