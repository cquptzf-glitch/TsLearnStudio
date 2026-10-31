# JS-09 课程样稿与代码参考

- `lesson.md`：完整教材讲解、预测题、动画脚本、C++ 对比和作业验收；
- `exercise.json`：机器可读的**设计级**题目描述与测试编号；
- `starter/loadUser.ts`：带缺陷的起始代码，供学员修改；
- `reference/loadUser.ts`：参考解法，用于后续编写真实评测。
- `tests/public.test.ts`：公开 C01–C03 的 Vitest 测试源码样本。
- `tests/verification.test.ts`：C04–C07 的附加验收样本，其中 C07 为可选项。

**重要：当前未建立 Vitest 项目配置、正式运行器、CI 或 Electron 课程集成；这些素材还不能在程序内点击运行/评分。**

后续落地顺序：内容 Schema 验证 → 工作区实例化 → strict TS 检查 → 真实 C01–C07 测试 → 失败反馈 → 历史记录 → 课内步骤交互 → UI/自动化验收。

安全：学员代码不能在 Electron Main 或拥有高权限的 Preload 中执行。

本地测试样本最终应交给受控评测器运行。初始 starter 在 C02/C03/C06 等测试失败是**有意设置的错误**；不能把失败样本误当成课程功能故障。
