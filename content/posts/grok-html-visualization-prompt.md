---
title: 让 Grok 帮你画产品介绍页——一套提示词搞定时间线、对比表、可视化卡片
date: 2026-06-08
description: 一套 Grok 提示词模板，能让 AI 输出带时间线、对比表格、功能卡片、优劣势布局的精美 HTML 可视化页面
cover: /images/agnes/generated-covers-20260608/grok-html-visualization-prompt-cover-gpt-image-2-v1.png
tags:
  - AI研究
published: true
---

最近发现一个有意思的玩法。

**一套 Grok 提示词，能让 AI 直接画出一个完整的产品介绍页。**

不是那种丑丑的 Markdown 渲染，也不是简单的文字堆砌。

是**带颜色、带布局、带时间线、带对比表格**的 HTML 页面。

一次对话，完整输出。

---

## 先看效果

我把这套提示词喂给 Grok，让它介绍 **Xesim 物理 eSIM 卡**。

它一次性输出了这个页面 👇

![Grok 生成的可视化页面 - 上半部分](/images/agnes/grok-visual/demo-top-v2.png)

**整个页面包含了：**
- 标题 + 副标题
- 产品概览说明
- 五大核心功能卡片
- 三款版本对比表格

往下翻还有 **六步使用流程时间线 + 优劣势对比卡片**👇

![Grok 生成的可视化页面 - 下半部分](/images/agnes/grok-visual/demo-bottom-v2.png)

看到没？**这些全是 Grok 一次性输出的 HTML，没有人手动调过样式。**

> 想亲手点开看看？→ [查看完整的 Grok 生成页面](/visualizations/xesim-intro.html)

---

## 这套提示词到底做了什么

Grok 本身就能写 HTML。但直接让它写，很容易翻车：

- 输出一半 Markdown 一半 HTML
- 样式写在 `<style>` 里被过滤
- 布局混乱，没有层次感

这套提示词的核心就三招：

**第一招：死防御**

禁止反引号、禁止 `<style>` 标签、**首字符必须是 `<div`**、禁止裸文本。

没有这些约束，AI 很容易偷懒混用 Markdown。

**第二招：智能布局**

告诉 Grok 根据内容类型自动匹配布局：

| 内容类型 | 自动匹配布局 |
|---------|------------|
| 对比/决策 | 矩阵对比表格 |
| 流程/步骤 | 时间线 / 步骤卡片 |
| 数据/指标 | 数据卡片 + 紧凑表 |
| 长篇内容 | 折叠面板 |

它会自己判断该用什么布局，不需要你操心。

**第三招：视觉规范**

- 浅色主题，蓝色 `#3182ce` 做主色
- 标题带蓝色左边框
- 卡片用浅灰背景 `#f8fafc`
- 推荐用绿色、风险用红色

给 AI 定好配色系统，它就不会自创辣眼睛的配色。

---

## 提示词长什么样

完整模板（可直接复制粘贴到 Grok）：

<div class="code-block-wrapper">
<pre class="pre-dark">
你是一个只输出渲染后 HTML 的专业引擎。你将融合 AMC-WebUI 的高信息密度智能布局与 Grok 平台的极端渲染防御规则，把用户信息转化为无懈可击、精美且可读的内联 HTML 产物。

&#35;&#35; 致命防御约束 (ZERO TOLERANCE - 极高优先级)

1&#46; 绝对禁止反引号：严禁在响应中输出任何 ``` 或 ` 符号。

2&#46; 绝对禁止 &lt;style&gt; 和 &lt;script&gt; 块：所有样式必须 100% 写入每个标签的 style="..." 属性中。

3&#46; 首字符强制：响应必须以 &lt;div style="display:block;width:100%;box-sizing:border-box;max-width:100%;background:#ffffff;border:1px solid #eef0f2;border-radius:16px;padding:24px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.05);font-family:sans-serif;color:#1a202c;overflow-wrap:anywhere;"&gt; 开头。严禁任何前导文字、Emoji、空格或换行。

4&#46; 禁止裸文本：所有文字内容必须包裹在 &lt;span&gt;, &lt;p&gt;, &lt;h2&gt;, &lt;td&gt; 或 &lt;div&gt; 中。

5&#46; 禁用 Markdown 符号：响应中严禁出现 &#35;, &#42;&#42;, - , *, &gt; 等任何 Markdown 语法符号。

6&#46; 输出格式：整个响应必须是一个连续的 HTML 字符串（可内嵌 render 组件用于图片展示）。

&#35;&#35; 智能布局选择

根据内容类型自动匹配高级布局：

&bull; 对比/决策 → 矩阵对比表格（带 overflow-x:auto 容器）

&bull; 流程/步骤 → 时间线或横向/纵向步骤卡片

&bull; 数据/指标 → 数据卡片 + 紧凑数据表

&bull; 长篇内容 → 摘要卡片 + &lt;details&gt;&lt;summary&gt; 折叠面板

&#35;&#35; 视觉标准 (Premium Light 主题)

&bull; 主容器必须使用指定 root style

&bull; 标题使用 border-left:4px solid &#35;3182ce 的样式

&bull; 内容卡片使用 border:1px solid &#35;edf2f7 + background:#f8fafc

&bull; 配色克制使用 &#35;3182ce（主色）、&#35;38a169（推荐/安全）、&#35;e53e3e（风险）

&#35;&#35; 图片与媒体支持

需要真实图片时，使用 render render_searched_image 组件内嵌显示（系统自动处理）。优先选择高质量产品实拍图或相关视觉素材。

&#35;&#35; 立即执行

将用户信息转化为完全符合上述所有约束的、高密度、精美浅色主题的单流 HTML 产物。记住：首字符必须是 &lt;div，绝对不准出现任何反引号！
</pre>
</div>

把它丢给 Grok，然后在同一次对话里，把你想要展示的内容发过去就行了。
<p class="copy-hint">💡 选中上方文本即可复制</p>

---

## 还能用来做什么

拿这套模板，我试了几个方向，效果都不错：

- **产品介绍** — 把你的产品或服务描述扔进去，出来就是一张宣传页
- **方案对比** — A 方案 vs B 方案，自动生成对比表
- **步骤教程** — 横向时间线展示操作流程
- **数据看板** — 数据卡片 + 表格，信息密度高

而且这个 HTML 是**纯内联样式**的，不需要任何外部 CSS 文件。

复制出来保存成 `.html`，直接扔到静态服务器就能用。

---

## 怎么上手

三句话的事儿：

1. 把提示词模板复制给 **Grok**
2. 接着把你想要展示的内容发过去
3. 等几秒，完整 HTML 就出来了

我用的模型是 **grok-4.20-multi-agent-xhigh**，一次输出 12KB 左右，质量很稳。

---

## 最后

这套提示词最巧妙的地方是——**用约束创造自由**。

越严格的防御规则，AI 反而输出越稳定。

你要是经常需要做产品介绍、功能对比之类的页面，**复制这份模板去 Grok 试试**，能省掉你大量写样式的时间。