---
title: "免费域名盘点总结（2026版）"
date: "2026-05-30T10:00:00Z"
description: "2026年免费域名服务大盘点：DigitalPlat us.kg/xx.kg、ClouDNS、deSEC、Cloudflare Pages、ZoneABC 等免费域名服务商深度对比，注册流程、续期方式、Cloudflare 托管兼容性全解析。"
cover: "/images/agnes/coding-plan-cover.png"
tags: ["免费域名", "域名注册", "Cloudflare", "福利羊毛"]
published: true
---

# 免费域名盘点总结（2026版）

---

## DigitalPlat（us.kg / xx.kg）

> 官网：[https://dash.domain.digitalplat.org](https://dash.domain.digitalplat.org)

以前 DigitalPlat 给 qzz.io 和 dpdns.org 免费注册，现在这两个后缀已经停了。目前还能免费注册的只有 **us.kg** 和 **xx.kg**。

**有效期：1 年。** 到期前 180 天内可以在面板点「续杯」续期，续完之后再加一年。不存在 14 天续期这种说法——14 天是旧版 us.kg 的风控观察期，不是有效期。

**注册门槛：** 现在新注册可能需要 GitHub 账号验证（给仓库点 star），部分时期还收 $2~3 的一次性费用。每个账号通常限 3 个域名。

**Cloudflare 托管：** 支持。改 NS 到 Cloudflare 就能用。

**适合场景：** 年抛项目、实验环境。记得设日历提醒在到期前续期，不然域名说丢就丢。

---

## ClouDNS（cloud-ip.cc / abrdns.org）

> 官网：[https://www.cloudns.net](https://www.cloudns.net)

老牌免费 DNS 服务了。免费套餐：1 个 zone、50 条 DNS 记录、每月 50 万次查询。还带 1 个邮件转发和 1 个 Dynamic DNS。

**30 天不活跃就回收**——连续 30 天没有 DNS 查询请求，zone 会被自动删除。所以要隔段时间发个请求保活。

**Cloudflare 托管：** ❌ 不行。ClouDNS 免费域名不给改 NS，没法托管到 Cloudflare。Cloudflare 社区也有人问过这个问题，结论是无解。

**注册注意：** 需要干净科学上网环境，不然页面 403。

**适合场景：** 纯备用 DNS 转发、DDNS 场景。1 个域名+50 条记录够个人用，但绑不上 Cloudflare 是硬伤。

---

## DnShe（cc.cd / ccwu.cc / us.ci / cn.mt / bbroot.com）

> 官网：[https://my.dnshe.com](https://my.dnshe.com)

这是我目前在用的主力免费域名商。一个账号能拿 **5 个域名**，用邀请码还能再多几个。

**Cloudflare 托管：** ✅ 完全支持。实测 `cc.cd` 和 `ccwu.cc` 在 Cloudflare 上跑得很稳，用来挂 API 业务和实验项目都没出过问题。

**后缀选择建议：**
- `cc.cd` / `ccwu.cc` — 最推荐，短又好记，CF 兼容性最好
- `us.ci` — 能用，但偶有 DNS 不稳定的反馈
- `cn.mt` — 部分新账号注册有邮箱域名限制
- `bbroot.com` — 还在免费名单里，但之前有过免费转付费的争议，注意观察

**适合场景：** 长期主力。搭配 CF Tunnel 或 API 代理都很稳。

---

## ZoneABC（webn.cc / sylu.cc / acg.rest）

> 官网：[https://zoneabc.net](https://zoneabc.net)

ZoneABC 的特点是用 **积分** 来注册域名。完善资料给 20 分，邀请一个人给 10 分。

**关键点：域名是永久免费的，不需要续期！** 积分只用于注册时抢短前缀（4~6 位的短域名），7 位以上前缀根本不要积分。所以不存在「每个月签到保活」这种说法。

**一个账号最多 5 个域名。**

**当前可用后缀：**
- `webn.cc` ✅ 最稳
- `zabc.net` ✅
- `sylu.cc` / `sylu.net` ✅
- `acg.rest` ✅
- `vvvv.ee` ⚠️ 可能活动名额已满
- `ctil.li` ⚠️ 同上

**Cloudflare 托管：** ❌ **不能正常接入 Cloudflare 免费计划**。ZoneABC 域名改 NS 到 CF 兼容性有问题。但它自己提供背后的 Cloudflare Enterprise 代理（SaaS / Custom Hostname），性能可以。

**适合场景：** 想要 `acg.rest` 这类特殊后缀的，或者不在乎 CF 托管、直接用 ZoneABC 自带 CF Enterprise 的。

---

## Desec（dedyn.io）

> 官网：[https://desec.io](https://desec.io)

偏技术向的免费 DNS + 域名服务。API 设计得非常好，RESTful 全功能，支持 2FA、Token 细粒度控制。

**每个账号默认 15 个域名**（可申请增加）。解析记录数单 RRset 最多 4091 条。纯 API 操作，没有图形面板。

API 操作很方便，适合写脚本的人。

**Cloudflare 托管：** ⚠️ 不能同时作为权威 DNS。但 Desec 的 DNS 服务本身质量很好，很多人直接用它替代 Cloudflare DNS。

**适合场景：** 开发者、API 爱好者、需要不限域名数量的人。

---

## 其他值得关注的免费域名

### is-a.dev / is-cool.dev 系列
> 官网：[https://is-a.dev](https://is-a.dev)

GitHub 认证的免费子域名，通过 PR 提交申请。`yourname.is-a.dev` 这种形式，稳定，适合个人开发者。缺点是必须要有 GitHub 账号。

### freedns.afraid.org
> 官网：[https://freedns.afraid.org](https://freedns.afraid.org)

老牌社区型免费 DNS，提供几百种后缀（mooo.com 等）。可以自建 NS，自由度极高。但界面确实古早。

### nic.ua（pp.ua）
> 官网：[https://nic.ua](https://nic.ua)

乌克兰的免费域名，`.pp.ua` 后缀，需审核。2025 年简化了流程但速度偏慢。

---

## 我的个人推荐方案

| 用途 | 推荐 | 原因 |
|------|------|------|
| **长期主力** | 🥇 DnShe（ccwu.cc / cc.cd） | 稳定、可托管 CF、多域名、零维护 |
| **年抛/实验** | 🥈 DigitalPlat（us.kg / xx.kg） | 注册快，1 年有效期记着续就行 |
| **备用 DNS** | 🥉 Desec（dedyn.io） | API 方便，不限域名数量 |
| **特殊后缀** | ZoneABC（acg.rest） | 免费永久无需续期，不能托管 CF 是缺点 |
| **不推荐** | ❌ ClouDNS | 不能托管 CF，30 天不活跃就回收 |


> **最后提醒：** 免费域名始终是免费域名，服务商随时改规则或关停。重要的业务一定要留好迁移方案，别把生产环境绑死在一个免费域名上。我踩过的坑：Freenom 说关就关、us.kg 改过注册规则、bbroot.com 闹过付费风波——哪家都不是铁饭碗。
