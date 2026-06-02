# 博客文章发布规范

## 目标

保证 Obsidian 里的文章同步到博客后，不只存在于 Mac mini 本机临时目录，也能进入 Git 历史并推送到远端 GitHub，方便回滚、迁移和灾难恢复。

## 关键概念

- Obsidian vault：写作源头，文章先在这里创作和修改。
- 本地博客仓库：`/Users/solaris/AI/e-life-blog`，网站实际从这里读取 `content/posts` 和 `public/images`。
- 本地 Git：本机仓库里的版本记录，执行 `git add` 和 `git commit` 后才算进入本地 Git 历史。
- 远端 Git：GitHub 仓库，当前是 `https://github.com/Solaris-star/e-life-blog.git`，执行 `git push` 后才算远端也有备份。
- 线上网站：当前 Docker 容器从 Mac mini 本地仓库构建和运行。文章能在线显示，不代表已经进入 GitHub。

## 推荐发布顺序

1. 在 Obsidian 写文章，补齐标题、日期、摘要、标签等 frontmatter。
2. 使用同步 Agent 把文章复制到博客仓库：
   - Markdown：`content/posts/<slug>.md`
   - 图片：`public/images/<slug>/...`
3. 在本地检查同步结果：

```bash
git -C /Users/solaris/AI/e-life-blog status --short
```

4. 本地预览或构建检查：

```bash
npm --prefix /Users/solaris/AI/e-life-blog run build
```

5. 只提交本次文章相关文件，不使用 `git add .`：

```bash
git -C /Users/solaris/AI/e-life-blog add content/posts/<slug>.md public/images/<slug>/
git -C /Users/solaris/AI/e-life-blog commit -m "docs: 发布 <文章标题>"
```

6. 推送到远端 GitHub：

```bash
git -C /Users/solaris/AI/e-life-blog push origin master
```

7. 重新构建并更新线上 Docker 服务。
8. 如果文章列表、首页或统计脚本没有立即变化，在 EdgeOne 控制台清理对应 URL 缓存。

## 判断文章是否已经进 Git

查看哪些内容已被 Git 跟踪：

```bash
git -C /Users/solaris/AI/e-life-blog ls-files content public/images
```

查看哪些内容还只是本地文件：

```bash
git -C /Users/solaris/AI/e-life-blog status --short
```

状态含义：

- `??`：文件还没有进入 Git。
- `M`：文件已被 Git 跟踪，但本地有新修改还没 commit。
- 没有输出：当前本地工作区干净。

## 发布原则

- Obsidian 是写作入口，不直接等于线上发布。
- 同步到 `content/posts` 只是进入本地博客目录，不等于进入 Git。
- `git commit` 后才算进入本地 Git。
- `git push` 后才算远端 GitHub 有备份。
- 线上 Docker 更新后，用户才能看到最新构建结果。
- 每次文章发布都应至少包含文章 Markdown；如果文章引用了本地图片，也必须一起提交图片目录。

## 当前建议

短期保持 Obsidian 作为写作源头，不急着引入 CMS。先把流程固定为：

```text
Obsidian -> 同步到本地博客仓库 -> 本地检查 -> git commit -> git push -> 重新部署网站
```

后续如果需要网页后台管理文章，再评估 TinaCMS 或 Keystatic。它们适合 Git/Markdown 工作流，但会改变现在以 Obsidian 为中心的写作方式。

## 统计系统

当前使用 Umami 统计博客访问：

- Umami 本机地址：`http://127.0.0.1:3004`
- Umami 部署目录：`/Users/solaris/AI/umami-compose`
- 博客站点 ID：`8f7a8110-e25d-44e3-96ce-44dbdc10656c`
- 博客页面脚本：`/umami/script.js`
- 博客上报代理：`/umami/api/send`

Umami 服务只监听 `127.0.0.1:3004`，不直接暴露到公网或局域网。公网用户访问博客时，浏览器请求的是 `https://blog.sovoice.asia/umami/script.js` 和 `https://blog.sovoice.asia/umami/api/send`，再由博客后端代理到本机 Umami。

检查 Umami 容器：

```bash
docker ps --filter name=e-life-umami --format '{{.Names}} {{.Status}} {{.Ports}}'
```

检查统计是否入库：

```bash
docker exec e-life-umami-db psql -U umami -d umami -c 'select count(*) from website_event;'
```

注意：用 `curl` 默认 User-Agent 测试 `/api/send` 会被 Umami 当作 bot，返回 `{"beep":"boop"}` 且不入库。这是正常防 bot 行为。真实浏览器访问会正常统计。

## EdgeOne 缓存

博客首页当前可能被 EdgeOne 缓存。代码更新后，如果 `https://blog.sovoice.asia/` 仍然没有新内容，但 `https://blog.sovoice.asia/?任意参数=1` 有新内容，说明源站已更新，只是 EdgeOne 裸 URL 缓存未刷新。

需要在 EdgeOne 控制台执行缓存清理：

```text
缓存刷新 / Purge URL：
https://blog.sovoice.asia/
https://blog.sovoice.asia/articles
```

如果只更新了某篇文章，也清理对应文章 URL。
