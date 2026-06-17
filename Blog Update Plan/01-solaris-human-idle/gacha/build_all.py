#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
统一构建 — 单一几何源,一次产出首页 Solaris 全部动画段 + manifest + 验证条。

合并自:
  build_unified.py     (human_idle / octo_idle 程序化呼吸)
  build_portal_morph.py(符文环传送门变身,取代旧的"一团光闪"交叉淡入)

关键修复:idle 与 morph 共用同一条地面线 GROUND(旧版 0.92 vs 0.80 不一致 → 切换跳帧)。
所有段都把人形脚底锚在 GROUND、传送门椭圆压在 GROUND、章鱼浮在 OCTO_CY,保证
human_idle ↔ morph ↔ octo_idle 首尾姿态严格对齐,可无缝循环。

产出(gacha/):
  anim_human_idle.png       人形 idle 呼吸 8f @8
  anim_octo_idle.png        章鱼 idle 漂浮 6f @6
  anim_morph_to_octo.png    人形→章鱼 传送门变身 16f @12 (loop:false)
  anim_morph_to_human.png   章鱼→人形 传送门变身 16f @12 (loop:false)
  anim_manifest.json        状态机依据(state 名对齐 首页故事脚本.md §5)
  loop_strip.png            全循环验证条
"""
import sys, json, math; sys.path.insert(0, ".")
from make_breathing import cut_background, warp_x
from PIL import Image
import numpy as np

# ---------------- 单一几何源 ----------------
WS      = 420
CELL    = 168
GROUND  = int(0.82 * WS)     # 地面线:人形脚底 + 传送门椭圆中心(idle/morph 共用)
CX      = WS // 2
HUMAN_H = 0.80               # 人形高度占比
OCTO_H  = 0.42               # 章鱼高度占比
OCTO_CY = int(0.50 * WS)     # 章鱼漂浮中心(idle 与 morph 升起终点)

PORT = Image.open("gacha/portal_rune.png").convert("RGBA")   # 金色符文环传送门(自带透明底)


def blank(): return Image.new("RGBA", (WS, WS), (0, 0, 0, 0))

def bbox(fn):
    ch = cut_background(Image.open(fn).convert("RGB")); a = np.array(ch)[:, :, 3]
    ys, xs = np.where(a > 8); return ch.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))

def scaled(ch, hf):
    s = (hf * WS) / ch.height
    return ch.resize((round(ch.width * s), round(ch.height * s)), Image.LANCZOS)

def lay_feet(sp, fy):   # 精灵底边落在 fy
    c = blank(); c.alpha_composite(sp, ((WS - sp.width) // 2, int(fy - sp.height))); return c

def lay_cen(sp, cy):    # 精灵中心落在 cy
    c = blank(); c.alpha_composite(sp, ((WS - sp.width) // 2, int(cy - sp.height / 2))); return c

def clip_above(layer, surf=GROUND, feather=7):   # 只保留 surf 线以上 → 沉入地面效果
    arr = np.array(layer).astype(float); ys = np.arange(WS)
    m = np.clip((surf - ys) / feather, 0, 1); arr[:, :, 3] *= m[:, None]
    return Image.fromarray(arr.astype(np.uint8))

def sm(x): x = max(0, min(1, x)); return x * x * (3 - 2 * x)

# ---------------- idle 用:横摆位移场 ----------------
_xs   = np.arange(WS)
emask = np.clip((np.abs(_xs - CX) / (WS / 2) - 0.24) / 0.76, 0, 1) ** 1.3
vramp = np.clip((_xs - 0.50 * WS) / (0.50 * WS), 0, 1) ** 1.5
def sway(canvas, amp):
    return Image.fromarray(warp_x(np.array(canvas), amp * np.outer(vramp, emask)))

# ---------------- 素材(bbox 裁紧 + 缩放) ----------------
H_open  = scaled(bbox("frame_01_raw.png"),     HUMAN_H)
H_blink = scaled(bbox("gacha/identity_test.png"), HUMAN_H)
O_open  = scaled(bbox("gacha/octo_idle.png"),  OCTO_H)
O_blink = scaled(bbox("gacha/octo_blink.png"), OCTO_H)


# ================= idle 段 =================
def human_idle():
    out = []
    for i in range(8):
        sink = (1 - math.cos(2 * math.pi * i / 8)) / 2
        sy = 1 - 0.032 * sink; sx = 1 + 0.013 * sink
        base = H_blink if i in (2, 6) else H_open
        c = lay_feet(base, GROUND)
        nw, nh = round(WS * sx), round(WS * sy)
        c = c.resize((nw, nh), Image.LANCZOS)
        f = blank(); f.alpha_composite(c, (round((WS - nw) / 2), round(GROUND - GROUND * sy)))
        out.append(sway(f, 0.012 * WS * math.sin(2 * math.pi * i / 8 + math.pi / 2)))
    return out

def octo_idle():
    out = []
    for i in range(6):
        ph = 2 * math.pi * i / 6; bob = round(0.05 * WS * math.sin(ph))
        base = O_blink if i == 3 else O_open
        f = lay_cen(base, OCTO_CY + bob)
        out.append(sway(f, 0.012 * WS * math.sin(ph + math.pi / 2)))
    return out


# ================= 传送门变身段 =================
OPEN, SINK, MID, RISE, CLOSE = 3, 4, 2, 4, 3
NM = OPEN + SINK + MID + RISE + CLOSE   # 16

def portal(scale, angle):
    if scale <= 0.02: return blank()
    rot = PORT.rotate(angle, resample=Image.BICUBIC, expand=False)
    pw = max(2, int(0.78 * WS * scale)); ph = max(2, int(0.30 * WS * scale))
    pe = rot.resize((pw, ph), Image.LANCZOS)
    c = blank(); c.alpha_composite(pe, ((WS - pw) // 2, int(GROUND - ph / 2))); return c

def morph(direction):
    """direction: 'to_octo' (人沉→章鱼起) | 'to_human' (章鱼沉→人起)。"""
    Hs, Os = H_open, O_open
    H_rest = lay_feet(Hs, GROUND)                       # 人形站定(脚=GROUND)
    O_rest = lay_cen(Os, OCTO_CY)                       # 章鱼漂浮(中心=OCTO_CY)
    H_deep = GROUND + Hs.height                          # 人形全沉(脚远在地下)
    O_deep = GROUND + Os.height * 0.7                    # 章鱼全沉(中心入门)
    frames = []
    for i in range(NM):
        ang = i * 20; ps = 1.0; hl = ol = None
        if i < OPEN:                                     # 开门 + 静态起始姿
            ps = sm((i + 1) / OPEN)
            if direction == "to_octo": hl = H_rest
            else:                      ol = O_rest
        elif i < OPEN + SINK:                            # 下沉:起始角色沉入门
            p = (i - OPEN + 1) / SINK
            if direction == "to_octo":
                hl = clip_above(lay_feet(Hs, GROUND + sm(p) * (H_deep - GROUND)))
            else:
                ol = clip_above(lay_cen(Os, OCTO_CY + sm(p) * (O_deep - OCTO_CY)))
        elif i < OPEN + SINK + MID:                      # 水下切换(只剩门)
            pass
        elif i < OPEN + SINK + MID + RISE:               # 升起:目标角色从门浮出
            p = (i - (OPEN + SINK + MID) + 1) / RISE
            if direction == "to_octo":
                cy = O_deep - sm(p) * (O_deep - OCTO_CY)
                ol = clip_above(lay_cen(Os, cy))
            else:
                fy = H_deep - sm(p) * (H_deep - GROUND)
                hl = clip_above(lay_feet(Hs, fy))
        else:                                            # 关门 + 静态终止姿
            p = (i - (OPEN + SINK + MID + RISE) + 1) / CLOSE; ps = 1 - sm(p)
            if direction == "to_octo": ol = O_rest
            else:                      hl = H_rest
        f = blank()
        f.alpha_composite(portal(ps, ang))               # 门(洞)在身后
        if hl: f.alpha_composite(hl)
        if ol: f.alpha_composite(ol)
        frames.append(f)
    return frames


# ================= 交互姿态(单帧,与 octo_idle 同几何,供 §4 互动) =================
def pose_octo(fn):
    """章鱼单帧姿态,中心锚在 OCTO_CY,与 octo_idle 对齐 → 可直接切入/切出。"""
    return [lay_cen(scaled(bbox(fn), OCTO_H), OCTO_CY)]


# ================= 打包 =================
def pack(frames, name, fps, loop):
    sheet = Image.new("RGBA", (CELL * len(frames), CELL), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.paste(f.resize((CELL, CELL), Image.LANCZOS), (i * CELL, 0))
    sheet.save(f"gacha/anim_{name}.png")
    return {"file": f"anim_{name}.png", "frames": len(frames), "fps": fps, "loop": loop, "cell": CELL}

hi  = human_idle()
oi  = octo_idle()
m2o = morph("to_octo")
m2h = morph("to_human")

manifest = {
    "human_idle":     pack(hi,  "human_idle",     8,  True),
    "octo_idle":      pack(oi,  "octo_idle",      6,  True),
    "morph_to_octo":  pack(m2o, "morph_to_octo",  12, False),
    "morph_to_human": pack(m2h, "morph_to_human", 12, False),
    "octo_curious":   pack(pose_octo("gacha/octo_curious.png"), "octo_curious", 1, False),  # hover 探头
    "octo_curl":      pack(pose_octo("gacha/octo_curl.png"),    "octo_curl",    1, False),  # 受惊/缩团
}
json.dump(manifest, open("gacha/anim_manifest.json", "w"), ensure_ascii=False, indent=2)

# 全循环验证条:idle(f1,f4) → 变章鱼16 → 章鱼idle(f1,f4) → 变人16 → 回到 idle f1
seq = [hi[0], hi[4]] + m2o + [oi[0], oi[3]] + m2h + [hi[0]]
PV = 110
strip = Image.new("RGB", (PV * len(seq), PV), (243, 229, 207))
for i, f in enumerate(seq):
    th = f.resize((PV, PV), Image.LANCZOS); strip.paste(th, (i * PV, 0), th)
strip.save("gacha/loop_strip.png")
print(f"OK  human_idle:8  octo_idle:6  morph_to_octo:{NM}  morph_to_human:{NM}  (GROUND={GROUND})")
print(f"loop_strip: {strip.size}, {len(seq)} cells")
