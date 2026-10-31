# 08 · 实战项目功能设计与分阶段验收（v0.2）

> 这是可以直接拆分成实现工单的**产品/项目规格**，不是已经完成的应用。
> 目标：让学员在 TsLearnStudio 内部从零理解并实现一个真正可运行的 React + TypeScript + Node.js + SQLite 小型测试用例管理系统。
> 课程映射见 [06 能力地图](06-learning-objectives-and-difficulty.md)，评测见 [07 练习与评测规格](07-exercise-design-and-grading.md)。

## 1. 实战体系：避免只在最后做一个大项目

课程中的实战应分为四层：

| 层次 | 触发 | 规模 | 代表任务 | 学习收益 |
| --- | --- | --- | --- | --- |
| Micro Lab | 每课 | 1 个文件、5–25 行重点修改 | 预测微任务执行顺序、修复 this | 理解最小原理 |
| Feature Lab | 每 2–3 课 | 2–5 个文件、1 个小功能 | 组件筛选、类型化 API Client | 能独立实现小功能 |
| Stage Checkpoint | 每阶段最后一课 | 一个可回归的小模块 | 静态任务板、TS 代码审查、Node API | 验证阶段能力 |
| Capstone | S6 全栈阶段 | 前端+后端+数据库+测试 | Mini TestPilot | 迁移知识到真实代码维护 |

不要把所有实战都放在最后。用户在 JS 阶段就应该看到 HTTP 请求和状态，在 TS 阶段就应该阅读 DTO，在 React 阶段就应该接入 mock API。

## 2. 毕业项目定义：Mini TestPilot

### 2.1 产品目标

**最小但真实**的测试用例管理平台。学员通过它练习「需求→数据建模→API→UI→数据库→测试→发布/审查」的完整过程。

**不做**：多租户、用户权限系统、复杂测试执行编排、真实 SVN/禅道连接、云端账户、协作、AI Agent（保留独立进阶扩展接口）。这些功能容易让学习目标被无关工程复杂度淹没。

### 2.2 典型用户故事

- U1：查看测试用例列表，按名称、模块、状态、优先级筛选。
- U2：新建测试用例，填写标题、模块、前置条件、步骤、预期、优先级。
- U3：修改测试用例并保存，列表立刻呈现新数据。
- U4：删除测试用例，先确认且 UI 与数据库一致。
- U5：执行一次「通过/失败/阻塞」的结果记录，能查看最近执行结果。
- U6：请求失败时有清晰错误提示，且可以重试。
- U7：刷新/重启之后数据不丢失，DB 写入失败不会留下半更新。
- U8：学员能运行类型检查、单测、API 测试，查看失败详情并修复。

## 3. 领域模型和规则（M1）

### 3.1 TestCase

```ts
type Priority = "P0" | "P1" | "P2";
type CaseStatus = "draft" | "ready" | "archived";
type ExecutionStatus = "passed" | "failed" | "blocked";

interface TestCase {
  id: string;              // 系统生成、不可编辑
  title: string;           // trim 后 1–120 字符
  module: string;          // trim 后 1–60 字符
  priority: Priority;      // 默认 P1
  status: CaseStatus;      // 默认 draft
  precondition: string;    // 可为空
  steps: string[];         // 1–20 条，每条 1–500 字符
  expected: string;        // 1–1000 字符
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
  version: number;         // 乐观更新控制
}

interface TestRun {
  id: string;
  caseId: string;
  result: ExecutionStatus;
  note: string;            // 可为空
  executedAt: string;
}
```

为降低课程起步门槛，项目初始数据只要求 `title/module/priority/status`；M3 开始增加步骤、预期等字段，M5 再加入执行记录。数据迁移也作为实际练习。不要一开始就给完整最终类型然后让学员无脑复制。

### 3.2 不变式
1. `title`、`module` 不允许仅空格；`priority`、`status` 只能取固定枚举。
2. `steps` 为非空数组，数组成员去空白后非空（完成 M3 后启用）。
3. `createdAt` 不可由客户端直接修改；时间戳由服务端产生。
4. 修改时 `version` 必须与当前 DB 版本相符；不匹配返回 409，提示刷新。
5. 删除不存在资源返回 404；不得误报成功。
6. 列表默认按 `updatedAt DESC, id ASC` 排序，结果可预测。
7. 数据库迁移有版本号，且不能丢掉已有测试用例。
8. 为避免过早引入认证，项目作为单机本地学习环境，默认仅绑定 localhost，禁止暴露公网。

## 4. 数据库设计（M2 后逐步演进）

```sql
CREATE TABLE test_cases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 120),
  module TEXT NOT NULL CHECK (length(trim(module)) BETWEEN 1 AND 60),
  priority TEXT NOT NULL CHECK (priority IN ('P0','P1','P2')),
  status TEXT NOT NULL CHECK (status IN ('draft','ready','archived')),
  precondition TEXT NOT NULL DEFAULT '',
  expected TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE test_case_steps (
  case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  content TEXT NOT NULL,
  PRIMARY KEY(case_id, position)
);
CREATE TABLE test_runs (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  result TEXT NOT NULL CHECK (result IN ('passed','failed','blocked')),
  note TEXT NOT NULL DEFAULT '',
  executed_at TEXT NOT NULL
);
```

SQLite 连接初始化：开启 `foreign_keys=ON`，并使用实际测试验证级联行为；批量更新用事务。教学中解释 SQL `CHECK`、后端运行时校验与前端表单校验的不同责任。  
生产级迁移应记录 schema 版本；练习中 M3 增字段需要提供一个可执行迁移演示，不直接销毁数据库重建。

## 5. REST API 合约（M2、M4、M5）

统一返回 `Content-Type: application/json`，列表与单条资源结构区分。默认本地 API 端点 `/api/v1`。

| 方法/路径 | 请求 | 成功响应 | 异常 |
| --- | --- | --- | --- |
| GET /cases | `q,module,priority,status,limit,offset` | 200 + `{items,total,limit,offset}` | 400 参数无效 |
| GET /cases/:id | — | 200 + `{item}` | 404 不存在 |
| POST /cases | CreateTestCaseDTO | 201 + `{item}` | 422 字段校验失败 |
| PATCH /cases/:id | `{version, ...editable}` | 200 + `{item}` | 404/409/422 |
| DELETE /cases/:id | — | 204 无 body | 404 不存在 |
| POST /cases/:id/runs | `{result,note}` | 201 + `{run}` | 404/422 |
| GET /cases/:id/runs | `limit,offset` | 200 + `{items,total}` | 404/400 |
| GET /health | — | 200 + `{status:"ok"}` | 503（依赖故障时） |

Base path 是 `/api/v1`，即第一行完整路径为 `GET /api/v1/cases`。

统一错误：
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "title must contain 1–120 characters",
    "field": "title"
  }
}
```

约定 400 用于查询参数语法错误，422 用于合法 JSON 但字段不满足业务约束；409 为版本冲突。具体 Node 框架可采用 Express/Fastify 任一，但第一版固定一个，课程和测试保持一致。  
**重点：** 204 不发送 JSON 响应体；请求体与 URL 参数均必须运行时校验，不以 TS 类型替代。

## 6. 前端页面与交互设计

### 页面 A：用例列表
- 顶部：搜索栏、模块筛选、优先级、状态、创建按钮、重置过滤条件；
- 中间：表格列（标题、模块、优先级、状态、更新时间、操作）；
- 底部：分页、总记录数；
- 状态：初次加载、空数据、筛选无结果、加载失败、刷新中、成功；
- 细节：切换筛选后旧请求不能覆盖新请求；删除成功后更新列表；刷新时保留用户已填过滤条件；
- 测试：组合筛选、空结果、返回乱序、分页边界、API 500。

### 页面 B：新增/编辑抽屉
- 标题、模块、优先级、状态、前置条件、步骤（动态多条）、预期；
- 前端表单验证只是体验层，后端负责最终验证；
- 保存中禁止重复提交，失败保留未提交草稿，成功关闭并更新列表；
- 编辑时使用 version；409 提示「数据已改变，请刷新后重新编辑」；
- 测试：空白标题、无步骤、非法优先级、重复提交、409 冲突。

### 页面 C：用例详情与执行记录
- 左侧：基本信息、步骤与预期；
- 右侧：最近执行结果、执行备注、时间；
- 支持记录 passed/failed/blocked；
- 切换用例后旧请求不能覆盖当前用例；
- 测试：404、空执行记录、非法状态、记录排序。

### 页面 D：项目诊断与测试
- 本地服务状态：已启动/已停止/端口占用；
- HTTP 请求工具：可发 GET、POST、PATCH、DELETE 请求并查看响应；
- 测试面板：类型检查、单元、API 集成、页面交互测试；
- 错误可点击打开对应文件行；
- 不展示假的服务运行状态或模拟测试“通过”。

## 7. 项目分阶段任务（依赖、交付物、运行方式）

项目总里程碑 8 项；每项在桌面程序内具有独立工单、可编辑文件、检查步骤、通过结果和复盘。

### M1 · 数据建模和纯函数（TS 基础）
**先修**：TS-02/03/04/06。  
**改动**：`shared/types.ts`、`shared/validators.ts`、`shared/filter.ts`。  
**任务**：定义 TestCase、DTO、联合状态，写用例过滤/排序/校验纯函数。  
**测试**：合法/非法字段、空集合、不修改原数组、never 穷尽。  
**验收**：TypeScript strict + 纯函数单测。  
**运行器**：无需 Node 服务；受控 TS 编译与函数评测即可。

### M2 · 基础 REST API（Node 核心）
**先修**：BE-02/03/04。  
**改动**：`server/app.ts`、`server/routes/cases.ts`、`server/services/cases.ts`。  
**任务**：GET/POST/PATCH/DELETE，统一错误格式及运行时验证；先使用内存仓储避免立刻陷入 DB 复杂度。  
**测试**：200/201/204/400/404/409/422；POST 返回新 id；PATCH 版本冲突。  
**验收**：HTTP 集成测试通过且能在程序内用 HTTP 面板调用。  
**运行器**：独立受控 Node 服务；需显示端口和退出清理。

### M3 · SQLite 与数据迁移（后端难点）
**先修**：BE-05。  
**改动**：`server/storage/schema.sql`、`server/storage/repository.ts`、`server/storage/migrations/`。  
**任务**：内存仓储改 SQLite；事务处理步骤表、避免部分保存；迁移不丢旧数据。  
**测试**：持久化、事务回滚、外键、重复插入、迁移前后查询。  
**验收**：重启后数据存在，失败事务全回滚。  
**运行器**：临时 SQLite 测试数据库；不覆盖用户真实项目文件。

### M4 · React 用例列表（React 状态与请求）
**先修**：RE-01/02/03/04/07。  
**改动**：`client/App.tsx`、`client/components/CaseTable.tsx`、`client/api/cases.ts`。  
**任务**：列表、搜索、筛选、加载/错误/空态、取消旧请求。  
**测试**：用户交互、网络 500、搜索乱序响应、空数据分页。  
**验收**：真实 React 预览显示行为，组件测试 + 真实本地 API 联调。  
**运行器**：Vite dev server + 浏览器隔离预览。

### M5 · 表单与执行记录（前后端修改）
**先修**：RE-05/06、BE-03。  
**改动**：`client/components/CaseForm.tsx`、`client/components/CaseDetail.tsx`、`server/routes/runs.ts`。  
**任务**：新增/编辑/删除、版本冲突处理、执行结果记录、错误反馈。  
**测试**：非法字段、重复点击、冲突、失败保留草稿、记录可查。  
**验收**：前后端全链路可用。

### M6 · 缺陷定位（真实 Debug）
**先修**：FS-03。  
**给定缺陷**：
1. 前端快速搜索时，旧的慢响应覆盖新结果；
2. API 成功返回，但更新步骤时没有事务，DB 保存一半失败；
3. [可选] 版本冲突时 UI 直接覆盖旧数据。
**任务**：先复现，利用 Network/Logs/断点定位，再改最小范围并补回归测试。  
**验收**：必须提交「复现步骤、根因、修复和测试证据」。

### M7 · AI 代码维护与回归（工程方法）
**先修**：FS-04/06/07。  
**变更需求**：为测试用例增加 `owner` 字段并在列表筛选；不要求鉴权系统。  
**任务**：先列出影响范围，修改 TS 模型、DB 迁移、API、React 组件和测试；避免直接整库重写。  
**验收**：旧数据有明确默认策略、迁移不丢失、筛选正确、404/422/409 不回归。

### M8 · 毕业交付与解释
**任务**：运行统一检查；导出本地项目；提交变更摘要、架构图、数据流说明、错误处理策略、测试结果和已知限制。  
**验收**：全套关键用例通过；能解释从「点击新增」到「DB 写入」和 UI 反馈的完整调用链。  
**不把漂亮截图当毕业标准**。

## 8. 项目可运行的标准目录

```text
mini-testpilot/
├─ package.json
├─ tsconfig.json
├─ client/
│  ├─ src/App.tsx
│  ├─ src/api/cases.ts
│  ├─ src/components/CaseTable.tsx
│  ├─ src/components/CaseForm.tsx
│  └─ src/components/CaseDetail.tsx
├─ server/
│  ├─ src/app.ts
│  ├─ src/routes/cases.ts
│  ├─ src/routes/runs.ts
│  ├─ src/services/cases.ts
│  ├─ src/storage/repository.ts
│  └─ src/storage/migrations/
├─ shared/
│  ├─ types.ts
│  ├─ validators.ts
│  └─ filter.ts
└─ tests/
   ├─ unit/
   ├─ api/
   └─ ui/
```

这是**目标模板结构**，当前仓库尚未创建这些源码。

## 9. 在 TsLearnStudio 内的项目学习体验

### 9.1 必须真正能操作
- 「开始里程碑」：从只读模板复制到私有工作区，显示对应任务目标与可编辑文件。
- 「查看需求」：项目需求拆分为可勾选验收项目，标注来源课程知识。
- 「打开文件」：Monaco 以文件树/标签编辑多文件源码、保存草稿。
- 「运行服务」：经授权启动固定项目脚本，显示端口、日志、停止按钮；失败可定位原因。
- 「预览应用」：隔离 Chromium 内容区展示真实 React UI，支持刷新与查看请求。
- 「测试 API」：GUI 中构造请求并检查响应，保存可复现的请求样例。
- 「运行测试」：独立展示 typecheck/unit/api/ui 结果，区分设施错误与代码错误。
- 「提交里程碑」：生成不可变代码快照，执行必选测试并归档报告。
- 「查看 Diff」：对比初始模板与当前源码，解释改了哪些层。
- 「恢复/导出」：重置前快照，可将项目导出给 VS Code 继续开发。

### 9.2 任务可视化面板设计

```text
┌ 里程碑 M4 · React 用例列表 / 先修 RE-04、RE-07 ────────────────┐
│ 任务说明/验收 [左侧]  │ 文件树 + Monaco [中间] │ 实时预览/请求 [右] │
│ [ ] 空态               │ App.tsx               │ 页面 / API 结果    │
│ [ ] 加载中             │ CaseTable.tsx         │                   │
│ [ ] HTTP 错误          │ cases.ts              │                   │
│ [ ] 竞态取消           │                       │                   │
├────────────────────────┴───────────────────────┴───────────────────┤
│ Problems | Console | Tests | HTTP Trace | Diff                         │
│ ▶ 启动前端   ▶ 启动 API   ■ 停止   ✓ 提交里程碑   ↺ 恢复快照         │
└───────────────────────────────────────────────────────────────────┘
```

### 9.3 三种教学模式

| 模式 | 目标 | 学生控制范围 |
| --- | --- | --- |
| Guided | 第一遍：知道做什么、怎么观察 | 指定文件、公开测试、分层提示 |
| Independent | 第二遍：只显示目标和验收，独立实现 | 所有当前阶段可编辑文件 |
| Debug Challenge | 第三遍：给故障现象，隐藏原因 | 真实代码与日志、有限提示 |

从 Guided 到 Independent 不能偷偷改变 API 合约和评分标准；变式难度增长要明确标记。

## 10. 综合项目测试分层

| 层 | 推荐工具/方式 | 关键验收 |
| --- | --- | --- |
| Typecheck | tsc strict | TS 类型错误为零，接口模型一致 |
| Unit | Vitest | 校验器、筛选、排序、状态机 |
| API Integration | Vitest + HTTP 客户端 + 临时 DB | 状态码、错误格式、事务、并发版本 |
| UI Component | React 组件测试 | 加载、空态、表单、错误、查询乱序 |
| E2E | Playwright（后期） | 新建→刷新→修改→删除→重启 |
| Code Review | 结构化清单 + 学员解释 | 影响范围、未回归点、限制 |

单测通过不代表 UI 正常；UI 交互测试通过也不代表数据库事务正确。通过定义关键全链路用例确保跨层一致。

## 11. 可选进阶任务：SVN 变更 → 受影响功能 → 测试用例草案

这与大型自动化测试平台的真实维护场景相关，但**不要强行纳入毕业必选条件**，避免学习 TS/Web 被 SVN/Agent 复杂度淹没。

### 进阶目标
给定一份预制的 SVN diff（离线 fixture），系统分析文件变更 → 生成受影响的模块候选 → 关联已有测试用例 → 输出待审阅的测试清单。先使用确定性规则完成最小功能，再允许 AI 推荐辅助解释。

### 设计分层
1. `DiffParser`：读取本地预制 SVN unified diff，得出文件/改动片段；不能无限制访问真实 SVN。
2. `ImpactRuleEngine`：路径/模块映射 + 直接依赖，生成「直接影响/可能影响/证据不足」。
3. `TestCaseMatcher`：按模块和标签关联现有用例，不伪造覆盖率。
4. `CandidateGenerator`：生成候选用例标题/步骤，标注来源 diff 与置信度说明（不等同真实概率）。
5. `ReviewQueue`：人工确认、修改、导出，明确不自动写入正式库。
6. [P2] AI Assistant：解释变更与建议回归点，无法证明的影响应标明不确定。

### 验收样例
- 修改纯 UI 样式 → 关联该页面布局/视觉回归用例，不能宣称所有 API 均受影响；
- 修改 `validation.ts` → 关联数据输入校验与异常测试；
- 修改共享 DTO → 关联前后端消费者，标记为跨层影响；
- 未知文件 → 输出「待人工检查」，不能编造测试覆盖。

## 12. 交付优先级

1. **先交付一个真正能运行的 Micro Lab**（JS-09 fetch 错误修复），完成运行/提交/失败反馈闭环。
2. 再交付 TypeScript 联合类型与 React 竞态专项，让评测器具备不同类型题支持。
3. 首个可运行的 Mini TestPilot 只实现 M1–M2（纯函数+内存 API），确保多文件、Node 流程和测试可信。
4. 通过安全/功能验证后再引入 SQLite、Vite 预览和综合 M3–M8。
5. 所有教学体验必须真实运行；未完成的功能只展示说明，不显示虚假的通过状态。
