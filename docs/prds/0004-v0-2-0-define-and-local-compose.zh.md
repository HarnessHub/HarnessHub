# HarnessHub v0.2.0 PRD：显式定义与本地组合

English version: [`0004-v0-2-0-define-and-local-compose.md`](./0004-v0-2-0-define-and-local-compose.md)

## 状态

`0.1.0` 发布后的规划中产品范围文档。

这份 PRD 定义了 HarnessHub 在已发布 `0.1.0` 之后的第一条 post-MVP 版本线。

## 版本意图

`0.1.0` 证明了 HarnessHub 已经可以围绕 OpenClaw-first 的 harness image 完成：

- `inspect`
- `export`
- `import`
- `verify`

`0.2.0` 的下一步应当是：

- 从“打包一个 runtime realization”
- 走向“显式定义并在本地组合一个可复用 harness image”

这个版本不是 registry 版本，也不是多 adapter 版本。

## 产品目标

`0.2.0` 应当在不试图一次完成 `1.0` 全部架构的前提下，让 HarnessHub 的“可复用性”真正前进一步。

这个版本应该让操作者能够：

1. 显式定义一个 harness image
2. 声明一个本地 parent/base image 关系
3. 产出一个范围受控的本地组合结果
4. 继续对这个结果使用 `export -> import -> verify`

一句话概括：

- `0.1.0` = 可以打包并搬运一个 image
- `0.2.0` = 可以定义一个 image，并在一个 parent 之上做本地组合

## 为什么需要这个版本

当前产品方向已经把目标生命周期定义为：

`inspect -> define -> compose -> export -> import -> verify -> evolve`

而当前仓库实际实现的仍然只是：

`inspect -> export -> import -> verify`

所以 `0.1.0` 之后最值得补的空白，不是 registry，也不是第二个 runtime adapter，而是缺失的：

- `define`
- 第一条真实可用的 `compose`

## 范围

`0.2.0` 应当交付以下内容。

### 1. 显式 Harness Definition

HarnessHub 需要引入一个仓库内的 harness definition 模型。

这个 definition 至少应当表达：

- image identity
- 目标 adapter / runtime realization
- 包含的组件
- 如存在则声明 parent image reference
- binding 与 rebinding 预期
- verification intent

definition 应当成为“可复用 harness image”的显式来源，而不是继续把某个 runtime 目录视为唯一出发点。

### 2. `harness init`

`0.2.0` 应当新增 `harness init` 作为公开的 bootstrap 命令。

它应支持：

- 在当前目录创建一个新的 starter definition
- 在适当场景下根据现有 OpenClaw source path 进行 bootstrap

心智模型应当是：

- 用 `init` 开始定义一个 harness
- 用 `compose` 在需要时叠加本地 parent
- 之后继续进入 `export`、`import`、`verify`

### 3. 本地 Parent Image References

当前 manifest 里的 lineage 字段需要从“保留字段”变成“本地可用”。

`0.2.0` 应支持：

- 一个本地 parent/base image reference
- 仅支持本地路径或本地 image identity

`0.2.0` 不应支持：

- 远程 registry lookup
- 远程 namespaced image resolution
- 网络化 catalog 行为

### 4. 收敛范围的本地组合

`0.2.0` 应通过 `harness compose` 提供第一条真实的组合路径。

这条路径必须刻意保持收敛：

- 一个 parent
- 一个 child
- 一个本地 materialized result

组合语义应当明确，而且在不支持的情形下快速失败。

`0.2.0` 应优先选择：

- 一个范围小但真实的组合模型

而不是：

- 一个范围很大但语义含糊的 merge 模型

### 5. 具备 Lineage 语义的 Export 与 Verify

现有生命周期需要扩展到能正确承载 `0.2.0` 支持的 composed image。

这意味着：

- `export` 可以从 definition-driven 或 composed local result 出发
- `import` 继续兼容现有 `0.1.x` image
- `verify` 检查真正的 lineage 语义，而不只是字段存在

## Public CLI Shape

`0.2.0` 的 CLI 形态应当是：

- `harness init`
- `harness compose`
- 已有的 `harness inspect`
- 已有的 `harness export`
- 已有的 `harness import`
- 已有的 `harness verify`

设计意图：

- `init` 是显式进入 definition 的入口
- `compose` 是显式进入本地 layering 的入口
- 现有命令尽量保持稳定

## 0.2.0 的组合规则

这个版本应当实行一个收敛范围的组合契约。

### 支持的结构

- 一个 parent/base image
- 一个 child image 或 definition
- 一个本地 materialized result

### 支持的结果

materialized result 应当可以继续用于：

- 本地检查（在需要时）
- 导出为 `.harness`
- 导入到目标 runtime 布局
- 带 lineage 语义的验证

### Merge Policy

merge policy 必须是显式的。

只有在 `0.2.0` 明确支持的组件集合里，才允许 child-over-parent 行为。

不被支持的重叠必须产生清晰的 operator-facing conflict，而不是静默合并。

### 延后语义

`0.2.0` 应当明确延后：

- multi-parent graphs
- 深层多层组合
- 更复杂的 conflict-resolution 策略
- registry-backed parent resolution

## 推荐的组件边界

`0.2.0` 应先把组合能力聚焦在最有意义、最可复用的 harness 组件上。

优先支持的可组合组件：

- workspace
- config
- skills

其他组件类别可以先保持为：

- pass-through
- 不支持组合
- 或显式延后

关键原则是：`0.2.0` 不能暗示“广义组合已经支持”，而实际上并没有。

## Verification 语义

`verify` 应当从：

- “解包后的文件结构是否大体有效”

演进到：

- “这个 image 以及它声明的本地 lineage 是否在语义上自洽”

在 `0.2.0` 里，这至少意味着验证：

- parent reference 是否有效
- layer ordering 是否有效
- composed materialization 结果是否符合预期
- 组合和导入之后 binding / rebinding 预期是否仍然成立

`verify` 应当能清晰区分：

- 单 image 的结构有效
- 带 lineage 的 image 有效
- lineage 声明错误
- composition / materialization 不一致

## 非目标

`0.2.0` 明确不做以下内容：

- 远程 registry / catalog primitives
- 第二个生产级 runtime adapter
- cryptographic signing
- advanced policy engines
- 广义深层 layer inheritance
- 实现层面上的完整 multi-runtime neutrality
- hosted UI 或 SaaS 行为

## 成功标准

当以下条件都成立时，可以认为 `0.2.0` 达成目标：

1. 用户可以通过 `harness init` 创建 harness definition
2. 用户可以声明一个本地 parent/base image 关系
3. 用户可以对一个受支持的两层场景运行 `harness compose`
4. 组合结果仍然可以走通 `export -> import -> verify`
5. `verify` 能对 lineage-aware 的成功和失败给出有意义的结果
6. `0.2.0` 文档已经具体到足以驱动 issue 拆分和实现顺序

## 实现含义

这个版本应继续沿着现有架构方向推进：

- 保持 OpenClaw 仍是唯一生产级 adapter
- 把内部重心继续从 snapshot 驱动，推进到 definition-driven 与 composition-aware 的 image handling
- 避免让版本目标漂移成 registry 项目或第二 adapter 项目

这样 `0.2.0` 就会成为一个真实的产品步骤，而不是纯文档版本：

- 它补上了缺失的 define 步骤
- 它补上了第一条本地 compose 步骤
- 同时保持了通往 `1.0` 的架构连续性

## 参考文档

- `docs/prds/0002-product-foundation.md`
- `docs/prds/0003-roadmap-mvp-to-v1.md`
- `docs/architecture/0001-harness-image-architecture.md`
- `docs/architecture/0002-harness-capability-packaging.md`
- `docs/specs/0001-mvp-harness-image-specification.md`
