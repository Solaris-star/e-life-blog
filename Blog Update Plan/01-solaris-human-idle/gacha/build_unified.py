import sys, json, math; sys.path.insert(0,".")
from make_breathing import cut_background, warp_x
from PIL import Image
import numpy as np
WS=420; CELL=168
GROUND=int(0.92*WS); CX=WS//2
HUMAN_H=0.80; OCTO_H=0.42; OCTO_CY=int(0.55*WS)
def bbox(fn):
    ch=cut_background(Image.open(fn).convert("RGB")); a=np.array(ch)[:,:,3]
    ys,xs=np.where(a>8); return ch.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
def place_feet(ch,hf,dy=0):
    s=(hf*WS)/ch.height; im=ch.resize((round(ch.width*s),round(ch.height*s)),Image.LANCZOS)
    c=Image.new("RGBA",(WS,WS),(0,0,0,0)); c.alpha_composite(im,((WS-im.width)//2,GROUND-im.height+dy)); return c
def place_center(ch,hf,cy,dy=0):
    s=(hf*WS)/ch.height; im=ch.resize((round(ch.width*s),round(ch.height*s)),Image.LANCZOS)
    c=Image.new("RGBA",(WS,WS),(0,0,0,0)); c.alpha_composite(im,((WS-im.width)//2,int(cy-im.height/2)+dy)); return c
def sa(img,f):
    a=img.split()[3].point(lambda p:int(p*max(0,min(1,f)))); o=img.copy(); o.putalpha(a); return o
def smooth(x): x=max(0,min(1,x)); return x*x*(3-2*x)
_xs=np.arange(WS)
emask=np.clip((np.abs(_xs-CX)/(WS/2)-0.24)/0.76,0,1)**1.3
vramp=np.clip((_xs-0.50*WS)/(0.50*WS),0,1)**1.5
def sway(canvas,amp):
    return Image.fromarray(warp_x(np.array(canvas), amp*np.outer(vramp,emask)))

# 辉光
yy,xx=np.mgrid[0:WS,0:WS]; r=np.sqrt((xx-CX)**2+(yy-OCTO_CY)**2)/(WS*0.40)
gm=(np.clip(1-r,0,1)**2*255).astype(np.uint8)
glow=np.zeros((WS,WS,4),np.uint8); glow[:,:,0]=90; glow[:,:,1]=235; glow[:,:,2]=255; glow[:,:,3]=gm
glow=Image.fromarray(glow)

H_open=bbox("frame_01_raw.png"); H_blink=bbox("gacha/identity_test.png")
O_open=bbox("gacha/octo_idle.png"); O_blink=bbox("gacha/octo_blink.png")

def human_idle():
    out=[]
    for i in range(8):
        sink=(1-math.cos(2*math.pi*i/8))/2
        sy=1-0.032*sink; sx=1+0.013*sink
        base=H_blink if i in (2,6) else H_open
        c=place_feet(base,HUMAN_H)
        nw,nh=round(WS*sx),round(WS*sy); c=c.resize((nw,nh),Image.LANCZOS)
        f=Image.new("RGBA",(WS,WS),(0,0,0,0)); f.alpha_composite(c,(round((WS-nw)/2),round(GROUND-GROUND*sy)))
        out.append(sway(f,0.012*WS*math.sin(2*math.pi*i/8+math.pi/2)))
    return out
def octo_idle():
    out=[]
    for i in range(6):
        ph=2*math.pi*i/6; bob=round(0.05*WS*math.sin(ph))
        base=O_blink if i==3 else O_open
        f=place_center(base,OCTO_H,OCTO_CY,dy=bob)
        out.append(sway(f,0.012*WS*math.sin(ph+math.pi/2)))
    return out
def morph():  # human(feet) → octo(float)
    hc=place_feet(H_open,HUMAN_H); oc=place_center(O_open,OCTO_H,OCTO_CY); out=[]
    for i in range(8):
        t=i/7; ha=1-smooth(t/0.72); oa=smooth((t-0.28)/0.72)
        hs=1-0.30*t; h=hc.resize((int(WS*hs),int(WS*hs)),Image.LANCZOS)
        lift=int(-smooth(t)*0.16*WS)
        hcv=Image.new("RGBA",(WS,WS),(0,0,0,0)); hcv.alpha_composite(h,((WS-h.width)//2,(WS-h.height)//2+lift))
        f=Image.new("RGBA",(WS,WS),(0,0,0,0))
        f.alpha_composite(sa(hcv,ha)); f.alpha_composite(sa(oc,oa)); f.alpha_composite(sa(glow,math.sin(math.pi*t)*0.8))
        out.append(f)
    return out

anims={"human_idle":(human_idle(),8),"octo_idle":(octo_idle(),6),"morph":(morph(),12)}
manifest={}
for name,(frames,fps) in anims.items():
    sheet=Image.new("RGBA",(CELL*len(frames),CELL),(0,0,0,0))
    for i,f in enumerate(frames): sheet.paste(f.resize((CELL,CELL),Image.LANCZOS),(i*CELL,0))
    sheet.save(f"gacha/anim_{name}.png")
    manifest[name]={"file":f"anim_{name}.png","frames":len(frames),"fps":fps,"cell":CELL}
json.dump(manifest,open("gacha/anim_manifest.json","w"),ensure_ascii=False,indent=2)

# 验证带:人形idle f1,f4 | morph 8 | octo idle f1,f4 —— 看比例/位置连不连贯
hi=human_idle(); mo=morph(); oi=octo_idle()
seq=[hi[0],hi[4]]+mo+[oi[0],oi[3]]
PV=120; strip=Image.new("RGB",(PV*len(seq),PV),(243,229,207))
for i,f in enumerate(seq): strip.paste(f.resize((PV,PV),Image.LANCZOS),(i*PV,0),f.resize((PV,PV),Image.LANCZOS))
strip.save("gacha/continuity_strip.png"); print("unified built; strip",strip.size)
