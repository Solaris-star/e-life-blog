import json, base64, subprocess, re, time, tempfile, os
BASE="http://192.168.110.48:3801"; KEY="chatgpt2api"
def _post(path,payload,tmo):
    f=tempfile.NamedTemporaryFile("w",suffix=".json",delete=False); json.dump(payload,f); f.close()
    try:
        return subprocess.run(["curl","-s","--max-time",str(tmo),f"{BASE}{path}",
            "-H",f"Authorization: Bearer {KEY}","-H","Content-Type: application/json",
            "--data-binary",f"@{f.name}"],capture_output=True,text=True).stdout
    finally: os.unlink(f.name)
def _save(c,out):
    m=re.search(r"data:image/\w+;base64,([A-Za-z0-9+/=]+)",c)
    if m: open(out,"wb").write(base64.b64decode(m.group(1))); return True
    u=re.search(r"https?://[^\s)\"']+",c)
    if u:
        d=subprocess.run(["curl","-s","--max-time","120",u.group(0)],capture_output=True).stdout
        if d[:8]==b"\x89PNG\r\n\x1a\n": open(out,"wb").write(d); return True
    return False
def t2i(prompt,out,size="1024x1024",tries=5):
    for i in range(tries):
        o=_post("/v1/images/generations",{"model":"gpt-image-2","prompt":prompt,"n":1,"size":size},300)
        try:
            open(out,"wb").write(base64.b64decode(json.loads(o)["data"][0]["b64_json"])); return out
        except Exception: time.sleep(4)
    return None
def i2i(prompt,ref,out,tries=5):
    b=base64.b64encode(open(ref,"rb").read()).decode()
    payload={"model":"gpt-image-2","stream":False,"messages":[{"role":"user","content":[
        {"type":"text","text":prompt},{"type":"image_url","image_url":{"url":f"data:image/png;base64,{b}"}}]}]}
    for i in range(tries):
        o=_post("/v1/chat/completions",payload,300)
        try:
            if _save(json.loads(o)["choices"][0]["message"]["content"],out): return out
        except Exception: pass
        time.sleep(4)
    return None
