---
status: accepted
date: 2026-03-11
decision-makers:
---

# 采用架构决策记录

## 背景与问题陈述

本项目的架构决策往往隐含在代码、对话与口口相传中。当新贡献者（人类或 AI agent）加入代码库时，缺少关于**为何**如此构建的记录。这导致：

- 难以判断某种模式是有意为之还是偶然形成
- 难以知晓过往决策是否仍适用或已被取代
- 容易重复争论已仔细考虑过的决策

我们需要一种轻量、与代码同库版本控制的决策记录方式。

## 决策

采用 MADR 4.0 格式的架构决策记录（ADR），存放在 `contributing/decisions/`。

约定：

- 每个 ADR 一个文件，命名为 `YYYY-MM-DD-title-with-dashes.md`
- 新 ADR 从 `proposed` 开始，再转为 `accepted` 或 `rejected`
- 被取代的 ADR 需双向链接到替代 ADR
- ADR 应自包含——coding agent 应能仅凭 ADR 实现决策，无需额外上下文

## 后果

- 优点：决策可发现，并与代码一起版本控制
- 优点：新贡献者（人类或 agent）能理解架构选择背后的「为什么」
- 优点：团队积累共享决策日志，避免重复争论已定论的问题
- 缺点：编写 ADR 需要时间——但好的 ADR 节省的时间多于成本
- 中性：ADR 需要定期审阅，将过时决策标记为 deprecated 或 superseded

## 考虑的替代方案

- 无正式记录：继续在对话与代码注释中做决策。因上下文会丢失且决策被重复争论而拒绝。
- Wiki 或 Notion 页面：在仓库外记录决策。因与代码不同步且未版本控制而拒绝。
- 轻量 RFC：更重的流程与正式评审。对大多数决策而言过重——ADR 在需要时可扩展到 RFC 级别细节。

## 更多信息

- MADR：<https://adr.github.io/madr/>
- Michael Nygard, "Documenting Architecture Decisions": <https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions>
