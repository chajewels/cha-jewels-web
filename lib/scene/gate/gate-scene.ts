/**
 * HALCYON GATE — the GetLayers scene ported for the layaway band (P3 item 5;
 * docs/design-refs/halcyon-gate/halcyon-gate.html is the source, CONTRACT.md
 * the rules, TINT.md the palette). A fullscreen fragment-shader scene: a calm
 * sea at golden hour, a slender brass ring standing on the horizon, its lower
 * half drowned, the world mirrored in rippled water that the pointer disturbs.
 *
 * PRESERVED, VERBATIM: the shader (one `worldColor()` sampled straight for the
 * sky and mirrored below the horizon for the sea; the true-perspective water
 * plane; the ripple pool), the uniform contract, the pointer-trail ripples
 * (no click, no scroll), the gamma pass. The colours are CONFIG values only.
 *
 * CHANGED FOR THIS SITE: the renderer draws into a given box (not the window),
 * the frame runs on the shared ticker only while the band is in view and the
 * tab visible (`lib/animation/ticker.ts`), the pointer is read on the box,
 * `localStorage` and the dev panel are gone, and `three` is the site's own
 * (0.186: `WebGLRenderer` with `outputColorSpace` left at the default so the
 * gamma pass is the one conversion, as in the source). Two CONFIG values can
 * be driven over time for the entrance (`setEntrance`).
 */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "three/addons/shaders/GammaCorrectionShader.js";

/* ============================================================
   CONFIG — every tweakable value, as the source holds it; the eight colour
   stops carry the Lumière tint (TINT.md). Never the GLSL.
============================================================ */
export const GATE_CONFIG = {
  colSkyTop: "#ece4d8",
  colSkyHorizon: "#e2d0b2",
  colSun: "#f6e4c0",
  colCloudLit: "#f6efe3",
  colCloudDark: "#cdbda2",
  colWaterDeep: "#5f4319",
  colGoldLight: "#e8c37d",
  colGoldDark: "#8a6b12",
  horizon: 0.5,
  sunX: 0.5,
  sunY: 0.6,
  sunGlow: 0.2,
  sunCore: 0.06,
  sunBright: 0.55,
  cloudScale: 4.1,
  cloudSpeed: 0.074,
  cloudCover: 0.35,
  cloudSoft: 0.19,
  cloudOpacity: 0.4,
  ringX: 0.5,
  ringR: 0.34,
  tube: 0.004,
  goldSpec: 1.26,
  goldRim: 0,
  camHeight: 0.135,
  waveScale: 1.8,
  waveDetail: 0.92,
  waveSpeed: 0.42,
  waveAmp: 0.028,
  stretch: 0.6,
  edgePos: 0.035,
  edgeSoft: 0.015,
  ripFreq: 38,
  ripDecay: 2.2,
  ripSize: 2.5,
  ripAmp: 0.54,
  reflLow: 0,
  reflHigh: 0.85,
  reflFall: 12,
  sparkle: 0.35,
  brightness: 0.96,
  grain: 0.02,
  mouseLerp: 0.63,
};

export type GateConfig = typeof GATE_CONFIG;

const COL_KEYS = ["SkyTop", "SkyHorizon", "Sun", "CloudLit", "CloudDark", "WaterDeep", "GoldLight", "GoldDark"] as const;
const NRIP = 28; // big enough that a fast swipe leaves a continuous trail before slots recycle

const hexToVec3 = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

/* The fragment shader, verbatim from the source. */
const FRAGMENT = `
    precision highp float;
    #define PI 3.14159265
    #define NRIP 28
    uniform vec2  uRes, uMouse;
    uniform vec2  uRipPos[NRIP];
    uniform float uRipAge[NRIP];
    uniform float uTime;
    uniform float uHorizon, uSunX, uSunY, uSunGlow, uSunCore, uSunBright;
    uniform float uCloudScale, uCloudSpeed, uCloudCover, uCloudSoft, uCloudOpac;
    uniform float uRingX, uRingR, uTube, uGoldSpec, uGoldRim;
    uniform float uCamH, uWaveScale, uWaveDetail, uWaveSpeed, uWaveAmp, uStretch;
    uniform float uRipFreq, uRipDecay, uRipFalloff, uRipAmp;
    uniform float uEdgePos, uEdgeSoft;
    uniform float uReflLow, uReflHigh, uReflFall, uSparkle;
    uniform float uBright, uGrain;
    uniform vec3  ucSkyTop, ucSkyHorizon, ucSun, ucCloudLit, ucCloudDark, ucWaterDeep, ucGoldLight, ucGoldDark;

    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }
    float fbm(vec2 p){
      float s = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++){ s += a * noise(p); p = p * 2.02 + vec2(11.3, 7.7); a *= 0.5; }
      return s;
    }
    float aspect(){ return uRes.x / uRes.y; }

    vec3 worldColor(vec2 uv){
      float ar = aspect();
      float st = clamp((uv.y - uHorizon) / max(0.0001, 1.0 - uHorizon), 0.0, 1.0);
      vec3 col = mix(ucSkyHorizon, ucSkyTop, pow(st, 0.7));
      vec2 sun = vec2(uSunX, uSunY);
      vec2 ds = uv - sun; ds.x *= ar;
      float sd = length(ds);
      float glow = exp(-sd * sd / (uSunGlow * uSunGlow));
      float core = exp(-sd * sd / (uSunCore * uSunCore));
      col = mix(col, ucSun, glow * 0.55);
      col += ucSun * core * uSunBright;
      vec2 cp = vec2(uv.x * ar, uv.y) * uCloudScale;
      cp += vec2(uTime * uCloudSpeed + uMouse.x * 0.04, -uTime * uCloudSpeed * 0.25);
      float base = fbm(cp);
      float form = fbm(cp * 2.1 + base * 1.6);
      float mask = smoothstep(uCloudCover, uCloudCover + uCloudSoft, base * 0.62 + form * 0.5);
      mask *= smoothstep(uHorizon - 0.04, uHorizon + 0.16, uv.y);
      float lit = smoothstep(0.28, 0.82, form);
      vec3 cloud = mix(ucCloudDark, ucCloudLit, lit);
      cloud = mix(cloud, ucSun, glow * 0.35);
      col = mix(col, cloud, mask * uCloudOpac);
      vec2 dr = uv - vec2(uRingX, uHorizon); dr.x *= ar;
      float rr = length(dr);
      float band = abs(rr - uRingR);
      float aa = max(1.3 / uRes.y, uTube * 0.12);
      float ring = smoothstep(uTube + aa, uTube - aa, band);
      if (ring > 0.001){
        vec2 rad = dr / max(rr, 1e-4);
        float a = clamp((rr - uRingR) / uTube, -1.0, 1.0);
        float round = sqrt(max(0.0, 1.0 - a * a));
        vec3 N = normalize(vec3(rad * a, round + 1e-4));
        vec3 V = vec3(0.0, 0.0, 1.0);
        vec3 L = normalize(vec3(normalize(sun - vec2(uRingX, uHorizon)) * 0.9, 0.55));
        vec3 Rr = reflect(-V, N);
        float upf = Rr.y;
        vec3 env = mix(ucWaterDeep * 1.3, ucSkyHorizon, smoothstep(-0.7, 0.15, upf));
        env = mix(env, ucSkyTop * 1.12, smoothstep(0.15, 0.9, upf));
        env = mix(env, ucSun, glow * 0.55);
        float envLum = dot(env, vec3(0.35, 0.4, 0.25));
        vec3 albedo = mix(ucGoldDark, ucGoldLight, 0.5 + 0.5 * upf);
        vec3 g = albedo * (0.32 + 1.05 * envLum);
        vec3 H = normalize(L + V);
        float spec = pow(max(0.0, dot(N, H)), 110.0);
        g += spec * ucSun * (1.0 + uGoldSpec);
        float sheen = pow(max(0.0, dot(N, normalize(vec3(0.0, 0.9, 0.7)))), 3.5);
        g += sheen * ucGoldLight * 0.22;
        g += pow(1.0 - round, 3.0) * mix(ucGoldLight, ucSun, 0.4) * uGoldRim;
        g += ucSun * core * 0.5;
        col = mix(col, g, ring);
      }
      return col;
    }

    vec2 waterPlane(vec2 uv){
      float ar = aspect();
      float b = max(uHorizon - uv.y, 0.0008);
      float wz = uCamH / b;
      float wx = (uv.x - 0.5) * ar * wz;
      return vec2(wx, wz);
    }

    float waterH(vec2 uv){
      vec2 w = waterPlane(uv);
      float wx = w.x, wz = w.y;
      float fade = 1.0 / (1.0 + wz * wz * uWaveDetail);
      float t = uTime * uWaveSpeed;
      float s = uWaveScale;
      float h = 0.0;
      h += sin((wz * 1.0 + wx * 0.15) * s - t * 1.0) * 0.55;
      h += sin((wz * 1.9 - wx * 0.40) * s - t * 1.5) * 0.32 * mix(0.5, 1.0, fade);
      h += sin((wz * 3.3 + wx * 0.85) * s - t * 2.1) * 0.18 * fade;
      h += (fbm(vec2(wx, wz) * s * 1.3 + vec2(0.0, -t * 0.6)) - 0.5) * 0.8 * fade;
      for (int i = 0; i < NRIP; i++){
        float age = uRipAge[i];
        float env = smoothstep(0.0, 0.35, age) * exp(-age * uRipDecay);
        if (env < 0.002) continue;
        float dist = length(w - uRipPos[i]);
        float clear = smoothstep(0.0, 2.5 / uRipFreq, dist);
        h += sin(dist * uRipFreq - age * uRipDecay * 4.0)
             * env * exp(-dist * uRipFalloff) * uRipAmp * fade * clear;
      }
      return h;
    }

    vec3 waterColor(vec2 uv, float ar){
      float depth = max(uHorizon - uv.y, 0.0);
      float e = 0.0016;
      float hx = waterH(uv + vec2(e, 0.0)) - waterH(uv - vec2(e, 0.0));
      float hy = waterH(uv + vec2(0.0, e)) - waterH(uv - vec2(0.0, e));
      vec2 slope = clamp(vec2(hx, hy) / (2.0 * e), -40.0, 40.0);
      float amp = uWaveAmp * (depth + 0.02);
      vec2 ruv;
      ruv.x = uv.x + slope.x * amp;
      ruv.y = uHorizon + depth * uStretch + slope.y * amp;
      vec3 refl = worldColor(ruv);
      float fres = mix(uReflLow, uReflHigh, exp(-depth * uReflFall));
      vec3 col = mix(ucWaterDeep, refl, fres);
      float lum = dot(refl, vec3(0.299, 0.587, 0.114));
      col += refl * smoothstep(0.6, 1.05, lum) * 0.6;
      float glit = pow(noise(vec2(uv.x * ar, uv.y) * 240.0 + vec2(0.0, -uTime * 3.0)), 5.0);
      col += glit * smoothstep(0.5, 0.95, lum) * ucSun * uSparkle;
      return col;
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / uRes;
      float ar = aspect();
      float center = uHorizon - uEdgePos;
      float soft   = max(uEdgeSoft, 0.0005);
      vec3 col;
      if (uv.y > center + soft) {
        col = worldColor(uv);
      } else if (uv.y < center - soft) {
        col = waterColor(uv, ar);
      } else {
        float waterMask = smoothstep(center + soft, center - soft, uv.y);
        col = mix(worldColor(uv), waterColor(uv, ar), waterMask);
      }
      float hl = exp(-abs(uv.y - center) * 60.0);
      col += hl * ucSun * 0.12 * exp(-pow((uv.x - uSunX) * 2.0, 2.0));
      col *= uBright;
      col += (hash(uv * uRes + uTime) - 0.5) * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }`;

export interface GateScene {
  /** Draw a frame at `time` (seconds). */
  render(time: number): void;
  setSize(width: number, height: number, pixelRatio: number): void;
  /** The pointer over the box, in 0–1 box coordinates (y up). */
  setPointer(x: number, y: number): void;
  /** The two CONFIG values the entrance drives (TINT.md). */
  setEntrance(camHeight: number, brightness: number): void;
  dispose(): void;
}

export const createGateScene = (canvas: HTMLCanvasElement, config: GateConfig = GATE_CONFIG): GateScene => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "low-power" });
  renderer.setClearColor(0x000000, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
  camera.position.set(0, 0, 1);

  const uniforms: Record<string, THREE.IUniform> = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uCamH: { value: config.camHeight },
    uRipFreq: { value: config.ripFreq },
    uRipDecay: { value: config.ripDecay },
    uRipFalloff: { value: config.ripSize },
    uRipAmp: { value: config.ripAmp },
    uEdgePos: { value: config.edgePos },
    uEdgeSoft: { value: config.edgeSoft },
    uHorizon: { value: config.horizon },
    uSunX: { value: config.sunX },
    uSunY: { value: config.sunY },
    uSunGlow: { value: config.sunGlow },
    uSunCore: { value: config.sunCore },
    uSunBright: { value: config.sunBright },
    uCloudScale: { value: config.cloudScale },
    uCloudSpeed: { value: config.cloudSpeed },
    uCloudCover: { value: config.cloudCover },
    uCloudSoft: { value: config.cloudSoft },
    uCloudOpac: { value: config.cloudOpacity },
    uRingX: { value: config.ringX },
    uRingR: { value: config.ringR },
    uTube: { value: config.tube },
    uGoldSpec: { value: config.goldSpec },
    uGoldRim: { value: config.goldRim },
    uWaveScale: { value: config.waveScale },
    uWaveDetail: { value: config.waveDetail },
    uWaveSpeed: { value: config.waveSpeed },
    uWaveAmp: { value: config.waveAmp },
    uStretch: { value: config.stretch },
    uReflLow: { value: config.reflLow },
    uReflHigh: { value: config.reflHigh },
    uReflFall: { value: config.reflFall },
    uSparkle: { value: config.sparkle },
    uBright: { value: config.brightness },
    uGrain: { value: config.grain },
  };
  for (const k of COL_KEYS) uniforms[`uc${k}`] = { value: hexToVec3(config[`col${k}`]) };

  /* ---------- cursor-trail ripple pool (world-plane coords) ---------- */
  const ripPos = Array.from({ length: NRIP }, () => new THREE.Vector2(0, 0));
  const ripBirth = new Array<number>(NRIP).fill(-1e3);
  let ripIdx = 0;
  uniforms.uRipPos = { value: ripPos };
  uniforms.uRipAge = { value: new Array<number>(NRIP).fill(1e3) };

  const material = new THREE.ShaderMaterial({
    uniforms,
    depthTest: false,
    depthWrite: false,
    vertexShader: `void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: FRAGMENT,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  scene.add(quad);

  /* ---------- composer (gate → gamma; no bloom), as the source ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new ShaderPass(GammaCorrectionShader));

  /* ---------- pointer → ripples ---------- */
  const mouse = new THREE.Vector2(0, 0);
  const mouseTarget = new THREE.Vector2(0, 0);
  let lastSx = 0;
  let lastSy = 0;
  let aspect = 1;
  const dropRipple = (sx: number, sy: number) => {
    const b = config.horizon - sy;
    if (b <= 0.012) return; // only over the water, not the sky
    const wz = (uniforms.uCamH.value as number) / b;
    const wx = (sx - 0.5) * aspect * wz;
    ripPos[ripIdx].set(wx, wz);
    ripBirth[ripIdx] = performance.now() / 1000;
    ripIdx = (ripIdx + 1) % NRIP;
  };

  return {
    render(now) {
      mouse.lerp(mouseTarget, config.mouseLerp);
      uniforms.uTime.value = now;
      (uniforms.uMouse.value as THREE.Vector2).copy(mouse);
      const ages = uniforms.uRipAge.value as number[];
      for (let i = 0; i < NRIP; i++) ages[i] = now - ripBirth[i];
      composer.render();
    },
    setSize(width, height, pixelRatio) {
      const dpr = Math.min(pixelRatio, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      aspect = width / Math.max(1, height);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      composer.setPixelRatio(dpr);
      composer.setSize(width, height);
      (uniforms.uRes.value as THREE.Vector2).copy(renderer.getDrawingBufferSize(new THREE.Vector2()));
    },
    setPointer(sx, sy) {
      mouseTarget.set(sx * 2 - 1, sy * 2 - 1);
      // throttle by screen distance so ripples space evenly into a trail
      if (Math.hypot(sx - lastSx, sy - lastSy) > 0.018) {
        dropRipple(sx, sy);
        lastSx = sx;
        lastSy = sy;
      }
    },
    setEntrance(camHeight, brightness) {
      uniforms.uCamH.value = camHeight;
      uniforms.uBright.value = brightness;
    },
    dispose() {
      material.dispose();
      quad.geometry.dispose();
      composer.dispose();
      renderer.dispose();
    },
  };
};
