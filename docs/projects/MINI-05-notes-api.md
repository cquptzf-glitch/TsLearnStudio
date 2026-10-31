# MINI-05 · Notes API：Node.js 本地知识库后端

- 先修：BE-01/02/03/04/05/06/07、TS-06
- 技术：Node.js、TypeScript、SQLite、Vitest、HTTP 集成测试
- 建议：6–9 小时；5 个里程碑
- 产物：本地可启动的笔记/标签 REST API，含持久化、查询和自动测试
- 状态：design（不是已运行的后端服务）

## 一、产品故事与边界

为自己的技术知识笔记提供 JSON API：创建、查询、编辑、删除笔记，设置标签，按标题/标签检索。客户端先使用课程工具的 HTTP 面板测试，不需要 React 页面；通过这一项目专注学习路由、运行时校验、错误传播、存储事务和测试。

不做用户账号、远程公网服务、全文搜索引擎、上传附件或云同步。仅监听 127.0.0.1，端口由 Runner 受控分配。

## 二、领域模型与 API

~~~ts
type Note = {
  id: string;
  title: string;       // trim 后 1–120 字符
  content: string;     // 0–10000 字符
  tags: string[];      // 0–8 个唯一标签，标签 1–30 字符
  version: number;     // 乐观并发版本
  createdAt: string; updatedAt: string;
};
type CreateNoteInput = Pick<Note, "title"|"content"|"tags">;
type UpdateNoteInput = {version:number} & Partial<CreateNoteInput>;
~~~

| 方法 | 路径 | 成功 | 常见失败 |
| --- | --- | --- | --- |
| GET | /api/v1/notes?q=&tag=&limit=&offset= | 200 {items,total,limit,offset} | 400 查询错误 |
| GET | /api/v1/notes/:id | 200 {item} | 404 不存在 |
| POST | /api/v1/notes | 201 {item} | 400 JSON 格式错误；422 字段校验 |
| PATCH | /api/v1/notes/:id | 200 {item} | 404、409 版本冲突、422 |
| DELETE | /api/v1/notes/:id | 204（无 body） | 404 不存在 |
| GET | /health | 200 {status:"ok"} | 503 依赖异常（有检查时） |

统一错误体：

~~~json
{"error":{"code":"VALIDATION_FAILED","message":"invalid title","field":"title"}}
~~~

URL/Body 参数来自不可信运行时输入：必须做 schema 校验。分页 limit 建议 1–100，offset >= 0，默认 limit 20；查询排序按 updatedAt DESC,id ASC。PATCH 需要 version 且更新成功后递增。

## 三、推荐工程目录

~~~text
notes-api/
├─ package.json
├─ tsconfig.json
├─ src/
│  ├─ app.ts
│  ├─ routes/notes.ts
│  ├─ services/notes.ts
│  ├─ repository/sqlite.ts
│  ├─ validation/noteSchema.ts
│  └─ errors.ts
└─ tests/
   ├─ unit/validation.test.ts
   └─ api/notes.test.ts
~~~

## 四、里程碑与验收

| ID | 实作任务 | 文件 | 通过证据 |
| --- | --- | --- | --- |
| P05-M1 | 内存仓储实现 GET/POST/DELETE | app/routes/services | 状态码/JSON/资源找不到处理 |
| P05-M2 | 严格运行时参数校验与统一错误中间件 | validation/errors | 400/422/404 和非法 JSON |
| P05-M3 | SQLite 表与标签关联、迁移 | repository/migrations | 重启保存、标签唯一/级联约束 |
| P05-M4 | PATCH version 冲突、批量标签更新事务 | services/repository | 409 冲突、事务回滚、旧数据兼容 |
| P05-M5 | 故障注入、HTTP 集成与安全回归 | tests/ | DB 错误变 500、无半提交，受限监听 |

## 五、难点设计与 AI 缺陷

**类型系统与入参边界**：错误实现直接将 req.body as CreateNoteInput，服务会接受 title 为 number 或 tags 为字符串。必须在路由边界做运行时校验，且失败不能写 DB。

**异常传播**：某些 async 路由漏 await，导致“先响应成功，后异步写库报错”。需要统一错误处理；每个请求仅响应一次。

**事务一致性**：更新笔记并更换标签过程中，写入第二个标签失败时要求整个更新回滚，包括 version 和 updatedAt。事务不能只围住部分写入。

**并发版本**：两个客户端同时读取 version=1，都 PATCH：只能一个成功另一个收到 409；不能出现静默后写覆盖前写。

**敏感运行环境**：Node API 仅在本机工作区操作项目数据库，不接触主学习软件 SQLite；启动、停止均由 Runner 管理，关闭程序能清理子进程。

## 六、自动验收矩阵

| ID | 操作 | 预期 |
| --- | --- | --- |
| P05-T01 | POST 合法数据 | 201，生成 ID、version=1 |
| P05-T02 | GET 列表/筛选/分页 | 顺序与 total 正确，边界处理明确 |
| P05-T03 | 空白 title、非法 tags、错误 JSON | 400/422，数据库不变 |
| P05-T04 | GET/DELETE 不存在记录 | 404；DELETE 成功时 204 无 body |
| P05-T05 | PATCH 成功后再次使用旧 version | 第二次 409，无意外覆盖 |
| P05-T06 | SQLite 更新中注入故障 | 所有写入回滚，version 未增加 |
| P05-T07 | 关闭后重启服务 | 原记录仍可读取 |
| P05-T08 | 标签查询与删除 | 无孤儿标签关联；启用 foreign_keys |
| P05-T09 | DB 连接故障 / 约束错误 | 返回明确非成功状态且不泄露内部路径 |
| P05-T10 | 新 DB / 旧 DB 迁移 | Schema 升级正常、旧笔记保留 |

T01～T10 均必选；测试使用每个用例独立 SQLite fixture，不依赖执行顺序。接口请求和响应应在 UI 中真实可见、可重放。

## 七、复盘和毕业项目迁移

解释一次 POST 请求在路由、校验、服务、事务、响应中的数据流，说明为什么前端 TypeScript 类型不能保证服务端接收到的数据正确；解释 PATCH 版本冲突和事务回滚的区别。将 API 设计方法迁移到 Mini TestPilot，但不要复制 Notes 的领域字段。
