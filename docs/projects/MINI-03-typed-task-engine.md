# MINI-03 · Typed Task Engine：类型安全任务引擎

- 先修：TS-02/03/04/05/06/08、JS-02/07
- 技术：TypeScript strict、ESM、Vitest（纯逻辑）
- 建议：4–6 小时；4 个里程碑
- 产物：可复用的任务状态模块，可添加任务、进行状态迁移、记录日志、按泛型 Result 返回执行结果
- 状态：design（不运行学员提供的系统脚本，不含实际任务执行器）

## 一、边界与故事

通过设计一个**模拟任务状态引擎**学习类型系统，而不是写有系统权限的脚本执行工具。输入为任务配置和预设模拟结果，管理任务的 idle / queued / running / success / error / cancelled 状态；支持历史日志、错误原因、状态筛选、取消事件。避免引入真实子进程安全问题。

## 二、推荐类型合同

~~~ts
type TaskState<T> =
  | {status:"idle"}
  | {status:"queued"; queuedAt:number}
  | {status:"running"; startedAt:number; progress:number}
  | {status:"success"; finishedAt:number; result:T}
  | {status:"error"; finishedAt:number; error:{code:string;message:string}}
  | {status:"cancelled"; finishedAt:number; reason:string};

type Result<T,E> =
  | {ok:true; value:T}
  | {ok:false; error:E};

type TaskEvent<T> =
  | {type:"enqueue"; at:number}
  | {type:"start"; at:number}
  | {type:"progress"; at:number; value:number}
  | {type:"resolve"; at:number; result:T}
  | {type:"reject"; at:number; code:string; message:string}
  | {type:"cancel"; at:number; reason:string};

function reduceTask<T>(state:TaskState<T>,event:TaskEvent<T>): Result<TaskState<T>,TransitionError>;
~~~

只允许如下迁移：idle→queued→running→success/error/cancelled；允许 queued→cancelled；终态不可再改变。progress 介于 0–100 且只能在 running 更新。Event 类型设计要兼顾运行时转换校验，避免单靠类型承诺非法组合永远不会传入。

## 三、里程碑

| ID | 学员任务 | 可编辑文件 | 验收 |
| --- | --- | --- | --- |
| P03-M1 | 设计合法状态和泛型 Result<T,E> | src/types.ts | 合法值可编译，非法组合出现 TS 错误 |
| P03-M2 | 实现 reduceTask、迁移约束与错误结果 | src/reducer.ts | 所有合法迁移与非法拒绝覆盖 |
| P03-M3 | 写纯函数筛选和不可变历史日志 | src/selectors.ts, src/history.ts | 排序/筛选正确，原对象/数组不变 |
| P03-M4 | 制作 AI 代码审查与修复 | src/reducer.ts, tests/ | 修复不安全断言和遗漏分支，补负向类型测试 |

## 四、难点与反例

**类型层面：** 一个含 isLoading/isSuccess/data?/error? 的普通对象允许“不合法同时成功与加载”，正确的联合类型应消除这种状态。  
**穷尽分支：** switch 的 default 使用 never，让未来新增事件时编译器提醒未覆盖。  
**运行时层面：** TypeScript 无法约束从外部 JSON 加载的全部值；reduceTask 必须处理实际非法输入或转换不合法。  
**不可变性：** 不要直接 push 到传入的日志数组或者改写 state，以免历史快照变化。  
**泛型：** Result<T,E> 在成功和错误分支内分别精确收窄，不允许 any 掩盖问题。

## 五、测试合同

| ID | 输入/动作 | 必选输出 |
| --- | --- | --- |
| P03-T01 | 新建 TaskState success 缺 result | 类型检查失败（负向类型用例） |
| P03-T02 | 新增未处理 Event 变体 | never 穷尽检查提示 |
| P03-T03 | idle→queued→running→success | 成功，时间和结果正确 |
| P03-T04 | idle→resolve 或 success→progress | 返回明确 TransitionError |
| P03-T05 | running progress=-1、101 | 拒绝非法值 |
| P03-T06 | queued→cancelled | 取消结果正确且记录原因 |
| P03-T07 | selectors/filter | 不修改原始数据 |
| P03-T08 | 历史快照 | 后续变更不会污染先前快照 |

T01/T02 负向编译测试建议使用 tsc 和 @ts-expect-error 并校验期望错误出现；不能把“所有编译失败”都当作负向测试通过。

## 六、学习迁移

这套 TaskState<T> 可以用于 Mini TestPilot 的测试运行任务、代码执行结果等状态，但不要直接把教学引擎当成真实 OS 进程调度器。复盘重点：为什么有些限制可以在 TS 类型层面表达，另一些必须在运行时校验？
