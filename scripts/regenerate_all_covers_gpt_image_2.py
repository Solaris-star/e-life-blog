#!/usr/bin/env python3
import base64
import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path('/Users/solaris/AI/e-life-blog')
POSTS = ROOT / 'content/posts'
OUTDIR = ROOT / 'public/images/agnes/generated-covers-20260608'
OUTDIR.mkdir(parents=True, exist_ok=True)
API = 'http://192.168.110.48:8082/v1/images/generations'
KEY = 'sk-' + 'a829c586f822e859e6ae52982dde291dadcb1ff731a39fb0db4446a785940450'
MODEL = 'gpt-image-2'
SKIP = {'fiat24-passport-tutorial'}

TAG_THEMES = {
    'AI研究': '人工智能、模型、API、开发者工具、深色代码与发光节点',
    '海外支付': '跨境支付、虚拟卡、银行账户、护照、地图定位、金融科技',
    '福利羊毛': '免费资源、优惠、工具箱、云服务、醒目的实用信息标签',
    '云服网络': '云服务器、网络节点、容器、全球网络、部署流程',
    '域名邮箱': '域名、DNS、邮箱、信封、网络解析、控制台界面',
    'OPC实战': '公司注册、商业文档、印章、财务流程、办公桌面',
}

def parse_frontmatter(text):
    m = re.match(r'^---\n(.*?)\n---\n(.*)$', text, re.S)
    if not m:
        return None, text
    return m.group(1), m.group(2)

def field(fm, name):
    m = re.search(rf'^{re.escape(name)}:\s*(.*)$', fm, re.M)
    return m.group(1).strip().strip('"') if m else ''

def tags(fm):
    m = re.search(r'^tags:\n((?:\s+-\s+.*\n?)+)', fm, re.M)
    if not m:
        return []
    return [x.strip()[2:].strip() for x in m.group(1).splitlines() if x.strip().startswith('- ')]

def safe_excerpt(body):
    body = re.sub(r'```.*?```', '', body, flags=re.S)
    body = re.sub(r'!\[[^\]]*\]\([^)]*\)', '', body)
    body = re.sub(r'\[[^\]]+\]\([^)]*\)', '', body)
    body = re.sub(r'[#>*_`|\-]+', ' ', body)
    return re.sub(r'\s+', ' ', body).strip()[:700]

def prompt_for(post):
    tag = post['tags'][0] if post['tags'] else '技术博客'
    theme = TAG_THEMES.get(tag, '中文个人博客、技术教程、真实信息密度、干净高级')
    title = post['title']
    subtitle = post['description'][:42] if post['description'] else post['excerpt'][:42]
    return f'''为中文个人博客生成一张 1792x1024 横版文章封面。

文章标题：{title}
文章摘要：{post['description']}
内容关键词：{post['excerpt']}
分类主题：{tag}，视觉方向：{theme}

统一风格要求：
- 成熟个人博客封面，不要像 SaaS 落地页，不要像手机 App 截图，不要廉价 3D 图标。
- 信息密度要真实：画面里要包含和文章主题相关的对象、指标、界面片段、流程线或对比标签。
- 横版 16:9，适合博客列表缩略图和 OpenGraph 分享。
- 主色尽量克制，背景可用浅米色、深蓝、黑白灰、低饱和渐变；根据主题加入少量强调色。
- 中文标题必须清晰可读：{title}
- 可以添加一个较短副标题，但不要堆太多文字：{subtitle}
- 不要出现真实个人隐私，不要出现论坛名、作者名、站外水印。
- 构图有层次：主视觉 + 2 到 4 个信息标签 + 相关图标/设备/地图/代码/卡片等元素。
- 整体要像一张高质量中文技术博客封面，专业、干净、有内容。'''

def call_image(prompt, out):
    payload = {'model': MODEL, 'prompt': prompt, 'size': '1792x1024', 'n': 1}
    req = urllib.request.Request(API, data=json.dumps(payload).encode('utf-8'), headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + KEY,
    }, method='POST')
    with urllib.request.urlopen(req, timeout=420) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    item = data['data'][0]
    if 'b64_json' in item:
        out.write_bytes(base64.b64decode(item['b64_json']))
    elif 'url' in item:
        urllib.request.urlretrieve(item['url'], out)
    else:
        raise RuntimeError('no image data')

posts = []
for path in sorted(POSTS.glob('*.md')):
    text = path.read_text(encoding='utf-8')
    fm, body = parse_frontmatter(text)
    if fm is None:
        continue
    if field(fm, 'published').lower() == 'false':
        continue
    slug = path.stem
    if slug in SKIP:
        continue
    posts.append({
        'slug': slug,
        'path': path,
        'text': text,
        'fm': fm,
        'body': body,
        'title': field(fm, 'title') or slug,
        'description': field(fm, 'description'),
        'tags': tags(fm),
        'excerpt': safe_excerpt(body),
    })

print(f'TOTAL {len(posts)}')
limit = int(os.environ.get('LIMIT', '0') or '0')
if limit:
    posts = posts[:limit]
    print(f'LIMITED {len(posts)}')
manifest = []
for i, post in enumerate(posts, 1):
    slug = post['slug']
    out = OUTDIR / f'{slug}-cover-gpt-image-2-v1.png'
    print(f'[{i}/{len(posts)}] {slug} -> {out.name}', flush=True)
    if not out.exists() or out.stat().st_size < 100_000:
        attempts = 0
        while True:
            attempts += 1
            try:
                call_image(prompt_for(post), out)
                break
            except urllib.error.HTTPError as e:
                msg = e.read().decode('utf-8', errors='replace')[:500]
                print(f'HTTP_ERROR {slug} attempt={attempts} code={e.code} {msg}', flush=True)
                if attempts >= 5:
                    print(f'SKIP {slug} after {attempts} attempts', flush=True)
                    break
                sleep_for = 90 if e.code == 429 else 30 * attempts
                time.sleep(sleep_for)
            except Exception as e:
                print(f'ERROR {slug} attempt={attempts} {type(e).__name__}: {e}', flush=True)
                if attempts >= 5:
                    print(f'SKIP {slug} after {attempts} attempts', flush=True)
                    break
                time.sleep(30 * attempts)
    if not out.exists() or out.stat().st_size < 100_000:
        manifest.append({'slug': slug, 'cover': None, 'error': 'generation_failed'})
        (OUTDIR / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
        continue
    cover_value = f'/images/agnes/generated-covers-20260608/{out.name}'
    text = post['text']
    if re.search(r'^cover:\s*.*$', text, re.M):
        new_text = re.sub(r'^cover:\s*.*$', f'cover: {cover_value}', text, count=1, flags=re.M)
    else:
        new_text = text.replace('description:', f'cover: {cover_value}\ndescription:', 1)
    post['path'].write_text(new_text, encoding='utf-8')
    manifest.append({'slug': slug, 'cover': cover_value, 'bytes': out.stat().st_size})
    (OUTDIR / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'OK {slug} {out.stat().st_size} bytes', flush=True)
    time.sleep(2)

print('DONE')
print(json.dumps(manifest, ensure_ascii=False, indent=2))
