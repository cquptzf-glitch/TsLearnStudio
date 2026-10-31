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

## UI 原型

打开 [prototype/index.html](prototype/index.html) 即可在浏览器预览学习工作台、多页面导航、亮暗色主题和代码练习的界面流程。

**注意：UI 原型不是真正的 Electron 程序**；它不会执行或评测学员代码，所有示例状态均为设计样例。

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
