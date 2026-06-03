---
title: "手把手自建 Cloudflare 临时邮箱：零成本、无限账号、支持收发"
date: "2026-06-02T22:30:00Z"
description: "基于 Cloudflare Workers + D1 + KV + Email Routing 搭建个人临时邮箱系统，支持收发、TG 通知、IMAP/SMTP，小白也能看懂"
cover: "/images/agnes/temp-email-cover.png"
tags: ["Cloudflare", "临时邮箱", "自建教程", "技术向"]
published: true
---

> 不管你是刷注册、批量接码、还是想要一个不被广告污染的干净收件箱，**自建临时邮箱**都是最佳选择。
>
> 市面上那些公共临时邮箱（10分钟邮箱、guerrillamail）—— 域名被各大平台拉黑是常态，你收不到验证码，它还把你的验证邮件喂给不知道什么人看。
>
> 自己搭一个，域名是自己的，数据是自己的，收件速度自己的。

---

## 你需要准备什么

| 项目 | 说明 |
|------|------|
| 一个域名 | 免费或年抛均可，推荐 [免费域名盘点](/articles/free-domain-list) 里的服务商 |
| Cloudflare 账号 | [免费注册](https://dash.cloudflare.com/sign-up) |
| 一点点耐心 | 跟着步骤走，不超过 20 分钟 |

---

## 项目简介

我们要部署的是一个基于 **Cloudflare Workers + D1 + KV + Email Routing** 的临时邮箱系统。

**能力清单：**

| 功能 | 是否支持 |
|:----|:--------:|
| 接收邮件（任意域名邮箱） | ✅ |
| 转发到个人邮箱 | ✅ |
| 发送邮件（通过 Resend） | ✅ |
| Telegram Bot 通知 | ✅ |
| IMAP / SMTP 协议 | ✅ |
| 管理后台 Web UI | ✅ |
| 无限子地址 | ✅ |

而且 **完全免费**（Cloudflare 免费计划足够用）。

---

## 第一步：域名托管到 Cloudflare

### 1.1 准备域名

推荐从 [免费域名盘点](/articles/free-domain-list) 里选一个——DigitalPlat 的 `us.kg` / `xx.kg` 或者 Desec 的 `dedyn.io` 都不错，免费注册就能用。

> 不想折腾免费域名？年抛党也可以选阿里云 / 腾讯云首年的 `.xyz` 或 `.cloud`，几块钱就能拿下。

### 1.2 添加域名到 Cloudflare

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击 **添加域名**，输入你的域名
3. Cloudflare 会扫描现有 DNS 记录（新域名没有，直接下一步）
4. 选择 **Free 计划**
5. 记下 Cloudflare 给你的 **两个 DNS 服务器地址**（类似 `nile.ns.cloudflare.com`）

### 1.3 修改域名的 DNS 服务器

去你域名所在的管理后台（DigitalPlat / Desec / 阿里云 / 腾讯云），找到域名管理 → DNS 服务器 → 改成 Cloudflare 给的那两个地址。

> 改完后等几分钟到十几分钟，Cloudflare 状态会从 **待处理** 变成 **有效**。

---

## 第二步：配置电子邮件路由

### 2.1 开启 Email Routing

在 Cloudflare 控制台 → 你的域名 → **电子邮件** → **Email Routing** → 开启

### 2.2 添加目标邮箱

1. 点击 **目标地址** → **添加地址**
2. 输入你常用的邮箱（Gmail / QQ / Outlook 都行）
3. 去那个邮箱查收验证邮件，点击验证链接

### 2.3 配置 Catch-All 规则

这是**最关键的一步**：所有发给 `*@你的域名` 的邮件，都转发到后端 Worker。

1. 在 Email Routing 页面 → **Catch-All 地址**
2. 选择 **发送到 Worker**
3. 选择你即将部署的后端 Worker（下一节创建）

---

## 第三步：部署临时邮箱项目

### 方式 A：手动部署（推荐，兼容性最好）

#### 3.1 克隆项目

```bash
git clone https://github.com/dreamhunter2333/cloudflare_temp_email.git
cd cloudflare_temp_email
```

#### 3.2 安装依赖

```bash
npm install
```

#### 3.3 配置 wrangler.toml

编辑 `wrangler.toml`，找到以下配置项：

```toml
# 你的域名（用于接收邮件）
MAIL_DOMAIN = "yourdomain.com"
# 管理员密码（登录后台用）
ADMIN_PASSWORD="your-s...word"
# 管理员的接收邮箱
ADMIN_EMAIL = "you@gmail.com"
```

> 还有更多高级配置项（TG Bot Token、Resend API Key 等），详见项目 README。

#### 3.4 登录 Cloudflare

```bash
npx wrangler login
```

浏览器会自动打开 Cloudflare 授权页面，确认即可。

#### 3.5 创建 D1 数据库

```bash
npx wrangler d1 create temp-email-db
```

创建后会输出类似 `database_id = "xxxx-xxxx-xxxx"` 的内容，把它复制到 `wrangler.toml` 的 D1 配置中。

#### 3.6 创建 KV 命名空间

```bash
npx wrangler kv:namespace create TEMP_EMAIL_KV
```

同样把输出的 ID 填入 `wrangler.toml`。

#### 3.7 部署

```bash
npx wrangler deploy
```

#### 3.8 创建数据库表

```bash
npx wrangler d1 execute temp-email-db --file=./schema.sql
```

#### 3.9 构建前端

```bash
npm run build:frontend
npx wrangler pages deploy ./frontend/dist
```

### 方式 B：Windows 一键脚本（快速省心）

如果你在用 Windows，有社区大佬写了全自动 PowerShell 脚本：

1. 确保已安装 **Node.js**、**PowerShell**、**Corepack**
2. 域名必须**已经托管到 Cloudflare**（第一步已完成）
3. 运行以下脚本：

```powershell
# 下载部署脚本
iwr -Uri https://raw.githubusercontent.com/cnlion/cloudflare-temp-email-deploy/main/deploy-one-click.ps1 -OutFile deploy-one-click.ps1

# 运行
pwsh -File .\deploy-one-click.ps1
```

脚本会自动完成：
- 环境预检
- 下载官方源码
- 配置变量参数
- 创建 D1 和 KV
- 初始化数据库
- 构建前端 + 部署两个 Worker

> 唯一需要手动操作的是：在 Email Routing 中开启 Catch-All 并指向后端 Worker（参考第二步）。

---

## 第四步：验证与使用

### 4.1 测试收件

1. 打开部署后的管理后台 URL
2. 用设置的管理员密码登录
3. 用任意邮箱给你的 `test@你的域名` 发一封邮件
4. 管理后台应该秒收 ✅

### 4.2 配置 TG 通知（可选）

在 `wrangler.toml` 中添加：

```toml
TG_BOT_TOKEN="你的 Token"
TG_CHAT_ID = "你的 Chat ID"
```

重新部署后，每次收到新邮件，TG 会自动推送。

### 4.3 开启发件功能（可选）

项目支持通过 Resend 发送邮件：

1. 注册 [Resend](https://resend.com)（免费额度 3000 封/月）
2. 获取 API Key
3. 在 `wrangler.toml` 中配置 `RESEND_API_KEY`
4. 部署后就可以发件了

---

## 实测体验

实际感受：

| 维度 | 体验 |
|:----|:----|
| 收件速度 | 几乎是实时的，Email Routing + Worker 延迟 < 2 秒 |
| 稳定性 | 长期运行稳定，从未挂过 |
| 容量限制 | Cloudflare 免费计划 D1 5GB、Email 1000封/天，个人完全够用 |
| 垃圾邮件 | 没有（因为你的域名只有你知道） |

**避坑指南：**
- 域名如果之前在 Cloudflare 被别的项目绑过，记得先清理旧的 DNS / Worker / Pages
- 年抛域名不要用来注册重要平台
- 如果 `wrangler deploy` 报 `429 Too Many Requests`，等一分钟再试
- macOS 下的一键脚本可能有兼容问题，建议用手动部署

---

## 总结

Cloudflare 临时邮箱是目前**性价比最高的自建邮箱方案**——零成本、无需 VPS、10 分钟部署完成。

| 对比方案 | 成本 | 隐私 | 稳定性 | 可定制 |
|:---------|:---:|:----:|:------:|:-----:|
| 公共临时邮箱 | 免费 | ❌ | ❌ | ❌ |
| 自建 VPS 邮箱 | 💰 | ✅ | ✅ | ✅ |
| **Cloudflare 方案** | **免费** | **✅** | **✅** | **✅** |
| Gmail 别名 | 免费 | ❌ | ✅ | ❌ |

如果你是注册狂魔、羊毛猎人、或者只是想要一个干净的收件箱，**这可能是你今年花得最值的 10 分钟**。
