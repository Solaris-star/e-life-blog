import sys; sys.path.insert(0,".")
from gacha.imgapi import i2i
from concurrent.futures import ThreadPoolExecutor
PRE=("参考图是一个Q版萌系像素少女。严格保留她的全部外貌不变(黑蓝紫渐变长发带星点、金色罗盘冠镶蓝星、"
     "背后紫触手蓝青发光吸盘、金链项圈与腰带、暗色星纹短裙、Q版2-3头身、冷漠淡蓝大眼)。"
     "纯白背景、全身、居中、同画风同比例。只改姿态/神情:")
JOBS={
 "walk_mid":   "行走中段过渡(关键帧 passing pose):双脚交错过渡瞬间、一脚刚落地另一脚抬起向前、双臂自然摆动靠近身体两侧、侧身朝左,处于 walk A 和 walk B 之间。",
 "wave_mid":   "招手中间帧:手臂举到肩膀和头顶之间的半空、手掌略张开、眼睛弯起含笑、身体略前倾,挥手向上扬的瞬间。",
 "startle_set":"受惊后回神:刚从受惊恢复、双手仍微抬但已开始下放、眼睛由瞪大变正常但仍有些惊魂未定、表情松弛中。",
 "blush_mid":  "害羞前奏:脸颊刚开始微微泛红、双手刚要抬起到脸侧、视线刚开始飘移、即将完全害羞的过渡瞬间。",
 "happy_grin": "开心中间笑:嘴角刚刚上扬开始微笑、眼睛半睁有笑意但还没弯成月牙、双手刚要举起、变得很开心前的瞬间。",
}
def go(n,p): return n, i2i(PRE+p,"gacha/_ref_human.png",f"gacha/act_{n}.png",tries=6)
with ThreadPoolExecutor(max_workers=5) as ex:
    for n,r in ex.map(lambda a:go(*a),JOBS.items()): print(f"  {n}: {'OK' if r else 'FAIL'}",flush=True)
print("midposes done",flush=True)
