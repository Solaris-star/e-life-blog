"use client";

/**
 * GardenStage — 全站像素角色舞台（全局角色层）
 *
 * 渲染 Solaris + 哥哥猫 + 弟弟猫三个角色，基于 Canvas 2D + rAF。
 * 根据当前路由决定显示哪个场景的角色组合。
 * 仅 light 主题渲染；reduced-motion 定帧；移动端静态。
 *
 * 素材按需加载（只加载当前场景需要的 spritesheet）。
 * 场景背景分层：远/中/近三层独立图片 + CSS 动态层（花瓣/灰尘等）。
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useGarden, type PageId } from "./GardenNarrativeContext";
import styles from "./GardenStage.module.css";

const ASSET_BASE = "/images/solaris/";
const SCENE_BASE = "/images/solaris/scenes/";
const DPR_CAP = 1.5;
const CYCLE_DOZE_MS = 20000;
const THOUGHT_HOLD_MS = 2600;
const TYPE_MS = 46;
const HOVER_COOLDOWN_MS = 11000;
const EYE_FOLLOW = 4;

type Loaded = { img: HTMLImageElement; n: number; fps: number; loop: boolean };

export default function GardenStage({ page }: { page: PageId }) {
  const garden = useGarden();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLight, setIsLight] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [thought, setThought] = useState<{ full: string; shown: string; on: boolean }>({
    full: "",
    shown: "",
    on: false,
  });

  // Visit page on mount
  useEffect(() => {
    garden.visitPage(page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setIsLight(root.classList.contains("light"));
    read();
    const onTheme = () => requestAnimationFrame(read);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("blog-theme-change", onTheme);
    window.addEventListener("storage", onTheme);
    mq.addEventListener("change", onTheme);
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => {
      window.removeEventListener("blog-theme-change", onTheme);
      window.removeEventListener("storage", onTheme);
      mq.removeEventListener("change", onTheme);
      mo.disconnect();
    };
  }, []);

  // Reduced motion
  useEffect(() => {
    const rmq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(rmq.matches);
    on();
    rmq.addEventListener("change", on);
    return () => rmq.removeEventListener("change", on);
  }, []);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!isLight) return null;

  const action = garden.getCurrentSceneAction(page);

  return (
    <div className={styles.stageWrap} data-page={page} data-mobile={isMobile}>
      {/* Layered scene background */}
      <SceneBackground page={page} reduced={reduced} />

      {/* Character canvas */}
      {!isMobile && (
        <CharacterCanvas
          ref={canvasRef}
          page={page}
          action={action}
          reduced={reduced}
          thought={thought}
          setThought={setThought}
          garden={garden}
        />
      )}

      {/* Mobile static frame */}
      {isMobile && <MobileStaticFrame page={page} action={action} />}

      {/* Thought bubble */}
      {thought.on && (
        <div className={`${styles.thought} ${styles.thoughtOn}`} aria-hidden="true">
          <span className={styles.thoughtText}>「{thought.shown}」</span>
          <span className={styles.dots} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      )}
    </div>
  );
}

import { forwardRef } from "react";

interface CharacterCanvasProps {
  page: PageId;
  action: import("./GardenNarrativeContext").SceneAction;
  reduced: boolean;
  thought: { full: string; shown: string; on: boolean };
  setThought: React.Dispatch<React.SetStateAction<{ full: string; shown: string; on: boolean }>>;
  garden: ReturnType<typeof useGarden>;
}

const CharacterCanvas = forwardRef<HTMLCanvasElement, CharacterCanvasProps>(function CharacterCanvas(
  { page, action, reduced, setThought, garden },
  ref
) {
  const canvasRef = ref as React.RefObject<HTMLCanvasElement | null>;
  const [loaded, setLoaded] = useState<Record<string, Loaded>>({});
  const [sceneReady, setSceneReady] = useState(false);

  // Determine which assets this scene needs
  const neededAssets = useCallback(() => {
    const keys = new Set<string>([action.solarisAnim]);
    if (action.brotherCatVisible && action.brotherCatAnim) keys.add(action.brotherCatAnim);
    if (action.youngerCatVisible && action.youngerCatAnim) keys.add(action.youngerCatAnim);
    return Array.from(keys);
  }, [action]);

  // Load assets for current scene
  useEffect(() => {
    let alive = true;
    setSceneReady(false);

    async function loadManifest() {
      try {
        const resp = await fetch(ASSET_BASE + "anim_manifest.json");
        const manifest = await resp.json();
        const keys = neededAssets();
        const toLoad = keys.filter((k) => !loaded[k]);

        if (toLoad.length === 0) {
          if (alive) setSceneReady(true);
          return;
        }

        let pending = toLoad.length;
        const newLoaded: Record<string, Loaded> = {};
        toLoad.forEach((k) => {
          const def = manifest[k];
          if (!def) {
            pending -= 1;
            if (pending === 0 && alive) {
              setLoaded((prev) => ({ ...prev, ...newLoaded }));
              setSceneReady(true);
            }
            return;
          }
          const img = new Image();
          img.onload = () => {
            newLoaded[k] = { img, n: def.frames, fps: def.fps, loop: def.loop };
            pending -= 1;
            if (pending === 0 && alive) {
              setLoaded((prev) => ({ ...prev, ...newLoaded }));
              setSceneReady(true);
            }
          };
          img.onerror = () => {
            pending -= 1;
            if (pending === 0 && alive) {
              setLoaded((prev) => ({ ...prev, ...newLoaded }));
              setSceneReady(true);
            }
          };
          img.src = ASSET_BASE + def.file;
        });
      } catch {
        if (alive) setSceneReady(true);
      }
    }

    loadManifest();
    return () => {
      alive = false;
    };
  }, [neededAssets]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animation engine
  useEffect(() => {
    if (!sceneReady || reduced) return;
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctx2d = canvasEl.getContext("2d");
    if (!ctx2d) return;
    // narrow 后赋值给非 null const,闭包内可直接使用
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = ctx2d;

    let alive = true;
    let raf = 0;
    let cellSolaris = 120;
    let cellCatA = 120;
    let cellCatB = 120;
    let cssW = 0;
    let cssH = 0;

    const M = {
      solarisFrame: 0,
      solarisAcc: 0,
      brotherFrame: 0,
      brotherAcc: 0,
      youngerFrame: 0,
      youngerAcc: 0,
      lastMove: performance.now(),
      pointerInside: false,
      px: 0.5,
      dozing: false,
      paused: false,
    };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const rect = canvas.getBoundingClientRect();
      cssW = rect.width || 320;
      cssH = rect.height || 200;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }

    function drawSprite(
      key: string,
      frame: number,
      dx: number,
      dy: number,
      scale: number,
      cell: number
    ) {
      const a = loaded[key];
      if (!a) return;
      const f = Math.max(0, Math.min(a.n - 1, frame));
      const drawW = cell * scale;
      const drawH = cell * scale;
      // Draw contact shadow at feet (more visible)
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath();
      ctx.ellipse(dx + drawW / 2, dy + drawH - 2, drawW * 0.4, drawH * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Draw sprite with pixelated rendering
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(a.img, f * cell, 0, cell, cell, dx, dy, drawW, drawH);
      ctx.imageSmoothingEnabled = true;
    }

    function step(dt: number) {
      // Advance Solaris animation
      const sa = loaded[action.solarisAnim];
      if (sa && sa.loop) {
        const iv = 1000 / sa.fps;
        M.solarisAcc += dt;
        while (M.solarisAcc >= iv) {
          M.solarisAcc -= iv;
          M.solarisFrame = (M.solarisFrame + 1) % sa.n;
        }
      }
      // Brother cat
      if (action.brotherCatVisible && action.brotherCatAnim) {
        const ba = loaded[action.brotherCatAnim];
        if (ba && ba.loop) {
          const iv = 1000 / ba.fps;
          M.brotherAcc += dt;
          while (M.brotherAcc >= iv) {
            M.brotherAcc -= iv;
            M.brotherFrame = (M.brotherFrame + 1) % ba.n;
          }
        }
      }
      // Younger cat
      if (action.youngerCatVisible && action.youngerCatAnim) {
        const ya = loaded[action.youngerCatAnim];
        if (ya && ya.loop) {
          const iv = 1000 / ya.fps;
          M.youngerAcc += dt;
          while (M.youngerAcc >= iv) {
            M.youngerAcc -= iv;
            M.youngerFrame = (M.youngerFrame + 1) % ya.n;
          }
        }
      }
    }

    function render() {
      ctx.clearRect(0, 0, cssW, cssH);
      // Solaris — 歧路旅人比例:角色约占场景高度 1/3,站在路径上
      const solScale = Math.min(cssH, cssW) / 360; // 动态缩放,适配场景
      const solW = cellSolaris * solScale;
      const solH = cellSolaris * solScale;
      const solX = cssW * 0.42 - solW / 2;
      const solY = cssH * 0.62 - solH / 2; // 脚踩在路径上
      drawSprite(action.solarisAnim, M.solarisFrame, solX, solY, solScale, cellSolaris);

      // Brother cat (高处或趴卧)
      if (action.brotherCatVisible && action.brotherCatAnim) {
        const bScale = solScale * 0.85;
        const bW = cellCatA * bScale;
        const bH = cellCatA * bScale;
        const bX = cssW * 0.72 - bW / 2;
        const bY = cssH * 0.15 - bH / 2; // 高处
        drawSprite(action.brotherCatAnim, M.brotherFrame, bX, bY, bScale, cellCatA);
      }

      // Younger cat (地面,游荡)
      if (action.youngerCatVisible && action.youngerCatAnim) {
        const yScale = solScale * 0.9;
        const yW = cellCatB * yScale;
        const yH = cellCatB * yScale;
        const yX = cssW * 0.18 - yW / 2;
        const yY = cssH * 0.68 - yH / 2; // 地面
        drawSprite(action.youngerCatAnim, M.youngerFrame, yX, yY, yScale, cellCatB);
      }
    }

    let lastT = performance.now();
    function loop(t: number) {
      if (!alive) return;
      const dt = Math.min(100, t - lastT);
      lastT = t;
      if (!M.paused) {
        step(dt);
        render();
      }
      raf = requestAnimationFrame(loop);
    }

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    const io = new IntersectionObserver(
      (ents) => {
        const vis = ents[0]?.isIntersecting ?? true;
        M.paused = !vis || document.hidden;
        if (vis) lastT = performance.now();
      },
      { threshold: 0.01 }
    );
    io.observe(canvas);

    // Pointer interaction
    function onPointerMove(e: PointerEvent) {
      M.lastMove = performance.now();
      const r = canvas.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      M.pointerInside = inside;
      if (inside) M.px = (e.clientX - r.left) / Math.max(1, r.width);
    }
    function onClick() {
      const triggered = garden.registerClick();
      if (triggered) garden.triggerOctopus();
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("click", onClick);

    raf = requestAnimationFrame(loop);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("click", onClick);
    };
  }, [sceneReady, action, reduced, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Thought bubble — independent effect, only re-triggers on say text change
  useEffect(() => {
    if (!action.solarisSay || reduced) {
      setThought((t) => ({ ...t, on: false }));
      return;
    }
    const text = action.solarisSay;
    setThought({ full: text, shown: "", on: true });
    let i = 0;
    let typeTimer: ReturnType<typeof setInterval> | null = null;
    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    typeTimer = setInterval(() => {
      i += 1;
      setThought((t) => ({ ...t, shown: t.full.slice(0, i) }));
      if (i >= text.length) {
        if (typeTimer) clearInterval(typeTimer);
        typeTimer = null;
        holdTimer = setTimeout(() => setThought((t) => ({ ...t, on: false })), THOUGHT_HOLD_MS);
      }
    }, TYPE_MS);
    return () => {
      if (typeTimer) clearInterval(typeTimer);
      if (holdTimer) clearTimeout(holdTimer);
    };
  }, [action.solarisSay, reduced]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
});

function SceneBackground({ page, reduced }: { page: PageId; reduced: boolean }) {
  const sceneNum = { home: 1, articles: 2, daily: 3, resources: 4, writing: 5 }[page];
  return (
    <div className={styles.sceneBg} aria-hidden="true">
      <img src={`${SCENE_BASE}scene${sceneNum}.png`} alt="" className={styles.sceneImg} />
      {/* Dynamic atmosphere layer (CSS animated) */}
      <div className={`${styles.atmosphere} ${styles[`scene${sceneNum}Atm`]}`} data-reduced={reduced} />
    </div>
  );
}

function MobileStaticFrame({
  page,
  action,
}: {
  page: PageId;
  action: import("./GardenNarrativeContext").SceneAction;
}) {
  const sceneNum = { home: 1, articles: 2, daily: 3, resources: 4, writing: 5 }[page];
  return (
    <div className={styles.mobileFrame}>
      <img src={`${SCENE_BASE}scene${sceneNum}_far.png`} alt="" className={styles.mobileBg} />
      <img src={`${ASSET_BASE}anim_${action.solarisAnim}.png`} alt="" className={styles.mobileChar} />
    </div>
  );
}
