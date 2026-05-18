---
name: list-npm-package-content
description: 在发布前列出 npm 包 tarball 的内容。当用户想查看 npm bundle 包含哪些文件、验证包内容或调试 npm publish 问题时使用。
metadata:
  internal: true
---

# 列出 npm 包内容

本 skill 列出 npm 包 tarball 的精确内容——与将上传到 npm 并由用户下载的文件相同。

## 用法

在包目录中运行脚本（例如 `packages/ai`）：

```bash
bash scripts/list-package-files.sh
```

脚本会构建包、创建 tarball、列出内容，并自动清理。

## 理解包内容

包含的文件由以下决定：

1. **`package.json` 中的 `files` 字段** - 文件/目录的显式白名单
2. **`.npmignore`** - 要排除的文件（若存在）
3. **`.gitignore`** - 若无 `.npmignore` 则使用
4. **始终包含**：`package.json`、`README`、`LICENSE`、`CHANGELOG`
5. **始终排除**：`.git`、`node_modules`、`.npmrc` 等
