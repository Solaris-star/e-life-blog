import sys; sys.path.insert(0,".")
from gacha.imgapi import i2i
from concurrent.futures import ThreadPoolExecutor
from make_breathing import cut_background
from PIL import Image, ImageDraw
import numpy as np
H="gacha/_ref_human.png"; O="gacha/_ref_octo.png"
HPRE=("参考图是一个Q版萌系像素少女。严格保留她的全部外貌不变(黑蓝紫渐变长发带星点、金色罗盘冠镶蓝星、"
      "背后紫触手蓝青发光吸盘、金链项圈与腰带、暗色星纹短裙、Q版2-3头身、冷漠淡蓝大眼)。"
      "纯白背景、全身、居中、同画风同比例。【夸张地】只改姿态/神情:")
OPRE=("参考图是一只Q版萌系小章鱼。严格保留外貌不变(深紫体、金色罗盘冠镶蓝星、8触手蓝青发光吸盘、"
      "金链项圈、冷漠淡蓝大眼)。纯白背景、居中、同画风同比例。【夸张地】只改:")
JOBS=[
 ("act_smug2",   HPRE+"得意洋洋的坏笑:眼睛微眯上挑、单边嘴角坏笑、下巴抬高、双手抱胸,一副'就这?'的傲娇。",H),
 ("act_pout2",   HPRE+"生气鼓腮:腮帮明显鼓起、眉头紧皱、嘴巴嘟起、双手叉腰、扭头别开不看你,明显不爽。",H),
 ("act_walk2",   HPRE+"行走关键帧B(与迈步反相):侧身朝左、右脚在前左脚在后蹬地、双臂反向摆动、裙摆与触手向后扬。",H),
 ("act_fall_tip",HPRE+"绊倒前一刻:身体大幅向后失衡、双臂向前张开乱抓、单脚离地、表情惊慌张嘴、触手上扬。",H),
 ("act_fall_up", HPRE+"摔倒后坐地:屁股坐地上、一只手撑地、另一只手揉头、表情委屈发懵、正准备爬起来。",H),
 ("octo_curl2",  OPRE+"受惊缩成一团:整体缩成圆球、8条触手全部紧紧裹住身体抱成团、只露紧闭的眼睛、明显缩小一圈。",O),
]
def go(name,prompt,ref): return name, i2i(prompt,ref,f"gacha/{name}.png",tries=6)
with ThreadPoolExecutor(max_workers=6) as ex:
    for name,r in ex.map(lambda a:go(*a),JOBS): print(f"  {name}: {'OK' if r else 'FAIL'}",flush=True)
# 对比拼图
def tile(fn,C=210):
    ch=cut_background(Image.open(fn).convert("RGB")); a=np.array(ch)[:,:,3]
    ys,xs=np.where(a>8); ch=ch.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
    ch.thumbnail((C-8,C-8),Image.LANCZOS)
    t=Image.new("RGBA",(C,C),(0,0,0,0)); t.alpha_composite(ch,((C-ch.width)//2,(C-ch.height)//2)); return t
items=[("得意2","gacha/act_smug2.png"),("嫌弃2","gacha/act_pout2.png"),("缩成团2","gacha/octo_curl2.png"),
       ("行走B","gacha/act_walk2.png"),("绊倒","gacha/act_fall_tip.png"),("爬起","gacha/act_fall_up.png")]
C=210; sheet=Image.new("RGB",(C*len(items),C+22),(243,229,207)); d=ImageDraw.Draw(sheet)
for i,(l,fn) in enumerate(items):
    try: t=tile(fn); sheet.paste(t,(i*C,22),t); d.text((i*C+6,6),l,fill=(150,60,30))
    except Exception as e: print("disp fail",fn,e)
sheet.save("gacha/batch2.png"); print("batch2 board:",sheet.size,flush=True)
