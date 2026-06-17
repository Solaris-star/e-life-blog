import sys; sys.path.insert(0,".")
from gacha.imgapi import t2i
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageDraw
JOBS=[
 ("portal_swirl","游戏美术素材,2D俯视视角的椭圆形魔法传送门:深紫到漆黑的向心漩涡、边缘环绕电青色(#00F7FF)发光、星空粒子质感、神秘深渊感。传送门居中、四周纯透明背景、无地面无场景无角色。"),
 ("portal_rune", "游戏美术素材,2D椭圆深渊传送门:午夜蓝与皇家紫漩涡、中心漆黑深邃、边缘一圈金色罗盘刻度符文环加电青辉光。居中、纯透明背景、无场景无角色。"),
 ("mud_pool",    "游戏美术素材,2D俯视一滩黑紫色粘稠泥潭/深渊沼泽:表面缓慢翻涌的气泡与漩涡、边缘渗出电青色微光、粘稠湿润质感。居中、纯透明背景、无场景无角色。"),
 ("portal_crack","游戏美术素材,2D黑紫色漩涡传送门:强烈向心漩涡、电青色裂纹光、星尘飘散、深渊外神风格、俯视椭圆。居中、纯透明背景、无地面。"),
]
def go(n,p): return n, t2i(p,f"gacha/{n}.png",size="1024x1024",tries=6)
with ThreadPoolExecutor(max_workers=4) as ex:
    for n,r in ex.map(lambda a:go(*a),JOBS): print(f"  {n}: {'OK' if r else 'FAIL'}",flush=True)
C=300; items=[j[0] for j in JOBS]; sheet=Image.new("RGB",(C*len(items),C+20),(30,28,45)); d=ImageDraw.Draw(sheet)
for i,n in enumerate(items):
    try:
        im=Image.open(f"gacha/{n}.png").convert("RGB"); im.thumbnail((C,C)); sheet.paste(im,(i*C,20)); d.text((i*C+4,4),n,fill=(180,230,255))
    except Exception as e: print("disp",n,e)
sheet.save("gacha/portals.png"); print("portals board:",sheet.size,flush=True)
