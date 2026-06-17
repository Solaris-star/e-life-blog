import sys; sys.path.insert(0,".")
from make_breathing import cut_background
from PIL import Image
import numpy as np, math
WS=420; N=8
def fit(fn,hfrac):
    ch=cut_background(Image.open(fn).convert("RGB")); a=np.array(ch)[:,:,3]
    ys,xs=np.where(a>8); ch=ch.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
    s=(hfrac*WS)/ch.height; ch=ch.resize((round(ch.width*s),round(ch.height*s)),Image.LANCZOS)
    c=Image.new("RGBA",(WS,WS),(0,0,0,0)); c.alpha_composite(ch,((WS-ch.width)//2,int(WS*0.5-ch.height/2))); return c
human=fit("frame_01_raw.png",0.86); octo=fit("gacha/octo_idle.png",0.50)
# 青蓝径向辉光
yy,xx=np.mgrid[0:WS,0:WS]; r=np.sqrt((xx-WS/2)**2+(yy-WS/2)**2)/(WS*0.42)
gmask=(np.clip(1-r,0,1)**2*255).astype(np.uint8)
glow=np.zeros((WS,WS,4),np.uint8); glow[:,:,0]=90; glow[:,:,1]=235; glow[:,:,2]=255; glow[:,:,3]=gmask
glow=Image.fromarray(glow)
def sa(img,f):
    a=img.split()[3].point(lambda p:int(p*max(0,min(1,f)))); o=img.copy(); o.putalpha(a); return o
def smooth(x): x=max(0,min(1,x)); return x*x*(3-2*x)
frames=[]
for i in range(N):
    t=i/(N-1)
    ha=1-smooth(t/0.72); oa=smooth((t-0.28)/0.72)
    hs=1-0.32*t; h=human.resize((int(WS*hs),int(WS*hs)),Image.LANCZOS)
    hc=Image.new("RGBA",(WS,WS),(0,0,0,0)); hc.alpha_composite(h,((WS-h.width)//2,(WS-h.height)//2))
    fr=Image.new("RGBA",(WS,WS),(0,0,0,0))
    fr.alpha_composite(sa(hc,ha)); fr.alpha_composite(sa(octo,oa))
    fr.alpha_composite(sa(glow, math.sin(math.pi*t)*0.75))     # 中段最亮
    frames.append(fr)
PV=150
for bg,name in [((18,16,38),"morph_preview_dark.png"),((243,229,207),"morph_preview_paper.png")]:
    pv=Image.new("RGB",(PV*N,PV),bg)
    for i,f in enumerate(frames):
        fr=f.resize((PV,PV),Image.LANCZOS); pv.paste(fr,(i*PV,0),fr)
    pv.save("gacha/"+name)
sheet=Image.new("RGBA",(WS*N,WS),(0,0,0,0))
for i,f in enumerate(frames): sheet.paste(f,(i*WS,0))
sheet.save("morph_human2octo_spritesheet.png")
print("morph:",N,"frames, dark+paper preview saved")
