---
title: "在 Windows 下使用 symlink 同步文件"
date: "2026-05-18T10:00:00Z"
description: "记录一下使用 mklink 创建目录软链接的技巧"
tags: ["Windows", "Tips"]
published: true
---

在 Windows 下，如果我们想要把两个不在一起的文件夹同步，除了复制粘贴，最好的办法就是使用 **软链接（Symlink）**。

具体命令如下：

```cmd
mklink /J "目标路径" "源路径"
```

这不仅节省了空间，而且两个地方的修改是完全同步的。非常适合用来做代码仓库和文档库的连接。