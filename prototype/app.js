/* TsLearnStudio UI prototype v0.2 — no runtime, no grading. */
(function prototypeApp(){
"use strict";
const $=id=>document.getElementById(id), $$=q=>Array.from(document.querySelectorAll(q));
const modules=[
["WEB","Web 与浏览器","从网页结构到网络请求","HTML、CSS、DOM、浏览器渲染与 HTTP 工具链","从 URL 到页面|请求链路、浏览器渲染;HTML 文档结构|语义标签、表单、可访问性;CSS 盒模型|选择器、层叠、布局计算;Flex 与 Grid|弹性、网格、响应式;DOM 与事件|事件冒泡、事件监听;Fetch 与浏览器工具|Network、Headers、HTTP;综合：静态任务板|HTML/CSS/DOM 调试与修复"],
["JS","JavaScript 核心","掌握运行机制","对象、闭包、Promise、Event Loop 与异步异常","变量与值类型|let/const、引用和值语义;对象与数组|解构、map、filter、reduce;函数与箭头函数|回调、this、作用域;作用域与闭包|词法作用域、闭包生命周期;原型与 Class|原型链、类和继承;模块与依赖|ESM、import/export、npm;Promise|pending、fulfilled、rejected;Event Loop 与 async|微任务、计时器、async/await;错误与网络异常|try/catch、fetch、AbortController"],
["TS","TypeScript 类型","用类型约束 AI 代码","interface、联合类型、泛型、类型收窄和严格检查","TS 编译与配置|tsconfig、strict、类型擦除;interface 和 type|对象、可选、只读成员;联合类型与收窄|discriminated union、never;泛型|泛型函数、约束、推断;工具类型|Pick、Omit、Partial、Record;null、unknown、any|安全检查、类型守卫;异步 TS 和模块|Promise<T>、模块边界;综合：AI 代码审查|类型设计、诊断与修复"],
["RE","React 与前端工程","可维护的交互界面","TSX、组件、State、Effect、表单与工程化调试","React/TSX 与组件|函数组件、Props、JSX;事件与 State|useState、不可变更新;列表与条件渲染|key、条件分支;Effect 和生命周期|useEffect、清理、依赖;表单与受控输入|校验、事件绑定;组件设计与状态提升|单向数据流、组件拆分;API 请求与加载状态|loading/error、竞态与取消;UI 工程与调试|Vite、DevTools、布局;综合：测试用例看板|React CRUD 界面"],
["BE","Node.js 后端","理解服务与 API","Node 事件循环、路由、中间件、SQLite 和测试","Node 事件循环与进程|Node/Browser 差异;HTTP 路由与 REST|方法、状态码、JSON;中间件与参数校验|输入校验、错误码;异步错误与日志|异常捕获、监测;SQLite 基础|Schema、SQL、事务;后端测试|Vitest、API 集成测试;综合：用例 API|服务分层、REST API"],
["FS","全栈与 AI 协作","从理解到交付","联调、测试回归、安全审查与项目实践","前后端联调|CORS、请求生命周期;完整数据流与状态|DTO、错误传播、事务;调试工具链|Source Map、断点、Network;单测与回归|Vitest、E2E 和验证;安全基础|XSS、输入校验、Secrets;AI 需求拆解与改代码|验收条件、最小变更;AI 代码审查|风险、边界条件、重构;毕业项目：Mini TestPilot|全栈 CRUD、测试与复盘"]
].map(([id,title,subtitle,desc,raw])=>({id,title,subtitle,desc,lessons:raw.split(";").map(s=>s.split("|"))}));
const tasks=[
["JS-08","修复 fetch 的 HTTP 错误处理","缺陷修复","入门","25 min"],
["JS-04","纠正循环闭包中的回调结果","预测与修复","基础","20 min"],
["TS-03","用联合类型定义任务状态机","函数实现","中级","35 min"],
["TS-06","检查不可信 JSON 响应结构","类型安全","中级","30 min"],
["RE-04","修复 React Effect 重复请求","组件调试","中级","40 min"],
["BE-03","实现 API 参数校验和错误码","后端实践","中级","45 min"],
["FS-04","补齐跨层回归测试","综合测试","进阶","60 min"]
];
const defaults={
"loadUser.ts": [
'import type { User } from "./types";',
'',
'export async function loadUser(',
'  id: number',
'): Promise<User> {',
'  const response = await fetch(',
'    "/api/users/" + id',
'  );',
'',
'  // TODO: handle HTTP errors',
'  return response.json() as Promise<User>;',
'}'
].join("\n"),
"types.ts":[
'export type User = {',
'  id: number;',
'  name: string;',
'};',
'',
'// External JSON needs runtime validation.',
'// TS type assertions are not validation.'
].join("\n")
};
const draftKey="tsls-prototype-v2-drafts", themeKey="tsls-prototype-v2-theme";
let drafts={...defaults},selectedModule=1,page="dashboard",file="loadUser.ts",fontSize=12.5,saveTimer=null,toastTimer=null;
try{const d=JSON.parse(localStorage.getItem(draftKey)||"null");if(d&&typeof d==="object"&&!Array.isArray(d)){for(const k of Object.keys(defaults))if(typeof d[k]==="string")drafts[k]=d[k]}}catch(e){}
const editor=$("source-editor"),gutter=$("line-gutter");
const notice=msg=>{const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),3500)};
const tag=(t,c="")=>`<span class="tag ${c}">${t}</span>`;
function navigate(id){
 if(!$(id)||!$(id).classList.contains("page"))return;
 page=id;
 $$(".page").forEach(x=>x.classList.toggle("active",x.id===id));
 $$(".nav-btn[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===id));
 const names={dashboard:"学习概览",courses:"课程体系",lesson:"学习工作台",assignments:"练习与作业",projects:"项目实战",insights:"学习分析",settings:"设置与环境"};
 $("breadcrumb-page").textContent=names[id]||"Studio";
 $("breadcrumb-extra").textContent=id==="lesson"?" / JS-08 示例课":"";
 $("main-scroll").scrollTop=0;
}
function stageStrip(){
 const root=$("dashboard-stages");root.replaceChildren();
 modules.forEach((m,i)=>{
  const b=document.createElement("button");b.className="stage-tile";b.type="button";
  b.innerHTML=`<span class="index">STAGE ${String(i+1).padStart(2,"0")}</span><strong>${m.title}</strong><small>${m.lessons.length} 课 · ${m.subtitle}</small><div class="mini-line"></div>`;
  b.addEventListener("click",()=>{selectedModule=i;moduleList();courseTable();navigate("courses")});root.appendChild(b);
 });
}
function moduleList(){
 const root=$("module-list");root.replaceChildren();
 modules.forEach((m,i)=>{
  const b=document.createElement("button");b.type="button";b.className="module-btn"+(i===selectedModule?" active":"");
  b.innerHTML=`<span class="module-id">${String(i+1).padStart(2,"0")}</span><span class="grow"><strong>${m.title}</strong><small>${m.lessons.length} 课 · ${m.subtitle}</small></span>`;
  b.addEventListener("click",()=>{selectedModule=i;$("course-search").value="";moduleList();courseTable()});root.appendChild(b);
 });
}
function courseTable(){
 const m=modules[selectedModule], q=$("course-search").value.trim().toLowerCase(),root=$("lesson-table");
 $("module-title").textContent=m.title;$("module-subtitle").textContent=m.desc;$("module-count").textContent=`${m.id} · ${m.lessons.length} LESSONS`;
 root.replaceChildren();
 const found=m.lessons.map((x,i)=>({x,i})).filter(({x,i})=>`${m.id}-${String(i+1).padStart(2,"0")} ${x[0]} ${x[1]}`.toLowerCase().includes(q));
 $("course-filter-result").textContent=`显示 ${found.length} / ${m.lessons.length} 节`;
 for(const {x,i} of found){
  const code=`${m.id}-${String(i+1).padStart(2,"0")}`,tr=document.createElement("tr");
  tr.innerHTML=`<td><span class="lesson-id">${code}</span></td><td><button class="lesson-row-btn" type="button">${x[0]}</button></td><td>${x[1]}</td><td>30–60 min</td><td>${tag("规划课程")}</td>`;
  tr.querySelector("button").addEventListener("click",()=>code==="JS-08"?navigate("lesson"):notice(`${code}「${x[0]}」目前只有课程目录规划；工作台已提供 JS-08 样例。`));
  root.appendChild(tr);
 }
 if(!found.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=5;td.style.padding="30px";td.style.textAlign="center";td.textContent="未匹配课程，请更换关键词。";tr.appendChild(td);root.appendChild(tr)}
}
function taskTable(){
 const root=$("assignment-rows");root.replaceChildren();
 tasks.forEach((task,i)=>{
  const tr=document.createElement("tr");
  tr.innerHTML=`<td><div class="flex" style="gap:9px"><span class="lesson-id">${task[0]}</span><strong>${task[1]}</strong></div></td><td>${tag(task[2],"blue")}</td><td>${tag(task[3])}</td><td>${task[4]}</td><td><button type="button" class="open-row">查看</button></td>`;
  tr.querySelector("button").addEventListener("click",()=>i===0?(navigate("lesson"),step("exercise")):notice(`${task[0]} 实际题目和评测器还未开发，这里是任务规划。`));
  root.appendChild(tr);
 });
}
function otherContent(){
 $("project-milestones").innerHTML=["类型与数据模型","Node REST API","React 列表与筛选","表单和状态处理","自动化测试","缺陷修复","代码审查","毕业验收"].map((t,i)=>`<div class="milestone"><span><strong>M${i+1}</strong> · ${t}</span>${tag("规划中")}</div>`).join("");
 $("skill-cards").innerHTML=[
 ["浏览器与 HTTP","页面、DOM、请求生命周期"],
 ["JavaScript 运行机制","对象、闭包、Event Loop"],
 ["TypeScript 类型系统","泛型、收窄、静态诊断"],
 ["React 开发","组件、状态、Effect"],
 ["Node.js API","路由、数据库、错误处理"],
 ["调试与测试","断点、单测、回归验证"]
 ].map((x,i)=>`<div class="skill"><div class="square">${String(i+1).padStart(2,"0")}</div><div class="grow"><strong>${x[0]}</strong><div class="small muted">${x[1]}</div></div>${tag("未评分")}</div>`).join("");
}
function step(id){$$(".lesson-block").forEach(x=>x.classList.toggle("active",x.id===`lesson-${id}`));$$(".step-btn").forEach(x=>x.classList.toggle("active",x.dataset.step===id));document.querySelector(".document-scroll").scrollTop=0}
const panel={
 console:"[设计预览]\n这里将显示 stdout / stderr、异常堆栈与运行耗时。\n目前没有真实代码执行器，编辑器中的代码不会被执行。",
 diagnostics:"[设计预览]\nTypeScript Diagnostics 计划展示：文件、行列、TS 错误代码与修复建议。\n当前未集成 Compiler API，无法判断代码是否有类型错误。",
 tests:"[设计预览]\n未来的评测：类型检查 → 公开断言 → 边界检查 → 提交历史。\n未运行测试，当前不能宣称“通过”或“失败”。",
 requests:"[设计预览]\n未来 HTTP 工具显示方法、URL、JSON 请求体、状态码、耗时与响应内容。\n当前无本地服务，未发送真实 HTTP 请求。"
};
function output(id,custom){
 $$(".panel-tab").forEach(x=>x.classList.toggle("active",x.dataset.output===id));
 $("output-body").textContent=custom===undefined?panel[id]:custom;
}
function save(){
 drafts[file]=editor.value;
 try{localStorage.setItem(draftKey,JSON.stringify(drafts));$("editor-save-state").textContent="示例草稿已保存 · 浏览器本地"}
 catch(e){$("editor-save-state").textContent="本地存储不可用 · 当前会话草稿"}
}
function scheduleSave(){drafts[file]=editor.value;$("editor-save-state").textContent="保存中…";clearTimeout(saveTimer);saveTimer=setTimeout(save,300)}
function editorInfo(){
 const s=editor.value.slice(0,editor.selectionStart),row=s.split("\n").length,col=s.length-s.lastIndexOf("\n");
 $("editor-position").textContent=`Ln ${row}, Col ${col}`;
 gutter.textContent=Array.from({length:editor.value.split("\n").length},(_,i)=>i+1).join("\n");gutter.scrollTop=editor.scrollTop;
}
function switchFile(to){
 if(!(to in defaults))return;
 clearTimeout(saveTimer);save();
 file=to;editor.value=drafts[file];
 $$(".file-tab").forEach(x=>x.classList.toggle("active",x.dataset.file===file));
 $("editor-save-state").textContent="示例文件 · 已加载";editorInfo();
}
function theme(){
 const next=document.body.getAttribute("data-theme")==="dark"?"light":"dark";
 document.body.setAttribute("data-theme",next);try{localStorage.setItem(themeKey,next)}catch(e){}
}
function font(delta){fontSize=Math.min(20,Math.max(11,fontSize+delta));editor.style.fontSize=fontSize+"px";gutter.style.fontSize=fontSize+"px";$("font-value").textContent=fontSize+"px"}
$$("[data-page]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
$$("[data-page-target]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.pageTarget)));
$$("[data-open-exercise]").forEach(b=>b.addEventListener("click",()=>{navigate("lesson");step("exercise")}));
$$(".step-btn").forEach(b=>b.addEventListener("click",()=>step(b.dataset.step)));
$$("[data-step-next]").forEach(b=>b.addEventListener("click",()=>step(b.dataset.stepNext)));
$$(".panel-tab").forEach(b=>b.addEventListener("click",()=>output(b.dataset.output)));
$$(".file-tab").forEach(b=>b.addEventListener("click",()=>switchFile(b.dataset.file)));
editor.value=drafts[file];editorInfo();
editor.addEventListener("input",()=>{editorInfo();scheduleSave()});
editor.addEventListener("click",editorInfo);editor.addEventListener("keyup",editorInfo);
editor.addEventListener("scroll",()=>gutter.scrollTop=editor.scrollTop);
editor.addEventListener("keydown",e=>{if(e.key==="Tab"){e.preventDefault();editor.setRangeText("  ",editor.selectionStart,editor.selectionEnd,"end");scheduleSave();editorInfo()}});
$("run-code").addEventListener("click",()=>output("console","[未执行]\n这是静态 UI 原型，没有 TS 编译器或 Node.js 执行器。\n本次操作未运行代码。已编辑代码仅保存在浏览器本地草稿。\n\nM2 阶段将实现独立 Runner、类型检查、日志与停止机制。"));
$("submit-code").addEventListener("click",()=>output("tests","[未评测]\n未运行任何断言、类型检查或测试；也未写入成绩。\n正式版才会提供 Vitest 评测、失败解释与提交历史。"));
$("reset-code").addEventListener("click",()=>{if(confirm(`重置 ${file} 的原型草稿吗？当前编辑内容将被覆盖。`)){editor.value=defaults[file];scheduleSave();editorInfo();notice("示例文件已恢复初始代码")}});
$("show-hint").addEventListener("click",()=>$("exercise-hint").classList.toggle("hint-hidden"));
$("review-check").addEventListener("click",()=>{
 const a=document.querySelector("input[name=q1]:checked"),b=document.querySelector("input[name=q2]:checked");
 const aa=$$("input[name=q1]"),bb=$$("input[name=q2]");
 if(!a||!b)notice("先完成两道选择题。");
 else notice(a===aa[1]&&b===bb[1]?"原型反馈：两题正确，不计入正式学习成绩。":"原型反馈：请回顾 fetch 状态和 await 的执行方式。");
});
$("layout-toggle").addEventListener("click",()=>$("workbench").classList.toggle("wide-notes"));
$("settings-layout").addEventListener("click",()=>{$("workbench").classList.toggle("wide-notes");notice("已切换工作台布局，仅影响当前原型页面")});
$("project-guide").addEventListener("click",()=>notice("项目多文件编辑、Node API 和自动测试将在后续阶段实现。"));
$("theme-toggle").addEventListener("click",theme);$("settings-theme").addEventListener("click",theme);
$("font-smaller").addEventListener("click",()=>font(-1));$("font-larger").addEventListener("click",()=>font(1));
$("course-search").addEventListener("input",courseTable);
const search=$("global-search");
search.addEventListener("keydown",e=>{if(e.key==="Enter"){
 const q=search.value.trim();if(!q)return;
 const i=modules.findIndex(m=>m.title.toLowerCase().includes(q.toLowerCase())||m.lessons.some(x=>x.join(" ").toLowerCase().includes(q.toLowerCase())));
 selectedModule=i>=0?i:0;moduleList();$("course-search").value=q;courseTable();navigate("courses");
 if(i<0)notice("没有匹配课程，可修改目录关键词。");
}});
document.addEventListener("keydown",e=>{
 const typing=e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement;
 if(e.key==="/"&&!typing&&!e.ctrlKey){e.preventDefault();search.focus()}
 if(e.ctrlKey&&e.key==="Enter"&&page==="lesson"){e.preventDefault();(e.shiftKey?$("submit-code"):$("run-code")).click()}
 if(e.ctrlKey&&e.key.toLowerCase()==="s"&&page==="lesson"){e.preventDefault();clearTimeout(saveTimer);save();notice("原型草稿已保存至浏览器")}
});
try{if(localStorage.getItem(themeKey)==="dark")document.body.setAttribute("data-theme","dark")}catch(e){}
stageStrip();moduleList();courseTable();taskTable();otherContent();
})();

/* v0.3 project gallery: offline static planning preview, not a runnable IDE. */
(() => {
 "use strict";
 const projects = [
  {id:"MINI-01",title:"Study Planner",cn:"原生 Web 学习计划板",stack:"HTML / CSS / JS",hours:"3–4h",stage:"Web",tests:9,desc:"DOM 事件委托、布局、存储、XSS",doc:"MINI-01-study-planner.md",steps:["表单与布局","DOM 任务操作","数据持久化","修复事件/安全缺陷"]},
  {id:"MINI-02",title:"Request Lab",cn:"请求故障实验台",stack:"TypeScript / Fetch",hours:"4–6h",stage:"JavaScript",tests:8,desc:"Promise、404/500、网络异常、取消与乱序",doc:"MINI-02-request-lab.md",steps:["错误类型预测","实现 Fetch 和校验","模拟请求与日志","竞态与取消回归"]},
  {id:"MINI-03",title:"Typed Task Engine",cn:"类型安全任务引擎",stack:"TypeScript / Vitest",hours:"4–6h",stage:"TypeScript",tests:8,desc:"泛型、状态联合、never 穷尽检查",doc:"MINI-03-typed-task-engine.md",steps:["状态模型/泛型","Reducer 迁移","筛选与日志","负向类型与审查"]},
  {id:"MINI-04",title:"React Bug Board",cn:"React 缺陷看板",stack:"React / Vite / TS",hours:"6–9h",stage:"React",tests:9,desc:"组件、表单、State、Effect 与请求竞态",doc:"MINI-04-react-bug-board.md",steps:["类型与列表","组合筛选","受控表单","请求竞态","组件测试"]},
  {id:"MINI-05",title:"Notes API",cn:"Node 本地知识库 API",stack:"Node / TS / SQLite",hours:"6–9h",stage:"Node.js",tests:10,desc:"REST、入参校验、事务、迁移、集成测试",doc:"MINI-05-notes-api.md",steps:["内存 REST","运行时校验","SQLite 持久化","并发/事务","HTTP 测试"]},
  {id:"MINI-06",title:"Snippet Vault",cn:"Electron 代码片段库（选修）",stack:"Electron / React / TS",hours:"6–10h",stage:"桌面开发",tests:9,desc:"Main/Preload/Renderer、IPC 与权限隔离",doc:"MINI-06-electron-snippet-vault.md",steps:["窗口与 UI","片段管理","本地持久化","受控 IPC","安全测试"]}
 ];
 const root=document.getElementById("mini-project-grid"),detail=document.getElementById("mini-project-detail");
 if(!root||!detail)return;
 function select(index){
  const p=projects[index];
  root.querySelectorAll("button").forEach((b,i)=>{b.classList.toggle("selected",i===index);b.setAttribute("aria-pressed",i===index?"true":"false")});
  detail.replaceChildren();
  const head=document.createElement("div");head.className="detail-head";
  const info=document.createElement("div");
  const kicker=document.createElement("div");kicker.className="eyebrow";kicker.textContent=p.id+" · "+p.stage+" · 设计规格";
  const title=document.createElement("h3");title.textContent=p.cn+" / "+p.title;
  const desc=document.createElement("p");desc.textContent="重点训练："+p.desc+"；建议 "+p.hours+"，分阶段独立开发。";
  info.append(kicker,title,desc);
  const link=document.createElement("a");link.href="../docs/projects/"+p.doc;link.className="btn sm";link.textContent="查看任务规格 ↗";link.title="打开仓库本地 Markdown 任务文档";
  head.append(info,link);
  const milestoneGrid=document.createElement("div");milestoneGrid.className="detail-milestones";
  p.steps.forEach((step,i)=>{const box=document.createElement("div");box.className="mini-milestone";const n=document.createElement("strong");n.textContent="M"+(i+1)+" · "+step;const s=document.createElement("small");s.textContent="设计中 · 暂不可运行";box.append(n,s);milestoneGrid.appendChild(box)});
  const footer=document.createElement("div");footer.className="small muted";footer.style.marginTop="10px";footer.textContent=p.tests+" 项测试检查点 · 项目工作区/运行器尚未接入，不能在本原型内提交。";
  detail.append(head,milestoneGrid,footer);
 }
 projects.forEach((p,index)=>{const card=document.createElement("button");card.type="button";card.className="mini-project-card";card.innerHTML='<div class="flex" style="justify-content:space-between;gap:6px"><span class="lesson-id">'+p.id+'</span><span class="tag amber">设计中</span></div><strong>'+p.cn+'</strong><div class="summary">'+p.desc+'</div><footer><span>'+p.stack+'</span><span>'+p.hours+'</span></footer>';card.addEventListener("click",()=>select(index));root.appendChild(card)});
 select(0);
})();
