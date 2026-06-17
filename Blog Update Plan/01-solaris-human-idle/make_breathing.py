#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
方案 1 — 从单张基准帧 frame_01_raw.png 程序化派生 idle 呼吸动画(grounded 版)。

修复:旧版整体下沉 + 下半身横摆 → 看着像"悬空晃腿"。
现在:
  - 脚永远钉在地面(无整体平移),呼吸 = 以脚为锚的躯干纵向挤压(吸气时肩头微沉)。
  - 横摆是 2D 位移场:中央腿部死区为 0,只有两侧触手尖 / 鬓发轻飘。
  - 眨眼泛化为"眼睑覆盖度" coverage:0=睁 / 0.45=半垂(待机) / 1.0=闭。

输出:
  frame_01..08.png        idle 呼吸 8 帧(睁眼 + 帧3/帧7 眨眼),CELL×CELL 透明底
  spritesheet.png         CELL*8 × CELL
  preview-sheet.png       暖纸底高清拼图
  eyestate-open/half/closed.png  三种眼态对照(供故事引擎按拍切换)
"""
import math
import numpy as np
from PIL import Image, ImageDraw

# ---------------- 配置 ----------------
SRC   = "frame_01_raw.png"
CELL  = 128
WS    = 560
N     = 8
FPS   = 8

FEET_FRAC   = 0.955
CHAR_HFRAC  = 0.86
SQUASH_MAX  = 0.032   # 吸气时躯干纵向压缩(脚锚定 → 肩头下沉感)
SQUASH_XCMP = 0.40    # 横向体积补偿
SWAY_MAX    = 0.013   # 触手尖/鬓发横摆幅度(占 WS)
SWAY_VSTART = 0.50    # 纵向:此线以下才摆
SWAY_VPOW   = 1.5
EDGE_DEAD   = 0.24    # 横向:中央 ±24% 死区(腿/身/脸不摆)
EDGE_POW    = 1.3
SWAY_PHASE  = math.pi / 2
BLINK_FRAMES = {2, 6}            # 0-based → 帧3、帧7

L_EYE = (508, 435, 602, 500)
R_EYE = (662, 437, 746, 503)
SKIN_MAIN   = (239, 227, 220)
SKIN_CREASE = (214, 203, 199)
LASH        = (16, 12, 22)


# ---------------- 1. 去白底 → 透明 ----------------
def cut_background(img_rgb, thresh=82):
    rgba = img_rgb.convert("RGBA")
    W, H = rgba.size
    SENT = (0, 255, 1)
    flood = rgba.convert("RGB")
    px = flood.load()
    step = 24
    seeds = [(x, 0) for x in range(0, W, step)] + [(x, H - 1) for x in range(0, W, step)] \
          + [(0, y) for y in range(0, H, step)] + [(W - 1, y) for y in range(0, H, step)]
    for sx, sy in seeds:
        r, g, b = px[sx, sy][:3]
        if r > 200 and g > 200 and b > 200:
            ImageDraw.floodfill(flood, (sx, sy), SENT, thresh=thresh)
    arr = np.array(flood)
    bg = (arr[:, :, 0] == SENT[0]) & (arr[:, :, 1] == SENT[1]) & (arr[:, :, 2] == SENT[2])
    out = np.array(rgba)
    out[:, :, 3] = np.where(bg, 0, 255).astype(np.uint8)
    a = out[:, :, 3]
    trans = a == 0
    neigh = np.zeros_like(trans)
    neigh[1:, :] |= trans[:-1, :]; neigh[:-1, :] |= trans[1:, :]
    neigh[:, 1:] |= trans[:, :-1]; neigh[:, :-1] |= trans[:, 1:]
    light = out[:, :, :3].sum(2) > 600
    out[:, :, 3] = np.where(neigh & light & ~trans, 120, out[:, :, 3]).astype(np.uint8)
    return Image.fromarray(out)


# ---------------- 2. 眼睑覆盖(统一 睁/半垂/闭) ----------------
def paint_lids(char_rgba, coverage):
    """coverage: 0=睁(不动) / 0.45=半垂 / 1.0=闭。眼睑自上而下盖住覆盖比例,睫毛线落在眼睑下沿。"""
    if coverage <= 0:
        return char_rgba.copy()
    im = char_rgba.copy()
    arr = np.array(im)
    for (x0, y0, x1, y1) in (L_EYE, R_EYE):
        h = y1 - y0
        lid_bottom = y0 + int(round(h * coverage))
        box = arr[y0:lid_bottom, x0:x1]
        if box.size:
            rgb = box[:, :, :3].astype(int)
            bright = rgb.sum(2)
            blue = (rgb[:, :, 2] - rgb[:, :, 0] > 12)
            eye = (bright > 250) | blue
            hh = box.shape[0]
            for j in range(hh):
                t = j / max(hh - 1, 1)
                col = tuple(int(SKIN_CREASE[k] * (1 - t) + SKIN_MAIN[k] * t) for k in range(3))
                row = eye[j]
                box[j, row, 0] = col[0]; box[j, row, 1] = col[1]; box[j, row, 2] = col[2]
                box[j, row, 3] = 255
            arr[y0:lid_bottom, x0:x1] = box
    im = Image.fromarray(arr)
    d = ImageDraw.Draw(im)
    for (x0, y0, x1, y1) in (L_EYE, R_EYE):
        w = x1 - x0; h = y1 - y0
        lash_y = y0 + h * coverage
        arc = h * 0.14
        th = max(5, int(h * 0.13))
        pts = [(x0 + s, lash_y + arc * math.sin(math.pi * s / w)) for s in range(0, w + 1, 3)]
        d.line(pts, fill=LASH + (255,), width=th, joint="curve")
    return im


# ---------------- 3. 装入工作画布(脚底锚定、水平居中) ----------------
def fit_canvas(char_rgba):
    a = np.array(char_rgba)[:, :, 3]
    ys, xs = np.where(a > 8)
    char = char_rgba.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    cw, ch = char.size
    s = (CHAR_HFRAC * WS) / ch
    nw, nh = max(1, round(cw * s)), max(1, round(ch * s))
    char = char.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (WS, WS), (0, 0, 0, 0))
    feet_y = int(FEET_FRAC * WS)
    canvas.alpha_composite(char, ((WS - nw) // 2, feet_y - nh))
    return canvas, feet_y


# ---------------- 4. 2D 水平位移场(亚像素双线性) ----------------
def warp_x(arr, dx):
    H, W = arr.shape[:2]
    xs = np.arange(W)[None, :].astype(np.float64)
    srcx = xs - dx
    x0 = np.floor(srcx).astype(int)
    wx = (srcx - x0)[:, :, None]
    out = np.zeros_like(arr, dtype=np.float64)
    ys = np.arange(H)[:, None]
    for off, wgt in ((0, 1 - wx), (1, wx)):
        idx = x0 + off
        sx = np.clip(idx, 0, W - 1)
        sample = arr[ys, sx].astype(np.float64)
        sample[(idx < 0) | (idx >= W)] = 0
        out += sample * wgt
    return out.astype(np.uint8)


# ---------------- 5. 单帧呼吸变换(grounded) ----------------
_xs = np.arange(WS)
_emask = np.clip((np.abs(_xs - WS / 2) / (WS / 2) - EDGE_DEAD) / (1 - EDGE_DEAD), 0, 1) ** EDGE_POW
_vramp = np.clip((_xs - SWAY_VSTART * WS) / ((1 - SWAY_VSTART) * WS), 0, 1) ** SWAY_VPOW

def make_frame(base_canvas, feet_y, i):
    phase = 2 * math.pi * i / N
    sink = (1 - math.cos(phase)) / 2
    sy = 1 - SQUASH_MAX * sink
    sx = 1 + SQUASH_MAX * SQUASH_XCMP * sink

    nw, nh = round(WS * sx), round(WS * sy)
    scaled = base_canvas.resize((nw, nh), Image.LANCZOS)
    frame = Image.new("RGBA", (WS, WS), (0, 0, 0, 0))
    oy = round(feet_y - feet_y * sy)        # 脚锚定,无整体下沉
    frame.alpha_composite(scaled, (round((WS - nw) / 2), oy))

    # 2D 横摆:dx(x,y) = 幅度 · sin · 纵向ramp(y) · 横向死区mask(x)
    amp = SWAY_MAX * WS * math.sin(phase + SWAY_PHASE)
    dx = amp * np.outer(_vramp, _emask)     # WS×WS
    return Image.fromarray(warp_x(np.array(frame), dx))


# ---------------- 主流程 ----------------
def main():
    src = Image.open(SRC).convert("RGB")
    char = cut_background(src)
    base_open, feet_y = fit_canvas(char)
    base_blink, _ = fit_canvas(paint_lids(char, 1.0))

    frames = []
    for i in range(N):
        base = base_blink if i in BLINK_FRAMES else base_open
        frames.append(make_frame(base, feet_y, i).resize((CELL, CELL), Image.LANCZOS))

    for i, f in enumerate(frames, 1):
        f.save(f"frame_{i:02d}.png")

    sheet = Image.new("RGBA", (CELL * N, CELL), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.paste(f, (i * CELL, 0))
    sheet.save("spritesheet.png")

    PV = 200
    pv = Image.new("RGB", (PV * N, PV), (243, 229, 207))
    for i, f in enumerate(frames):
        big = f.resize((PV, PV), Image.NEAREST)
        pv.paste(big, (i * PV, 0), big)
    pv.save("preview-sheet.png")

    # 三种眼态对照(故事引擎按拍切换:待机=half / 察觉打量=open / 眨眼打盹=closed)
    for name, cov in (("open", 0.0), ("half", 0.45), ("closed", 1.0)):
        st, _ = fit_canvas(paint_lids(char, cov))
        st.resize((CELL, CELL), Image.LANCZOS).save(f"eyestate-{name}.png")

    print(f"OK grounded: {N} frames @ {CELL}px, feet_y={feet_y}; eyestates open/half/closed")


if __name__ == "__main__":
    main()
