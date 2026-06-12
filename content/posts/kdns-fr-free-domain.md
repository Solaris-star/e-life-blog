---
title: 挖到一个永久免费 kdns.fr 二级域名 + 容器，连 VPS 都省了
date: 2026-06-08
description: Katabump 免费送你 kdns.fr 二级域名 + 永久免费的 Node.js/Python 容器，还能托管 Cloudflare、部署 TG Bot 和代理
cover: /images/agnes/generated-covers-20260608/kdns-fr-free-domain-cover-gpt-image-2-v1.png
tags:
  - 福利羊毛
published: true
---

说实话，**免费的东西见过不少，但免费给域名还给容器的，真不多见**。

今天说的这个 **Katabump**，一个平台送你两样：

- 一个 **kdns.fr 的二级域名**
- 一个 **永久免费的 Node.js / Python 容器**

还能托管到 Cloudflare，部署 TG Bot、挂代理、跑 sing-box。

不多说，地址先扔这 👇

> 官网：https://dashboard.katabump.com
> 自动续期工具：https://github.com/XCQ0607/katabump

---

## 🎁 到底免费拿什么

**域名部分：**

- **kdns.fr** 二级域名一个（法国 .fr 后缀，少见）
- 可以绑到 **Cloudflare** 管 DNS
- **建多少个没限制**，随便薅

**容器部分：**

- **永久免费** 的 Node.js 环境
- **永久免费** 的 Python 环境
- 不限时，**真的不要钱**

**还能这么玩：**

- 部署 **TG Bot**
- 跑 **sing-box 代理**
- 套 Cloudflare CDN 加速
- 当个人主页 / 导航站 / 短链接

一个服务，顶你一个 **5 刀的 VPS**。

---

## 🔧 怎么上手

简单到没门槛：

1. 打开 https://dashboard.katabump.com **注册**
2. 拿到你的 **kdns.fr 子域名**
3. 选 Node.js 或 Python，**部署你的服务**
4. 想加速？域名托管到 **Cloudflare**

三步走完，搞定 👇

![dashboard](/images/agnes/kdns-fr/dashboard-screenshot.png)

---

## ⚠️ 唯一的坑

这服务虽然是 **"永久免费"**，但不是真的一劳永逸。

它有 **定期续期机制**——大概每 7 天要手动点一次续期。不续？服务器回收。

**但别慌。**

社区大佬已经写好了自动续期工具：

> [XCQ0607/katabump](https://github.com/XCQ0607/katabump)
>
> Playwright + CDP 模拟浏览器操作，能**自动绕过 Cloudflare Turnstile 验证码**

支持两种跑法：

**推荐：GitHub Actions**
- Fork 仓库
- 加一个 `USERS_JSON` Secret
- 可选 Telegram 通知推送
- Actions 每天 UTC 00:00 自动跑
- **设完就不用管了**

**调试：本地跑**
- Node.js v18+
- 配置 `login.json`
- 一行命令启动

![github-repo](/images/agnes/kdns-fr/github-repo.png)

---

## 🤔 适合谁

**建议上车的：**
- 想白嫖一个免费域名做测试
- 想部署 TG Bot 但不想买 VPS
- 玩 sing-box 的代理党
- 域名收藏癖（反正不限量）

**不太适合的：**
- 真要跑生产大项目的
- 对数据安全要求极高的
- 连自动续期都懒得配的（那确实）

---

## 最后说两句

**"永久免费 + 续期"** 是这类服务商的经典套路——赚的就是你忘了续、释放资源。

配上 GitHub Actions 自动续期之后，**这服务对你就真的是永久免费了**。

而且 kdns.fr 是个法国域名，.fr 后缀比 .com 稀有很多，拿来当个人主页或者短链接都挺能装的。

社区里已经有人薅了一大把了 🌚

你要是也搞上了，**记得托管到 Cloudflare 开启 CDN**——免费的加速不用白不用。
