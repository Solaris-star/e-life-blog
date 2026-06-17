import sys; sys.path.insert(0,".")
from gacha.imgapi import i2i
from make_breathing import cut_background, fit_canvas
from PIL import Image, ImageDraw

PREFIX=("参考图是一个Q版萌系像素少女。严格保留她的全部外貌不变(黑蓝紫渐变长发带星点、"
        "金色罗盘冠镶蓝星、背后紫色触手末端蓝青发光吸盘、金色锁链项圈与腰带、暗色星空纹理短裙、"
        "Q版2-3头身、冷漠淡蓝大眼)。纯白背景、全身、居中、与参考完全相同的画风和比例。只改神情/动作:")
JOBS={
 "half":   "眼睛【半垂、慵懒半闭】,神情冷淡疏离(待机)。",
 "notice": "眼睛【睁大、直视正前方的你】、眼神微亮有神、下巴略微上抬(被察觉的瞬间)。",
 "soft":   "眼睛【柔和地微微下垂、温柔注视前方】、神情放松(收束)。",
}
ref="gacha/_ref_human.png"
for name,chg in JOBS.items():
    r=i2i(PREFIX+chg, ref, f"gacha/exp_{name}.png")
    print(f"  {name}: {'OK' if r else 'FAIL'}")

# 对齐:所有真表情帧统一抠底+归一到同高同心
reals=[("中性 raw_1","frame_01_raw.png"),("眨眼","gacha/identity_test.png"),
       ("半垂","gacha/exp_half.png"),("察觉","gacha/exp_notice.png"),("柔和","gacha/exp_soft.png")]
C=240; tiles=[]
for label,fn in reals:
    try:
        ch=cut_background(Image.open(fn).convert("RGB"))
        canv,_=fit_canvas(ch)              # 归一 WS×WS 居中同高
        tiles.append((label,canv.resize((C,C),Image.LANCZOS)))
    except Exception as e:
        print("align fail",fn,e)
sheet=Image.new("RGB",(C*len(tiles),C+22),(243,229,207)); d=ImageDraw.Draw(sheet)
for i,(label,t) in enumerate(tiles):
    sheet.paste(t,(i*C,22),t); d.text((i*C+6,6),label,fill=(60,40,20))
sheet.save("gacha/expr_aligned.png"); print("aligned sheet:",sheet.size)
