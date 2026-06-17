import sys; sys.path.insert(0,".")
from gacha.imgapi import i2i
from PIL import Image
P=("参考图是一个Q版萌系像素角色少女。请严格保留她的全部外貌不变:黑→蓝→紫渐变长发带星点、"
   "头顶金色罗盘冠镶蓝星、背后紫色触手末端蓝青发光吸盘、金色锁链项圈与腰带、冷漠淡蓝大眼、"
   "暗色星空纹理短裙、Q版2-3头身。只改动作:让她【轻轻闭上眼睛】、身体随呼吸【微微下沉】。"
   "纯白背景、全身、居中、与参考完全相同的画风与比例。")
r=i2i(P,"gacha/_ref_human.png","gacha/identity_test.png")
print("result:",r)
if r:
    res=Image.open(r).convert("RGB"); print("size:",res.size)
    ref=Image.open("gacha/_ref_human.png").convert("RGB")
    h=420; 
    def fit(im): 
        w=int(im.width*h/im.height); return im.resize((w,h))
    a=fit(ref); b=fit(res); cmp=Image.new("RGB",(a.width+b.width+20,h),(240,235,225))
    cmp.paste(a,(0,0)); cmp.paste(b,(a.width+20,0)); cmp.save("gacha/identity_cmp.png")
    print("cmp saved")
