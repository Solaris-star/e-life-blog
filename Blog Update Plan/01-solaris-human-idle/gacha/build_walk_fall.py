"""把已有真关键姿(行走A/B、摔倒3姿)组装成可循环动画。
统一画布 WS420 CELL168,脚锚 GROUND=0.92*WS,水平居中。
不归一 bbox(那样会拉伸摔倒坐地姿)——按 alpha-bbox 的最下沿 = GROUND。"""
import sys; sys.path.insert(0,".")
from make_breathing import cut_background
from PIL import Image
import numpy as np
WS=420; CELL=168; GROUND=int(0.92*WS); SCALE_REF=0.80
def prep(fn,hf=SCALE_REF):
    """抠底,缩放使其高度=hf*WS,脚踩 GROUND,水平居中。返回 WS×WS RGBA。"""
    ch=cut_background(Image.open(fn).convert("RGB")); a=np.array(ch)[:,:,3]
    ys,xs=np.where(a>8); ch=ch.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
    s=(hf*WS)/ch.height; ch=ch.resize((round(ch.width*s),round(ch.height*s)),Image.LANCZOS)
    c=Image.new("RGBA",(WS,WS),(0,0,0,0)); c.alpha_composite(ch,((WS-ch.width)//2,GROUND-ch.height)); return c
def crossfade(a,b,t):
    aa=np.array(a).astype(float); bb=np.array(b).astype(float)
    out=aa*(1-t)+bb*t; return Image.fromarray(out.astype(np.uint8))

# === 行走循环 4 帧:A→AB→B→BA (其实就是 idle、A、idle、B 那种节拍?试 A-mid-B-mid) ===
walkA=prep("gacha/act_walk.png"); walkB=prep("gacha/act_walk2.png")
# 中间姿用 0.5 交叉淡入做"双脚着地的过渡"
walk_mid=crossfade(walkA,walkB,0.5)
walk_frames=[walkA,walk_mid,walkB,walk_mid]   # 4 帧循环
sheet=Image.new("RGBA",(CELL*4,CELL),(0,0,0,0))
for i,f in enumerate(walk_frames): sheet.paste(f.resize((CELL,CELL),Image.LANCZOS),(i*CELL,0))
sheet.save("gacha/anim_walk.png"); print("walk:4 frames")

# === 摔倒+爬起 6 帧序列:idle→tip→sit→sit→getup_mid→idle ===
idle=prep("frame_01_raw.png"); tip=prep("gacha/act_fall_tip.png",0.78); 
sit=prep("gacha/act_fall_up.png",0.66)   # 坐地姿身高更矮
gu=crossfade(sit,idle,0.6)
fall_frames=[tip, sit, sit, sit, gu, idle]
sheet=Image.new("RGBA",(CELL*6,CELL),(0,0,0,0))
for i,f in enumerate(fall_frames): sheet.paste(f.resize((CELL,CELL),Image.LANCZOS),(i*CELL,0))
sheet.save("gacha/anim_fall.png"); print("fall:6 frames")

# === 反应单帧也归一,接进 demo 用 ===
reacts={
 "wave":"gacha/act_wave.png","startle":"gacha/act_startle.png",
 "blush":"gacha/act_blush.png","happy":"gacha/act_happy.png",
 "smug":"gacha/act_smug.png","pout":"gacha/act_pout2.png",
 "soft":"gacha/exp_soft.png","half":"gacha/exp_half.png","notice":"gacha/exp_notice.png"}
for name,fn in reacts.items():
    f=prep(fn,SCALE_REF); f.resize((CELL,CELL),Image.LANCZOS).save(f"gacha/react_{name}.png")
print("reacts:",len(reacts),"single frames")
