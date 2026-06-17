import sys; sys.path.insert(0,".")
from make_breathing import cut_background, warp_x
from PIL import Image
import numpy as np, math
WS=400; CELL=96; N=6
def fit_center(fn):
    ch=cut_background(Image.open(fn).convert("RGB")); a=np.array(ch)[:,:,3]
    ys,xs=np.where(a>8); ch=ch.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
    s=(0.74*WS)/max(ch.size); ch=ch.resize((round(ch.width*s),round(ch.height*s)),Image.LANCZOS)
    canv=Image.new("RGBA",(WS,WS),(0,0,0,0)); canv.alpha_composite(ch,((WS-ch.width)//2,(WS-ch.height)//2)); return canv
base=fit_center("gacha/octo_idle.png"); blink=fit_center("gacha/octo_blink.png")
_xs=np.arange(WS)
emask=np.clip((np.abs(_xs-WS/2)/(WS/2)-0.15)/0.85,0,1)**1.2   # 两侧触手
vramp=np.clip((_xs-0.45*WS)/(0.55*WS),0,1)**1.4               # 下半部
frames=[]
for i in range(N):
    ph=2*math.pi*i/N
    bob=round(0.045*WS*math.sin(ph))                          # 漂浮上下(章鱼天性)
    src=blink if i==3 else base
    fr=Image.new("RGBA",(WS,WS),(0,0,0,0)); fr.alpha_composite(src,(0,bob))
    dx=0.012*WS*math.sin(ph+math.pi/2)*np.outer(vramp,emask)
    frames.append(Image.fromarray(warp_x(np.array(fr),dx)).resize((CELL,CELL),Image.LANCZOS))
PV=150; pv=Image.new("RGB",(PV*N,PV),(243,229,207))
for i,f in enumerate(frames): pv.paste(f.resize((PV,PV),Image.NEAREST),(i*PV,0),f.resize((PV,PV),Image.NEAREST))
pv.save("gacha/octo_idle_preview.png")
sheet=Image.new("RGBA",(CELL*N,CELL),(0,0,0,0))
for i,f in enumerate(frames): sheet.paste(f,(i*CELL,0))
sheet.save("octopus_idle_spritesheet.png")
print("octopus idle:",N,"frames @",CELL,"px; bob+sway+blink@f4")
