---
title: "[6.10最新方法] ChatGPT Team 免费激活方法 全流程详解"
date: 2026-06-09
description: 三套 ChatGPT Team 免费激活方法：SSO 教育域直接进、Tampermonkey 脚本改 checkout 数量、Python 注册机配合域名批量化。含完整 Tampermonkey 脚本和注册机下载。
tags:
  - 福利羊毛
published: true
access: pro
---

Bug Team渠道半拉闸，从之前的无限拉人，变成了限制1000人，而且积分不再能开Team空间，目前只能正价开Team然后拉1000人，正价大概20~50美金不等（别问为什么一件商品加个不固定，问就是有优惠码，优惠码找到后会同步在blog中）

## 1. 教育域名 SSO 直接激活（需要有母号）

这一步适用于你手上已经有一个 Team 母号的场景。如果还没有母号，去社区收一个，或者用下面第 2 步自助开通母号。

打开 [chatgpt.com](https://chatgpt.com/)。

使用 `任意前缀@wishtoapp.edu.kg` 的邮箱，通过 SSO（单点登录）方式登录。

登录成功后自动激活 ChatGPT Team 权限。

或者直接打开下面这个链接，自动激活随机账号：

```
https://idp.wishtoapp.edu.kg/sso?SAMLRequest
```

### 状态判断

如果 SSO 页面打不开、登录后要验证码、登录后没有 Team 权限，说明这个入口已经失效或被 OpenAI 收口了。

## 2. Tampermonkey 脚本修改 checkout 数量

这个方法需要先有一个已经登录的 ChatGPT 账号，通过修改 Codex Team 的 checkout/update 请求参数，把购买量改成最低值。

### 步骤

1. 打开 Tampermonkey，新建脚本。
2. 粘贴下面的脚本内容并保存。
3. 访问：[https://chatgpt.com/codex/team/checkout?checkout_from=codex_app](https://chatgpt.com/codex/team/checkout?checkout_from=codex_app)
4. 等页面右下角出现按钮：**执行 checkout/update quantity=13**
5. 等页面先完全加载，出现有效的 `checkout_session_id` 后再点击按钮。
6. 成功后会刷新页面，返回的 checkout session 对应的是 13 credit（约 $0.53 左右）。

关键判断：如果右下角显示「当前 checkout_session_id: (未检测到，等页面跳转后再点)」，说明 URL 还在 `/checkout` 阶段，还没拿到真正的 session id，这时候不能点按钮。

### Tampermonkey 脚本

```javascript
// ==UserScript==
// @name         CTF Codex Checkout Update Helper
// @namespace    ctf-sandbox
// @version      0.1.0
// @description  Run the Codex checkout/update request from the logged-in browser page context.
// @match        https://chatgpt.com/codex/team/checkout*
// @match        https://chatgpt.com/codex/team/checkout/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const CONFIG = {
    processor_entity: 'openai_llc',
    credit_purchase_quantity: 13,
    language: 'zh-CN',
    updateUrl: 'https://chatgpt.com/backend-api/payments/checkout/update',
  };

  function log(...args) {
    console.log('[CTF checkout helper]', ...args);
  }

  function getCheckoutSessionId() {
    const url = new URL(window.location.href);
    const fromQuery = url.searchParams.get('checkout_session_id') || url.searchParams.get('checkoutSessionId');
    const parts = url.pathname.split('/').filter(Boolean);
    const fromPath = parts[parts.length - 1] || '';
    const id = fromQuery || fromPath;
    if (!id || id === 'checkout' || id === 'team' || id === 'codex') return '';
    return id;
  }

  async function getAccessToken() {
    const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
    if (!sessionRes.ok) {
      const text = await sessionRes.text().catch(() => '');
      throw new Error(`获取 session 失败 (HTTP ${sessionRes.status}): ${text.slice(0, 120)}`);
    }
    const sessionData = await sessionRes.json();
    const accessToken = sessionData?.accessToken;
    if (!accessToken) throw new Error('未找到 accessToken，请确认已登录');
    return accessToken;
  }

  async function runUpdate() {
    const checkoutSessionId = getCheckoutSessionId();
    if (!checkoutSessionId) {
      throw new Error(`当前 URL 还没有有效 checkout_session_id: ${window.location.href}`);
    }
    const accessToken = await getAccessToken();
    const body = {
      checkout_session_id: checkoutSessionId,
      processor_entity: CONFIG.processor_entity,
      credit_purchase_quantity: CONFIG.credit_purchase_quantity,
    };
    log('request body:', body);
    const res = await fetch(CONFIG.updateUrl, {
      method: 'POST',
      credentials: 'include',
      referrer: window.location.href,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'oai-device-id': localStorage.getItem('oai-device-id') || '',
        'oai-language': CONFIG.language,
      },
      body: JSON.stringify(body),
    });
    const text = await res.clone().text().catch(() => '');
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) {}
    if (!res.ok) {
      throw new Error(`请求失败 (HTTP ${res.status}): ${text.slice(0, 200)}`);
    }
    return data ?? text;
  }

  function installButton() {
    if (document.getElementById('ctf-checkout-helper-btn')) return;
    const box = document.createElement('div');
    box.id = 'ctf-checkout-helper-box';
    box.style.cssText = [
      'position:fixed', 'z-index:2147483647', 'right:16px', 'bottom:16px',
      'padding:12px', 'background:#111827', 'color:#fff',
      'border:1px solid #374151', 'border-radius:10px',
      'font:13px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
      'box-shadow:0 8px 24px rgba(0,0,0,.3)', 'max-width:360px',
    ].join(';');
    const btn = document.createElement('button');
    btn.id = 'ctf-checkout-helper-btn';
    btn.textContent = `执行 checkout/update quantity=${CONFIG.credit_purchase_quantity}`;
    btn.style.cssText = 'cursor:pointer;padding:8px 10px;border-radius:8px;border:0;background:#10a37f;color:white;font-weight:600';
    const status = document.createElement('div');
    status.id = 'ctf-checkout-helper-status';
    status.style.cssText = 'margin-top:8px;white-space:pre-wrap;word-break:break-word;color:#d1d5db';
    status.textContent = `当前 checkout_session_id: ${getCheckoutSessionId() || '(未检测到，等页面跳转后再点)'}`;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      status.textContent = '执行中...';
      try {
        const data = await runUpdate();
        log('成功:', data);
        status.textContent = `成功:\\n${JSON.stringify(data, null, 2).slice(0, 1000)}`;
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        console.error('[CTF checkout helper] 失败:', err);
        status.textContent = `失败: ${err?.message || err}`;
      } finally {
        btn.disabled = false;
      }
    });
    box.appendChild(btn);
    box.appendChild(status);
    document.documentElement.appendChild(box);
    setInterval(() => {
      status.textContent = status.textContent.startsWith('当前 checkout_session_id:')
        ? `当前 checkout_session_id: ${getCheckoutSessionId() || '(未检测到，等页面跳转后再点)'}`
        : status.textContent;
    }, 1000);
  }
  installButton();
  log('loaded on', window.location.href);
})();
```

## 3. Python 注册机配合域名批量化

脚本文件下载：[ChatGPT_team.py](/downloads/ChatGPT_team.py)（约 90KB）

### 功能说明

这个脚本是独立的单文件注册机，覆盖以下流程：

1. 通过当前可用的企业 SSO 流程注册/登录 ChatGPT
2. 完成 Codex OAuth 授权
3. 保存第一个可用的 Codex Refresh Token

### 安装

```bash
python -m pip install --upgrade pip
python -m pip install curl_cffi
```

### 配置

在脚本同目录下创建 `ChatGPT_team.config.local.json`：

```json
{
  "proxy": "http://127.0.0.1:7890"
}
```

如果不需要代理，可以省略这个文件直接运行。

### 使用

注册并保存 Refresh Token：

```bash
python ChatGPT_team.py --total 1 --workers 1
```

检查已有 `codex_tokens/*.json` 的 plan type：

```bash
python ChatGPT_team.py --check-tokens
```

当 `--check-tokens` 检测到 401 过期时，它会自动加载本地对应的 `chatgpt_sessions/` 会话，重新跑一遍 Codex OAuth，覆盖更新原来的 RT/AT/ID token 文件。

### 脚本输出文件

- `registered_only.txt` — 已注册的账号列表
- `register_only_failed.txt` — 注册失败的记录
- `chatgpt_sessions/` — 保存的 ChatGPT 登录会话
- `codex_tokens/` — 保存的 Codex OAuth 令牌（RT/AT/ID token）