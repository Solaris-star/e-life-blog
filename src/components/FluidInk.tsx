'use client';

import { useEffect, useRef } from 'react';

// ── Tuning knobs ─────────────────────────────────────────────────────────────
const FLOW_SPEED = 0.05; // global time scale; lower = slower drift (~25s feel)
const INK_SCALE = 1.55; // noise frequency; higher = smaller marbling features
const WARP_STRENGTH = 2.5; // domain-warp intensity; higher = more turbulence
const SHEEN_BASE = 0.13; // iridescent mix cap, light theme (keep <= 0.18)
const SHEEN_DARK_MULT = 1.4; // sheen multiplier in dark theme
const INK_DARK_MULT = 0.62; // ink coverage multiplier in dark theme (keeps it calm)
const POINTER_RADIUS = 0.35; // pointer swirl falloff radius (uv units)
const POINTER_SWIRL = 1.3; // swirl rotation strength at pointer center
const POINTER_EASE = 0.08; // pointer lerp factor per frame
const GRAIN = 0.04; // per-pixel grain amplitude (+/-2%)
const DPR_CAP = 2;
const DPR_CAP_COARSE = 1.25;

const glf = (n: number): string => n.toFixed(4);

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;
uniform float uSheen;
uniform float uInkAmt;
uniform vec3 uPaper, uPaperDeep, uRust, uOlive, uSand, uInk;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    a *= 0.55;
  }
  return v;
}

void main() {
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 st = vec2(vUv.x * aspect, vUv.y);

  // Gentle swirl + slight pull around the eased pointer, smooth falloff.
  vec2 pp = vec2(uPointer.x * aspect, uPointer.y);
  vec2 d = st - pp;
  float fall = smoothstep(${glf(POINTER_RADIUS)}, 0.0, length(d));
  float ang = fall * fall * ${glf(POINTER_SWIRL)};
  vec2 sw = pp + mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * d * (1.0 - 0.12 * fall);

  float t = uTime;
  vec2 p = sw * ${glf(INK_SCALE)};

  // Two-level domain warp: slow currents dragging the ink field around.
  vec2 q = vec2(fbm(p + t * 0.12), fbm(p + vec2(5.2, 1.3) - t * 0.09));
  vec2 r = vec2(fbm(p + ${glf(WARP_STRENGTH)} * q + vec2(1.7, 9.2) + t * 0.15),
                fbm(p + ${glf(WARP_STRENGTH)} * q + vec2(8.3, 2.8) - t * 0.11));
  vec2 pw = p + ${glf(WARP_STRENGTH)} * r;
  float f = fbm(pw);

  // Warm paper base with large-scale tone variation (never flat).
  vec3 col = mix(uPaper, uPaperDeep, 0.35 * smoothstep(0.3, 0.8, fbm(p * 0.45 + 3.1)));

  // Inks pre-softened toward paper so they read as wet bleed, not paint.
  float sandAmt = smoothstep(0.45, 0.85, q.y) * 0.45 * uInkAmt;
  float oliveAmt = smoothstep(0.60, 0.82, r.x) * 0.6 * uInkAmt;
  float rustAmt = smoothstep(0.60, 0.84, f) * 0.8 * uInkAmt;
  col = mix(col, mix(uPaper, uSand, 0.75), sandAmt);
  col = mix(col, mix(uPaper, uOlive, 0.8), oliveAmt);
  col = mix(col, mix(uPaper, uRust, 0.78), rustAmt);
  col = mix(col, mix(uInk, uRust, 0.45), rustAmt * oliveAmt * 0.25); // pooled ink deepens

  // Iridescent sheen: thin band along the rust contour, gated by field
  // steepness (forward differences; no derivatives extension needed).
  vec2 e = vec2(0.035, 0.0);
  float grad = clamp(length(vec2(fbm(pw + e.xy) - f, fbm(pw + e.yx) - f)) * 18.0, 0.0, 1.0);
  float ridge = smoothstep(0.07, 0.0, abs(f - 0.60));
  vec3 irid = 0.5 + 0.5 * cos(6.2831853 * (vec3(0.9, 0.7, 0.5) * (f * 1.8 + grad) + vec3(0.0, 0.33, 0.67) + t * 0.25));
  irid = mix(irid, uSand, 0.35); // warm the rainbow toward lamplight
  col = mix(col, irid, uSheen * ridge * grad * (0.35 + 0.65 * smoothstep(0.3, 0.7, q.x)));

  // Static per-pixel grain so it melds with the site's paper grain.
  col += (hash(gl_FragCoord.xy) - 0.5) * ${glf(GRAIN)};
  gl_FragColor = vec4(col, 1.0);
}
`;

type RGB = [number, number, number];

// CSS custom properties read from documentElement (defined on :root,
// overridden by the .dark class), with baked-in fallbacks per theme.
const CSS_VARS = ['--paper', '--paper-deep', '--rust', '--olive', '--sand', '--ink'] as const;
const UNIFORM_NAMES = ['uPaper', 'uPaperDeep', 'uRust', 'uOlive', 'uSand', 'uInk'] as const;
const FALLBACK_LIGHT: RGB[] = [
  [0.953, 0.898, 0.812], [0.886, 0.792, 0.659], [0.851, 0.427, 0.227],
  [0.31, 0.478, 0.345], [0.839, 0.659, 0.435], [0.141, 0.122, 0.094],
];
const FALLBACK_DARK: RGB[] = [
  [0.137, 0.122, 0.094], [0.275, 0.231, 0.169], [0.894, 0.467, 0.259],
  [0.525, 0.647, 0.427], [0.851, 0.678, 0.447], [1.0, 0.945, 0.839],
];

function parseColor(raw: string): RGB | null {
  const s = raw.trim().toLowerCase();
  let m = /^#([0-9a-f]{3})$/.exec(s);
  if (m) {
    const h = m[1];
    return [0, 1, 2].map((i) => parseInt(h[i] + h[i], 16) / 255) as RGB;
  }
  m = /^#([0-9a-f]{6})$/.exec(s);
  if (m) {
    const h = m[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;
  }
  m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(s);
  if (m) return [+m[1] / 255, +m[2] / 255, +m[3] / 255].map((v) => Math.min(v, 1)) as RGB;
  return null;
}

function readThemeColors(): { colors: RGB[]; dark: boolean } {
  const root = document.documentElement;
  const dark = root.classList.contains('dark');
  const style = getComputedStyle(root);
  const fb = dark ? FALLBACK_DARK : FALLBACK_LIGHT;
  return { colors: CSS_VARS.map((v, i) => parseColor(style.getPropertyValue(v)) ?? fb[i]), dark };
}

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

/**
 * Slow-moving marbled ink on warm paper with a faint iridescent sheen.
 * Wrapper div is `position: relative; overflow: hidden`; pass `className`
 * for sizing (the component fills whatever box the parent gives it).
 */
export function FluidInk({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    let theme = readThemeColors();

    const cssFallback = () => {
      canvas.style.display = 'none';
      const [paper, deep, rust, olive, sand] = theme.colors;
      const c = (rgb: RGB, a: number) => `rgba(${rgb.map((v) => Math.round(v * 255)).join(',')},${a})`;
      wrap.style.background = [
        `radial-gradient(60% 50% at 22% 28%, ${c(rust, 0.28)}, transparent 70%)`,
        `radial-gradient(50% 45% at 75% 62%, ${c(olive, 0.22)}, transparent 70%)`,
        `radial-gradient(70% 60% at 55% 15%, ${c(sand, 0.3)}, transparent 70%)`,
        `radial-gradient(120% 120% at 50% 50%, ${c(paper, 1)}, ${c(deep, 1)})`,
      ].join(',');
    };

    const attrs: WebGLContextAttributes = {
      alpha: false, antialias: false, depth: false, stencil: false,
      preserveDrawingBuffer: false, powerPreference: 'low-power',
    };
    const gl = (canvas.getContext('webgl', attrs) ??
      canvas.getContext('experimental-webgl', attrs)) as WebGLRenderingContext | null;
    if (!gl) { cssFallback(); return; }

    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const minFrameMs = coarse ? 1000 / 30 : 0; // ~30fps cap on mobile GPUs
    const rmq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = rmq.matches;
    let prog: WebGLProgram | null = null;
    let uni: Record<string, WebGLUniformLocation | null> = {};
    let raf = 0, timeSec = 0, lastNow = 0, lastDraw = 0;
    let running = false, inView = true, lost = false, disposed = false;
    const ptrTarget: [number, number] = [0.5, 0.5];
    const ptrCur: [number, number] = [0.5, 0.5];

    const pushColors = () => {
      if (!prog) return;
      theme.colors.forEach((rgb, i) => {
        const loc = uni[UNIFORM_NAMES[i]];
        if (loc) gl.uniform3f(loc, rgb[0], rgb[1], rgb[2]);
      });
      const sheen = uni.uSheen;
      if (sheen) gl.uniform1f(sheen, SHEEN_BASE * (theme.dark ? SHEEN_DARK_MULT : 1));
      const inkAmt = uni.uInkAmt;
      if (inkAmt) gl.uniform1f(inkAmt, theme.dark ? INK_DARK_MULT : 1);
    };

    const build = (): boolean => {
      const vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
      const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) return false;
      const p = gl.createProgram();
      if (!p) return false;
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.bindAttribLocation(p, 0, 'aPos');
      gl.linkProgram(p);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { gl.deleteProgram(p); return false; }
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.useProgram(p);
      prog = p;
      uni = {};
      for (const n of ['uRes', 'uTime', 'uPointer', 'uSheen', 'uInkAmt', ...UNIFORM_NAMES]) uni[n] = gl.getUniformLocation(p, n);
      pushColors();
      return true;
    };

    const drawFrame = (t: number) => {
      if (lost || !prog) return;
      const lt = uni.uTime;
      if (lt) gl.uniform1f(lt, t);
      const lp = uni.uPointer;
      if (lp) gl.uniform2f(lp, ptrCur[0], ptrCur[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (minFrameMs && now - lastDraw < minFrameMs) return;
      const dt = lastNow ? Math.min(now - lastNow, 100) : 16.7;
      lastNow = now;
      lastDraw = now;
      timeSec += dt / 1000;
      ptrCur[0] += (ptrTarget[0] - ptrCur[0]) * POINTER_EASE;
      ptrCur[1] += (ptrTarget[1] - ptrCur[1]) * POINTER_EASE;
      drawFrame(timeSec * FLOW_SPEED);
    };

    const stopLoop = () => {
      if (!running) return;
      cancelAnimationFrame(raf);
      running = false;
    };
    const maybeRun = () => {
      const should = !disposed && !lost && !reduced && inView && !document.hidden;
      if (should && !running) {
        running = true;
        lastNow = 0;
        raf = requestAnimationFrame(tick);
      } else if (!should) stopLoop();
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, coarse ? DPR_CAP_COARSE : DPR_CAP);
      const w = Math.max(1, Math.round(wrap.clientWidth * dpr));
      const h = Math.max(1, Math.round(wrap.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      const loc = uni.uRes;
      if (loc) gl.uniform2f(loc, w, h);
      if (reduced) drawFrame(0);
    };

    const setPointer = (x: number, y: number) => {
      const r = wrap.getBoundingClientRect();
      if (!r.width || !r.height) return;
      ptrTarget[0] = Math.min(1.2, Math.max(-0.2, (x - r.left) / r.width));
      ptrTarget[1] = Math.min(1.2, Math.max(-0.2, 1 - (y - r.top) / r.height));
    };
    const onPointer = (e: PointerEvent) => setPointer(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) setPointer(t.clientX, t.clientY);
    };
    const attachPointer = () => {
      window.addEventListener('pointermove', onPointer, { passive: true });
      window.addEventListener('touchmove', onTouch, { passive: true });
    };
    const detachPointer = () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('touchmove', onTouch);
    };

    const applyMotionMode = () => {
      if (reduced) {
        stopLoop();
        detachPointer();
        ptrCur[0] = ptrTarget[0] = 0.5;
        ptrCur[1] = ptrTarget[1] = 0.5;
        drawFrame(0); // single static marble frame
      } else {
        attachPointer();
        maybeRun();
      }
    };
    const onRmqChange = () => { reduced = rmq.matches; applyMotionMode(); };
    const onTheme = () => {
      theme = readThemeColors();
      pushColors();
      if (reduced) drawFrame(0);
    };
    const onVis = () => maybeRun();
    const onLost = (e: Event) => { e.preventDefault(); lost = true; stopLoop(); };
    const onRestored = () => {
      lost = false;
      theme = readThemeColors();
      if (!build()) { lost = true; cssFallback(); return; }
      resize();
      applyMotionMode();
    };

    if (!build()) { cssFallback(); return; }

    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    rmq.addEventListener('change', onRmqChange);
    window.addEventListener('blog-theme-change', onTheme);
    window.addEventListener('storage', onTheme);
    document.addEventListener('visibilitychange', onVis);
    const mo = new MutationObserver(() => onTheme());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);
    const io = new IntersectionObserver((entries) => {
      inView = entries.some((entry) => entry.isIntersecting);
      maybeRun();
    });
    io.observe(wrap);

    resize();
    applyMotionMode();

    return () => {
      disposed = true;
      stopLoop();
      detachPointer();
      rmq.removeEventListener('change', onRmqChange);
      window.removeEventListener('blog-theme-change', onTheme);
      window.removeEventListener('storage', onTheme);
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      mo.disconnect();
      ro.disconnect();
      io.disconnect();
      if (prog) gl.deleteProgram(prog);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return (
    <div ref={wrapRef} className={className} style={{ position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
