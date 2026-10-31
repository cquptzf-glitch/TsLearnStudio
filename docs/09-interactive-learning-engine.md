# 09 · 交互课程引擎、作业工作台与学习体验详细功能（v0.2）

> 本文件描述 TsLearnStudio **软件将如何承载课程、训练和综合项目**，防止教程与运行器成为两套割裂系统。设计未实现。
> 关联：[产品需求](01-product-requirements.md)｜[技术架构](02-technical-architecture.md)｜[难点矩阵](06-learning-objectives-and-difficulty.md)｜[练习评测](07-exercise-design-and-grading.md)｜[实战项目](08-capstone-project-design.md)

## 1. 核心体验目标：每个概念都能在一个窗口里验证

学习一个概念时，程序必须提供五个关联视图：

1. **概念/原理**：准确解释设计原因、运行限制和 C++/Qt 类比。
2. **执行动画**：堆栈/任务队列/对象/组件状态随时间变化；是教学模拟还是实际 tracer 必须明确。
3. **代码实验**：对应具体行的 Monaco 代码与示例输入；可修改，运行真实代码得到输出。
4. **评测反馈**：断言/类型诊断/异常位置/必要的日志与调用链。
5. **应用场景**：映射到真实前端/后端文件，并解释可能的 bug 和影响。

学习步骤应联动：点动画节点高亮代码行；点失败用例打开源文件行；点术语跳到课程术语解释。**没有运行器时，不生成冒充真实追踪的事件数据。**

## 2. 页面功能模块，具体到可开发接口

| 模块 | 主要能力 | 用户动作 | 数据来源/限制 |
| --- | --- | --- | --- |
| Course Navigator | 阶段/课时/先修/进度/全文搜索 | 选择、过滤、继续 | 版本化课程清单+SQLite |
| Lesson Reader | MD 正文/代码对照/术语/折叠步骤 | 阅读、标重点、复制代码 | 本地只读内容包 |
| Visual Tracer | 调度队列/Promise 状态/React render 流程 | 播放/暂停/单步/重置 | 课程提供确定性轨迹数据 |
| Code Lab | Monaco、多文件、诊断、断点入口 | 编辑、保存、撤销、重置 | 私有工作区，不直改课包 |
| Execution Panel | 运行/停止/日志/耗时/异常 | 运行、停止、查看堆栈 | 独立运行任务事件流 |
| Assignment Panel | 约束/公开测试/分级提示/提交 | 提交、重做、比较 | Exercise manifest+评测快照 |
| Test Explorer | 测试层级、输入、期望、实际、失败定位 | 展开失败、跳转源代码 | 真实 Grader Report |
| Project Studio | 文件树、终端、API、预览、Diff、快照 | 开发、测试、提交里程碑 | 本地项目与受控服务 |
| Progress & Review | 阅读/作业/重做/掌握度/薄弱项 | 回看、复习、导出 | 本地 SQLite，规则化状态 |
| AI Coach（可选） | 解释错误、建议测试、帮助拆解 | 显式请求、接受/拒绝建议 | 模型服务；不会覆盖真实测试结果 |

### 教学专用「观察器」组件

- **Runtime Timeline**：逐步显示调用栈、微任务队列、计时器任务与输出，标注浏览器/Node。
- **Reference Graph**：对象及数组引用、浅拷贝/深拷贝、闭包捕获，支持拖动赋值关系。
- **Type Inspector**：`unknown` → 类型守卫/收窄 → 分支可用属性；显示编译时 vs 运行时差异。
- **React Render Trace**：事件触发、State 快照、render、commit、Effect、cleanup 与竞态分支。
- **Request Journey**：Browser fetch → HTTP → Route → Validation → Service → SQLite → Response → UI。
- **Diff Navigator**：AI 修改前后文件差异与受影响调用点，支持回归用例映射。

动画每一帧必须有 `stepId`、解释、关联行、模型状态和可显示输出。高难点不允许只嵌一段不可操作的视频取代实验。

## 3. 学习工作台五种模式

| 模式 | 用途 | 展示面板 | 完成方式 |
| --- | --- | --- | --- |
| Learn | 阅读原理/示例 | Reader + Demo | 记录阅读位置 |
| Predict | 运行前推理 | 代码（只读）+ 答案输入 | 提交预测后才能揭示执行序列 |
| Explore | 自由调参/单步 | Reader + Visual + Code | 实验记录，不强制评分 |
| Practice | 受限文件编码练习 | Assignment + Monaco + Test Explorer | 真实必选测试通过 |
| Project | 多文件综合任务 | Requirement + FileTree + Preview + Console | 阶段验收 + 解释报告 |

从一课进入另一课必须保存草稿；重新打开恢复最后的步骤、代码文件、输出 Tab 和滚动位置。

## 4. 课程 Schema 细化（v2 草案，需正式 JSON Schema 校验）

```json
{
  "schemaVersion": 2,
  "lessonId": "JS-09",
  "revision": 1,
  "title": "Fetch 与错误传播",
  "stageId": "JS",
  "prerequisites": ["JS-07", "JS-08", "WEB-06"],
  "estimatedMinutes": 70,
  "keyConceptIds": ["promise-settlement", "http-status", "runtime-validation"],
  "difficulty": "core",
  "outcomes": [
    { "id": "OBJ-1", "level": "L2", "statement": "说明 HTTP 404 不一定让 fetch rejected" },
    { "id": "OBJ-2", "level": "L3", "statement": "处理 HTTP、网络、JSON 与字段校验错误" }
  ],
  "steps": [
    { "id": "concept", "type": "markdown", "resource": "lesson.md#concept" },
    { "id": "timeline", "type": "visual", "visualId": "fetch-life-cycle-v1" },
    { "id": "predict", "type": "prediction", "exerciseId": "JS09-PREDICT-01" },
    { "id": "repair", "type": "coding", "exerciseId": "PR-07" },
    { "id": "review", "type": "quiz", "exerciseId": "JS09-REVIEW-01" }
  ],
  "links": {
    "nextLessonId": "TS-01",
    "projectUsage": ["M4-api-client", "M6-request-debug"]
  },
  "reviewPolicy": { "variantIds": ["JS09-V1", "JS09-V2"], "requiredPractice": true }
}
```

### Schema 规则
- `lessonId`、`exerciseId`、`stepId` 是稳定 ID；标题可修改，ID 不随标题变化。
- `revision` 增加时记录历史题目评测版本；不能把旧成绩套用到新评分标准。
- `outcomes` 必须能映射至少一项评测证据（Objective→Exercise→TestCase）。
- 资源只允许引用本地已签名/受信任内容包内的路径，不执行内容里的 JS。
- Markdown 可承载受控富组件，但严禁从课程文本直接执行脚本。
- `prerequisites` 成环、找不到资源、缺考试规则均阻止课包正式发布。

## 5. 课程内容生产与校验流水线

```text
作者编写课程结构
   ↓ 资源/Schema 校验
教材内容审校（概念、例子、误区）
   ↓
示例/练习静态检查
   ↓
运行公开和内部测试
   ↓
检查目标→练习→测试映射
   ↓
UI 预览 / 可访问性 / 资源离线加载
   ↓
标注内容版本并发布课包
```

工具化检查建议：
- `validate:curriculum`：唯一 ID、先修图、资源链接、内容 schema。
- `test:lesson-examples`：示例代码真实运行，预期输出对照。
- `test:lesson-grading`：坏解法必须失败、参考解法通过；防止测试不具辨别力。
- `audit:coverage`：每节关键 Outcome 有练习与必选测试映射。
- `audit:accessibility`：Tab 键、对比度、Reduced Motion、辅助说明。

这些是**计划中的工具**，不是当前仓库已存在的命令。

## 6. 运行、提交与报告契约

### 6.1 一次练习提交
```text
编辑工作区 → 自动保存 → 创建只读快照 → 校验环境
      → TS 静态诊断 → 真实运行 / 测试 → 生成报告
      → 归档 Attempt → 更新练习进度 → 可继续修复
```

### 6.2 提交报告建议结构
```json
{
  "attemptId": "ATTEMPT-GENERATED-ID",
  "exerciseId": "PR-07",
  "exerciseRevision": 1,
  "sourceHash": "content-hash",
  "status": "failed",
  "infraStatus": "healthy",
  "typecheck": { "passed": true, "diagnostics": [] },
  "tests": [
    {
      "id": "C02",
      "title": "HTTP 404 returns HttpError",
      "required": true,
      "result": "failed",
      "expected": "HttpError(status=404)",
      "actual": "User-like error JSON",
      "hintId": "http-not-network-error"
    }
  ],
  "durationMs": 120,
  "gradingRevision": 1
}
```

报告中的时间和状态只是**示例数据**。正式系统只能存真实运行输出；`infraStatus!=healthy` 不得判定学员代码错误。

### 6.3 失败反馈规则
- **编译失败** → Problems Tab：`file:line:column`、TS 错误号、最相关文档；
- **行为失败** → Tests Tab：输入、期望、实际、可展开堆栈、提示；
- **超时** → Console：运行限制、可终止按钮、是否可能无限循环；
- **环境缺失** → Settings/Environment：缺少什么、如何安装、是否能离线补齐；
- **预览失败** → Preview：服务未启动、端口占用、CSP/资源限制；
- **评分已通过** → 可进入下一课，同时保留复盘/重做入口。

输出不应默认展开几千行堆栈；优先给顶部摘要和第一处相关错误，完整日志按需查看。

## 7. 运行内容安全与可信边界

- 课程脚本和题目数据视作数据，不能透过 Markdown/JSON 注入可执行 Electron Main 逻辑。
- `typecheck` 和 `evaluate` 是两个不同动作；类型检查可以离线独立运行，但并不证明行为正确。
- 基础 JS/TS 在经过限制的练习路径中执行；外部任意 Node/npm 脚本必须单独经过授权与隔离评估。
- 输出预览页面不可访问 Preload 权限；系统命令只能由可信 Main 按事先允许的模板发起。
- Monaco 仅解决编辑与语言服务，并不会自动带来安全的代码执行沙箱。
- 不能把 Node vm、Worker 或 UtilityProcess 单独作为恶意代码安全隔离的证明。
- 课程中的示例源码应尽可能没有第三方依赖；外部网络/账号不是完成基础课程的必要条件。

## 8. 学习进度与复习引擎（可解释规则）

状态以证据而不是主观百分比表达：
- `readSteps` 记录哪部分看过；
- `predictionResults` 记录首次推理是否正确及改正过程；
- `codeAttempts` 记录评测快照与失败类型；
- `explanations` 记录学员对“为什么”的复盘；
- `reviewResults` 记录变式题与间隔复练。

可推荐复习的触发器：
1. 同一概念连续两次测试失败 → 推荐对应原理和较简单实验。
2. 反复出现 TS `any` / 不安全断言 → 复习 TS-06。
3. React request race 出错 → 推荐 RE-04 / RE-07 预制变式题。
4. 已通过但无法预测执行结果 → 标记“会修改但推理仍薄弱”，不要标为精通。
5. 隔一段时间重新练同类型题 → 记录复习通过证据；间隔由用户设置或课程建议，不声称精确记忆算法。

## 9. 课程教学难度与自适应

提供三种可选路径，不改变知识准确性：
- **快速复习**：知识卡 + 关键预测题 + 1 份实战修复；适合已有经验开发者。
- **标准学习**：完整讲解 + 动画 + 公开测试 + 编码作业。
- **深度理解**：加入逆向推理、边界测试设计、Diff 审查、多文件迁移题。

C++ 对比卡允许展开/隐藏。若学员在某题直接知道答案，也可选择“不看解答先挑战”，不会因为略过阅读自动判定达标。

## 10. 典型完整学习旅程（JS-09）

1. 课程首页显示：「要解决的问题：AI 生成的请求函数把 404 误判为有效 User」。
2. 展示 `fetch` Promise 与 HTTP 状态差异，让学员先预测 404 会走哪个分支。
3. 展示一次教学时序：`fetch fulfilled → response.ok false → throw HttpError`。
4. 点击「开始练习」：受控工作区中复制初始 `loadUser.ts`，右侧展示要求和测试合同。
5. 学员自己添加错误处理；点击「运行」查看公开 C01–C03。
6. 若失败，Test Explorer 显示一个具体反例和建议定位的知识点。
7. 学员修正后点击「提交」：在不可变快照上运行全部必选 C01–C06。
8. 系统更新 `practicePassed`，保留预测答案、尝试历史和复盘解释。
9. 进入 React 阶段重用这个 API Client 作为 UI 请求依赖，验证知识迁移。

## 11. 优先开发的垂直切片（最小工作闭环）

不要先把 48 课的页面铺满而没有真实反馈。首个交付必须包含：
- 真正的 JS-09 课程（非仅标题）；
- 至少一个预测题 + 一个具体修复题；
- `loadUser.ts` 可编辑、自动保存、还原；
- TypeScript strict 诊断；
- 示例测试 + 完整必选评测；
- 单次任务超时/停止/错误分类；
- SQLite 归档尝试与继续学习；
- 学习报告映射回明确的知识目标。

这个垂直切片完成后，方可按相同内核扩展 JS-08 事件循环、TS-03 状态机、RE-04 竞态和项目 M1/M2。  
**优先保证一个课程真的能学、真的能改、真的能验证**，再批量生产课程资源。
