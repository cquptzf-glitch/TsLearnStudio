# MINI-04 · React Bug Board：交互式缺陷看板

- 先修：RE-01/02/03/04/05/06/07/08/09、TS-03/06
- 技术：React、TypeScript、Vite、React Testing Library、Vitest、受控 Mock API
- 建议：6–9 小时；5 个里程碑
- 产物：可搜索、筛选、新建、修改、关闭缺陷的 React 页面，支持请求状态与错误反馈
- 状态：design（前端本地 Mock，不需要真实 Node 后端）

## 一、产品故事与功能范围

一个小型研发团队需要管理缺陷：每条包含 id、title、severity、status、assignee、updatedAt。列表支持搜索、状态筛选、优先级筛选、分页或加载更多（首版固定分页即可）、新建、修改状态、查看详情。通过内置 Mock API 模拟请求延迟、404、500、乱序返回，不依赖真实网络服务。

需求不包括用户登录、团队权限、拖拽看板库、复杂图表或数据库。必须强调 React 数据流、状态归属、请求生命周期和稳定测试。

## 二、数据模型与接口约定

~~~ts
type BugStatus = "open" | "in_progress" | "resolved";
type Severity = "low" | "medium" | "high";
type BugItem = {
  id: string; title: string; severity: Severity;
  status: BugStatus; assignee: string; updatedAt: string;
};

type ListQuery = {q:string; status?:BugStatus; severity?:Severity; page:number};
type ListResult = {items:BugItem[]; total:number; page:number; pageSize:number};

interface BugApi {
  list(query:ListQuery, options?:{signal?:AbortSignal}):Promise<ListResult>;
  create(draft:Omit<BugItem,"id"|"updatedAt">):Promise<BugItem>;
  updateStatus(id:string,status:BugStatus):Promise<BugItem>;
}
~~~

标题 trim 后 1–120 字符；列表排序按 updatedAt 降序，ID 作稳定次序。Mock API 从固定 fixtures 加载并支持故障注入：慢请求、网络断开、HTTP 500、无效结果。

## 三、页面与组件拆分

- App：页面布局、当前筛选状态、请求数据状态；
- FilterBar：输入查询、状态/严重级别筛选，提供重置；
- BugTable：可复用表格，稳定 key=id，展示空态与加载态；
- BugEditor：受控表单，校验、保存中、服务错误反馈；
- BugDetail：查看详情、修改状态；
- ErrorBanner：错误文字、重试入口、没有网络时的提示。

组件必须有清晰的 Props 接口；不要把所有功能挤进一个大 App.tsx。

## 四、里程碑

| ID | 开发任务 | 可编辑文件 | 必须验收 |
| --- | --- | --- | --- |
| P04-M1 | 数据模型、组件拆分、固定 fixture 列表 | src/types.ts, App.tsx, components/BugTable.tsx | 列表正确显示，key 稳定 |
| P04-M2 | 筛选、计数、空态、派生状态 | components/FilterBar.tsx, hooks/useBugQuery.ts | 多条件组合正确，避免重复派生 state |
| P04-M3 | 创建与状态编辑、表单验证 | components/BugEditor.tsx, api/bugApi.ts | 无效输入、保存中重复点击 |
| P04-M4 | Effect 请求、错误、取消与旧响应抑制 | hooks/useBugQuery.ts, api/mockApi.ts | 请求 A 慢/B 快、unmount、重试 |
| P04-M5 | 修 AI 风格缺陷、补组件和回归测试 | tests/, hooks/, components/ | 关键交互、竞态、列表重排通过 |

## 五、必须深入的核心问题

### 1. React State 快照和批处理
在事件处理函数中连续调用两次 setCount(count + 1) 并不等于累计两次；必须解释渲染时闭包捕获的 state 快照与函数式更新方式。不要机械地“看到 setState 就改成函数式”，需要判断是否依赖旧值。

### 2. Effect 不应该承担所有计算
将列表筛选这类可以根据 Props/State 计算的派生值放进 render 或 useMemo，而不是通过 Effect 再保存一份多余 state，避免不一致和额外渲染。

### 3. 请求竞态和清理
用户快速输入 A → AB，A 的慢请求晚于 AB 返回时，不能覆盖新结果。使用 AbortController 或 ignore 旧响应；组件卸载后清理，不能产生幽灵状态更新。测试必须使用可控 Promise，而不是 sleep 随机等待。

### 4. 列表 key 与组件身份
故意给出 index 作为 key 的带内部输入状态列表；排序后输入状态可能错行。先复现，再更换稳定 id key。不要一概把所有 index key 都说成错误，要说明列表会重排时的风险。

## 六、必需测试

| ID | 事件或条件 | 通过结果 |
| --- | --- | --- |
| P04-T01 | 加载正常 fixtures | 列表、计数、状态与数据一致 |
| P04-T02 | 多条件筛选 + 清空筛选 | 结果正确，空态清晰 |
| P04-T03 | 添加合法 Bug | UI 更新，Mock API 状态一致 |
| P04-T04 | 空标题、非法 severity | 阻止提交、可见错误 |
| P04-T05 | 连续保存点击 | 只发起一次有效提交 |
| P04-T06 | 500 或 reject | 显示错误、可重试、保留必要输入 |
| P04-T07 | A 慢请求覆盖 B 风险 | 最终展示 B，A 不污染 |
| P04-T08 | unmount / StrictMode 开发环境 | 清理有效，无重复订阅或坏状态 |
| P04-T09 | 重新排序的本地输入行 | row 内部状态不会串行 |

T01～T09 必选，测试分为渲染行为测试与 API Mock 合约测试。

## 七、故意设置的 AI 缺陷

~~~tsx
useEffect(() => {
  bugApi.list(query).then(setBugs);
}, [query]); // 如果 query 每次 render 都新建，可能产生重复请求
~~~

以及：

~~~tsx
{bugs.map((bug, index) => <BugRow key={index} bug={bug} />)}
~~~

要求提交：如何触发问题、哪一层有错、最小修改和防回归测试。提交代码之前先写复现步骤及预期/实际。

## 八、项目结束应能回答

- 父组件 State 改变后，哪些组件重新渲染，为什么？
- Effect 何时执行，为什么 cleanup 必须正确？
- 为什么过时请求可能覆盖新请求？
- 受控输入、服务端状态和 UI 反馈为何不能混为一谈？

毕业项目 Mini TestPilot 可以复用组件分层和错误处理方法，但应重新核对数据字段和 API 路由。
