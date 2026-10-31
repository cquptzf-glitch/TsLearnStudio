# TsLearnStudio UI 原型 v0.2

> 静态界面交互原型。不是 Electron 桌面软件，也不运行 TypeScript/JavaScript 学员代码。

## 使用

1. 下载 GitHub 仓库 ZIP 或 clone 整个仓库。
2. 保持 \`prototype/index.html\`、\`prototype/styles.css\`、\`prototype/app.js\` 位于同一个文件夹。
3. 使用 Chrome / Edge 打开 \`prototype/index.html\`。无需安装 Node.js 或 npm。

## 已实现（仅原型）

- 七个主要页面：学习概览、课程体系、学习工作台、练习与作业、项目实战、学习分析、设置与环境。
- 48 节课程的规划目录；模块内筛选和顶栏课程搜索。
- 重点课程 JS-08 的详细概念说明、运行步骤、练习要求与即时知识问答。
- 可编辑的两份 TypeScript 样例文件及行号、文件标签、字体大小和浏览器 localStorage 草稿保存。
- 明暗主题、课程步骤切换、讲解区宽度切换。
- “运行”“提交评测”明确显示未接运行器的说明；“重置”需确认。

## 尚未实现

- Electron 主进程/Preload/正式 Renderer；Monaco 类型诊断。
- TypeScript 编译、Node 代码运行、Vitest 自动评测、工作区文件系统。
- 完整 48 课正文、真正的动画引擎、SQLite 进度和全栈项目开发。

## 代码结构

- \`index.html\`：页面与内容展示结构。
- \`styles.css\`：布局、配色、响应式与设计 token。
- \`app.js\`：课程数据、导航、草稿、原型交互逻辑。

正式实施时会把页面迁移到 React/TypeScript 组件；\`app.js\` 是原型逻辑而非最终技术架构。

## 已知边界

- localStorage 草稿依赖当前浏览器环境和地址 origin；清理站点数据后可能丢失。
- 所有“通过/失败”的真实评分能力均未实现；原型内的知识问答仅提供本地即时教学反馈。
- 无外部脚本和 CDN 依赖，可离线浏览。
