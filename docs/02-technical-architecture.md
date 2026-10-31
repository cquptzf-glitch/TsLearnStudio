# TsLearnStudio 技术架构与详细方案

- 版本：v0.1
- 决策：Electron + electron-vite + React + TypeScript（Windows 11 优先）
- 约束：运行器隔离优先于「一行代码直接执行」的便利

## 1. 关键技术选型与理由

| 子系统 | 选型 | 取舍与备注 |
| --- | --- | --- |
| 桌面外壳 | Electron | Chromium + Node 集成、开发迭代速度；包体和内存较大 |
| 构建/开发 | electron-vite + pnpm | Main/Preload/Renderer 独立构建、HMR；锁定依赖版本 |
| 渲染层 | React + TypeScript | 组件化且课程中直接教授同一技术栈 |
| UI | Tailwind + shadcn/ui（本地组件） | 轻量定制，需自建一致性规范 |
| 编辑器 | Monaco Editor | 多语言语法和 TS 诊断；不等同完整 VS Code |
| 内容 | JSON Manifest + Markdown + 受控交互组件 | 内容可版本化；禁止不受控的远程 HTML/脚本 |
| 状态 | React Query（异步）+ 轻量本地 UI Store | 本地事务通过 Main 层管理 |
| 持久化 | SQLite + 项目文件 | 结构化记录与真实文件开发并存 |
| 练习检查 | TypeScript Compiler API、Vitest | 同时覆盖静态类型和行为断言 |
| Node/React 项目 | 独立受控 Node Runtime、Vite | 与 Main 分开；运行前做环境自检 |
| 打包 | electron-builder | Windows 安装包，签名与发布属于后续实施 |
| 测试 | Vitest、Playwright（E2E）、安全验证用例 | 不把 UI 原型当作真实集成测试 |

不锁定具体最新版号：实现时固定 Electron/Node/TS 等兼容版本组合并提交 lockfile。

## 2. 运行进程与信任边界

~~~text
┌────────────────── Electron Main（可信控制平面） ──────────────────┐
│ Window / IPC / CourseCatalog / Workspace / Progress / JobManager │
└───────────────┬────────────────────────┬─────────────────────────┘
                │ typed IPC              │受控命令 + 事件流
┌───────────────▼───────────────┐   ┌────▼────────────────────────┐
│ Preload (窄 API)              │   │ Runner Broker (可信代理)    │
│ contextBridge + schema       │   │ 任务队列、超时、终止、日志    │
└───────────────┬───────────────┘   └────┬────────────────────────┘
                │                        │
┌───────────────▼───────────────┐   ┌────▼────────────────────────┐
│ React Renderer (不可信 UI)    │   │ Lesson/Node/Vite/Test 进程   │
│ Curriculum / Monaco / Preview│   │ 独立 cwd、资源限制、输出捕获 │
└───────────────────────────────┘   └─────────────────────────────┘
                                             │
                  Workspace（学生文件） + 只读内容包 + SQLite 记录
~~~

规则：
1. Main 不执行来自学员输入的 eval、vm、动态 require/import 或 npm script。
2. Renderer：nodeIntegration=false、contextIsolation=true、sandbox=true；严格 CSP，不暴露 Electron 原生对象。
3. Preload 只暴露具名、高层方法，不提供通用 ipcRenderer、任意 channel 或任意 shell 命令。
4. IPC 按 event sender frame/URL 白名单校验，并以 schema 验证请求、响应和消息体。
5. 学员 HTML/React 预览放进独立隔离 session / WebContentsView 或具有严格 sandbox 的 iframe，隔绝应用 preload、权限、导航、弹窗和跨域数据；实施时验证 Chromium 的具体隔离属性。
6. Electron utilityProcess 具备 Node 能力，可用于可信代理或可信计算任务，但**不能替代针对任意恶意代码的 OS 级沙箱**。
7. 真实 Node/npm 任务具备本机权限风险：首版仅支持经审核的模板；外部代码需要明确授权，并评估低权限用户/容器/VM 等强隔离策略。
8. 不使用 Node vm 作为安全边界；禁用任意 npm install 生命周期脚本自动执行。

官方依据：[Security](https://www.electronjs.org/docs/latest/tutorial/security)、[utilityProcess](https://www.electronjs.org/docs/latest/api/utility-process)、[electron-vite](https://electron-vite.org/guide/dev)。

## 3. 模块边界

### 3.1 Main
- WindowService：窗口生命周期、标题栏、窗口状态、缩放和菜单。
- IPCController：request ID、sender 校验、超时、取消、schema 校验。
- CourseCatalogService：加载 manifest、检查内容包 hash 与兼容版本、只读索引。
- WorkspaceService：实例化题目模板、保存草稿、路径 canonicalization、快照及恢复。
- ProgressService：课时状态、练习尝试、指标计算、SQLite 迁移。
- ExecutionService：创建、停止、查找任务并转发事件；禁止任意命令。
- AppDiagnostics：事件日志、环境检测、隐私过滤。

### 3.2 Renderer
- AppShell：侧栏、顶部操作、窗口布局；导航状态由路由驱动。
- CurriculumUI：课程树、知识内容、步骤卡与实验动画。
- EditorWorkbench：Monaco 模型、草稿保存、诊断标记、文件 Tabs。
- OutputPanel：控制台、错误、测试详情、运行进度、停止按钮。
- PreviewHost：实际 HTML/React 预览，与可信 UI 隔离。
- AssignmentUI：描述、提交状态、历史、提示与复盘。
- SettingsUI：主题、字号、快捷键、运行器检查、隐私、依赖路径。

### 3.3 课程与评测内核
- Lesson Loader：Schema 版本兼容；内容定位使用 immutable lesson ID。
- Exercise Factory：使用模板在用户工作区创建文件，不直接修改课包。
- Runner Registry：typecheck / js-basic / browser-preview / node-project / react-project。
- Grader Registry：静态检查、公开断言、隐藏断言、组件测试、API 集成测试。
- Feedback Engine：按错误类型输出固定知识提示，AI 可选但不能覆盖确定性评测。

## 4. Repository 建议目录

~~~text
TsLearnStudio/
├─ README.md
├─ docs/
│  ├─ 01-product-requirements.md
│  ├─ 02-technical-architecture.md
│  ├─ 03-ui-ux-design.md
│  ├─ 04-curriculum-and-assessment.md
│  └─ 05-implementation-plan.md
├─ prototype/index.html             # UI-only，非真实运行器
├─ src/
│  ├─ main/                         # Electron Main
│  │  ├─ ipc/
│  │  ├─ services/
│  │  └─ index.ts
│  ├─ preload/index.ts
│  ├─ renderer/
│  │  ├─ components/
│  │  ├─ pages/
│  │  ├─ features/
│  │  ├─ styles/
│  │  └─ index.html
│  └─ shared/                       # IPC schema & 类型
├─ packages/
│  ├─ lesson-core/
│  ├─ exercise-runner/
│  └─ grader/
├─ curriculum/
│  ├─ manifest.json
│  └─ stages/<stage>/<lesson>/
├─ templates/
│  ├─ vanilla-ts/
│  ├─ react-ts/
│  └─ node-ts/
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
└─ .github/workflows/
~~~

这是目标结构，并不代表以上源代码已存在。

## 5. IPC 契约

严禁设计通用 exec(command) 或 readFile(path) 给 renderer。采用明确的能力 API，所有请求具有 requestId、correlationId，具有版本号和错误枚举。

~~~typescript
type StudioAPI = {
  courses: {
    list(): Promise<CourseSummary[]>;
    getLesson(id: string): Promise<LessonView>;
  };
  workspace: {
    openExercise(exerciseId: string): Promise<WorkspaceHandle>;
    listFiles(handle: string): Promise<WorkspaceFile[]>;
    readFile(handle: string, relativePath: string): Promise<string>;
    writeFile(handle: string, relativePath: string, text: string): Promise<void>;
    resetExercise(handle: string): Promise<void>;
  };
  execution: {
    runExample(handle: string): Promise<{ jobId: string }>;
    typecheck(handle: string): Promise<Diagnostic[]>;
    stop(jobId: string): Promise<void>;
    subscribe(jobId: string, onEvent: (event: JobEvent) => void): () => void;
  };
  grading: {
    submit(exerciseId: string, handle: string): Promise<{ attemptId: string }>;
    getAttempt(attemptId: string): Promise<GradingReport>;
  };
  progress: {
    getSummary(): Promise<ProgressSummary>;
    markRead(lessonId: string, stepId: string): Promise<void>;
  };
};
~~~

细化：
- WorkspaceHandle：Main 分配的短期 opaque ID，不将绝对路径作为授权令牌。
- 路径检查：拒绝绝对路径、父目录遍历、软链接/Windows Junction 跳转；结合最终打开的目标句柄校验，防止 TOCTOU。
- 尺寸限制：文本最大长度、日志最大行数、运行时间、任务数量设置可控上限。
- Event 结构：jobId, seq, timestamp, kind(start|stdout|stderr|diagnostic|test|exit|error), payload；订阅后可补拉历史事件，避免 race。
- 错误码：INVALID_INPUT, NOT_FOUND, FORBIDDEN, RUNNER_UNAVAILABLE, TIMEOUT, CANCELLED, INTERNAL。
- IPC 不接受调用方传入任意 shell、可执行文件路径或工作目录。

## 6. 练习运行流程

1. Lesson Loader 根据题目 ID 解析只读资源和受信任运行配置。
2. WorkspaceService 在 app userData/workspaces 下创建实例，复制 starter，不复制可直接读取的隐藏测试。
3. 用户通过 Monaco 修改文件，草稿按 300–800ms debounce 原子写入并记录版本。
4. 运行时先生成 task snapshot（作业代码版本），防止运行中修改导致结果不确定。
5. Typecheck：使用 TS Compiler API 静态诊断，报告文件、行列、错误代码。
6. 基础 JS 运行：受控执行环境 + 超时 + stdout/stderr 捕获；不声称 Worker 能安全执行恶意代码。
7. 真实 Node/React 项目：Runner Broker 启动独立进程，固定入口和 args、cwd 为专用工作区、隔离用户配置、进程树追踪并结束整个任务树。
8. Grader 在独立环境执行显式测试；将报告以不可变 attempt ID 存档。
9. UI 根据 job events 更新；取消和退出必须释放资源及端口。

### 6.1 MVP 执行安全边界
在没有 OS 沙箱前，仅允许符合受控模式的内置基础课程（如纯表达式/函数练习），不面向外部不可信项目提供「安全运行」承诺。完全任意的用户 JS/Node 本机执行应延后到增强隔离设计通过验证之后。

### 6.2 失败类型
编译错误、运行时异常、超时、测试失败、运行器内部故障、依赖缺失分别使用不同状态和 UI。运行器崩溃不能导致应用崩溃。

## 7. 课程 Schema（草案）

~~~json
{
  "schemaVersion": 1,
  "courseId": "typescript-web-foundation",
  "lessonId": "ts-async-01",
  "version": "1.0.0",
  "title": "Promise 与 async/await",
  "prerequisites": ["js-promise-01"],
  "durationMinutes": 45,
  "tags": ["typescript", "async", "http"],
  "steps": [
    { "id": "concept", "kind": "markdown", "resource": "concept.md" },
    { "id": "timeline", "kind": "visual", "visualId": "promise-timeline-v1" },
    { "id": "exercise", "kind": "exercise", "exerciseId": "ts-async-404" },
    { "id": "recap", "kind": "quiz", "quizId": "ts-async-check" }
  ],
  "exercises": [{
    "id": "ts-async-404",
    "runner": "typecheck+js-basic",
    "starterDir": "starter/",
    "testManifest": "tests.json",
    "limits": { "timeoutMs": 3000, "outputKb": 64 }
  }]
}
~~~

- Manifest 必须做 schema 验证、hash 检查与版本迁移。
- 初始模板、解答、公开测试与隐藏测试分离；客户端离线隐藏测试只能延迟暴露或混淆，**不能宣称保密不可获取**。
- 本地学习是开放式学习；防作弊不是首版目标，评测强调行为正确性与可解释性。

## 8. 数据结构（SQLite 草案）

| 表 | 关键字段 | 作用 |
| --- | --- | --- |
| migrations | version, applied_at | DB 迁移 |
| courses | id, version, installed_at | 内容包版本 |
| lesson_progress | lesson_id, read_steps, status, updated_at | 学习状态 |
| exercises | id, lesson_id, revision | 题目索引 |
| workspace_instances | id, exercise_id, path_ref, updated_at | 学员工作区 |
| attempts | id, exercise_id, workspace_revision, status, score, created_at | 提交历史 |
| test_results | attempt_id, test_id, status, message | 测试明细 |
| weak_topics | topic_id, misses, last_practice_at | 薄弱点 |
| preferences | key, value, updated_at | 主题、布局等 |
| job_runs | id, kind, status, duration_ms, exit_code | 运行历史 |

不把所有学生代码塞入数据库；代码放在受控文件工作区，DB 持有相对引用与内容 hash。使用 SQLite 事务、数据库备份和工作区原子写；防止并发更新覆盖最新文件。

## 9. 构建与发布

- 开发：TypeScript strict、eslint、prettier、pnpm lockfile、Vite HMR。
- CI：lint → typecheck → unit → integration → E2E（Windows）→ 安全检查 → 打包产物。
- 打包：Windows x64 installer + 包校验，签名/自动更新为后续事项。
- 运行时探测：明确区分 Electron 内置 Node、独立 Node 可执行程序、npm/pnpm、缓存依赖及端口可用性；提示缺失原因而非静默失败。
- 不联网的功能不请求云 API；AI 作为插件式能力显式启用。

## 10. ADR（架构决策记录）

| ADR | 决策 | 理由 |
| --- | --- | --- |
| ADR-001 | Electron 替代 Tauri | 内置 Node、工程与教学同为 TS、主进程热重启方便 |
| ADR-002 | Main 只做可信调度 | 不让作业异常危及整个应用 |
| ADR-003 | 课程内容 Schema 化 | 便于扩充、更正、版本管理 |
| ADR-004 | SQLite + 文件工作区 | 兼顾学习记录与真实工程操作 |
| ADR-005 | 先单课闭环，后多文件 IDE | 降低早期复杂度并尽快验证学习价值 |
| ADR-006 | UI-only 原型不声称真实判题 | 防止把演示状态误认为交付功能 |

## 11. 实现前必须验证的技术 Spike

- Spike-A：Win11 Electron renderer 安全配置与 sandbox 覆盖率。
- Spike-B：Monaco TS diagnostics 与文件同步、100KB 文本编辑流畅度。
- Spike-C：基础题运行/停止/超时/崩溃测试；复核是否存在危险的任意代码路径。
- Spike-D：Node/Vite 子进程启动和进程树终止、端口回收、工具链缺失提醒。
- Spike-E：React 预览隔离、导航/弹窗/资源权限限制、CSP 与跨源通道。
- Spike-F：课程内容升级和历史记录回归迁移。
