# MINI-01 · Study Planner：原生 Web 学习计划板

- 定位：第一个无需 React/Node 后端的真实可交互小项目
- 先修：WEB-02/03/04/05/07，JS-01/02（也可边做边补）
- 技术：HTML5、CSS Grid/Flex、ES Modules、原生 JavaScript、localStorage
- 建议：3–4 小时；4 个里程碑；优先项目
- 产物：一个能添加、编辑、完成、删除、筛选学习任务，并在刷新后保留数据的离线页面
- 状态：design（教学/验收规格，尚无可运行模板）

## 一、产品行为与使用场景

使用者希望记录 TypeScript 学习计划，任务具有名称、学习阶段、预计时长和完成状态。打开页面可查看任务总数、已完成/未完成数量、按状态和阶段筛选、排序。刷新之后任务仍存在。空数据及错误存储场景有明确提示。

明确不做：用户登录、云同步、复杂日历、拖拽排期、任何远程接口。鼓励先把 DOM 数据流看懂，不允许用 React 或 UI 框架跳过底层学习。

## 二、数据与接口合约

~~~js
// main.js 里学员自己实现下列数据能力；示例仅定义接口
// Task: {id: string, title: string, topic: string, minutes: number,
//        completed: boolean, createdAt: number}
export function addTask(state, draft) { /* TODO */ }
export function toggleTask(state, id) { /* TODO */ }
export function removeTask(state, id) { /* TODO */ }
export function filterTasks(state, {topic, status, query}) { /* TODO */ }
export function summarizeTasks(state) { /* TODO */ }
~~~

标题 trim 后 1–80 字符；预计时长 5–240 分钟；合法 topic 在当前允许集合中。新增 ID 唯一。纯函数返回新数组，不原地修改传入 state。列表排序按 createdAt 降序，再按 id 稳定打平；原数组不得因为筛选/排序被修改。

## 三、页面布局

顶部概览：总任务、已完成、剩余时长。主体：左侧添加表单、右侧列表与筛选工具。1366px 显示双栏，窄屏改上下结构；重要操作不隐藏。列表行使用语义按钮、label 和明确焦点。

必须说明初始任务数据只用于展示，真实完成数从 state 计算，不能写死 DOM 文案。

## 四、分阶段任务

| ID | 任务卡（学员实际完成） | 可编辑文件 | 必选验收 |
| --- | --- | --- | --- |
| P01-M1 | 还原页面骨架、输入控件、响应式布局 | index.html, styles.css | 表单关联正确；两种视口无横向溢出 |
| P01-M2 | add/toggle/remove/filter 纯函数与 DOM 渲染 | src/tasks.js, src/main.js | 新增→完成→删除→筛选结果与数量正确 |
| P01-M3 | 本地持久化、加载损坏数据恢复与空态提示 | src/storage.js, src/main.js | 刷新保留；坏 JSON 不导致页面崩溃 |
| P01-M4 | AI 代码缺陷修复、XSS/事件/回归审查 | src/main.js, tests/ | 新加入节点可以删除；文本作为文本显示；无重复监听 |

## 五、难点与故意缺陷

**难点 A：事件冒泡与委托。** AI 示例把 click 监听器一次性绑定在初始按钮上，后续动态新增行失效。学员要先指出根因，再给父列表做事件委托或采用明确的安全绑定策略。回归测试必须覆盖新增后删除、切换筛选后删除和重复渲染后点击。

**难点 B：不可变数据与渲染。** 如果直接执行 sort()，可能修改原任务数组；如果让 DOM 成为唯一真相，状态与视图会逐渐偏离。要求证明 state 是单一数据源，render 只依据 state。

**难点 C：安全渲染。** 如果标题输入为 HTML 字符串，不可用不安全 innerHTML 拼接学员输入。使用 textContent / createTextNode，并由行为测试验证脚本不会执行或注入节点。

**难点 D：存储异常。** localStorage 可能被禁用、配额不足或内容损坏；UI 应提示保存失败，不假装已经持久化。数据解析做结构检查。

## 六、自动验收（未来真实执行）

| Test ID | 输入/操作 | 预期 |
| --- | --- | --- |
| P01-T01 | 添加合法任务 | state 新增一条，标题已 trim |
| P01-T02 | 空白标题/负数时长 | 校验失败，state 不改变 |
| P01-T03 | toggle / remove 不存在 ID | 行为明确（建议不改变 state） |
| P01-T04 | 两次 filter + sort | 结果正确，原数组无突变 |
| P01-T05 | 新增后再删除 | DOM 正常更新且事件只触发一次 |
| P01-T06 | 输入 <img ...> 等字符串 | 作为纯文本显示，没有 HTML 注入 |
| P01-T07 | 刷新/重复打开 | 任务可恢复，数据版本兼容 |
| P01-T08 | 破损 JSON / 存储异常 | 不崩溃，并提示可恢复/降级 |
| P01-T09 | 1366 与窄屏 | 没有横向滚动，表单和筛选可用 |

T01～T08 必选；T09 属于 UI 必测但可采用浏览器测试，发布门禁需通过。

## 七、与 C++/Qt 的对比与复盘

- DOM 事件监听与 Qt Signal/Slot 都涉及事件驱动，但 DOM 有事件冒泡及捕获传播。
- JS 对象与数组通常按引用传递，和 Qt 隐式共享容器并非一回事。
- localStorage 是浏览器的同步键值存储，不等于 SQLite 数据库，也不是可靠的多设备同步。

项目结束回答：一个任务从输入框到 state，再到 DOM 和 localStorage 分别经过哪些函数？如果数据有错，如何区分校验、状态、视图和存储层的责任？

## 八、接入桌面学习软件的要求

只读模板复制到独立 Workspace；左侧显示任务与验收，中央多文件编辑，右侧 sandbox Web 预览，下方 DOM 测试报告。允许重置、快照、导出。学员 HTML/JS 预览不得获得 Electron Preload/主进程权限。源码导出后可直接在浏览器或轻量静态服务器中使用（需遵守 ES Module 加载限制）。
