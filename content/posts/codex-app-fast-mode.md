---
title: "Codex App 开启 Fast 模式（使用中转站的方案）"
date: "2026-06-07T00:00:00Z"
description: "使用中转站 API Key 时 Codex App 看不到 Fast 模式选项？修改 App 源码硬开 Fast 模式的完整教程，macOS / VS Code 插件通用。"
cover: /images/agnes/generated-covers-20260608/codex-app-fast-mode-cover-gpt-image-2-v1.png
tags: ["AI研究", "Codex", "AI编程", "教程"]
published: true
---

## 背景

Codex App 的 **Fast 模式** 依赖登录 OpenAI 后的 `statsig_default_enable_features` AB Test 放量来判断是否展示。

目前放量似乎是 100%，但问题在于：**Codex App 不可能既登录 OpenAI 又使用中转站的 API Key**。所以使用中转站（relay/第三方 API）时，App 读不到 Fast 模式的开关，自然就看不到选项。

---

## 解决方案（macOS）

### 1. 解压 App 包

```shell
# 进入 app 目录
cd /Applications/Codex.app/Contents/Resources

# 解压 app.asar
npx @electron/asar e ./app.asar app

# 重命名，让 Electron 优先读取 app 目录而不是 app.asar
mv ./app.asar ./app.asar1
```

### 2. 修改 Fast 模式判断

找到 `webview/assets/general-settings-xxx.js` 文件（文件名可能带 hash，搜索 `general-settings` 开头的 JS 文件）。

找到 `function Dt()` 函数，将其返回值改为 `true`：

```diff
- function Dt(){let e=(0,J.c)(3),{authMethod:t}=R(),[n]=b(`statsig_default_enable_features`),r;return e[0]!==t||e[1]!==n?.fast_mode?(r=n?.fast_mode===!0&&Ot(t),e[0]=t,e[1]=n?.fast_mode,e[2]=r):r=e[2],r}
+ function Dt(){let e=(0,J.c)(3),{authMethod:t}=R(),[n]=b(`statsig_default_enable_features`),r;return e[0]!==t||e[1]!==n?.fast_mode?(r=n?.fast_mode===!0&&Ot(t),e[0]=t,e[1]=n?.fast_mode,e[2]=r):r=e[2],true}
```

只需要把最后的 `r` 改成 `true` 即可。

### 3. 关闭 Electron Fuse 保护

```shell
npx @electron/fuses write --app /Applications/Codex.app GrantFileProtocolExtraPrivileges=off
npx @electron/fuses write --app /Applications/Codex.app EnableCookieEncryption=off
npx @electron/fuses write --app /Applications/Codex.app OnlyLoadAppFromAsar=off
npx @electron/fuses write --app /Applications/Codex.app EnableEmbeddedAsarIntegrityValidation=off
```

### 4. 强制签名

```shell
codesign --force --deep --sign - /Applications/Codex.app
```

重新打开 Codex App，设置页面就能看到 Fast 选项了。

---

## VS Code 插件版

VS Code 的 Codex 插件也可以用类似的方法修改。找到插件目录下的 JS 文件：

```
%USERPROFILE%\\.vscode\\extensions\\openai.chatgpt-26.318.11754-win32-x64\\webview\\assets\\general-settings-xxx.js
```

搜索 `statsig_default_enable_features` 所在函数，做同样的返回值修改（`r` → `true`），重启 VS Code 即可生效。

---

## 相关资源

- [CodexDesktop-Rebuild](https://github.com/Haleclipse/CodexDesktop-Rebuild) — 自动重建方案（跨平台）
