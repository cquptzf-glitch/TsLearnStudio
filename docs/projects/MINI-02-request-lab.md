# MINI-02 · Request Lab：异步请求与故障实验台

- 先修：WEB-06、JS-07/08/09、TS-02/06/07
- 技术：TypeScript、Fetch API、DOM、可控 Mock Response / Promise
- 建议：4–6 小时；4 个里程碑
- 产物：可从 UI 选择请求情景、观察状态变化、显示响应或分门别类错误的本地请求诊断工具
- 状态：design（尚无可运行模板）

## 一、产品功能

主区域可配置 URL（仅本地模拟路径）、方法（首版 GET）、故障模式、延迟与响应数据。输出区域展示：请求发起、pending、Response 状态、JSON 解析、运行时校验和最终结果；支持取消任务。提供预置场景：200 合法 User、404 JSON 错误、500、网络断开、坏 JSON、字段类型错误、慢响应、用户主动取消。

**完全离线、确定性，不依赖第三方在线 API。** 先使用注入式 FetchLike，正式产品可在明确许可后拓展到测试本地 HTTP 服务，不允许随意访问任意内网目标或借学习工具绕过权限。

## 二、接口约束

~~~ts
type RequestState<T> =
  | {status:"idle"}
  | {status:"loading"; requestId:number}
  | {status:"success"; requestId:number; data:T}
  | {status:"error"; requestId:number; error:RequestError}
  | {status:"cancelled"; requestId:number};

type RequestError =
  | {kind:"http"; status:number}
  | {kind:"network"; message:string}
  | {kind:"parse"; message:string}
  | {kind:"validation"; message:string}
  | {kind:"abort"};

async function fetchUser(
  id: number,
  fetcher: FetchLike,
  signal?: AbortSignal
): Promise<User>;
~~~

约定：非 2xx 抛出 HttpError；200 JSON 先按 unknown 校验后再返回 User；网络拒绝不当成 HTTP 404；用户取消属于独立状态。对并发请求使用递增 requestId，仅最新请求可以更新当前显示；旧请求到达时不得覆盖新请求 UI。

## 三、里程碑与训练步骤

| ID | 任务卡 | 可编辑文件 | 必须检查 |
| --- | --- | --- | --- |
| P02-M1 | 设计 HTTP/网络错误分类与类型，写预测题 | src/types.ts, src/errors.ts | 类型分支穷尽；200/404 区分 |
| P02-M2 | 实现 fetchUser 与 JSON 校验 | src/api.ts, src/guards.ts | 200/404/500/网络/JSON/结构测试 |
| P02-M3 | 编写可控模拟器与 UI 状态展示 | src/mockFetch.ts, src/ui.ts | 可选故障、日志有因果顺序 |
| P02-M4 | 解决请求乱序/取消并补回归 | src/controller.ts, tests/ | stale response 不覆盖、取消后不误报成功 |

## 四、必须讲透的难点

**Promise 结束 ≠ HTTP 成功**：展示 Promise fulfilled(Response 404) 的执行路径；错误发生在业务检查，不能宣称 fetch 自动 rejected。  
**静态类型 ≠ 运行时数据检查**：禁止简单 as User 伪造验证；unknown 经过类型守卫。  
**错误分层**：网络断开、JSON 文本错误和数据结构错误属于不同失败阶段。  
**异步竞态与取消**：先发 A 慢请求，后发 B 快请求，只显示 B 结果；A 被取消或晚到均不能改变 B。AbortSignal 可被模拟；不要用不稳定的真实外网延迟当测试条件。

## 五、自动验收样例

| ID | 场景 | 通过条件 |
| --- | --- | --- |
| P02-T01 | 200 有效 JSON | User 校验通过并显示 |
| P02-T02 | 404/500 | error.kind=http，status 正确 |
| P02-T03 | fetch reject | error.kind=network |
| P02-T04 | body 非法 JSON | error.kind=parse |
| P02-T05 | JSON 结构无效 | error.kind=validation |
| P02-T06 | 取消等待任务 | error.kind=abort/cancelled，UI 不显示旧成功 |
| P02-T07 | 请求 A 慢，B 快 | B 后显示不被 A 覆盖 |
| P02-T08 | 连续执行多次 | 状态 ID 唯一、日志无混淆 |

T01–T08 均必选。用可控 deferred Promise 驱动顺序，禁止靠随机睡眠跑时序测试。

## 六、故意设置的 AI 缺陷

~~~ts
const response = await fetcher(url);
const user = (await response.json()) as User; // 未检查 response.ok、无校验
setCurrentUser(user); // 未判断是否已存在更新的请求
~~~

学员必须先列出至少三个风险，再修改并编写对应负面测试。反馈不能只显示“失败”，要标注产生错误的阶段。

## 七、迁移与扩展

输出可复用的 API Client、运行时 guard、错误类型与受控测试 fixture。将来 Mini TestPilot 前端 API Client 可迁移同一错误处理模式，但需先对齐其实际 DTO 与错误合同。Electron 里预览代码需与 Main IPC 隔离。
