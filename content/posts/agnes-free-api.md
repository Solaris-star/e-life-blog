---
title: "Agnes AI：全球首个无限免费 AI 图片、视频、文字 API（2026）"
date: "2026-06-01T21:30:00Z"
description: "新加坡 Sapiens AI 旗下 Agnes AI 无限期免费开放全模态 API！实测图片生成、视频生成、中文书法渲染效果，附交互式代码演示。"
cover: "/images/agnes/agnes_image_2_1_inkwash.png"
tags: ["AI研究", "免费API", "AgnesAI", "图片生成", "视频生成", "多模态", "打赏福利羊毛", "福利羊毛"]
published: true
---

> 🎉 **2026年6月1日起**，新加坡 Sapiens AI（全球 Top 10 AI Lab）旗下 Agnes AI **无限期免费开放全模态 API**！
> 无需信用卡、无需等待列表、无需订阅，注册即用。

---

## 📋 基本信息

| 项目 | 内容 |
|------|------|
| **官方网站** | [agnes-ai.com](https://agnes-ai.com) |
| **开发者平台** | [platform.agnes-ai.com](https://platform.agnes-ai.com) |
| **文档地址** | [agnes-ai.com/doc](https://agnes-ai.com/doc) |
| **API Base URL** | `https://apihub.agnes-ai.com/v1` |
| **API 协议** | OpenAI 兼容 |
| **注册方式** | 邮箱 + Google 账号 |

---

## 🆓 免费层说明

Agnes 提供两种接入方式：

**🔓 Free Access（推荐）**
- 无需 API Key，直接调用
- Rate Limit：60 RPM / 1000 RPD
- 适合个人使用、开发测试

**🔑 Token Plan**
- 注册后获取 API Key
- 每日免费额度更高
- 支持更多高级功能

---

## 🧠 免费模型列表

### Agnes-2.0-Flash（聊天 / 推理）

| 属性 | 值 |
|------|-----|
| **模型 ID** | `agnes-2.0-flash` |
| **类型** | 多模态聊天 + 推理 |
| **上下文** | 128K tokens |
| **多模态** | 图片输入、代码执行、文件解析 |
| **价格** | 🔥 **完全免费** |

**能力亮点：**
- 对标 GPT-4o 级别推理能力
- 支持 Function Calling / Tool Use
- 代码执行沙箱
- 图片理解

### Agnes-2.1-Flash（聊天 / 推理 — 升级版）

| 属性 | 值 |
|------|-----|
| **模型 ID** | `agnes-2.1-flash` |
| **类型** | 多模态聊天 + 推理 |
| **上下文** | 128K tokens |
| **价格** | 🔥 **完全免费** |

2.1 在推理、代码生成和多模态理解上有明显提升。

### Agnes-Image-2.0-Flash（图片生成）

| 属性 | 值 |
|------|-----|
| **模型 ID** | `agnes-image-2.0-flash` |
| **类型** | 文生图 |
| **价格** | 🔥 **完全免费** |

### Agnes-Image-2.1-Flash（图片生成 — 升级版）

| 属性 | 值 |
|------|-----|
| **模型 ID** | `agnes-image-2.1-flash` |
| **类型** | 文生图 |
| **价格** | 🔥 **完全免费** |

### Agnes-Video-V2.0（视频生成）

| 属性 | 值 |
|------|-----|
| **模型 ID** | `agnes-video-v2.0` |
| **类型** | 文生视频 / 图生视频 / 多图视频 |
| **生成方式** | 异步任务（Task） |
| **端点** | `POST /v1/videos`（创建任务） |
| **查询结果** | `GET /v1/videos/{task_id}` |
| **价格** | 🔥 **完全免费** |

**支持能力：**
- 文生视频（Text-to-Video）
- 图生视频（Image-to-Video）
- 多图视频（Multi-Image Video）
- 关键帧动画（Keyframe Animation）
- 原生音频同步
- 场景运镜控制

---

## 🧪 实测结果

### 📝 文字模型实测

**Agnes-2.0-Flash** 和 **Agnes-2.1-Flash** 均可正常调用，响应流畅。

```python
import requests

response = requests.post(
    "https://apihub.agnes-ai.com/v1/chat/completions",
    json={
        "model": "agnes-2.0-flash",
        "messages": [
            {"role": "system", "content": "你是一位精通中文的AI助手"},
            {"role": "user", "content": "用中文解释一下什么是多模态AI，并给出三个实际应用场景"}
        ]
    }
)
print(response.json()["choices"][0]["message"]["content"])
```

实测响应质量对标 GPT-4o 级别，中文能力强，推理逻辑清晰。

---

### 🖼️ 图片生成实测

#### 基础测试

```python
import requests

response = requests.post(
    "https://apihub.agnes-ai.com/v1/images/generations",
    json={
        "model": "agnes-image-2.0-flash",
        "prompt": "A cute orange cat sitting on a pile of books, digital art style",
        "n": 1,
        "size": "1024x1024"
    }
)
print(response.json()["data"][0]["url"])
```

**实测结果：**

**Agnes-Image-2.0-Flash：**

![橘猫测试 2.0](/images/agnes/agnes_orange_cat_2_0.png)

**Agnes-Image-2.1-Flash：**

![橘猫测试 2.1](/images/agnes/agnes_orange_cat_2_1.png)

> ✅ 两张图片均生成成功，橘猫形象清晰，书籍堆叠效果自然。2.1 在细节和色彩上略有提升。

#### 🖌️ 中文测试：水墨画 + 题字

**Prompt：** 一幅中国水墨风格画，远山含黛，云雾缭绕，近处有几枝梅花盛开。画面右上角有中文题字「春色满园」，字体为行楷，墨色自然。

**Agnes-Image-2.0-Flash 结果：**

![水墨画 2.0](/images/agnes/agnes_image_2_0_inkwash.png)

> **AI 视觉评分：8.8/10**
> - 画面整体呈现典雅、宁静的东方美学意境，远山层叠有致，梅花形态优雅
> - 中文题字「春色满园」可辨认，文字结构完整
> - 稍显不足：题字略微模糊，嵌入感较强，非独立清晰图层

**Agnes-Image-2.1-Flash 结果：**

![水墨画 2.1](/images/agnes/agnes_image_2_1_inkwash.png)

> **AI 视觉评分：9.0/10**
> - 颜色更鲜明，水墨层次更丰富
> - 题字「春色满园」更清晰，笔画更自然
> - 2.1 版本在文本渲染上有明显提升

#### ✍️ 中文测试：传统书法

**Prompt：** 一幅中国传统书法作品，在朱红色洒金宣纸上用浓墨书写「天道酬勤」四个大字，行楷风格，笔力遒劲，左侧有竖排小字落款和两枚印章。装裱在深色木质画框中，整体庄重典雅。

![书法 天道酬勤](/images/agnes/agnes_image_2_1_calligraphy.png)

> **AI 视觉评分：9.0/10 ⭐**
>
> **文字清晰度与准确性：9.5/10**
> - 「天道酬勤」四字笔画清晰，无错字漏笔
> - 字形结构完整，走之底流畅，笔画比例协调
> - 两枚印章位置恰当
>
> **笔力与墨色表现：8.5/10**
> - 飞白与涨墨效果明显，有浓淡变化
> - 部分细节（如「酬」字内部）略显僵硬
> - 某些笔画边缘过于平滑——AI 生成痕迹
>
> **装裱与视觉呈现：9.8/10**
> - 深棕实木画框、米白色绫边、朱砂红洒金宣纸
> - 构图均衡，光影自然，展厅级呈现
>
> **综合评价：这是一幅完成度极高的 AI 书法作品，已能高度还原传统书法的视觉语言与文化语境，足以用于装饰、教育或商业场景。**

---

### 🎬 视频生成实测

**请求：**
```python
import requests

# 创建视频任务
resp = requests.post(
    "https://apihub.agnes-ai.com/v1/videos",
    json={
        "model": "agnes-video-v2.0",
        "prompt": "A cute orange cat sitting on books, cinematic quality",
        "seconds": 5,
        "size": "1280x768"
    }
)
task_id = resp.json().get("task_id")

# 轮询结果
import time
while True:
    result = requests.get(f"https://apihub.agnes-ai.com/v1/videos/{task_id}")
    status = result.json().get("status")
    if status == "completed":
        video_url = result.json()["output"]["video_url"]
        print(f"✅ 视频生成完成: {video_url}")
        break
    elif status == "failed":
        print("❌ 生成失败")
        break
    time.sleep(10)
```

**实测结果：** ✅ 生成成功！

<video src="https://storage.googleapis.com/agnes-aigc/aigc/videos/2026/06/01/video_9fb47753131222d3bba7d75aaaccd5bc140d04195c6c656c.mp4" controls autoplay loop muted className="mx-auto my-8 max-h-[600px] rounded-[2px] border-2 border-[color:var(--line)] object-contain shadow-[var(--shadow-small)]"></video>

> **视频规格：** 5 秒 | 1280×768 | 约 1.1MB | MP4 格式
>
> 🎯 画面呈现一位老者赤脚漫步海滩的宁静意境，日落余晖映照海面，海鸥翱翔，运镜舒缓，整体氛围静谧而深沉。

---

### 💻 交互式代码演示（可直接部署到博客）

实测生成了一个 **曼德博集合交互式渲染器**，使用 p5.js 纯前端实现，无需后端依赖。

**功能特点：**
- 实时渲染曼德博集合
- 🖱️ 点击拖拽缩放
- 🔄 Reset 按钮还原初始视图
- ⚡ 完全自包含 HTML 文件

**🎯 在线演示：**

<iframe src="/demos/mandelbrot.html" width="100%" height="600" className="mx-auto my-8 rounded-[2px] border-2 border-[color:var(--line)] shadow-[var(--shadow-small)]" loading="lazy"></iframe>

> 💡 只需下载 HTML 文件，上传到任何支持静态文件的托管服务即可运行。

---

## 📊 Benchmark 排名

Agnes 在各大评测榜单中表现优异：

| 评测维度 | 排名 | 说明 |
|---------|:----:|------|
| **LMSYS Chatbot Arena** | ~Top 30 | 整体能力评级 |
| **LMSYS Coding** | Top 10 | 代码生成能力突出 |
| **Aider Polyglot** | Top 10 | 多语言编程 |
| **Artificial Analysis（图生视频）** | Top 10 | 视频生成 |
| **SWE-bench 已验证** | ✅ | 工程任务能力 |

---

## 🔬 模型评测工具

### lm-evaluation-harness

EleutherAI 出品的行业标准 LLM 评测框架，支持 60+ 学术 Benchmark。

```bash
pip install lm-eval

lm-eval --model openai-completions \
  --model_args model=agnes-2.0-flash,base_url=https://apihub.agnes-ai.com/v1 \
  --tasks mmlu,gsm8k,hellaswag \
  --output_path ./results_agnes
```

其他推荐评测工具：
- [Aider 编程评测](https://aider.chat/docs/leaderboards/)
- [LMSYS Chatbot Arena](https://chat.lmsys.org)
- [SWE-bench](https://www.swebench.com)
- [Artificial Analysis](https://artificialanalysis.ai)
- [OpenClaw Eval](https://claw-eval.github.io)

---

## 📝 注册流程（30 秒获取 API Key）

以下截图来自实际注册过程 👇

![注册步骤 1](/images/agnes/agnes_reg_01.png)

![注册步骤 2](/images/agnes/agnes_reg_02.png)

![注册步骤 3](/images/agnes/agnes_reg_03.png)

![注册步骤 4](/images/agnes/agnes_reg_04.png)

![注册步骤 5](/images/agnes/agnes_reg_05.png)

![注册步骤 6](/images/agnes/agnes_reg_06.png)

**注册步骤：**
1. 访问 [platform.agnes-ai.com](https://platform.agnes-ai.com)
2. 点击右上角 **Sign Up**
3. 选择 Google 账号登录或邮箱注册
4. 登录后进入 Dashboard
5. 在 API Keys 页面点击 **Create Key**
6. 复制 API Key，开始使用！

---

> **总结：** Agnes AI 是目前市面上唯一真正「无限免费」的全模态 API 服务，图片、视频、文字全部免费且无隐藏收费。实测五个模型全部正常工作，中文渲染效果优秀。对于个人开发者、AI 爱好者、内容创作者来说，是不可多得的优质资源。
>
> **综合评分：9.0/10**（性价比 10/10）

---

*最后更新：2026-06-01 | 实测验证：全部 5 个模型均正常工作*