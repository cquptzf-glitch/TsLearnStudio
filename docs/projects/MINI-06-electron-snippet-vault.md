# MINI-06 · Snippet Vault：Electron 代码片段管理器（选修）

- 先修：FS-08、TS-06、Node fs/path 基础、Electron 安全概念
- 技术：Electron、React、TypeScript、electron-vite、SQLite 或受控 JSON 存储
- 建议：6–10 小时；5 个里程碑
- 产物：独立 Windows 桌面 App，能保存、检索、复制 TypeScript 等代码片段
- 状态：design；**选修**，不是 TsLearnStudio 内置执行器的替代品

## 一、项目功能

建立本地代码片段库：新增片段、修改标题和语言、按关键字/标签搜索、查看语法高亮、复制代码、删除确认、退出后恢复。重点训练 Electron 主进程与 Renderer 的责任分离、Preload 最小权限通信和本地数据可靠性。

为了安全和聚焦，**不提供任意代码运行/系统命令执行功能**；代码片段只是文本。应用可在开发阶段由受控外部进程启动，不应该把学生写的 Electron Main 代码作为 TsLearnStudio 的内部插件加载。

## 二、类型与分层

~~~ts
type Snippet = {
  id:string; title:string; language:"typescript"|"javascript"|"json"|"html"|"css";
  code:string; tags:string[]; createdAt:string; updatedAt:string;
};

interface SnippetAPI {
  list(query?:{q?:string;language?:Snippet["language"]}):Promise<Snippet[]>;
  create(input:{title:string;language:Snippet["language"];code:string;tags:string[]}):Promise<Snippet>;
  update(id:string,patch:Partial<Pick<Snippet,"title"|"language"|"code"|"tags">>):Promise<Snippet>;
  remove(id:string):Promise<void>;
}
~~~

推荐进程职责：
- Main：窗口生命周期、可信 SnippetService、数据访问、IPC 请求验证；
- Preload：contextBridge 暴露具名 SnippetAPI，不暴露任意 ipcRenderer；
- Renderer：React 表单/列表/搜索/代码展示，不具备 Node fs 权限；
- 存储：应用私有目录 SQLite 或可信 JSON 文件，写入使用事务/原子替换。

## 三、里程碑

| ID | 学员任务 | 修改范围 | 验收 |
| --- | --- | --- | --- |
| P06-M1 | 窗口、渲染层、React 列表和空态 | src/renderer | 能打开桌面窗口，空状态正确 |
| P06-M2 | Snippet 类型、增删改查和搜索 | src/shared, src/renderer | 校验、筛选、删除确认 |
| P06-M3 | Main 存储服务和持久化 | src/main/services | 关闭重启后数据仍在 |
| P06-M4 | Preload 具名 API、IPC 校验 | src/preload, src/main/ipc | 无 nodeIntegration、不接受未知 channel |
| P06-M5 | 故意安全缺陷修复与回归 | tests/, src/main/ipc | 恶意输入被拒绝、权限隔离、存储异常恢复 |

## 四、关键难点

**不能因为 Electron 自带 Node，就在 Renderer 里直接调用 fs。** Renderer 禁用 nodeIntegration、启用 contextIsolation 与 sandbox，Preload 只暴露高层方法。收到任何请求，Main 验证 sender 来源、schema、字符串长度、枚举值等，不允许通用执行 shell 或读写任意路径。

**Main 与 Renderer 不能共享任意可变内存对象。** IPC 请求/响应应该是明确的可序列化数据合同，错误码可区分 INVALID_INPUT、NOT_FOUND、STORAGE_FAILED。

**代码片段不等于可执行代码。** 不能在预览区使用 eval 或以不可信 innerHTML 注入；代码按文本显示。复制到剪贴板前不需执行。

**路径约束**：文件应保存在 app 私有工作区或数据库中；拒绝用户输入任意绝对路径、路径遍历或软链接逃逸。默认不提供任意目录导入。

**异常恢复**：写存储失败不能误提示“已保存”；重启后可读取上次成功的完整状态。

## 五、必选验收

| ID | 条件 | 正确结果 |
| --- | --- | --- |
| P06-T01 | 首次启动 | 空库且无报错 |
| P06-T02 | 创建、修改、删除片段 | UI 和持久化状态一致 |
| P06-T03 | 搜索和语言筛选 | 返回正确集合，不改原数据 |
| P06-T04 | 重启应用 | 保存的数据仍在 |
| P06-T05 | 代码含 HTML/script 字符串 | 仅显示文本，不执行或注入 |
| P06-T06 | Renderer 尝试访问 fs/process | 受限访问不可用 |
| P06-T07 | 未授权 IPC / 错误参数 | 明确拒绝，Main 保持正常 |
| P06-T08 | 伪造路径或越界 | 无法写出应用允许范围 |
| P06-T09 | 模拟存储失败 | 反馈准确、不损坏已有片段 |

T01～T09 必选。正式启动学员开发的 Electron 应用前，需明确授权并验证与主学习软件隔离；普通子进程隔离并不等于可以安全运行恶意脚本。

## 六、迁移练习

学员从自己开发的 Snippet Vault 中抽取“数据合同、IPC 边界、存储服务、失败反馈”的设计经验，阅读 TsLearnStudio 工程架构，并指出哪些接口不应由 Renderer 获得；但不要把用户应用的 Main 进程嵌入主学习软件中执行。
