---
title: "AI API 后缀到底在说什么：/messages、/chat/completions、/responses 的真实区别"
date: "2026-06-07T12:51:18Z"
description: "一篇面向开发者的 AI API 协议地图：解释 /v1/chat/completions、/v1/messages、/v1/responses、generateContent、embeddings 和 models 的真实含义，以及配置 Base URL 时最容易踩的坑。"
cover: /images/agnes/generated-covers-20260608/ai-api-suffixes-guide-cover-gpt-image-2-v1.png
tags: ["AI研究", "API", "OpenAI", "Claude", "Gemini", "技术向"]
published: true
---

很多 AI API 的第一道门槛，不是模型，也不是价格，而是一串看起来很像、实际完全不一样的路径：

```text
/v1/chat/completions
/v1/messages
/v1/responses
/v1/embeddings
/v1/models
/v1beta/models/{model}:generateContent
/openai/v1/chat/completions
/api/v1/chat/completions
```

它们不是随便起的 URL。

这些后缀背后，其实是一套协议。协议决定请求字段叫什么，响应结构长什么样，流式输出怎么发，工具调用怎么表达，错误格式怎么返回。

所以接 AI API 时，真正要问的不是“这个模型强不强”，而是：**这个服务到底兼容哪一种协议。**

---

## 先给一张地图

可以先粗暴记成这样：

| 路径 | 协议风格 | 核心含义 |
| --- | --- | --- |
| `/v1/completions` | 旧式文本补全 | 给一段 prompt，让模型续写 |
| `/v1/chat/completions` | OpenAI Chat Completions | 给一组 messages，让模型补下一条 assistant 消息 |
| `/v1/messages` | Anthropic Messages | Claude 原生消息协议，强调 content block 和顶层 system |
| `/v1/responses` | OpenAI Responses | 更现代的统一响应对象，适合多模态、工具、Agent |
| `/v1/embeddings` | 向量接口 | 把文本转成向量，用于搜索、RAG、聚类 |
| `/v1/models` | 模型资源 | 查询账号可用模型和模型信息 |
| `/v1beta/models/{model}:generateContent` | Gemini / Google 风格 | 对某个模型资源执行内容生成方法 |

这张表比模型列表更重要。

模型 ID 只是告诉服务“用哪个模型”。接口路径才告诉 SDK“怎么说话”。

---

## `/v1` 不是模型版本

最常见的误解是：

```text
/v1 = 第一代模型
/v2 = 第二代模型
```

不是。

`/v1` 是 API 版本，不是模型版本。

API 版本约束的是：

```text
请求字段
响应字段
错误格式
鉴权方式
流式事件格式
工具调用格式
文件上传格式
```

模型版本约束的是：

```text
模型能力
上下文长度
推理能力
价格
速度
多模态能力
```

比如：

```text
API 版本：/v1
模型版本：gpt-4.1、claude-sonnet-4-5、gemini-2.5-pro
SDK 版本：openai Python SDK 1.x
协议风格：OpenAI-compatible、Anthropic-compatible、Gemini-compatible
```

这四个不是一回事。

如果厂商在同一个稳定 API 版本里随便改响应结构，所有客户端都会炸。所以新能力通常会有两种做法：要么新增字段，要么开新接口，比如 `/v1/responses`。

---

## `/v1/completions`：旧时代的文本续写

早期的大语言模型接口更像“自动续写”。

你给它一段文本：

```json
{
  "model": "text-model",
  "prompt": "Translate this sentence into Chinese: Hello, how are you?"
}
```

它继续往后写。

如果你想做对话，需要自己拼接：

```text
System: You are helpful.
User: Hello.
Assistant: Hi.
User: Explain API suffixes.
Assistant:
```

这很脆。

系统消息、用户消息、助手消息都只是字符串。模型只能靠文本猜边界。工具调用、多模态输入、结构化历史都很难优雅表达。

所以 `/v1/completions` 更像历史遗产。理解它有用，但新项目一般不该从这里开始。

---

## `/v1/chat/completions`：兼容生态最强的聊天协议

过去几年，`/v1/chat/completions` 是事实上的行业标准。

它的核心是 `messages`：

```json
{
  "model": "gpt-4.1",
  "messages": [
    {
      "role": "system",
      "content": "You are a concise technical explainer."
    },
    {
      "role": "user",
      "content": "Explain /v1/chat/completions."
    }
  ]
}
```

这里不再是一整段 prompt，而是一组有角色、有顺序的消息对象。

常见角色包括：

```text
system      系统指令
user        用户输入
assistant   模型回复
tool        工具返回结果
```

响应一般长这样：

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 5,
    "total_tokens": 15
  }
}
```

最常见的解析路径是：

```python
text = response.choices[0].message.content
```

它最大的优势不是“最新”，而是“兼容”。

很多服务都提供 OpenAI-compatible 入口：

```text
OpenAI       /v1/chat/completions
Mistral      /v1/chat/completions
xAI          /v1/chat/completions
Groq         /openai/v1/chat/completions
OpenRouter   /api/v1/chat/completions
DashScope    /compatible-mode/v1/chat/completions
```

这也是为什么很多软件只让你填三项：

```text
base_url
api_key
model
```

因为 SDK 会自动把 `/chat/completions` 拼到 base URL 后面。

---

## “OpenAI-compatible” 不等于完全兼容

这是最容易被骗的地方。

一个服务说自己兼容 OpenAI API，通常至少意味着：

```text
POST /v1/chat/completions
model
messages
temperature
max_tokens 或 max_completion_tokens
stream
choices[0].message.content
```

但它不一定完整支持：

```text
tools
tool_choice
parallel_tool_calls
response_format
JSON schema strict mode
vision input
audio input/output
logprobs
reasoning tokens
cached tokens
streaming tool-call delta
structured outputs
```

所以兼容要分层看：

```text
Level 1：普通文本聊天能跑
Level 2：流式输出正常
Level 3：工具调用格式正常
Level 4：结构化输出稳定
Level 5：多模态输入可用
Level 6：复杂 Agent 事件流和状态管理可用
```

很多廉价中转只做到 Level 1 或 Level 2。

能回一句话，不代表能接进 Agent。

---

## `/v1/messages`：Claude 的原生协议

Anthropic Claude 的核心接口是：

```text
POST /v1/messages
```

它看起来也有 `messages`，但和 OpenAI Chat Completions 不是一回事。

典型请求：

```json
{
  "model": "claude-sonnet-4-5",
  "max_tokens": 1024,
  "system": "You are a careful technical explainer.",
  "messages": [
    {
      "role": "user",
      "content": "Explain /v1/messages."
    }
  ]
}
```

最明显的区别：Claude 常把 `system` 放在顶层字段。

OpenAI Chat Completions 常见写法：

```json
{
  "messages": [
    {"role": "system", "content": "You are helpful."},
    {"role": "user", "content": "Hello."}
  ]
}
```

Anthropic Messages 常见写法：

```json
{
  "system": "You are helpful.",
  "messages": [
    {"role": "user", "content": "Hello."}
  ]
}
```

响应结构也不同：

```json
{
  "id": "msg_xxx",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Hello"
    }
  ],
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 10,
    "output_tokens": 5
  }
}
```

常见解析路径是：

```python
text = response.content[0].text
```

不是：

```python
response.choices[0].message.content
```

Claude 的 `content` 更强调 block。文本、图片、工具使用、工具结果，都可以作为不同 block 表达。

这就是为什么很多网关要做 Anthropic ↔ OpenAI 格式转换。不是换个 URL 就行，而是整个请求和响应结构都要映射。

---

## `/v1/responses`：OpenAI 新一代统一响应对象

`/v1/responses` 是 OpenAI 更现代的一套接口。

简单文本可以这样：

```json
{
  "model": "gpt-4.1",
  "input": "Explain why /v1/responses exists."
}
```

更复杂时，它会变成一套 input / output / item / tool 的结构：

```json
{
  "model": "gpt-4.1",
  "input": [
    {
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": "Search the web and summarize the result."
        }
      ]
    }
  ],
  "tools": [
    {
      "type": "web_search_preview"
    }
  ]
}
```

它解决的是 `chat/completions` 名字里的历史包袱。

`chat/completions` 本质上是在说：

```text
给我一段聊天历史，我补下一条消息。
```

但现在模型要做的事情已经不只是聊天：

```text
读取图片
处理音频
搜索网页
检索文件
调用函数
使用代码解释器
输出结构化 JSON
产生多个中间事件
维护服务端上下文
```

这些能力都塞进“补全一条聊天消息”里，会越来越别扭。

Responses API 更像：

```text
给我一个任务、上下文和可用工具。
返回一个完整 response，里面可以有文本、工具调用、中间事件和最终结果。
```

响应可能是：

```json
{
  "id": "resp_xxx",
  "object": "response",
  "output": [
    {
      "type": "message",
      "content": [
        {
          "type": "output_text",
          "text": "Hello"
        }
      ]
    }
  ]
}
```

SDK 里通常可以直接取：

```python
text = response.output_text
```

如果是复杂工具流，就需要遍历 `response.output`。

---

## Chat Completions 和 Responses 怎么选

我的判断很简单。

如果只是做普通聊天、简单问答、兼容第三方模型：

```text
优先 /v1/chat/completions
```

理由是生态最好，代理最多，前端、网关、RAG 框架、Coding IDE 都支持。

如果是新项目，并且主要接 OpenAI，同时需要现代能力：

```text
优先研究 /v1/responses
```

尤其是你要做：

```text
工具调用
网页搜索
文件搜索
多模态输入
结构化输出
复杂流式事件
Agent workflow
服务端状态
```

这类项目继续用 Chat Completions 也能做，但会越来越像在旧房子里加电梯。能装，别扭。

---

## Gemini 为什么是 `models/{model}:generateContent`

Google Gemini 的 REST 路径经常长这样：

```text
POST /v1beta/models/{model}:generateContent
```

或者：

```text
POST /v1/models/{model}:generateContent
```

这个风格和 OpenAI、Anthropic 不一样。

拆开看：

```text
/v1beta          API 版本
/models/{model}  模型资源
:generateContent 对这个模型资源执行 generateContent 方法
```

它更像 Google API 的资源方法风格。

Gemini 的数据结构也不同。它通常使用 `contents` 和 `parts`：

```text
OpenAI Chat Completions: messages -> role + content
Anthropic Messages:      messages -> role + content blocks
Gemini:                  contents -> role + parts
```

所以接 Gemini 时，不要先入为主地把它当 OpenAI Chat Completions。

很多平台会额外提供 OpenAI-compatible 入口，但那是“兼容层”，不是 Gemini 原生协议本身。

---

## `/v1/embeddings`：它不是聊天接口

`/v1/embeddings` 经常和聊天 API 一起出现，但它不是用来生成回复的。

它负责把文本变成向量：

```json
{
  "model": "text-embedding-3-large",
  "input": "AI API suffixes explained"
}
```

返回的是一串浮点数：

```json
{
  "data": [
    {
      "embedding": [0.0123, -0.0456, 0.0789]
    }
  ]
}
```

Embedding 常用于：

```text
语义搜索
RAG 检索
相似度匹配
聚类
推荐
去重
分类
```

典型 RAG 流程是：

```text
1. 用 /v1/embeddings 把文档切片转成向量
2. 存入向量数据库
3. 用户提问时，把问题也转成向量
4. 检索最相似的文档片段
5. 把片段塞进聊天或 responses 接口生成答案
```

Embedding 负责找资料。

聊天接口负责写答案。

---

## `/v1/models`：调试模型名的第一步

`/v1/models` 通常用于列出可用模型：

```text
GET /v1/models
GET /v1/models/{model}
```

它能帮你确认：

```text
账号能看到哪些模型
模型 ID 到底叫什么
是不是拼错模型名
当前 key 是否被分组限权
聚合平台是否隐藏了某些模型
```

但也别迷信 `/models`。

很多聚合平台的模型列表不完整，或者根据 key、分组、余额动态过滤。列表里没有，不一定绝对不能调；列表里有，也不代表路由质量稳定。

真正判断可用性，还是要发一条最小请求。

---

## Base URL 和 Endpoint 最容易填错

很多报错不是 key 坏了，而是 URL 填错了。

如果软件让你填：

```text
Base URL
API Base
OpenAI Base URL
```

通常填到 `/v1` 为止：

```text
https://api.openai.com/v1
https://api.groq.com/openai/v1
https://openrouter.ai/api/v1
```

不要填完整 endpoint：

```text
https://api.openai.com/v1/chat/completions
```

因为 SDK 会自动拼接 `/chat/completions`。

你如果把完整 endpoint 填进 base URL，最终请求可能变成：

```text
https://api.openai.com/v1/chat/completions/chat/completions
```

然后 404。

但如果软件让你填的是：

```text
Endpoint
Full URL
Request URL
```

那就要填完整路径：

```text
https://api.openai.com/v1/chat/completions
```

经验规则：

```text
Base URL / API Base：填到协议根，比如 /v1
Endpoint / Full URL：填完整请求路径
Provider：选协议类型，比如 OpenAI、Anthropic、Gemini
Model：填模型 ID，不要填 URL
```

---

## 流式输出也不统一

很多接口都支持：

```json
{"stream": true}
```

但事件格式不一样。

OpenAI Chat Completions 常见 SSE：

```text
data: {"choices":[{"delta":{"content":"Hel"}}]}
data: {"choices":[{"delta":{"content":"lo"}}]}
data: [DONE]
```

Anthropic Messages 会有自己的事件：

```text
event: message_start
event: content_block_start
event: content_block_delta
event: content_block_stop
event: message_stop
```

Responses API 也有自己的 response event 类型。

所以“支持 stream”只说明它会分块返回，不说明你的解析器一定能用。

---

## 工具调用：Agent 应用的分水岭

普通聊天只要输出文本。

Agent 应用需要模型调用工具。

例如：

```text
查一下今天武汉天气，再决定要不要带伞。
```

模型实际要完成：

```text
1. 判断需要天气工具
2. 生成 tool call
3. 工具返回天气数据
4. 模型读取工具结果
5. 生成最终建议
```

不同协议表达工具调用的方式不一样：

```text
Chat Completions：tools、tool_calls、tool role
Anthropic Messages：tool_use / tool_result content block
Responses：工具调用和工具结果作为 response item / output item
```

这就是为什么“能聊天”不能代表“能接 Agent”。

如果要做复杂 Agent，至少要检查：

```text
工具调用格式是否稳定
是否支持并行工具调用
是否支持流式工具调用 delta
是否支持结构化输出
是否支持服务端状态
是否支持内置工具
错误恢复是否清楚
```

便宜中转最常翻车的地方就在这里。

---

## 第三方路径里的 `/openai`、`/api`、`/compatible-mode`

很多第三方服务不是 OpenAI，但路径里会出现 OpenAI：

```text
https://api.groq.com/openai/v1/chat/completions
https://openrouter.ai/api/v1/chat/completions
https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
```

这些前缀通常是平台自己的命名空间。

意思是：

```text
这里不是 OpenAI 官方服务。
但这里提供一套接近 OpenAI 协议的兼容入口。
```

所以 OpenRouter 的 base URL 不是：

```text
https://openrouter.ai/v1
```

而是：

```text
https://openrouter.ai/api/v1
```

Groq 的 base URL 也不是：

```text
https://api.groq.com/v1
```

而是：

```text
https://api.groq.com/openai/v1
```

路径里的每一层都可能有意义。不要凭感觉删。

---

## 一张实用对照表

| 平台 | 常见接口 | 协议风格 | 适合场景 |
| --- | --- | --- | --- |
| OpenAI | `/v1/responses` | Responses | 新项目、多模态、工具、Agent |
| OpenAI | `/v1/chat/completions` | Chat Completions | 普通聊天、兼容生态 |
| Anthropic | `/v1/messages` | Messages | Claude 原生能力 |
| Gemini | `/v1/models/{model}:generateContent` | generateContent | Gemini 稳定接口 |
| Gemini | `/v1beta/models/{model}:generateContent` | generateContent Beta | 预览能力 |
| OpenAI / 多家兼容服务 | `/v1/embeddings` | Embeddings | RAG、搜索、向量化 |
| OpenAI / 多家兼容服务 | `/v1/models` | Models | 查询模型列表 |
| Groq | `/openai/v1/chat/completions` | OpenAI-compatible | 高速推理，复用 OpenAI SDK |
| OpenRouter | `/api/v1/chat/completions` | OpenAI-compatible aggregator | 多模型聚合路由 |

---

## 最后的选择规则

如果你只是接一个聊天软件：

```text
OpenAI-compatible + /chat/completions 就够了。
```

如果你要接 Claude 官方能力：

```text
用 /v1/messages，别硬套 OpenAI 解析路径。
```

如果你要做 OpenAI 新项目，尤其是工具、多模态、Agent：

```text
优先看 /v1/responses。
```

如果你要接 Gemini：

```text
理解 contents / parts / generateContent，不要直接套 messages。
```

如果你要调试第三方中转：

```text
先确认 Base URL，再查 /models，最后发最小请求实测。
```

如果你要判断一个 API 能不能接进 Agent：

```text
不要只测“Hello”。
要测 stream、tool call、structured output、vision、长上下文和错误格式。
```

API 后缀不是装饰。

它是模型服务和你的程序之间的语法。语法没对，模型再强也只是隔着玻璃说话。
