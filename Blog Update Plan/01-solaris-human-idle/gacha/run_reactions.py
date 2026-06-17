import sys; sys.path.insert(0,".")
from gacha.imgapi import i2i
from make_breathing import cut_background
from PIL import Image, ImageDraw
import numpy as np
HPRE=("参考图是一个Q版萌系像素少女。严格保留她的全部外貌不变(黑蓝紫渐变长发带星点、金色罗盘冠镶蓝星、"
      "背后紫色触手末端蓝青发光吸盘、金色锁链项圈与腰带、暗色星空纹理短裙、Q版2-3头身、冷漠淡蓝大眼)。"
      "纯白背景、全身、居中、与参考完全相同的画风和比例。只改姿态/神情:")
OPRE=("参考图是一只Q版萌系小章鱼。严格保留它的外貌不变(深紫靛蓝体色、头顶金色罗盘冠镶蓝星、"
      "8条触手末端蓝青发光吸盘、金色锁链项圈、冷漠淡蓝大眼、圆润毛绒玩具感)。"
      "纯白背景、居中、与参考完全相同的画风和比例。只改神情/动作:")
HJOBS={
 "startle":"受惊一瞬:眼睛猛地睁大、身体后仰、双手微抬到胸前、触手向外炸开,惊讶。",
 "wave":   "开心招手问候:一只手高举挥手、眼睛弯起含笑、身体微微前倾(欢迎)。",
 "blush":  "害羞脸红:脸颊明显泛红、双手轻抬到脸侧、视线害羞地别开、神情扭捏。",
 "happy":  "开心大笑:眼睛弯成月牙、嘴角大大上扬、双手雀跃举起、触手轻快上扬。",
}
OJOBS={
 "curl":   "受惊缩成一团:8条触手全部向内收紧蜷缩、身体缩成小球、眼睛紧闭,躲闪。",
 "sparkle":"开心闪耀:眼睛眯成弯月笑眼、周围有金色星光闪烁、触手欢快上扬。",
}
for n,c in HJOBS.items():
    print(f"  H/{n}:",'OK' if i2i(HPRE+c,"gacha/_ref_human.png",f"gacha/act_{n}.png",tries=5) else 'FAIL',flush=True)
for n,c in OJOBS.items():
    print(f"  O/{n}:",'OK' if i2i(OPRE+c,"gacha/_ref_octo.png",f"gacha/octo_{n}.png",tries=5) else 'FAIL',flush=True)

# 反应总览(保形)
def tile(fn,C=220):
    ch=cut_background(Image.open(fn).convert("RGB")); a=np.array(ch)[:,:,3]
    ys,xs=np.where(a>8); ch=ch.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
    ch.thumbnail((C-10,C-10),Image.LANCZOS)
    t=Image.new("RGBA",(C,C),(0,0,0,0)); t.alpha_composite(ch,((C-ch.width)//2,(C-ch.height)//2)); return t
rows=[("人形反应",[("招手","gacha/act_wave.png"),("受惊","gacha/act_startle.png"),("得意","gacha/act_smug.png"),
                  ("嫌弃","gacha/act_pout.png"),("害羞","gacha/act_blush.png"),("开心","gacha/act_happy.png")]),
      ("章鱼反应",[("好奇hover","gacha/octo_curious.png"),("缩成团","gacha/octo_curl.png"),("开心闪耀","gacha/octo_sparkle.png")])]
C=220; maxn=max(len(r[1]) for r in rows); W=C*maxn+60; H=(C+24)*len(rows)+8
sheet=Image.new("RGB",(W,H),(243,229,207)); d=ImageDraw.Draw(sheet)
for ri,(rl,items) in enumerate(rows):
    y=ri*(C+24)+24; d.text((4,y-18),rl,fill=(150,60,30))
    for ci,(l,fn) in enumerate(items):
        try: t=tile(fn); sheet.paste(t,(60+ci*C,y),t); d.text((60+ci*C+4,y-2),l,fill=(60,40,20))
        except Exception as e: print("disp fail",fn,e)
sheet.save("gacha/REACTIONS.png"); print("board:",sheet.size,flush=True)
