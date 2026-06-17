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
import { usePathname } from "next/navigation";
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

const PAGE_MAP: Record<string, PageId> = {
  "/": "home",
  "/articles": "articles",
  "/daily": "daily",
  "/resources": "resources",
  "/writing": "writing",
};

function resolvePage(pathname: string): PageId | null {
  if (pathname === "/") return "home";
  for (const [route, page] of Object.entries(PAGE_MAP)) {
    if (pathname.startsWith(route)) return page;
  }
  return null;
}

export default function GardenStage() {
  const pathname = usePathname();
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

  const page = resolvePage(pathname);

  // Theme detection
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

  // Visit page on route change
  useEffect(() => {
    if (page) garden.visitPage(page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!page || !isLight) return null;

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
    let cellCatA = 100;
    let cellCatB = 110;
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
      ctx.drawImage(a.img, f * cell, 0, cell, cell, dx, dy, drawW, drawH);
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
      // Solaris position (center-ish, varies by page)
      const solScale = 0.8;
      const solX = cssW * 0.45 - (cellSolaris * solScale) / 2;
      const solY = cssH * 0.55;
      drawSprite(action.solarisAnim, M.solarisFrame, solX, solY, solScale, cellSolaris);

      // Brother cat (high position or loaf)
      if (action.brotherCatVisible && action.brotherCatAnim) {
        const bScale = 0.7;
        const bX = cssW * 0.75 - (cellCatA * bScale) / 2;
        const bY = cssH * 0.2; // high up
        drawSprite(action.brotherCatAnim, M.brotherFrame, bX, bY, bScale, cellCatA);
      }

      // Younger cat (ground level, wandering)
      if (action.youngerCatVisible && action.youngerCatAnim) {
        const yScale = 0.75;
        const yX = cssW * 0.2 - (cellCatB * yScale) / 2;
        const yY = cssH * 0.6;
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

    // Show thought if available
    if (action.solarisSay) {
      setThought({ full: action.solarisSay, shown: "", on: true });
      let i = 0;
      const typeTimer = setInterval(() => {
        i += 1;
        setThought((t) => ({ ...t, shown: t.full.slice(0, i) }));
        if (i >= action.solarisSay!.length) {
          clearInterval(typeTimer);
          setTimeout(() => setThought((t) => ({ ...t, on: false })), THOUGHT_HOLD_MS);
        }
      }, TYPE_MS);
    }

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

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
});

function SceneBackground({ page, reduced }: { page: PageId; reduced: boolean }) {
  const sceneNum = { home: 1, articles: 2, daily: 3, resources: 4, writing: 5 }[page];
  return (
    <div className={styles.sceneBg} aria-hidden="true">
      <img src={`${SCENE_BASE}scene${sceneNum}_far.png`} alt="" className={styles.layerFar} />
      <img src={`${SCENE_BASE}scene${sceneNum}_mid.png`} alt="" className={styles.layerMid} />
      <img src={`${SCENE_BASE}scene${sceneNum}_near.png`} alt="" className={styles.layerNear} />
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
