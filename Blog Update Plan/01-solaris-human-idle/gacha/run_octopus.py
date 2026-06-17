import sys; sys.path.insert(0,".")
from gacha.imgapi import i2i
from make_breathing import cut_background, fit_canvas
from PIL import Image, ImageDraw
PRE=("参考图是一只Q版萌系小章鱼。严格保留它的外貌不变(深紫靛蓝体色、头顶金色罗盘冠镶蓝星、"
     "8条触手末端蓝青色发光吸盘、金色锁链项圈、冷漠淡蓝大眼、圆润毛绒玩具感)。"
     "纯白背景、居中、与参考完全相同的画风和比例。只改神情/动作:")
JOBS={"idle":"平静漂浮、眼睛睁开、触手自然下垂(基准漂浮姿态)。",
      "blink":"眼睛轻轻闭上(眨眼)、平静漂浮。",
      "curious":"好奇探头:眼睛睁大有神、身体微微前倾、顶部两条触手好奇上扬。"}
for n,c in JOBS.items():
    r=i2i(PRE+c,"gacha/_ref_octo.png",f"gacha/octo_{n}.png"); print(f"  {n}: {'OK' if r else 'FAIL'}")
# 对齐接触表
items=[("锚·正面","gacha/_ref_octo.png"),("漂浮idle","gacha/octo_idle.png"),
       ("眨眼","gacha/octo_blink.png"),("好奇探头","gacha/octo_curious.png")]
C=240; tiles=[]
for label,fn in items:
    try:
        canv,_=fit_canvas(cut_background(Image.open(fn).convert("RGB")))
        tiles.append((label,canv.resize((C,C),Image.LANCZOS)))
    except Exception as e: print("align fail",fn,e)
sheet=Image.new("RGB",(C*len(tiles),C+22),(243,229,207)); d=ImageDraw.Draw(sheet)
for i,(l,t) in enumerate(tiles): sheet.paste(t,(i*C,22),t); d.text((i*C+6,6),l,fill=(60,40,20))
sheet.save("gacha/octo_aligned.png"); print("octo sheet:",sheet.size)
