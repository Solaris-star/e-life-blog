---
title: ChatGPT 无限Team最后一舞——随便薅走奥特曼百万美金Token
date: 2026-06-08
description: OpenAI Team 的 SSO 接入不检查许可证，域名对上就能进，不计费。一个 $25/月的 Team 拉几百个人跑无限 Token，号商圈欠款 180 万美金。教你两种方法。
cover: /images/agnes/generated-covers-20260608/chatgpt-team-unlimited-cover-gpt-image-2-v1.png
tags:
  - AI研究
  - ChatGPT
  - OpenAI
  - 漏洞
  - 免费
  - 福利羊毛
published: true
---

![cover_card](/images/agnes/chatgpt-team-unlimited/cover_card.png)

---

**TL;DR:** OpenAI 的 Team 套餐有一个天大的漏洞——SSO 接入不检查许可证，域名对上就能进，不计费。你能用一个 $25/月的 Team 拉几百个人进来跑无限 Token。

开搞之前，先说说这事儿的「前世今生」👇

---

## 🧵 懂的都懂：年初的幽灵席位

不是第一次了。今年年初就有一波，核心是一个叫「幽灵席位」的骚操作：

1. 买 2 个 Team 席位（≈$60/月）
2. 脚本批量发邀请链接
3. OpenAI 的身份系统和 Stripe 计费系统不同步——人进来了，账单追不上
4. 邀请 A → A 拿 Token → 移除 A → 邀请 B
5. A 的 Token 在缓存期（几小时到几天）依然有效，但已经不占名额

一个 $60/月的 Team 就变成了无限席位池。当时被票商用转代理工具（**CPA/Sub2API** 这类工具）配合 **号池轮换** 来榨干额度——维护多个幽灵席位组成 Token 池，A 触达速率上限了自动切到池子里下一个幽灵席位 B，用户看来就跟无限额度一样🤯

后来 OpenAI 修了三条：
- 邀请前实时查 Stripe 计费
- 移除成员立即吊销 Token
- 自动封禁异常席位流转的工作区

然后……这个月的漏洞又来了 😂

![meme_05](/images/agnes/chatgpt-team-unlimited/meme_05.png)

---

## 💀 现在的漏洞：SSO 不验许可证

**原理简单到想笑：**

OpenAI Team 定价 $25/月/人，150 人上限。

但 **SSO 接入** 和 **手动邀请** 走的是两套检查。手动邀请按人头计费，SSO 只验域名不验许可证。

于是：
- Team 页面显示 5 个付费成员
- SSO 接入了几十上百人
- 所有人共享额度池
- 计费只按那 5 个人收

**找到一个月结慢的母号，就能在账单来之前无限制让人 SSO 加进来。**

而且只要后台开了 **不限制 Codex 额度**，每个 Team 成员 5h 额度上限直接取消（Team 的 5h 额度 ≈ 8—10 美金），一个月 200—300 美金的额度能一次跑完。

---

## 🔧 方法一：普通 Team + 域名绑定

**条件：** 一个正在用的 ChatGPT Team + 你的域名

操作：
1. 登录 admin.openai.com
2. 绑定域名
3. 配置域名邮箱 SSO
4. **不要手动邀请**（手动触发计费）
5. 用户自己 SSO 加入

---

## 🪙 方法二：Codex 空间（只要 $0.5）

**更骚的玩法。** 不用先买 Team。

**成本对比：**

| 方式 | 前期投入 | 成员待遇 | 计费 |
|------|----------|----------|------|
| 正常 Team | $25/月/人 | ChatGPT Team | 按人头 |
| 方法一 | $25/月（1人） | ChatGPT Team | 只收 1 人 |
| 方法二 | **$0.5** | ChatGPT Team | **不追加** |

原理：Codex 和 ChatGPT Team 共享身份系统，但计费是分开的。SSO 接入时身份映射到了 Team，计费侧没跟上。经典的基础设施对不上。

---

![号商圈盛况](/images/agnes/chatgpt-team-unlimited/222b7fd4d04e3d66c8ddb3007edd9a2a.png)

---

## 🎪 号商现状：欠款 180 万美金

号商圈随随便便欠了 **180 万美金** 账单——奥特曼真是融资记录创造者，欠钱也随便欠 😂

![meme_debt](/images/agnes/chatgpt-team-unlimited/meme_debt.png)

账单后台截图：

![账单截图](/images/agnes/chatgpt-team-unlimited/f4665a72eac273eae5da9b8d7d490ae7.png)

OpenAI 官方论坛已经炸了锅。举报帖被人发了又被管理员隐藏了（迷惑行为），漏洞没修。这可能是为了上市冲用户量故意的？谁知道呢。

反正漏洞被举报后，号商和公益站的管理员们觉得渠道要死了，直接开闸放水——**免费分发 Token、刷 Codex Team 账号**，各社群全部陷入获得无限 GPT-5.5 xhigh 的狂欢中。

**史称：疯狂双休日** 🎉

![meme_party](/images/agnes/chatgpt-team-unlimited/meme_party.png)

论坛 battle 截图（帖子已被管理员隐藏）：

![forum_1](/images/agnes/chatgpt-team-unlimited/6d32371dbd429022d699aaaf4eb71d19.png)
![forum_2](/images/agnes/chatgpt-team-unlimited/f1d19295cc4b9952f02270259051c92c.png)
![forum_3](/images/agnes/chatgpt-team-unlimited/bad187d798e023f6ba9541b7a60c4b64.png)
![forum_4](/images/agnes/chatgpt-team-unlimited/b95d0403ba9821225f4146bf2a164478.png)

官网论坛分两派：
- 🧐 **举报派**：这是安全漏洞，应该上报
- 🐑 **羊毛派**：OpenAI 自己没做检查，怪我咯？