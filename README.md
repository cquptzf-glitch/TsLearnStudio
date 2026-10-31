# TsLearnStudio

面向已有编程经验（尤其是 C/C++ / Qt 开发者）的 **TypeScript + Web 交互式桌面学习 IDE**。

> 当前阶段：产品需求、技术架构、课程与 UI/UX 设计。代码运行器和正式 Electron 应用尚未实现；原型仅用于交互与视觉验证。

## 产品目标

在一个 Windows 优先、可逐步跨平台的桌面程序中，形成 **阅读教程 → 观察可视化执行过程 → 编辑代码 → 运行/调试 → 自动评测 → 作业复盘 → 项目实战** 的学习闭环。最终目标是能独立看懂、修改、调试和验证 AI 编写的前端与 Node.js 后端代码。

## 设计文档

| 文件 | 内容 |
| --- | --- |
| [需求规格](docs/01-product-requirements.md) | 用户场景、FR/NFR 编号、范围、验收标准 |
| [技术架构](docs/02-technical-architecture.md) | Electron 进程、安全架构、数据模型、课程/执行/评测引擎 |
| [UI/UX 设计](docs/03-ui-ux-design.md) | 信息架构、页面布局、交互状态、设计 Token、无障碍 |
| [课程与评测](docs/04-curriculum-and-assessment.md) | 48 课目录、练习设计、评测/掌握度、样例数据 |
| [实施计划](docs/05-implementation-plan.md) | 里程碑、任务拆解、质量门禁、风险与决策记录 |
| [逐课能力与难点地图](docs/06-learning-objectives-and-difficulty.md) | 48 课的关键机制、易错点、实验与最低验收 |
| [作业题库与评测](docs/07-exercise-design-and-grading.md) | 六种题型、首批 16 项重点任务、详细测试与反馈规则 |
| [Mini TestPilot 实战规格](docs/08-capstone-project-design.md) | 领域模型、API 合约、8 个里程碑、联调与回归设计 |
| [交互课程引擎](docs/09-interactive-learning-engine.md) | 教学视图、课时 Schema、运行/测试/复盘数据流 |
| [精品示范课 JS-09](curriculum/samples/JS-09/lesson.md) | Fetch 异常处理的完整教材样稿与示例代码 |

## UI 原型

下载/克隆仓库后打开 [prototype/index.html](prototype/index.html)，即可在浏览器预览 v0.2 专业紧凑型工作台、课程列表、项目页面、亮暗主题和代码草稿编辑。请保留同目录的 `styles.css` 与 `app.js`。

**注意：UI 原型不是真正的 Electron 程序**；已支持课程导航、模块搜索、示例编辑草稿、主题/布局切换，但不会编译、执行或评测学员代码。具体说明见 [prototype/README.md](prototype/README.md)。

## 拟定技术栈

- Electron + electron-vite + React + TypeScript
- Monaco Editor、Tailwind CSS、shadcn/ui、Markdown/MDX（受控内容）
- TypeScript Compiler API、Vitest、独立 Node 执行器、SQLite
- 分离 Main / Preload / Renderer / Runner，默认禁止学员代码接触 Electron 主进程权限

## 实施原则

1. 文档先行、先跑通 **单课完整学习闭环**，再扩充全部课程。
2. 学员代码与可信应用代码必须隔离；独立进程不是安全沙箱。
3. 课程内容、答案、测试规则和 UI 解耦；题目应有确定性评测和解释性反馈。
4. 默认直接维护 **main**，不主动创建开发分支；每次改动需有可验证的验收结果。
5. 优先 Windows 11，基础学习可离线；完整项目依赖预装工具链或已缓存依赖。

## 权威技术资料

- [Electron 安全清单](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron Utility Process](https://www.electronjs.org/docs/latest/api/utility-process)
- [electron-vite 开发指南](https://electron-vite.org/guide/dev)
- [TypeScript 官方手册](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React 学习文档](https://react.dev/learn)
- [Node.js 学习文档](https://nodejs.org/en/learn)

## 本轮课程与实战深化（设计更新）

- 课程重点从“语法介绍”转向 **关键机制 → 可观察行为 → 反例 → 实际修复 → 回归验证**。
- 学习结果分为 L1 识别、L2 推理、L3 实现、L4 迁移；关键知识点必须有真实的评测证据。
- 每课至少一项预测/理解题和一项动手编程；关键课程增加缺陷修复与异常边界，综合课程是多文件任务。
- 毕业项目按 M1–M8 分阶段实现，并指定需要修改的文件、API、数据模型和自动验收。
- 新增 [JS-09 课程样稿](curriculum/samples/JS-09/README.md)，包括课程正文、课程题目元数据、学员起始源码及参考解法。**尚未接入运行器/评测系统**。

## 阶梯式小项目（v0.3）

除 48 课内的练习与毕业项目 Mini TestPilot 外，新增六个独立实战项目：Study Planner、Request Lab、Typed Task Engine、React Bug Board、Notes API、Snippet Vault（Electron 选修）。详见 [六个小项目学习路线](docs/10-mini-project-learning-path.md)、[逐项目详细规格](docs/projects/) 和 [机器可读项目目录](curriculum/projects/catalog.json)。

目前是**项目设计与验收规格**，尚未提供可运行模板、运行器与评测，不应标示为已交付项目。
