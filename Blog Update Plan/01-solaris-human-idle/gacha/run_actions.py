import sys; sys.path.insert(0,".")
from gacha.imgapi import i2i
from make_breathing import cut_background
from PIL import Image, ImageDraw
PRE=("参考图是一个Q版萌系像素少女。严格保留她的全部外貌不变(黑蓝紫渐变长发带星点、金色罗盘冠镶蓝星、"
     "背后紫色触手末端蓝青发光吸盘、金色锁链项圈与腰带、暗色星空纹理短裙、Q版2-3头身、冷漠淡蓝大眼)。"
     "纯白背景、全身、居中、与参考完全相同的画风和比例。只改姿态/神情:")
JOBS={
 "smug":   "得意小傲娇:微微挑眉、嘴角上扬、双手抱胸,神情自满(被夸/被点)。",
 "pout":   "鼓腮嫌弃:鼓起脸颊、眉头轻皱、别过脸,一脸'又来'的不耐烦(被反复戳)。",
 "startle":"受惊一瞬:眼睛睁大、身体后仰、双手微抬、触手炸开,吃惊。",
 "walk":   "行走关键帧:侧身面向左、左脚向前迈出一步、双臂自然摆动、裙摆与触手随步伐后扬。",
 "fall":   "摔倒瞬间:重心后仰、屁股着地、双腿前抬、双手撑地、表情慌张、触手向上乱舞。",
}
for n,c in JOBS.items():
    r=i2i(PRE+c,"gacha/_ref_human.png",f"gacha/act_{n}.png",tries=4); print(f"  {n}: {'OK' if r else 'FAIL'}")
# 真实姿态接触表(保形,不做等高归一,避免摔倒被拉伸)
items=[("行走","gacha/act_walk.png"),("摔倒","gacha/act_fall.png"),("受惊","gacha/act_startle.png"),
       ("得意","gacha/act_smug.png"),("嫌弃","gacha/act_pout.png")]
C=240; tiles=[]
import numpy as np
for label,fn in items:
    try:
        ch=cut_background(Image.open(fn).convert("RGB")); a=np.array(ch)[:,:,3]
        ys,xs=np.where(a>8); ch=ch.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
        ch.thumbnail((C-10,C-10),Image.LANCZOS)
        t=Image.new("RGBA",(C,C),(0,0,0,0)); t.alpha_composite(ch,((C-ch.width)//2,(C-ch.height)//2))
        tiles.append((label,t))
    except Exception as e: print("disp fail",fn,e)
sheet=Image.new("RGB",(C*len(tiles),C+22),(243,229,207)); d=ImageDraw.Draw(sheet)
for i,(l,t) in enumerate(tiles): sheet.paste(t,(i*C,22),t); d.text((i*C+6,6),l,fill=(150,60,30))
sheet.save("gacha/actions_sample.png"); print("sample:",sheet.size)
