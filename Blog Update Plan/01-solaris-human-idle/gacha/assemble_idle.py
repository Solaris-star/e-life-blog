import sys; sys.path.insert(0,".")
from make_breathing import cut_background, fit_canvas, make_frame
from PIL import Image
CELL=128
base_open,feet_y = fit_canvas(cut_background(Image.open("frame_01_raw.png").convert("RGB")))
base_blink,_     = fit_canvas(cut_background(Image.open("gacha/identity_test.png").convert("RGB")))  # 真·闭眼
frames=[]
for i in range(8):
    base = base_blink if i in (2,6) else base_open
    frames.append(make_frame(base,feet_y,i).resize((CELL,CELL),Image.LANCZOS))
# 预览拼图(暖纸底)
PV=200; pv=Image.new("RGB",(PV*8,PV),(243,229,207))
for i,f in enumerate(frames):
    pv.paste(f.resize((PV,PV),Image.NEAREST),(i*PV,0),f.resize((PV,PV),Image.NEAREST))
pv.save("gacha/idle_real_preview.png")
# 同时存成正式帧+spritesheet(覆盖派生版)
for i,f in enumerate(frames,1): f.save(f"frame_{i:02d}.png")
sheet=Image.new("RGBA",(CELL*8,CELL),(0,0,0,0))
for i,f in enumerate(frames): sheet.paste(f,(i*CELL,0))
sheet.save("spritesheet.png")
print("OK: real-blink idle assembled; preview gacha/idle_real_preview.png")
