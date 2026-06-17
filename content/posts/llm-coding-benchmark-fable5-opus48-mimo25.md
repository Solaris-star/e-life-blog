---
title: "Claude Fable 5 登顶！最新一轮 AI 编程横向评测：Fable 5、Opus 4.8、M3、Mimo V2.5 等 37 款模型对决"
date: "2026-06-12T16:00:00Z"
description: "Claude Fable 5 以几乎零瑕疵的完成度超越 GPT-5.5 登顶榜首！基于 Unity C# 真实项目需求的第三轮 AI 编程模型横评，涵盖 37 款模型。Minimax M3 上演「修改服务器协议」的神操作。"
cover: /images/agnes/llm-coding-benchmark-fable5-opus48-mimo25-cover.png
tags: ["AI研究"]
published: true
---

> 本文转载自 SmallMain 在 Linux Do 的帖子，原文链接见文末。

---

这是第三轮基于同一 Unity C# 皮肤系统项目的横向评测。预制体已提前做好，模型负责完成全部代码编写，评审员对完成度、边界处理、代码一致性做人工审查。

前两轮项目和环境完全一致：
- **第一轮**：[topic/1544250](https://linux.do/t/topic/1544250) — GPT-5.5 和 Claude Opus 4.6 并列 T0
- **第二轮**：[topic/2054337](https://linux.do/t/topic/2054337) — GPT-5.5(xhigh) 建立稳定领先

## 模型来源

| 模型 | 来源 |
|------|------|
| Claude 系列 | 官方 API |
| Mimo V2.5 系列 | 官方 Token Plan |
| Hy3 Preview | 官方 API |
| Qwen3.7 系列 | 官方 API |
| Minimax M3 | 官方 API |
| Nex-N2-Pro | OpenRouter Free API（退赛） |
| Nemotron 3 Ultra | OpenRouter Free API（退赛） |

## ⚡ 速度排行

| 排名 | 模型 | 时间 | 备注 |
|:---:|------|:---:|------|
| 1 | Grok 4.20 0309 Reasoning | **3min** | |
| 2 | Step-3.5-Flash | **6min** | |
| 3 | Mimo V2 Omni | **7min** | |
| 4 | Doubao-Seed-2.0-Lite | **7min** | |
| 5 | Doubao-Seed-2.0-Pro | **9min** | |
| 6 | Doubao-Seed-2.0-Code | **9min** | |
| 7 | Qwen3-Coder-Next | **9min** | |
| 8 | Claude Sonnet 4.6(high) | **9min** | |
| 9 | Qwen3.5-Plus | **9min** | |
| 10 | GLM-5 Turbo | **10min** | |
| 11 | Minimax M2.7 | **10min** | Highspeed 版本 |
| 12 | Qwen3.5-Flash | **10min** | |
| 13 | Gemini 3 Pro | **11min** | |
| 14 | **Hy3 Preview** | **13min** | |
| 15 | GPT-5.5(low) | **13min** | |
| 16 | GPT-5.5(medium) | **15min** | |
| 17 | Mimo V2 Pro | **15min** | |
| 18 | DeepSeek V4 Flash | **17min** | |
| 19 | **Qwen3.7-Plus** | **17min** | |
| 20 | **Qwen3.7-Max** | **18min** | |
| 21 | GPT-5.5(high) | **19min** | |
| 22 | Claude-Opus-4.7(Max) | **20min** | |
| 23 | GLM-5 | **20min** | |
| 24 | DeepSeek V4 Pro | **21min** | |
| 25 | Gemini 3 Flash | **22min** | |
| **26** | **Claude-Fable-5(xhigh)** | **23min** | |
| **27** | **Mimo V2.5** | **24min** | |
| 28 | KAT-Coder-Pro V2 | **24min** | |
| **29** | **Minimax M3** | **25min** | |
| 30 | Claude-Opus-4.6(Max) | **26min** | |
| 31 | GPT-5.5(xhigh) | **28min** | |
| 32 | Gemini 3.1 Pro(high) | **29min** | 受 429 限制 |
| **33** | **Claude-Opus-4.8(Max)** | **33min** | |
| 34 | Kimi K2.6 | **33min** | |
| 35 | Qwen3.5 9B GGUF Q4_K_XL | **35min** | 本地 MBP M4 Pro |
| 36 | Qwen3.5 35B A3B GGUF Q4_K_XL | **36min** | 本地 MBP M4 Pro |
| **37** | **Mimo V2.5 Pro** | **37min** | |

## 令牌消耗

| 模型 | Tokens |
|------|:------:|
| **Claude-Fable-5(xhigh)** | **7.1M** |
| **Claude-Opus-4.8(Max)** | **13M** |
| Mimo V2.5 Pro | 未知 |
| Mimo V2.5 | 未知 |
| Hy3 Preview | 1.4M |
| Qwen3.7-Max | 4.6M |
| Qwen3.7-Plus | 4.2M |
| Minimax M3 | 未知 |

Fable 5 的令牌消耗仅 Opus 4.8 的一半多——**实际成本差距不大**。

## 代码行数

| 模型 | 新增 / 删除 |
|------|:----------:|
| Claude-Fable-5(xhigh) | +1520, -7 |
| Claude-Opus-4.8(Max) | +1347, -22 |
| Mimo V2.5 Pro | +1682, -14 |
| Mimo V2.5 | +1270, -8 |
| Hy3 Preview | +1246, -8 |
| Qwen3.7-Max | +1529, -6 |
| Qwen3.7-Plus | +1532, -7 |
| Minimax M3 | +2284, -137 |

## 完成度审查

### 🥇 Claude-Fable-5(xhigh)

**审查结论：** 完成度非常高，仅有一个细节问题。

**中等级（1个）：** 启动 useSkins 只记录使用中 ID，没有登记为已拥有。`SkinDataMgr.cs:82` 的 InitUseSkins 只写 _usingSkins，而 `SkinUI.cs:363` 请求列表后立刻刷新界面。网络返回前，当前使用皮肤会被判定为未拥有，出现「去获取」、置灰、无剩余时间等错误首帧状态。

Fable 5 做完需求后还有一段「需向你确认的事项」，对某些奇怪的实现细节（皮肤配置枚举值与服务器枚举值不同、时间戳单位猜测）有自己不确定的地方进行了汇总。给人的感觉是**对于这个需求它游刃有余，一切尽在掌握**。

关于枚举映射问题，它写了双向转换函数还附了说明：

> 皮肤类型编号不一致：协议枚举 SkinType（0=神针 1=称号 2=头像框 3=气泡）与 skinList 表（1=神针 2=头像框 3=气泡 4=称号）顺序、偏移都不同。我已把转换收口在 SkinNetMgr.ToProtoSkinType/ToCfgSkinType，内部数据一律以配置表类型为准（按 skinId 反查表），仅 C2S_SKIN_LIST.skinType 请求参数按协议枚举发送。请与服务器确认线上实际使用哪套编号，若用表编号只需改这两个函数。

**完全无可挑剔的答卷。**

⚠️ 但 Fable 5 **安全敏感度极高**。测完后想用它审查另一个有反代功能的需求，思考一半直接拒绝，而 GPT-5.5 对此完全没有问题。

### 🥈 Claude-Opus-4.8(Max)

**审查结论：** 完成度很高，虽然存在常见错误，但在最后列出了该处理需要确认。另有细微实现不一致。

**高等级（1个）：** 皮肤列表拉取的类型映射不成立，非神针皮肤可能一直被判定未拥有。`SkinUI.cs:232` 打开时只调用 ReqSkinList()，而 `SkinNetMgr.cs:33` 默认发送 SkinType = 0。但协议枚举里 `P_skin.cs:14` 的 0 是 SKIN_NEEDLE，不是「全部」。同时 `SkinDataMgr.cs:117` 每次响应会清空所有 owned 数据。结果是称号/头像框/气泡框的 owned 状态、按钮三态、onlyHas、属性总览都会错。

**中等级（1个）：** 倒计时使用本机 UTC 时间，没走项目服务器时间。`SkinUI.cs:706` 用 DateTimeOffset.UtcNow 计算过期时间，本机时间不准时会把限时皮肤显示成错误剩余时间或已过期。

但它留下了说明：
> 皮肤类型枚举：以 skinList 表 Type 字段为准分类（1/2/3/4），未采用 skin.proto 中数值不一致的 SkinType（0/1/2/3）。

说明它**知道问题所在**，但认为采用配置表的值是合理的——没有编写转换函数，选了错误的处理方式。

### 🥉 Minimax M3

**审查结论：** 存在部分功能错误和与需求/线上实现不一致的功能缺失；但在最后特别说明了协议枚举值调整的破坏性和服务器需要同步更新枚举值这一点，显示了理解。

**高等级（1个）：** 协议类型映射被单边改成配置值，和指南/线上基线不一致。`skin.proto:8` 与 `P_skin.cs:14` 把 SkinType 改成 1/2/3/4；`SkinNetMgr.cs:36` 直接发送该值，没有 cfg/server 映射。指南明确要求核对「配置 1~4 vs 协议 0~3」，线上也有转换逻辑。结果会导致神针/称号请求和回包类型错位。

Minimax M3 的判断是——**一定是后端写错了！** 于是它直接修改了 proto 定义！史无前例，首次有模型直接修改服务器协议定义。

不过它在最后说明了这一点：
> 协议中 SkinType 枚举值的调整属于破坏性变更，服务器需要同步更新枚举值（1/2/3/4）。

**中等级（3个）：**
- 属性总览不是「正在使用皮肤」的配置聚合。`SkinAttrUI.cs:73` 通过请求所有类型列表，再读 `SkinDataMgr.cs:216` 的 TotalAttrs。但协议注释是「所有已拥有皮肤的属性总和」，需求要求的是「当前激活/使用的所有类型皮肤」。
- onlyHas 没有按类型独立保存。`SkinUI.cs:128` 只有一个 _onlyHas，切换页签时不按类型恢复状态。
- 称号预览资源和建筑预览不符合需求。`SkinUI.cs:616` 给建筑图加载了称号皮肤的 homeShowUrl，`SkinUI.cs:644` 又用 item icon 当称号背景。

**低等级（1个）：** 页签克隆没有设置页签文案。`SkinUI.cs:273` 克隆 4 个页签但没有写 text 子节点。

### Mimo V2.5 Pro

**审查结论：** 存在常见错误，有几处与需求/线上实现不一致的功能缺失。

**5个问题：**
1. `GameApp_RegisterSystem.cs:31` 未注册 SkinSys.Instance。导致 SkinSys.OnStart() 不执行，S2C_HOME_INFO.UseSkins 不会初始化，列表/使用响应不会被转发成 UI 事件。
2. `SkinUI.cs:352` 切换页签时没有保证选中项属于当前页签。SwitchTab() 只刷新内容，不检查 _selectedSkinId 是否在当前类型可见。
3. `SkinUI.cs:640` 称号预览资源用错。称号页同时显示称号和建筑，但当前代码把称号皮肤的资源也设置给 m_imgBuilding。
4. `SkinUI.cs:692` 称号未拥有置灰不完整。称号需求是 m_goTitlePreview + m_goBuildingPreview 同时展示，未拥有时建筑预览不会被置灰。
5. `SkinAttrUI.cs:67` 属性总览依赖缓存的 TotalAttrs，不是实时聚合所有正在使用皮肤。

### Mimo V2.5

**审查结论：** 无法编译，且存在严重的功能错误和与需求/线上实现不一致的功能缺失。

**6个阻断级问题：**
1. 编译失败：`SkinDataMgr.cs:12` 继承 Singleton 但未 using GameBase；`SkinSys.cs:10` 继承 BaseLogicSys 也未引入。CS0246。
2. 皮肤类型映射整体错误：`SkinCfgMgr.cs:27` 把 2/3/4 定义成称号/头像框/气泡框，但配置表是 1 神针/2 头像框/3 气泡/4 称号；协议枚举又是 0~3。请求和存储都没有做协议/配置转换。
3. 单类型拉取会清空全量已拥有数据：`SkinDataMgr.cs:47` 每次 S2C_SKIN_LIST 都 _ownedSkins.Clear()。
4. 属性总览不满足需求：依赖 _usingSkins 里的 Attrs，但启动 useSkins 初始化没有 attrs；格式化也没有按属性类型区分百分比/万分比。
5. UI 行为多处偏离：onlyHas 是全局布尔不是按类型独立；列表刷新总是重选使用中/第一个；世界/城镇切换 interactable 逻辑反了。
6. 事件生命周期泄漏：`SkinUI.cs:187` 直接用 GameEvent.AddEventListener 注册，`SkinUI.cs:240` 没有移除。

### Hy3 Preview

**审查结论：** 无法编译，且存在严重的功能错误和与需求/线上实现不一致的功能缺失。

**6个阻断级问题：**
1. 编译失败：SkinUI.cs 有两个同签名 UpdatePreviewTypeSelect()，并且文件末尾多出闭合括号。
2. 编译失败：协议字段用错。生成协议里是 SkinId、SkinType、SkinList，但实现大量使用不存在的 Id、Type、Skins，并引用不存在的 SkinInfoProto。
3. SkinSys 没有注册，系统生命周期不会启动。
4. 玩家信息页入口被回退成「当前版本暂不支持」，没有打开 SkinUI。
5. 属性功能基本未实现。SkinCfgMgr.GetSkinAttributes() 仍是 TODO 且固定返回空列表。
6. 资源加载、跳转、预览细节仍是占位。列表图标、名称背景、预览图都没有实际加载。

### Qwen3.7-Max

**审查结论：** 较多功能错误和与需求/线上实现不一致的功能缺失。

**6个问题：**
1. `PlayerInfoUI.cs:310` 皮肤入口仍弹「当前版本暂不支持」。
2. `GameApp_RegisterSystem.cs:30` SkinSys 未注册。
3. `SkinCfgMgr.cs:70` 配置类型到协议类型映射错误。配置是 1 神针/2 头像框/3 气泡/4 称号，协议是 0 神针/1 称号/2 头像框/3 气泡，当前用 cfgType - 1 会把所有类型都请求错位。
4. `SkinUI.cs:228` 皮肤列表/使用事件注册为无参回调，但 `SkinNetMgr.cs:67` 发送的是带 response 参数的事件。事件系统按签名匹配，Action&#60;void&#62; 不会收到 Action&#60;Response&#62; 事件。
5. `SkinUI.cs:133` onlyHas 是单个状态，切页时被重置。
6. `SkinAttrUI.cs:98` 属性总览合并时只累加数值，丢失属性 Type/NumType，百分比类属性会显示错误。

### Qwen3.7-Plus

**审查结论：** 无法编译，且存在严重的功能错误和与需求/线上实现不一致的功能缺失。

**6个问题：**
1. 阻断编译：SkinUI 使用了 DateTimeOffset，但文件没有 using System。
2. 线上已有的 SKIN_VIEW/SKIN_EXPIRE、未查看红点、过期处理链路被删掉了。
3. S2C_HOME_INFO.useSkins 只写入 _usingSkinIds，没有把使用中的皮肤登记为拥有/使用状态。
4. SkinDataMgr.UpdateSkinList 只增量覆盖服务器返回项，不清理同类型旧拥有项。
5. 属性总览没有按需求从「所有正在使用皮肤」聚合，而是依赖最近一次 S2C_SKIN_LIST.TotalAttrs。
6. 称号预览把称号资源同时加载到 m_imgTitleBg 和建筑预览 m_imgBuilding。

## 🏆 最终排名

| 排名 | 模型 / 层级 | 说明 |
|:---:|------|------|
| | **Tier 0** | 与线上基线高度一致 |
| **1** | **Claude-Fable-5(xhigh)** | 🏆 **新榜首** |
| 2 | GPT-5.5(xhigh) | |
| | **Tier 1** | 少量边界问题或轻微不一致 |
| **3** | **Claude-Opus-4.8(Max)** | |
| 4 | GPT-5.5(high) | |
| 5 | Kimi K2.6 | |
| 6 | GPT-5.5(low) | |
| 7 | GPT-5.5(medium) | |
| 8 | Claude-Opus-4.6(Max) | |
| 9 | Claude Sonnet 4.5 | |
| | **Tier 2** | 明显功能错误或与需求不一致 |
| 10 | **GLM 5.1** | |
| **11** | **Minimax M3** | **进步明显** |
| **12** | **Mimo V2.5 Pro** | **进步明显** |
| 13 | GLM 5 | |
| 14 | Kimi K2.5 | |
| 15 | Claude Sonnet 4.6(high) | |
| 16 | **Qwen3.7-Max** | |
| 17 | Qwen3.5-Plus | |
| 18 | KAT-Coder-Pro V2 | |
| 19 | **DeepSeek V4 Pro(max)** | |
| | **Tier 3** | 无法编译或大量幻觉 |
| 20 | DeepSeek V4 Flash(max) | |
| 21 | Claude-Opus-4.7(Max) | |
| 22 | **Qwen3.7-Plus** | |
| 23 | **Mimo V2.5** | |
| 24 | **Hy3 Preview** | |
| 25 | GLM-5 Turbo | |
| 26 | Gemini 3.1 Pro(high) | |
| 27 | Mimo V2 Pro | |
| 28 | Mimo V2 Omni | |
| 29 | Minimax M2.7 | |
| 30 | Step-3.5-Flash | |
| 31 | Qwen3-Coder-Next | |
| 32 | Gemini 3 Pro | |
| 33 | Gemini 3 Flash | |
| 34 | Doubao-Seed-2.0-Code | |
| 35 | Doubao-Seed-2.0-Pro | |
| 36 | Doubao-Seed-2.0-Lite | |
| 37 | Qwen3.5-Flash | |
| 38 | Qwen3.5 35B A3B GGUF Q4_K_XL | |
| 39 | Qwen3.5 9B GGUF Q4_K_XL | |
| 40 | Grok 4.20 0309 Reasoning | |

## 退赛选手

**Nex-N2-Pro**：思考内容发生循环，一直在纠结函数名：
```
Need "SkinDataMgr GetSkinPreviewPathForType".
Need "SkinDataMgr GetSkinPreviewPathForType".
Need "SkinDataMgr GetSkinPreviewPathForType".
...
```

**Nemotron 3 Ultra**：发生上游错误，无法继续。

## 原作者总结

Claude-Fable-5(xhigh)：
- 速度超过 Claude-Opus-4.6(Max) 与 GPT-5.5(xhigh)
- 完成度非常高与 GPT-5.5(xhigh) 相当，仅一个体验细节问题
- **Claude 的首个 T0 模型，接替 GPT-5.5 成为榜首**

原作者已经有点怀疑是否应该将评审员从 GPT-5.5 换为 Claude-Fable-5 了。
Fable 5 在处理完需求后还有一段汇总——**需求未说明自己决定的地方都放在最后列出以进行核对，这是比较难得的。**

但 Fable 5 的安全方面确实非常敏感，测完想用它审查别的项目时，由于存在类似反代的功能，思考一半直接拒绝。

Claude-Opus-4.8：速度几乎和本地部署的模型一样慢（33min），令牌消耗是 Fable 5 的近两倍。完成度有明显提升，但**有了 Fable 5，Opus 4.8 存在的意义就不太大了。**

Mimo V2.5 Pro：速度非常慢（37min），但完成度相对上代明显提升。

Minimax M3：相对上代进步明显。下出神之一手修改协议，惊为天人。

---

*本文转载自 [SmallMain 的 Linux Do 帖子](https://linux.do/t/topic/2376385)*

*第一轮：[topic/1544250](https://linux.do/t/topic/1544250) | 第二轮：[topic/2054337](https://linux.do/t/topic/2054337)*
