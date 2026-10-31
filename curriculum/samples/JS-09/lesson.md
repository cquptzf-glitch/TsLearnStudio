# JS-09 · Fetch、HTTP 状态与错误传播（精品示范课）

> 内容状态：**教材样稿**（供后续课程引擎接入）。代码和测试素材尚未接入 Electron 运行器。  
> 难度：核心难点 · 70–90 分钟 · 先修：WEB-06、JS-07、JS-08  
> 学习成果：在不知道服务端响应的情况下，正确区分业务成功、HTTP 失败、网络失败、JSON 解析失败和数据结构错误。

## 0. 真实问题：AI 写的代码为何“能跑却出错”？

项目里需要根据 ID 获取 User 详情。AI 生成：

```ts
async function loadUser(id: number): Promise<User> {
  const response = await fetch("/api/users/" + id);
  return response.json() as Promise<User>;
}
```

在服务端正常返回时工作良好。但如果返回 404 + `{"error":"user not found"}`，页面可能会把错误对象当成 User，继续读取 `user.name`，随后触发 UI 逻辑错误。

**观察问题**：为什么 `await fetch(...)` 没抛出异常？为什么 TypeScript 没报错？为什么换成 `unknown` 能帮助我们设计安全边界？

## 1. 必须掌握的四层概念

### 1.1 Promise 结果 ≠ HTTP 业务成功

- `fetch` 是异步函数接口，返回 Promise。
- Promise fulfilled 意味着成功拿到一个 Response，不等于 status 是 200。
- HTTP 404/500 是一个有效的 HTTP 响应，通常不会让 fetch 自动 reject。
- 网络断开、无效 URL、部分请求中断可能使 Promise rejected。
- `response.ok` 是状态码在 200–299 范围时的布尔指示。

观察真实项目时，打开 Network 面板先看**请求是否发出 → 状态码 → 响应正文**，再判断错误来自网络、HTTP 还是业务解析。

参考：[MDN fetch](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch)。

### 1.2 async/await 并不是“整个线程等待”

`await` 会暂停当前异步函数的后续执行，并把继续执行安排在 Promise settlement 后。主线程并不会因这个 await 被同步阻塞。  
类比 Qt 信号/槽：事件能够在后续调度中触发，但不要把 await 直接等同于 Qt 中阻塞的 `waitFor...` 方法。

### 1.3 TypeScript 的 as 不是运行时校验

```ts
const data: unknown = await response.json();
const user = data as User; // 编译阶段告诉 TS 如何看待 data
```

这一句**不会**检查运行时 `id` 是数字还是字符串，也不会阻止 `null` 被当成 User。只有运行时校验函数或 schema 才能挡住格式错误。

### 1.4 五类失败应区分

| 情况 | 发生阶段 | 本课约定 |
| --- | --- | --- |
| HTTP 404/500 | 收到 Response，ok=false | HttpError(status) |
| 网络错误 | fetch Promise rejected | 保留原始错误 |
| 响应体不合法 JSON | response.json() 抛错 | 保留解析错误 |
| JSON 合法但字段不合法 | 运行时校验 | DataValidationError |
| id 非正整数（可选扩展） | 发请求前 | RangeError |

这几类错误在 UI 中可以统一呈现，但不能误当作成功 User。

## 2. 先预测：不要立即运行

对于每个情景，先填写「fulfilled / rejected / 抛出 HttpError / 通过校验」：

1. HTTP 200，返回 `{"id":7,"name":"Ada"}`。
2. HTTP 404，返回 `{"error":"not found"}`。
3. HTTP 500，返回合法 JSON 错误对象。
4. fetch 因断网而 Promise rejected。
5. HTTP 200，body 是不合法 JSON 文本。
6. HTTP 200，body 是 `{"id":"7","name":null}`。

建议程序内交互为：预测 → 查看状态时序动画 → 执行 mock → 看结果对照 → 解释原因。

## 3. 教学动画脚本（模拟，不是 profiler trace）

```text
点击「发送请求」
    |
    v
调用 fetch("/api/users/7") -> Promise pending
    |
    +--- 网络失败 → rejected → 错误处理 UI
    |
    +--- Response 到达，status=404 → fulfilled(Response)
             |
             v
        response.ok ? ── 否 → HttpError(status=404)
             |
             是
             v
        response.json()
             |
             +--- JSON 语法错误 → SyntaxError
             |
             v
        unknown 数据 → isUser() 校验
             |
             +--- 无效 → DataValidationError
             |
             +--- 有效 → User → UI 显示
```

每一步高亮 source 中对应行，并显示当前 Promise 状态及 Result 分支。课程必须注明这是预制教学模型；真实运行日志由运行器另行输出。

## 4. 动手练习：修复 loadUser

### 文件权限
只能编辑 `starter/loadUser.ts` 中 `loadUser` 的实现体（正式项目工作区中会复制 starter）。不得删除对外导出的 `User`、`HttpError`、`DataValidationError`。

### 对外函数契约
- `loadUser(id, fetcher?)` 返回 `Promise<User>`，注入 `fetcher` 只是为了测试可控；
- `HttpError.status` 保存 HTTP 状态码；
- `DataValidationError` 表示 JSON 结构不满足 `User`；
- JSON/网络异常按原异常传播，禁止静默返回伪 User；
- `User` 必须包含正整数 id 和非空、非全空格 name。

### 作业步骤
1. 先补齐非 2xx 判断，禁止对错误 Response 当作 User 解析；
2. 把 `response.json()` 的结果先当 `unknown`，实现数据校验；
3. 实现错误类型，保证不同失败路径在 UI 可识别；
4. 用样例 C01–C03 验证正常、404、500，再思考 C04–C06；
5. 解释：为什么 `tsc --noEmit` 通过但行为测试仍可能失败？

### 公开测试
- C01：200 + 有效 JSON → 返回用户；
- C02：404 → 抛 HttpError(404)；
- C03：500 → 抛 HttpError(500)。

### 完整评测
- C04：fetcher 拒绝 → 保留网络异常；
- C05：JSON 解析失败 → 保留 SyntaxError；
- C06：JSON 字段缺失/错误 → DataValidationError；
- C07（可选）：输入 id 非正整数不应发送请求。

失败反馈应分别定位：HTTP 响应状态、JSON.parse、字段校验、参数校验，不给所有失败统一的一句“测试失败”。

## 5. C++ / Qt 类比（准确性优先）

| C++ / Qt | TypeScript / Web | 不等价之处 |
| --- | --- | --- |
| 同步阻塞等待 Future | `await Promise` | await 暂停 async 函数，不阻塞整个 JS 主线程 |
| HTTP 状态码与网络层错误 | `response.ok` 与 rejected Promise | HTTP 404 通常不会自动让 Promise reject |
| `std::optional` 或结果类型 | 联合类型/错误类 | JS 运行时类型约束与 C++ 静态对象模型不同 |
| 结构体字段校验 | `isUser(unknown)` | TS 类型声明不能验证来自网络的 JSON |
| Qt NetworkReply 处理 | Fetch + Response | 对象/API 生命周期与细节不同，不能逐 API 照搬 |

## 6. 自测：能否从代码现象找到根因？

**情景 A**：控制台出现 `Cannot read properties of undefined`；Network 显示 404。  
问：错误根因在页面读取字段的语句还是更早的 API Client 边界？答：页面异常是后果，Client 没正确处理 404 / 数据形状是上游根因。

**情景 B**：Network 显示 200，但 `name` 是 null。  
问：TypeScript 声明 `name:string` 能保证安全吗？答：不能；响应体是外部运行时数据，需验证。

**情景 C**：网络断开后页面一直 loading。  
问：除了捕获异常，还可能漏掉什么？答：必须保证错误/最终状态更新，React 等 UI 框架还要处理请求取消与组件卸载情形。

## 7. 迁移到后续课程与项目

- TS-06：单独深入类型收窄、运行时校验和可重用验证器；
- RE-07：调用 loadUser，完整实现 loading/success/error，解决旧请求覆盖新结果；
- BE-03：后端同样必须校验入参 JSON；
- FS-03：通过 Network → API → UI 链路定位失败来源；
- Mini TestPilot M4：把 User API 替换成 Case API，保留相同的错误处理原则。

## 8. 本课完成门槛

- 能在不运行前预测至少 4/5 类核心路径；
- C01–C06 必选行为测试通过，类型检查通过；
- 不使用 `as User` 冒充运行时校验；
- 能说明 HTTP 404 与网络 rejected 的区别；
- 能在 Mini TestPilot 的 API Client 中复用这一模式。

> 当前提供的是完整教材样稿及参考素材；课程内容包发布、编辑器/运行器/自动评测需要后续开发。
