"""把 主姿+中间姿 各反应组装成 2-3 帧小循环,行走换成真中间帧。"""
import sys; sys.path.insert(0,".")
from make_breathing import cut_background
from PIL import Image
import numpy as np
WS=420; CELL=168; GROUND=int(0.92*WS)
def prep(fn,hf=0.80):
    ch=cut_background(Image.open(fn).convert("RGB")); a=np.array(ch)[:,:,3]
    ys,xs=np.where(a>8); ch=ch.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
    s=(hf*WS)/ch.height; ch=ch.resize((round(ch.width*s),round(ch.height*s)),Image.LANCZOS)
    c=Image.new("RGBA",(WS,WS),(0,0,0,0)); c.alpha_composite(ch,((WS-ch.width)//2,GROUND-ch.height)); return c

# 行走:A → 真中间姿 → B → 真中间姿 (4 帧循环)
A=prep("gacha/act_walk.png"); MID=prep("gacha/act_walk_mid.png"); B=prep("gacha/act_walk2.png")
sheet=Image.new("RGBA",(CELL*4,CELL),(0,0,0,0))
for i,f in enumerate([A,MID,B,MID]): sheet.paste(f.resize((CELL,CELL),Image.LANCZOS),(i*CELL,0))
sheet.save("gacha/anim_walk.png"); print("walk(real mid):4 frames")

# 反应循环 = 主姿+中间姿 2 帧来回(快速节奏)
PAIRS={
 "wave":   ("gacha/act_wave.png",   "gacha/act_wave_mid.png"),
 "startle":("gacha/act_startle.png","gacha/act_startle_set.png"),
 "blush":  ("gacha/act_blush.png",  "gacha/act_blush_mid.png"),
 "happy":  ("gacha/act_happy.png",  "gacha/act_happy_grin.png"),
}
for name,(main,mid) in PAIRS.items():
    a=prep(main); b=prep(mid)
    s=Image.new("RGBA",(CELL*2,CELL),(0,0,0,0))
    s.paste(a.resize((CELL,CELL),Image.LANCZOS),(0,0))
    s.paste(b.resize((CELL,CELL),Image.LANCZOS),(CELL,0))
    s.save(f"gacha/anim_react_{name}.png")
print("react loops:",len(PAIRS))
