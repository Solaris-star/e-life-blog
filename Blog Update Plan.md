# Blog Update Plan — E-Life Blog 视觉升级

> 创建时间：2026-06-13 · 状态：规划阶段

---

## 一、总体目标

将 E-Life Blog 从「合格级动画博客」升级为**电影叙事感沉浸站点**，参考 Annie Xie "ANNIE CREATIVE OS" 的滚动驱动叙事手法，但走自己的双主题路线。

核心原则：**先做视觉素材，再驱动动画系统**。没有素材的动画只是几何变换空架子。

---

## 二、双主题体系

### Light Mode — 古籍书房风（现有改良）

| 属性 | 值 |
|------|----|
| 氛围 | 活字印刷、纸纹呼吸、书房幽静 |
| 主色 | 暖纸 `#f3e5cf` / 锈红 `#d96d3a` / 橄榄绿 / 墨色 `#241f18` |
| Hero | **可交互像素小人**（风格一致的像素角色，Claude Code 制作） |
| 入场动画 | 纸页翻开、墨迹渗入 |
| 交互反馈 | 纸纹微浮、活字跳动 |
| 过渡衔接 | 墨滴溶散 → 纸面 |
| 视频 | **不放视频**，纯交互像素小人 + CSS 动画 |

### Dark Mode — Solaris 外神风格

| 属性 | 值 |
|------|----|
| 氨围 | 深渊星海、触手蔓延、罗盘脉动、锁链束缚、神秘深邃优雅 |
| 主色 | 午夜蓝 `#0A0F2C` / 电青 `#00F7FF` / 皇家紫 `#6A0DAD` / 金 `#FFD700` |
| Hero | **AI 生成视频**——星云推进 + 外神剪影 + 触手展开 |
| 入场动画 | 星尘漩涡、深渊涌现 |
| 交互反馈 | 发光粒子追踪鼠标、罗盘旋转 |
| 过渡衔接 | 星尘漩涡 → 深渊 |
| 视频 | 每页 Hero 区放置视频，页面间首尾衔接 |

---

## 三、视频衔接体系（Dark Mode）

全站不是每页独立一段，而是一条**连续分镜叙事链**。页面跳转时视频之间首尾相接，用户感受不是「换页」而是「镜头推进」。

### 分镜序列

| # | 页面 | 视频内容 | 时长 | 首帧 | 尾帧（= 下一段首帧） |
|---|------|---------|------|------|---------------------|
| 1 | 首页 Hero | 星云深处推进 → 外神剪影浮现 → 触手展开托出标题 → 流体扩散铺满 | 4-5s loop | 星云远景 | 流体铺满 hero 区 |
| 2 | 文章列表 | 从流体中浮出卡片，如深渊水面升起 → 卡片排列 → 星尘飘落 | 3-4s | 流体铺满水面 | 卡片静立 + 星尘 |
| 3 | 文章详情 | 纸页（星尘材质）展开铺平 → 标题以墨迹（电青光）渗入 → 底部星尘缓慢流动 | 3-4s | 卡片 → 纸面展开 | 墨迹标题 + 星尘底 |
| 4 | 归档/标签 | 星尘收束成年份数字 / 标签节点 → 罗盘旋转定位 → 线条连接节点 | 2-3s | 星尘收束 | 罗盘静止 + 节点 |
| 5 | 关于 | 罗盘 → 外神全貌剪影一瞥 → 镜头拉回星云全景 → 回到首页 | 3-4s | 罗盘 | 星云远景（= #1 首帧） |

**闭环设计**：#5 尾帧 = #1 首帧，全站叙事链可无限循环。

### 技术集成方案

- 视频格式：MP4（H.264）+ WebM（VP9）双格式，移动端降级为首帧静态图
- 页面过渡：`view-transition` API 或 GSAP ScrollTrigger `scrub` 做帧间 blend
- `prefers-reduced-motion: reduce` → 显示首帧静态图，不播放视频
- 视频加载：`preload="none"` + `IntersectionObserver` 懒加载，不影响首屏性能

---

## 四、像素小人体系（Light Mode Hero）

由 Claude Code 制作，风格与古籍书房主题一致。

| 属性 | 值 |
|------|----|
| 风格 | 16×16 或 32×32 像素，暖纸色 + 锈红 + 墨色 |
| 交互 | 随鼠标移动、点击反馈、idle 状态动画 |
| 技术 | CSS sprite / canvas / SVG 像素渲染 |
| 实现 | Claude Code 生成 sprite 图 + 交互逻辑 |
| 不放视频 | Light mode Hero 区纯交互像素小人 + CSS 动画 |

---

## 五、制作流程

### Phase 0 — 分镜脚本 + 首帧 Reference 图 ✅ Light Mode 完成

**Light Mode 概念图 V3**（GPT-image-2，2k quality，忠于 Solaris 立绘参考图）：

| # | 文件 | 页面 | Solaris 形态 | 动/静 | 状态 |
|---|------|------|------------|-------|------|
| 1 | `01-solaris-sprites.png` | Sprite Sheet | 人形 IDLE/WRITING/HAPPY + 章鱼 IDLE/READING/HAPPY | 动（帧序列） | ✅ |
| 2 | `02-homepage.png` | 首页 | 人形 IDLE 站 Hero + 小章鱼漂浮 | 动 | ✅ |
| 3 | `03-daily.png` | Daily | 小章鱼漂浮（无人形） | 动（微动） | ✅ |
| 4 | `04-resources.png` | 资源 | 小章鱼守各分类 | 静 | ✅ |
| 5 | `05-member.png` | 会员 | 小章鱼戴皇冠守 Pro | 静 | ✅ |
| 6 | `06-article-detail.png` | 文章详情 | 人形坐姿读书（文末） | 静 | ✅ |

存储路径：`/tmp/blog-concept-light-v3/`

**Solaris 角色规范（忠于立绘）**：

| 特征 | 人形萌系小人 | 小章鱼形态 |
|------|------------|-----------|
| 发色/体色 | 黑→蓝→紫渐变长发 + 星闪 | 深紫体色 |
| 皇冠 | 金色罗盘冠 + 蓝星宝石 | 迷你版同款罗盘冠 |
| 触手/吸盘 | 2-3条紫色触手 + 蓝荧光吸盘 | 8条触手 + 蓝荧光吸盘 |
| 装饰 | 金色锁链项圈/腰带/星坠 | 金色锁链项圈 |
| 眼睛 | 冷漠淡蓝眼 | 同款冷漠蓝眼 |
| 服装 | 暗色短裙 + 金链 + 星空纹理 | 无（纯生物形态） |

**动静分配原则**：

- **可交互/动态**（Claude Code 制作）：
  - 首页 Hero Solaris 人形：idle 呼吸 + 鼠标靠近触手微动 + 点击切换章鱼形态
  - 各页面小章鱼：idle 漂浮微动 + hover 触手收缩躲闪
  - 装饰粒子：墨点/星尘漂浮（CSS keyframes）
  - 形态切换：人形 ↔ 章鱼变身过渡（sprite 帧序列）

- **静态展示**（像素图直接用）：
  - 文末 Solaris 坐姿读书图
  - 资源/会员页小章鱼 mascot（最多 CSS 呼吸微动）
  - Sprite sheet 各姿态作为备用帧

**视觉规范**：

- 中文导航：首页 | 写作 | Daily | 资源 | 会员
- 暖纸 `#f3e5cf` + 锈红 `#d96d3a` + 墨色 `#241f18`
- 硬边阴影 `7px 7px 0 var(--ink)`
- 人形做人形的事，章鱼做章鱼的事，不混搭
- 装饰三件套：星尘粒子 / 墨点过渡 / 薄荷叶脉线条

**Dark Mode 视频首帧概念图**：待制作

### Phase 1 — Light Mode 像素动画帧制作 🔜 交 Claude Code

**GPT-image-2 无法保证帧间角色一致性，逐帧生成不可用。像素动画帧必须由 Claude Code 一次性制作。**

详细任务书：`Blog Update Plan/像素动画任务书.md`

需要的帧序列：

| 帧序列 | 尺寸 | 帧数 | FPS | 说明 |
|--------|------|------|-----|------|
| 人形 idle 呼吸 | 64×64 | 8-12 | 8 | 呼吸+眨眼+触手微摆 |
| 人形→章鱼变身 | 64→32 | 6-8 | 12 | 过渡帧，loop: false |
| 章鱼→人形变身 | 32→64 | 6-8 | 12 | 逆序过渡 |
| 小章鱼 idle 漂浮 | 32×32 | 4-6 | 6 | 上下微浮+触手微动 |
| 小章鱼 hover 反应 | 32×32 | 2-3 | 10 | 触手收缩躲闪 |
| 文末人形坐姿读书 | 64×64 | 1（静态） | — | 单帧装饰图 |

交互逻辑：自动轮播（30s）+ 点击切换，变身帧不可打断

### Phase 2 — 像素小人制作（Light Mode）

1. Claude Code 生成像素角色 sprite 图
2. 实现交互逻辑（鼠标追踪、状态动画）
3. 风格一致性验证：暖纸色调、墨色轮廓

### Phase 3 — 前端集成

1. Dark Mode CSS 变量扩展：午夜蓝 / 电青 / 皇家紫 / 金
2. Hero 区条件渲染：light → 像素小人，dark → 视频
3. GSAP ScrollTrigger 或 `view-transition` 页面过渡实现
4. 视频懒加载 + reduced-motion 降级
5. Docker build → 验证 dev → 验证 prod

### Phase 4 — 滚动驱动动画升级

1. PostListCard 3D 透视倾斜 hover
2. Reveal 扩展新变体（slide-from-left/right, scale-up）
3. 视差层叠（文字层 vs 背景层不同速率）
4. 渐变遮罩过渡（section 间溶接）

---

## 六、待定事项

| # | 问题 | 状态 |
|---|------|------|
| 1 | AI 视频工具选择（Kling / Sora / Runway / Pika） | ⏳ 等用户确认额度 |
| 2 | 首帧 reference 图：艾蕾生成 vs 用户自画 | ⏳ 等用户确认 |
| 视频画风 | 参考用户提供的 Solaris 外神图——写实3D渲染 + 细节叠加，深邃星海 + 触手 + 罗盘 |
| 6 | Light mode 概念图已生成（4张），见 `/tmp/blog-concept-light/` | ✅ 完成 |

---

## 八、概念图资产

### Light Mode（已生成）

| # | 文件 | 内容 |
|---|------|------|
| 1 | `/tmp/blog-concept-light/01-hero-fullpage.png` | 首页全页：暖纸底色 + 像素学者 Hero + 文章卡片网格 |
| 2 | `/tmp/blog-concept-light/02-hero-closeup.png` | Hero 特写：像素学者写字 + 漂浮汉字粒子 + 烛光书房 |
| 3 | `/tmp/blog-concept-light/03-article-list.png` | 文章列表页：卡片网格 + 羊皮纸质卡 + 像素学者探出 |
| 4 | `/tmp/blog-concept-light/04-pixel-character-sheet.png` | 像素角色 Sprite：4姿态（举笔/挥手/展卷/书写） |

### Dark Mode（待生成）

需要基于用户提供的两张 Solaris 外神参考图生成，Phase 1 时制作。

---

*本文件随项目推进持续更新。最后更新：2026-06-14*
| 4 | 像素小人尺寸：16×16 vs 32×32 | ⏳ 待 Phase 2 确定 |
| 5 | GSAP vs Framer Motion 选择 | ⏳ 倾向 GSAP（ScrollTrigger 更成熟） |

---

## 七、关键文件路径

| 文件 | 作用 |
|------|------|
| `/Users/solaris/AI/e-life-blog-dev/src/app/globals.css` | 全站 CSS 变量 + 动画定义 |
| `/Users/solaris/AI/e-life-blog-dev/src/components/FluidInk.tsx` | WebGL 流体 Hero 背景 |
| `/Users/solaris/AI/e-life-blog-dev/src/components/layout/Reveal.tsx` | 滚动显现组件 |
| `/Users/solaris/AI/e-life-blog-dev/src/app/(main)/page.tsx` | 首页 Hero 区 |
| `/Users/solaris/AI/e-life-blog-dev/src/app/template.tsx` | page-enter 过渡 |
| `/Users/solaris/AI/e-life-blog-dev/src/app/layout.tsx` | 根 layout + 主题注入 |

---

*本文件随项目推进持续更新。*
