---
name: adr-skill
description: 创建与维护面向 agentic 编码工作流优化的架构决策记录（ADR）。在需要提议、撰写、更新、接受/拒绝、弃用或取代 ADR；bootstrap adr 文件夹与索引；在实现变更前查阅现有 ADR；或执行 ADR 约定时使用。本 skill 在起草前用苏格拉底式提问捕获意图，并对照 agent 就绪清单验证输出。
metadata:
  internal: true
---

# ADR Skill

## 理念

用本 skill 创建的 ADR 是 **面向 coding agent 的可执行规范**。人类批准决策；agent 实现。ADR 必须包含 agent 编写正确代码所需的一切，无需追问。

这意味着：

- 约束必须明确且可衡量，而非模糊感觉
- 决策必须具体到可执行（「使用带 pgvector 的 PostgreSQL 16」而非「使用数据库」）
- 后果必须映射到具体后续任务
- 必须说明非目标以防止范围蔓延
- ADR 必须自包含——不假设口口相传的知识
- **ADR 必须包含实现计划**——涉及哪些文件、遵循哪些模式、编写哪些测试、如何验证决策已正确实现

## 何时撰写 ADR

在以下情况撰写 ADR：

- **改变系统构建或运行方式**（新依赖、架构模式、基础设施选择、API 设计）
- 一旦针对其编写代码后**难以逆转**
- **影响**后续在本代码库工作的其他人或 agent
- **存在被考虑并拒绝的真实替代方案**

**不要**为以下情况撰写 ADR：

- 既定模式内的常规实现选择
- Bug 修复或错别字更正
- 已在现有 ADR 中记录的决策（应更新该 ADR）
- 已由 linter 或 formatter 覆盖的风格偏好

有疑问时：若未来在此代码库工作的 agent 能因了解**为何**做出该选择而受益，则撰写 ADR。

### 主动 ADR 触发（面向 Agent）

若你是正在仓库中编码的 agent 并遇到以下情况，**先停止并提议 ADR** 再继续：

- 即将引入项目中尚不存在的新依赖
- 即将创建其他代码需遵循的新架构模式（新的错误处理方式、新的数据访问层、新的 API 约定）
- 即将在多个真实替代方案间做选择且权衡不明显
- 即将变更与现有已接受 ADR 矛盾的内容
- 发现自己正在写长代码注释解释「为什么」——该推理应放在 ADR 中

**如何提议**：告诉人类你遇到的决策、为何重要，并询问是否希望记录为 ADR。若是，运行完整四阶段工作流。若否，在代码注释中记录决策并继续。

## 创建 ADR：四阶段工作流

每个 ADR 经历四个阶段。不要跳过阶段。

### 阶段 0：扫描代码库

在提问前，从仓库收集上下文：

1. **查找现有 ADR。** 检查 `contributing/decisions/`、`docs/decisions/`、`adr/`、`docs/adr/`、`decisions/`。阅读它们。注意：
   - 现有约定（目录、命名、模板风格）
   - 与当前决策相关或约束当前决策的决策
   - 本新决策可能取代的任何 ADR

2. **检查技术栈。** 阅读 `package.json`、`go.mod`、`requirements.txt`、`Cargo.toml` 或等价物。注意相关依赖与版本。

3. **查找相关代码模式。** 若决策涉及特定领域（例如「我们如何处理 auth」），扫描现有实现。识别决策将影响的特定文件、目录与模式。

4. **检查代码中的 ADR 引用。** 在注释与文档中查找 ADR 引用（见下方「Code ↔ ADR Linking」）。这可揭示哪些现有决策管辖代码库的哪些部分。

5. **记录发现。** 将上下文带入阶段 1——这将使问题更精准并防止 ADR 与现有决策矛盾。

### 阶段 1：捕获意图（苏格拉底式）

通过访谈理解决策空间。**一次问一个问题**，在前述答案基础上展开。不要一次性抛出问题列表。

**核心问题**（大致按此顺序，若上下文或阶段 0 已清楚则跳过）：

1. **你在决定什么？** — 得到简短、具体的标题。推动使用动词短语（「Choose X」、「Adopt Y」、「Replace Z with W」）。
2. **为何是现在？** — 什么坏了、什么在变、或什么都不做会怎样？这是触发器。
3. **存在哪些约束？** — 技术栈、时间线、预算、团队规模、现有代码、合规。要具体。引用阶段 0 的发现（「我看到你已在用 X——这是否约束本决策？」）。
4. **成功是什么样子？** — 可衡量的结果。超越「能用」到具体指标（延迟、吞吐、DX、维护负担）。
5. **考虑过哪些选项？** — 至少两个。每个：核心权衡是什么？若只有一个选项，帮助阐明为何拒绝替代方案。
6. **你目前倾向什么？** — 尽早捕获直觉。常揭示未言明的优先级。
7. **谁需要知晓或批准？** — 决策者、咨询专家、知情相关方。
8. **Agent 实现需要什么？** — 影响哪些文件/目录？应遵循哪些现有模式？应避免什么？哪些测试能证明有效？这直接馈入实现计划。

**自适应追问**：根据答案，在决策模糊处深入。常见追问：

- 「若此决策错误，最坏结果是什么？」
- 「什么会让你在 6 个月后重新审视？」
- 「你明确选择**不**做什么？」
- 「这与代码库中哪些先例或现有模式相关？」
- 「我发现 [现有 ADR/模式]——新决策是否与之交互？」

**何时停止**：当你能填写 ADR 的每个部分——包括实现计划——而无需编造时即足够。若对任何部分在猜测，再问一个问题。

**意图摘要关卡**：进入阶段 2 前，呈现结构化摘要并请人类确认或更正：

> **以下为 ADR 捕获内容：**
>
> - **Title**: {title}
> - **Trigger**: {why now}
> - **Constraints**: {list}
> - **Options**: {option 1} vs {option 2} [vs ...]
> - **Lean**: {which option and why}
> - **Non-goals**: {what's explicitly out of scope}
> - **Related ADRs/code**: {what exists that this interacts with}
> - **Affected files/areas**: {where in the codebase this lands}
> - **Verification**: {how we'll know it's implemented correctly}
>
> **是否准确反映你的意图？需要补充或更正吗？**

在人类确认摘要之前**不要**进入阶段 2。

### 阶段 2：起草 ADR

1. **选择 ADR 目录。**
   - 若已存在（阶段 0 发现），使用它。
   - 若不存在，创建 `contributing/decisions/`（若存在 `contributing/`）、`docs/decisions/`（MADR 默认）或 `adr/`（较简单仓库）。

2. **选择文件名策略。**
   - 若现有 ADR 使用日期前缀（`YYYY-MM-DD-...`），继续该方式。
   - 否则使用仅 slug 文件名（`choose-database.md`）。

3. **选择模板。**
   - 对直接决策（一个明确赢家、权衡少）使用 `assets/templates/adr-simple.md`。
   - 需记录多个选项及结构化利弊/驱动因素时使用 `assets/templates/adr-madr.md`。
   - 见 `references/template-variants.md`。

4. **根据已确认的意图摘要填写每个部分。** 不要留占位符。每部分应有真实内容或删除（仅可选部分）。

5. **撰写实现计划。** 这对 agent 优先的 ADR 最重要。它告诉下一个 agent 确切做什么。结构见模板。

6. **将验证标准写为复选框。** 必须具体到 agent 可程序化或手动逐项检查。

7. **生成文件。**
   - 首选：运行 `scripts/new_adr.js`（处理目录、命名与可选索引更新）。
   - 若无法运行脚本，从 `assets/templates/` 复制模板并手动填写。

### 阶段 3：对照清单审阅

起草后，对照 `references/review-checklist.md` 中的 agent 就绪清单审阅 ADR。

**以摘要形式呈现审阅**，而非原始清单倾倒。格式：

> **ADR Review**
>
> ✅ **Passes**: {list what's solid — e.g., "context is self-contained, implementation plan covers affected files, verification criteria are checkable"}
>
> ⚠️ **Gaps found**:
>
> - {specific gap 1 — e.g., "Implementation Plan doesn't mention test files — which test suite should cover this?"}
> - {specific gap 2}
>
> **Recommendation**: {Ship it / Fix the gaps first / Needs more Phase 1 work}

仅呈现失败项与显著优点——不要逐条复述通过的复选框。

若有缺口，提出具体修复。不要只标问题——提供方案并请人类批准。

在 ADR 通过清单或人类明确接受缺口之前不要定稿。

## 查阅 ADR（阅读工作流）

Agent 应在有 ADR 的代码库中**在实现变更之前**阅读现有 ADR。这不属于创建 ADR 工作流——是任何 agent 都应执行的独立操作。

### 何时查阅 ADR

- 开始涉及架构的功能（auth、数据层、API 设计、基础设施）之前
- 遇到代码中的模式并疑惑「为何如此实现」时
- 在提议可能与现有决策矛盾的变更之前
- 当人类说「查 ADR」或「对此有决策」时
- 在代码注释中发现 ADR 引用时

### 如何查阅 ADR

1. **找到 ADR 目录。** 检查 `contributing/decisions/`、`docs/decisions/`、`adr/`、`docs/adr/`、`decisions/`。并检查索引文件（`README.md` 或 `index.md`）。

2. **扫描标题与状态。** 阅读索引或列出文件名。聚焦 `accepted` ADR——这些是有效决策。

3. **完整阅读相关 ADR。** 不要只读标题——阅读 context、decision、consequences、non-goals **以及** Implementation Plan。Implementation Plan 说明应遵循的模式以及哪些文件受该决策管辖。

4. **尊重决策。** 若已接受 ADR 说「使用 PostgreSQL」，不要在不创建取代它的新 ADR 的情况下提议换 MongoDB。若发现代码与 ADR 矛盾，向人类标记。

5. **遵循实现计划。** 在 ADR 管辖区域内实现代码时，遵循其实现计划中的模式。若计划说「所有新查询经 `src/db/` 的数据访问层」，则照做。

6. **在工作中引用 ADR。** 在代码注释与 PR 描述中添加 ADR 引用（见下方「Code ↔ ADR Linking」）。

## Code ↔ ADR Linking

ADR 应与其管辖的代码双向链接。

### ADR → Code（在 Implementation Plan 中）

Implementation Plan 部分命名具体文件、目录与模式：

```markdown
## Implementation Plan

- **Affected paths**: `src/db/`, `src/config/database.ts`, `tests/integration/`
- **Pattern**: all database queries go through `src/db/client.ts`
```

### Code → ADR（在注释中）

在 ADR 指导下实现代码时，添加引用 ADR 的注释：

```typescript
// ADR: Using better-sqlite3 for test database
// See: docs/decisions/2025-06-15-use-sqlite-for-test-database.md
import Database from 'better-sqlite3';
```

保持轻量——在入口点一条注释，而非每行。目标是可发现性：未来 agent 读此代码时可找到推理。

### 为何重要

- 在 `src/db/` 工作的 agent 可找到管辖该区域的 ADR
- 阅读 ADR 的 agent 可找到实现它的代码
- ADR 被取代时，代码引用便于找到所有需更新的代码

## 其他操作

### 更新现有 ADR

1. 明确意图：
   - **Accept / reject**：更改状态，添加最终上下文。
   - **Deprecate**：状态 → `deprecated`，说明替代路径。
   - **Supersede**：创建新 ADR，双向链接（旧 → 新，新 → 旧）。
   - **Add learnings**：附带到 `## More Information` 并加日期戳。不要改写历史。

2. 使用 `scripts/set_adr_status.js` 更改状态（支持 YAML front matter、bullet status 与 section status）。

### 接受后生命周期

ADR 被接受后：

1. **创建实现任务。** Implementation Plan 中每项与 Consequences 中每项后续都应成为可跟踪任务（issue、ticket 或 TODO）。
2. **在 PR 中引用 ADR。** 在 PR 描述中链接 ADR，例如 "Implements `contributing/decisions/2025-06-15-use-sqlite-for-test-database.md`."
3. **添加代码引用。** 在关键实现点添加 ADR 路径注释。
4. **检查验证标准。** 实现完成后，逐项检查 Verification 复选框。在 `## More Information` 中更新 ADR 结果。
5. **触发条件时重新审视。** 若 ADR 指定了重新审视条件（「若 X 发生则重新考虑」），监控这些条件。

### 索引

若仓库有 ADR 索引/日志文件（常在 ADR 目录的 `README.md` 或 `index.md`），保持更新。

首选：由 `scripts/new_adr.js --update-index` 处理。否则：

- 为新 ADR 添加 bullet 条目。
- 保持排序一致（若编号则数字序；若 slug 则日期或字母序）。

### Bootstrap

向尚无 ADR 的仓库引入 ADR 时：

```bash
node /path/to/adr-skill/scripts/bootstrap_adr.js
```

这会创建目录、索引文件，以及内容完整的第一个 ADR（「Adopt architecture decision records」），说明团队为何使用 ADR。使用 `--json` 获取机器可读输出。使用 `--dir` 覆盖目录名。

### 分类（大型项目）

对 ADR 很多的仓库，按子目录组织：

```
docs/decisions/
  backend/
    2025-06-15-use-postgres.md
  frontend/
    2025-06-20-use-react.md
  infrastructure/
    2025-07-01-use-terraform.md
```

日期前缀在各分类内局部有效。尽早选择分类方案（按层、按域、按团队）并在索引中文档化。

## 资源

### scripts/

- `scripts/new_adr.js` — 根据仓库约定从模板创建新 ADR 文件。
- `scripts/set_adr_status.js` — 就地更新 ADR 状态（YAML front matter 或内联）。使用 `--json` 获取机器输出。
- `scripts/bootstrap_adr.js` — 创建 ADR 目录、`README.md` 与初始「Adopt ADRs」决策。

### references/

- `references/review-checklist.md` — 阶段 3 审阅的 agent 就绪清单。
- `references/adr-conventions.md` — 目录、文件名、状态与生命周期约定。
- `references/template-variants.md` — 何时使用 simple 与 MADR 风格模板。
- `references/examples.md` — 带实现计划的完整短/长 ADR 示例。

### assets/

- `assets/templates/adr-simple.md` — 直接决策的精简模板。
- `assets/templates/adr-madr.md` — 多选项与结构化权衡的 MADR 4.0 模板。
- `assets/templates/adr-readme.md` — `scripts/bootstrap_adr.js` 使用的默认 ADR 索引脚手架。

### Script Usage

在目标仓库根目录：

```bash
# Simple ADR
node /path/to/adr-skill/scripts/new_adr.js --title "Choose database" --status proposed

# MADR-style with options
node /path/to/adr-skill/scripts/new_adr.js --title "Choose database" --template madr --status proposed

# With index update
node /path/to/adr-skill/scripts/new_adr.js --title "Choose database" --status proposed --update-index

# Bootstrap a new repo
node /path/to/adr-skill/scripts/bootstrap_adr.js --dir docs/decisions
```

Notes:

- Scripts auto-detect ADR directory and filename strategy.
- Use `--dir` and `--strategy` to override.
- Use `--json` to emit machine-readable output.
