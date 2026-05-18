# 架构决策记录（ADR）

架构决策记录（ADR）用于记录一项重要架构决策及其背景与后果。

## 约定

- 目录：`contributing/decisions`
- 命名：
  - 使用日期前缀文件：`YYYY-MM-DD-choose-database.md`
  - 若仓库已使用仅 slug 命名，则保持：`choose-database.md`
- 状态值：`proposed`、`accepted`、`rejected`、`deprecated`、`superseded`

## 工作流

- 新建 ADR 时状态为 `proposed`。
- 讨论并迭代。
- 团队确认后：标记为 `accepted`（或 `rejected`）。
- 若后续被替代：创建新 ADR，并将旧 ADR 标记为 `superseded` 并附上链接。

## ADR 列表

- [Adopt architecture decision records](2026-03-11-adopt-architecture-decision-records.md)（accepted，2026-03-11）
