import sys,math; sys.path.insert(0,".")
from make_breathing import cut_background
from PIL import Image
import numpy as np
WS=420; CELL=168; CX=WS//2
SURF=int(0.80*WS); OCTO_CY=int(0.55*WS); HUMAN_H=0.80; OCTO_H=0.42
def bbox(fn):
    ch=cut_background(Image.open(fn).convert("RGB")); a=np.array(ch)[:,:,3]
    ys,xs=np.where(a>8); return ch.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
def scaled(ch,hf):
    s=(hf*WS)/ch.height; return ch.resize((round(ch.width*s),round(ch.height*s)),Image.LANCZOS)
Hs=scaled(bbox("frame_01_raw.png"),HUMAN_H); Os=scaled(bbox("gacha/octo_idle.png"),OCTO_H)
PORT=Image.open("gacha/portal_rune.png").convert("RGBA")
def lay_feet(sp,fy): c=Image.new("RGBA",(WS,WS),(0,0,0,0)); c.alpha_composite(sp,((WS-sp.width)//2,int(fy-sp.height))); return c
def lay_cen(sp,cy):  c=Image.new("RGBA",(WS,WS),(0,0,0,0)); c.alpha_composite(sp,((WS-sp.width)//2,int(cy-sp.height/2))); return c
def clip_above(layer,surf,feather=7):
    arr=np.array(layer).astype(float); ys=np.arange(WS)
    m=np.clip((surf-ys)/feather,0,1); arr[:,:,3]*=m[:,None]; return Image.fromarray(arr.astype(np.uint8))
def portal(scale,angle):
    if scale<=0.02: return Image.new("RGBA",(WS,WS),(0,0,0,0))
    rot=PORT.rotate(angle,resample=Image.BICUBIC,expand=False)
    pw=max(2,int(1.10*WS*scale)); ph=max(2,int(0.44*WS*scale))
    pe=rot.resize((pw,ph),Image.LANCZOS)
    c=Image.new("RGBA",(WS,WS),(0,0,0,0)); c.alpha_composite(pe,((WS-pw)//2,int(SURF-ph/2))); return c
def sm(x): x=max(0,min(1,x)); return x*x*(3-2*x)
def light_pillar(intensity, t_in_phase):
    """从门中心涌出:核心辉光爆发 + 锥形光柱 + 向上飘散粒子。"""
    if intensity <= 0.02: return Image.new("RGBA",(WS,WS),(0,0,0,0))
    arr = np.zeros((WS,WS,4), np.float64)
    yy,xx = np.mgrid[0:WS,0:WS].astype(np.float64)
    # 0) 门心核心辉光(径向爆发,覆盖门中心,亮青蓝)
    cd = np.sqrt((xx-CX)**2 + (yy-SURF)**2*4)              # *4 是椭圆距离(横向更扁)
    core_r = 0.18*WS
    core = np.clip(1 - cd/core_r, 0, 1)**1.8
    arr[:,:,0] = np.maximum(arr[:,:,0], 180*core)
    arr[:,:,1] = np.maximum(arr[:,:,1], 245*core)
    arr[:,:,2] = np.maximum(arr[:,:,2], 255*core)
    arr[:,:,3] = np.maximum(arr[:,:,3], core*235*intensity)
    # 1) 锥形光柱(底宽顶窄向上)
    cy_top = SURF - 0.34*WS
    cy_base= SURF
    h_norm = np.clip((cy_base - yy) / (cy_base - cy_top), 0, 1)
    half_w = (0.34 - 0.22*h_norm) * WS
    side = np.clip(1 - np.abs(xx-CX)/np.maximum(half_w,1), 0, 1)
    in_pillar = (yy<=cy_base) & (np.abs(xx-CX)<=half_w)
    fade = (1 - h_norm)**1.3 * side**1.2
    pillar_a = np.where(in_pillar, fade, 0) * 200 * intensity
    base_rgb = np.array([110, 225, 255])
    for k in range(3):
        arr[:,:,k] = np.maximum(arr[:,:,k], base_rgb[k] * (pillar_a/255.0))
    arr[:,:,3] = np.maximum(arr[:,:,3], pillar_a)
    # 2) 飘散粒子(更多更亮)
    rng = np.random.RandomState(11)
    for _ in range(26):
        sx = CX + rng.uniform(-0.24*WS, 0.24*WS)
        speed = rng.uniform(0.15, 0.38)*WS
        offset = rng.uniform(0,1)
        py = SURF - ((t_in_phase + offset) % 1) * speed
        px = sx + math.sin((t_in_phase+offset)*6.28)*5
        if py < cy_top - 6: continue
        r = rng.randint(2,5)
        life = 1 - (SURF - py)/speed
        if life <= 0: continue
        a_p = 255 * intensity * life
        for dy in range(-r,r+1):
            for dx in range(-r,r+1):
                d = (dx*dx+dy*dy)**0.5
                if d <= r:
                    iy, ix = int(py+dy), int(px+dx)
                    if 0<=iy<WS and 0<=ix<WS:
                        alpha_pt = a_p * max(0, 1 - d/r)
                        # 星点白热,边缘青蓝
                        glow = 1 - d/r
                        arr[iy,ix,0] = max(arr[iy,ix,0], 180 + 75*glow)
                        arr[iy,ix,1] = max(arr[iy,ix,1], 230 + 25*glow)
                        arr[iy,ix,2] = max(arr[iy,ix,2], 255)
                        arr[iy,ix,3] = max(arr[iy,ix,3], alpha_pt)
    return Image.fromarray(np.clip(arr,0,255).astype(np.uint8))
OPEN,SINK,MID,RISE,CLOSE=4,7,3,7,4; N=OPEN+SINK+MID+RISE+CLOSE
frames=[]
for i in range(N):
    ang=i*20; ps=1.0; hl=ol=None
    if i<OPEN: ps=sm((i+1)/OPEN); hl=lay_feet(Hs,SURF)
    elif i<OPEN+SINK:
        p=(i-OPEN+1)/SINK; hl=clip_above(lay_feet(Hs,SURF+sm(p)*Hs.height*1.1),SURF)
    elif i<OPEN+SINK+MID: pass
    elif i<OPEN+SINK+MID+RISE:
        p=(i-(OPEN+SINK+MID)+1)/RISE; cy=(SURF+Os.height*0.7)-sm(p)*((SURF+Os.height*0.7)-OCTO_CY)
        ol=clip_above(lay_cen(Os,cy),SURF)
    else:
        p=(i-(OPEN+SINK+MID+RISE)+1)/CLOSE; ps=1-sm(p); ol=lay_cen(Os,OCTO_CY)
    fr=Image.new("RGBA",(WS,WS),(0,0,0,0))
    fr.alpha_composite(portal(ps,ang))           # 门(洞)在身后
    # 光涌:从下沉中段开始,到升起中段最强
    li=0
    if i>=OPEN+SINK-2 and i<=OPEN+SINK+MID+RISE-2:
        progress=(i-(OPEN+SINK-2))/(MID+RISE+1)
        li = math.sin(min(1,max(0,progress))*math.pi)        # 钟形包络
    if li>0:
        fr.alpha_composite(light_pillar(li, (i%8)/8))
    if hl: fr.alpha_composite(hl)
    if ol: fr.alpha_composite(ol)
    frames.append(fr)
sheet=Image.new("RGBA",(CELL*N,CELL),(0,0,0,0))
for i,f in enumerate(frames): sheet.paste(f.resize((CELL,CELL),Image.LANCZOS),(i*CELL,0))
sheet.save("gacha/anim_morph_portal.png")
PV=130; pv=Image.new("RGB",(PV*N,PV),(243,229,207))
for i,f in enumerate(frames): pv.paste(f.resize((PV,PV),Image.LANCZOS),(i*PV,0),f.resize((PV,PV),Image.LANCZOS))
pv.save("gacha/portal_morph_strip.png")
print(f"portal morph: {N} frames (open{OPEN}/sink{SINK}/mid{MID}/rise{RISE}/close{CLOSE})")
