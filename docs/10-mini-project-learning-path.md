# 10 · 阶梯式小项目学习体系（v0.3）

> **状态：已完成项目规格设计；尚未制作项目运行模板、实际运行器和评分系统。**
> 对应：[课程体系](06-learning-objectives-and-difficulty.md)、[练习规则](07-exercise-design-and-grading.md)、[毕业项目 Mini TestPilot](08-capstone-project-design.md)、[交互式课程引擎](09-interactive-learning-engine.md)。
> 结构化目录：[curriculum/projects/catalog.json](../curriculum/projects/catalog.json)。

## 1. 为什么增加小项目

单课 Micro Lab 太小，毕业项目 Mini TestPilot 又涉及整个前后端链路。因此补充 6 个“2～10 小时可拆分、可独立完成的项目”，训练从单一语法到真实功能的迁移。小项目不重复讲课：要求阅读既有代码、实现功能、修复 AI 风格缺陷、覆盖异常与边界、解释改动并运行回归测试。

- 建议做 5 个阶段项目、1 个进阶选修（Electron）。也可优先选最相关的四个，不强制每周全部完成。
- 每项切为 3～5 个小里程碑，每个里程碑要支持暂停、恢复、重置和查看代码 Diff。
- **完成标准是实际功能与测试**，不是观看演示、点击运行或复制整套答案。
- 默认保留不同项目自己的工作区；不能让项目数据覆盖课程示例或主程序。
- 项目时长为建议的动手开发时间，需依个人经验调整；可与阶段综合课共用内容，避免额外负担。

## 2. 六个项目概览

| 项目 | 放置阶段 | 建议时间 | 技术 | 最终产物 | 核心难点 |
| --- | --- | ---: | --- | --- | --- |
| [MINI-01 学习计划板](projects/MINI-01-study-planner.md) | WEB-07 / JS-02 后 | 3–4h | HTML/CSS/JS | 离线任务板 | DOM 事件委托、响应式、存储与 XSS |
| [MINI-02 请求故障实验台](projects/MINI-02-request-lab.md) | JS-09 / TS-06 后 | 4–6h | TS、Fetch、DOM | 可模拟 HTTP 故障的请求工具 | Promise、错误分类、取消、运行时校验 |
| [MINI-03 类型安全任务引擎](projects/MINI-03-typed-task-engine.md) | TS-08 后 | 4–6h | TS、Vitest | 可复用的任务状态/记录模块 | 联合类型、泛型、never、不可变更新 |
| [MINI-04 React 缺陷看板](projects/MINI-04-react-bug-board.md) | RE-09 后 | 6–9h | React、TS、Vite | 带表单/筛选的 React UI | State 快照、Effect、列表 Key、竞态 |
| [MINI-05 本地知识库 API](projects/MINI-05-notes-api.md) | BE-07 后 | 6–9h | Node、TS、SQLite | 可用 HTTP 调试的笔记服务 | REST、入参校验、事务、迁移、测试 |
| [MINI-06 Electron 片段库](projects/MINI-06-electron-snippet-vault.md)（选修） | FS-08 后 | 6–10h | Electron、React、TS | 本地片段管理桌面 App | Main/Preload/Renderer、受控 IPC、权限 |

## 3. 教学包统一结构

每个项目必须有：产品故事与用户行为、前置能力题、目标目录结构、分阶段任务卡、初始模板、可编辑文件白名单、公开测试、完整验收、故意设置的缺陷、分级提示、过程快照与代码导出。

在桌面程序中以五区协作显示：左侧任务与验收，中央文件树/Monaco，右侧实时浏览器预览或 HTTP 客户端，下方 Console/Problems/Tests/Diff；课程原理与目标始终可回看。窄屏改成标签式切换，不缩到无法使用。

**统一任务形态**：先预测执行结果 → 自己实现 → 用测试暴露失败 → 最小修改修复 → 补边界测试 → 写出原因及风险。关键里程碑必须至少有一项可复现的错误，而非全部都是空模板填空。

## 4. 自动评测维度

| 维度 | MINI-01 | MINI-02 | MINI-03 | MINI-04 | MINI-05 | MINI-06 |
| --- | --- | --- | --- | --- | --- | --- |
| 静态检查 | ESLint | TS strict | TS strict + 负向类型用例 | TS strict | TS strict | Main/Preload/Renderer TS |
| 功能验证 | DOM 行为 | Mock Fetch | 纯函数/状态测试 | React 组件测试 | HTTP 集成/SQLite | IPC 受控行为测试 |
| 反例检查 | XSS / 事件重复 | 404/离线/坏 JSON | 非法状态/错误分支 | 竞态/清理/键 | 非法字段/事务回滚 | 非法 IPC/路径 |
| 交付成果 | 可交互页面 | 本地请求实验台 | 类型化模块 | Vite React 页面 | 本地 REST API | 单独 Electron 应用 |

判定规则：**所有必需行为断言通过，且关键约束没有违例**；解释性复盘要求提交，但文字质量不可冒充确定性的 Vitest 评分。基础题优先内置 fixtures，避免依赖公网/API key；有运行器或依赖缺失要显示环境故障而非作业失败。

## 5. 课程衔接与毕业项目迁移

| 小项目 | 向 Mini TestPilot 转移的知识 |
| --- | --- |
| 01 | DOM 事件、表单、筛选和前端数据安全 |
| 02 | TypeScript API Client、HTTP/网络错误分层和请求取消 |
| 03 | TaskRun 联合状态、通用 Result 泛型和穷尽检查 |
| 04 | React 列表/表单、状态一致性、请求竞态测试 |
| 05 | REST API、SQLite、入参校验、事务与迁移 |
| 06 | Electron 主/渲染分离和安全 IPC，理解学习工具自身的架构 |

课程阶段 Checkpoint 可直接选用关联小项目的部分里程碑，避免“48 课 + 6 个项目”机械叠加。

## 6. 运行模式与安全边界

- Browser Lab（01、02）：隔离 DOM 预览，无高权限桥接，不允许不可信页面跨进程访问 Main。
- Typed Lab（03）：受控 TS 编译和 Vitest 执行；Node 子进程不是 OS 安全沙箱。
- React Lab（04）：Vite/依赖需明确环境预装和授权；隔离预览导航与请求。
- Node API Lab（05）：受限工作区、loopback 监听、任务树终止和临时 DB。
- Electron Lab（06）：学员开发的 Electron 主进程是**独立应用**，不可嵌进学习软件可信 Main；执行前要求明确授权与更强隔离评估。

不允许原型 UI 伪造运行/评测结果。外部来源的任意 Node/npm 脚本仍需额外的隔离与权限审查。

## 7. 项目引擎实施顺序

1. JS-09 单课真实运行、评测、恢复闭环。
2. Project Manifest 解析、任务卡、专用工作区、代码快照和测试报告。
3. MINI-01：DOM 编辑/预览/测试/项目导出闭环。
4. MINI-02/03：可控异步和类型级检查。
5. MINI-04：React HMR/组件测试。
6. MINI-05：Node API 服务/SQLite/HTTP 测试。
7. 毕业项目 Mini TestPilot。
8. MINI-06 进阶选修。

机器可读目录采用 [catalog.json](../curriculum/projects/catalog.json)。状态区分：design=只定义了规格；template-ready=已拥有可实例化模板；runnable=真实运行通路可用；graded=自动评测可用。**目前全部为 design。**
