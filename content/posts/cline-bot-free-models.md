---
title: "Cline Bot：免费调用 m3 / MiMo-V2.5 / DSv4f，支持创建 Key 直接调用"
date: "2026-06-07T00:00:00Z"
description: "Cline Bot 上线三个免费模型：MiniMax M3、小米 MiMo-V2.5、DeepSeek V4 Flash，全部 1M 上下文，注册即送额度，Google 登录无需手机号，直接创建 API Key 就能用。"
cover: /images/agnes/generated-covers-20260608/cline-bot-free-models-cover-gpt-image-2-v1.png
tags: ["福利羊毛", "免费API", "Cline", "AI编程"]
published: true
---

## 简介

**Cline Bot** 是一个提供 AI 模型 API 的服务平台，最近上线了三个免费模型，全部支持 **1M token 上下文**，注册后直接创建 API Key 就能用，无需反代、无需复杂配置。

---

## 免费模型列表

| 模型 | 缩写 | 提供商 | 上下文 | 定位 |
|------|------|--------|--------|------|
| `minimax/minimax-m3` | **m3** | MiniMax | **1M** | 高性能文本/推理模型 |
| `xiaomi/mimo-v2.5` | **mimo-v2.5** | 小米 | **1M** | 原生全模态模型（文字+图像+视频） |
| `deepseek/deepseek-v4-flash` | **dsv4f** | DeepSeek | **1M** | 284B MoE 高效推理模型 |

三个模型都支持 1M token 上下文，远超市面上常见的 256K，对于 Cline 这类需要长上下文的 AI 编程场景非常实用。

---

## 注册与使用

### 1. 注册

打开 [app.cline.bot/dashboard](https://app.cline.bot/dashboard)

- 支持 **Google 登录**，无需手机号
- 注册即送 **$0.5 额度**

### 2. 创建 API Key

登录后在 Dashboard 创建 API Key

- **API 端点**: `https://api.cline.bot/api/v1`
- **格式**: 标准 OpenAI 兼容格式

### 3. 调用示例

```bash
curl https://api.cline.bot/api/v1/chat/completions \
  -H "Authorization: Bearer sk-你的key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "minimax/minimax-m3",
    "messages": [{"role": "user", "content": "你好"}],
    "stream": false
  }'
```

### 4. 在 Cline 中使用

在 Cline VS Code 插件的设置中配置：

- **API Provider**: OpenAI Compatible
- **Base URL**: `https://api.cline.bot/api/v1`
- **API Key**: 你创建的 Key

---

## 关于这三个模型

### MiniMax M3

MiniMax 推出的高性能文本模型，擅长推理和文本生成，1M 上下文窗口让它能一次性处理超长文档或对话历史。

### 小米 MiMo-V2.5

小米自研的原生全模态模型，支持文本、图像、视频理解。在 agent 任务上有 Pro 级别的表现，而推理成本只有一半。适合需要多模态理解的场景。

### DeepSeek V4 Flash

DeepSeek 的效率优化 MoE 模型，284B 总参数量、13B 激活参数，1M 上下文窗口。设计目标是快速推理和高吞吐，同时保持较强的推理和编程能力。

---

## 在 NewAPI 中配置

也可以把这三个模型加入 NewAPI 统一管理：

1. 新增渠道 → OpenAI 兼容类型
2. **Base URL**: `https://api.cline.bot/api/v1`
3. **Key**: 你创建的 API Key
4. **Models**: `minimax/minimax-m3,xiaomi/mimo-v2.5,deepseek/deepseek-v4-flash`
5. 插入 ability 记录并重启容器

---

## 注意事项

- ⚠️ 需要 **Google 账号** 登录
- 💰 初始额度 $0.5，用完后可能需充值
- 📱 手机客户端可能不会自动获取模型列表，需要手动添加
- 🔄 目前免费，但未来可能调整定价策略
- 🎯 特别适合：Cline 编程辅助、长上下文推理、多模态理解任务
