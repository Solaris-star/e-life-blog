'use client';

/**
 * SolarisGarden — 首页 Hero 右栏「数字花园」里的可交互像素角色 Solaris。
 *
 * 人形少女 ⇄ 小章鱼「章章」双形态(外神设定)。Canvas 2D + sprite sheet + rAF,
 * 自包含(无 worker / 无外部资源,满足站点 CSP)。仅 light 主题渲染;
 * prefers-reduced-motion 下定帧不动。素材与时序由 build_all.py 单一几何源产出,
 * 经 public/images/solaris/anim_manifest.json 加载。
 *
 * 行为依据:Blog Update Plan/首页故事脚本.md(§1 主线 7 拍 · §3 台词池 · §4 互动 · §5 状态机)。
 */

import { useEffect, useRef, useState } from 'react';
import styles from './SolarisGarden.module.css';

// ── 调参 ───────────────────────────────────────────────────────────────────
const MANIFEST_URL = '/images/solaris/anim_manifest.json';
const ASSET_BASE = '/images/solaris/';
const DPR_CAP = 2;
const CYCLE_DOZE_MS = 20000; // §4 久不动 → 打盹
const THOUGHT_HOLD_MS = 2600; // §2 思考停留后散开
const TYPE_MS = 46; // 逐字「盖章」间隔
const HOVER_COOLDOWN_MS = 11000; // 悬停彩蛋台词冷却
const EYE_FOLLOW = 5; // 人形眼神追随位移(168 空间像素)

// §1 主线循环:7 拍。morph 拍无 ms(播完即转);idle 拍按 ms 停留。
type Beat = { anim: string; ms?: number; say?: keyof typeof POOL };
const BEATS: Beat[] = [
  { anim: 'human_idle', ms: 5000 }, //              ① 待机(静)
  { anim: 'human_idle', ms: 4200, say: 'notice' }, // ② 察觉
  { anim: 'human_idle', ms: 6000, say: 'observe' }, // ③ 打量
  { anim: 'morph_to_octo', say: 'morph' }, //         ④ 变身
  { anim: 'octo_idle', ms: 6000, say: 'watch' }, //   ⑤ 守望
  { anim: 'morph_to_human' }, //                      ⑥ 变回(静)
  { anim: 'human_idle', ms: 4200, say: 'settle' }, // ⑦ 收束
];
const BEAT_TO_OCTO = 3; // 点击/强制:跳到「变身」拍
const BEAT_TO_HUMAN = 5; // 点击/强制:跳到「变回」拍
const BEAT_NOTICE = 1; // 打盹惊醒后回到「察觉」

// §3 台词轮换池(A 档「冷淡带暖」)
const POOL = {
  notice: ['……又有人闯进来了。', '脚步声。新的访客。', '唔,有人来了。'],
  observe: [
    '技术、生活、还有没说出口的念头——都埋在这座花园里。',
    '你在找什么?这里什么都有,又什么都没有。',
    '随便逛。能读懂多少,看你。',
  ],
  morph: ['这副样子……比较好藏。', '想看真正的我?……还太早。', '别被吓着,我本就不是「人」。'],
  watch: ['别紧张,我只是……看着。', '小一点,才钻得进字里行间。'],
  settle: ['慢慢看吧。反正我,等了很久了。', '我会在这儿,一直都在。', '看累了,就歇会儿。'],
  react: ['……别戳。', '很痒。', '还来?', '好啦好啦。'],
  doze: ['Zzz……'],
  hover: ['(盯——)'],
};

type AnimDef = { file: string; frames: number; fps: number; loop: boolean; cell: number };
type Loaded = { img: HTMLImageElement; n: number; fps: number; loop: boolean };

// 拍是否人形(用于判断当前形态)
const isHumanBeat = (i: number) => i === 0 || i === 1 || i === 2 || i === 6;
const isMorphBeat = (i: number) => i === BEAT_TO_OCTO || i === BEAT_TO_HUMAN;

function pickFrom(pool: readonly string[], lastRef: { v: string | null }): string {
  if (pool.length === 1) return pool[0];
  let t = pool[Math.floor(Math.random() * pool.length)];
  if (t === lastRef.v) t = pool[(pool.indexOf(t) + 1) % pool.length];
  lastRef.v = t;
  return t;
}

export default function SolarisGarden() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLight, setIsLight] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [thought, setThought] = useState<{ full: string; shown: string; on: boolean }>({
    full: '',
    shown: '',
    on: false,
  });

  // ── 主题门控:仅 light 渲染,跟随 blog-theme-change / storage / 系统主题 ──
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setIsLight(root.classList.contains('light'));
    read();
    // ThemeProvider 在切换时改 root class,但事件先于 class 落地,用 rAF 等一帧再读
    const onTheme = () => requestAnimationFrame(read);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    window.addEventListener('blog-theme-change', onTheme);
    window.addEventListener('storage', onTheme);
    mq.addEventListener('change', onTheme);
    // class 可能被 ThemeProvider 异步加上 → 观察 root class 变化兜底
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => {
      window.removeEventListener('blog-theme-change', onTheme);
      window.removeEventListener('storage', onTheme);
      mq.removeEventListener('change', onTheme);
      mo.disconnect();
    };
  }, []);

  // ── prefers-reduced-motion ──
  useEffect(() => {
    const rmq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(rmq.matches);
    on();
    rmq.addEventListener('change', on);
    return () => rmq.removeEventListener('change', on);
  }, []);

  // ── 引擎主体:加载 → 渲染循环 / 定帧 ──
  useEffect(() => {
    if (!isLight) return; // dark 不挂载 canvas
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctx2d = canvasEl.getContext('2d');
    if (!ctx2d) return;
    // narrow 后赋值给非 null const,闭包内可直接使用(TS 跨闭包不传递 narrowing)
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = ctx2d;

    let alive = true;
    let raf = 0;
    const anims: Record<string, Loaded> = {};
    let cell = 168;
    let cssW = 0; // CSS 像素边长(正方形舞台)

    // 思考飘字(逐字盖章 → 停留 → 散开)
    const lastSaid: Record<string, { v: string | null }> = {};
    let typeTimer: ReturnType<typeof setInterval> | null = null;
    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    function clearThoughtTimers() {
      if (typeTimer) clearInterval(typeTimer);
      if (holdTimer) clearTimeout(holdTimer);
      typeTimer = holdTimer = null;
    }
    function say(poolKey: keyof typeof POOL, persist = false) {
      const last = (lastSaid[poolKey] ??= { v: null });
      const text = pickFrom(POOL[poolKey], last);
      clearThoughtTimers();
      if (reduced) {
        setThought({ full: text, shown: text, on: true });
        return;
      }
      setThought({ full: text, shown: '', on: true });
      let i = 0;
      typeTimer = setInterval(() => {
        i += 1;
        setThought({ full: text, shown: text.slice(0, i), on: true });
        if (i >= text.length) {
          if (typeTimer) clearInterval(typeTimer);
          typeTimer = null;
          if (!persist) holdTimer = setTimeout(() => setThought((t) => ({ ...t, on: false })), THOUGHT_HOLD_MS);
        }
      }, TYPE_MS);
    }
    function hush() {
      clearThoughtTimers();
      setThought((t) => ({ ...t, on: false }));
    }

    // 机器状态
    const M = {
      beat: 0,
      frame: 0,
      frameAcc: 0, // 帧累积时间
      beatAcc: 0, // 拍累积时间
      dozing: false,
      lastMove: performance.now(),
      pointerInside: false,
      px: 0.5, // 指针在舞台内的归一化 x(0..1)
      hoverSaidAt: -1e9,
      paused: false,
    };

    function enterBeat(i: number) {
      M.beat = i;
      M.frame = 0;
      M.frameAcc = 0;
      M.beatAcc = 0;
      M.dozing = false;
      const b = BEATS[i];
      if (b.say) say(b.say);
      else if (!isMorphBeat(i)) hush();
    }

    function forceMorph() {
      if (isMorphBeat(M.beat) || M.dozing) {
        if (M.dozing) wake();
        return; // 变身中不接受输入(§5)
      }
      const toHuman = !isHumanBeat(M.beat); // 当前章鱼 → 变回人形
      enterBeat(toHuman ? BEAT_TO_HUMAN : BEAT_TO_OCTO);
      say('react'); // 反应词覆盖默认 morph 台词
    }

    function wake() {
      if (!M.dozing) return;
      M.dozing = false;
      enterBeat(BEAT_NOTICE);
    }

    function step(dt: number) {
      const b = BEATS[M.beat];
      const a = anims[b.anim];
      if (!a) return;
      const iv = 1000 / a.fps;
      M.frameAcc += dt;
      while (M.frameAcc >= iv) {
        M.frameAcc -= iv;
        if (!a.loop) {
          M.frame += 1;
          if (M.frame >= a.n) {
            // 变身/单次动画播完 → 进入下一拍
            enterBeat((M.beat + 1) % BEATS.length);
            return;
          }
        } else {
          M.frame = (M.frame + 1) % a.n;
        }
      }
      // 循环拍按时长推进
      if (a.loop && b.ms) {
        M.beatAcc += dt;
        if (M.beatAcc >= b.ms) enterBeat((M.beat + 1) % BEATS.length);
      }
    }

    function drawCell(animKey: string, frame: number, dx: number) {
      if (!ctx) return;
      const a = anims[animKey];
      if (!a) return;
      const f = Math.max(0, Math.min(a.n - 1, frame));
      ctx.clearRect(0, 0, cssW, cssW);
      ctx.drawImage(a.img, f * cell, 0, cell, cell, (dx / cell) * cssW, 0, cssW, cssW);
    }

    function render() {
      const b = BEATS[M.beat];
      if (M.dozing) {
        // 打盹:人形定在闭眼帧 / 章鱼缩成团
        if (isHumanBeat(M.beat)) drawCell('human_idle', 2, 0);
        else drawCell('octo_curl', 0, 0);
        return;
      }
      // §4 mouse-near:章鱼探头 / 人形眼神追随
      if (M.beat === 4 && M.pointerInside) {
        drawCell('octo_curious', 0, (M.px - 0.5) * EYE_FOLLOW * 2);
      } else if (isHumanBeat(M.beat) && M.pointerInside) {
        drawCell('human_idle', M.frame, (M.px - 0.5) * EYE_FOLLOW * 2);
      } else {
        drawCell(b.anim, M.frame, 0);
      }
    }

    // rAF 循环
    let lastT = performance.now();
    function loop(t: number) {
      if (!alive) return;
      const dt = Math.min(100, t - lastT);
      lastT = t;
      if (!M.paused) {
        if (!M.dozing && !isMorphBeat(M.beat) && t - M.lastMove > CYCLE_DOZE_MS) {
          M.dozing = true;
          say('doze', true);
        }
        if (!M.dozing) step(dt);
        render();
      }
      raf = requestAnimationFrame(loop);
    }

    // 指针互动
    function onPointerMove(e: PointerEvent) {
      M.lastMove = performance.now();
      if (M.dozing) wake();
      const r = canvas.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      M.pointerInside = inside;
      if (inside) {
        M.px = (e.clientX - r.left) / Math.max(1, r.width);
        // 悬停彩蛋:偶发「(盯——)」,带冷却
        if (performance.now() - M.hoverSaidAt > HOVER_COOLDOWN_MS && !isMorphBeat(M.beat) && Math.random() < 0.012) {
          M.hoverSaidAt = performance.now();
          say('hover');
        }
      }
    }
    function onClick() {
      forceMorph();
    }
    function onVis() {
      M.paused = document.hidden;
      if (!document.hidden) {
        lastT = performance.now();
        M.lastMove = performance.now(); // 回到前台不立刻判定打盹
      }
    }

    // DPR 尺寸
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const rect = canvas.getBoundingClientRect();
      cssW = rect.width || 240;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssW * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
    const ro = new ResizeObserver(() => resize());

    // 离屏暂停
    const io = new IntersectionObserver(
      (ents) => {
        const vis = ents[0]?.isIntersecting ?? true;
        M.paused = !vis || document.hidden;
        if (vis) {
          lastT = performance.now();
          M.lastMove = performance.now();
        }
      },
      { threshold: 0.01 }
    );

    // 加载 manifest → 预载所有 sheet → 启动
    fetch(MANIFEST_URL)
      .then((r) => r.json())
      .then((mani: Record<string, AnimDef>) => {
        if (!alive) return;
        const keys = Object.keys(mani);
        cell = mani[keys[0]]?.cell ?? 168;
        let pending = keys.length;
        keys.forEach((k) => {
          const def = mani[k];
          const img = new Image();
          img.onload = () => {
            anims[k] = { img, n: def.frames, fps: def.fps, loop: def.loop };
            pending -= 1;
            if (pending === 0 && alive) start();
          };
          img.onerror = () => {
            pending -= 1;
            if (pending === 0 && alive) start();
          };
          img.src = ASSET_BASE + def.file;
        });
      })
      .catch(() => {});

    function start() {
      if (!anims['human_idle']) return; // 核心帧缺失则不启动
      resize();
      ro.observe(canvas);
      io.observe(canvas);
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      canvas.addEventListener('click', onClick);
      document.addEventListener('visibilitychange', onVis);
      enterBeat(0);
      if (reduced) {
        // 定帧:人形站立 + 一句静态独白
        drawCell('human_idle', 0, 0);
        say('observe');
        return; // 不进 rAF
      }
      lastT = performance.now();
      M.lastMove = performance.now();
      raf = requestAnimationFrame(loop);
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearThoughtTimers();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [isLight, reduced]);

  if (!isLight) return null; // 仅 light 主题出现

  return (
    <div className={styles.stage}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={`${styles.thought} ${thought.on ? styles.thoughtOn : ''}`} aria-hidden="true">
        <span className={styles.thoughtText}>「{thought.shown}」</span>
        <span className={styles.dots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}
