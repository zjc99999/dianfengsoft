# 巅峰软件门户 · 开发日志

> 记录目的：把「为什么这么改、改了什么、验证结果」沉淀成可追溯的过程证据，既服务交付，也作为 `/insights`（洞察与实践）栏目的真实素材来源。
> 时区：Asia/Shanghai。历史条目只追加，不覆写。

---

## 2026-11-22 · 立项与工程迁移准备

**背景**：用户注册个体工商户「巅峰软件 / dianfengsoft」，旧的「独立开发者」个人站（Atelier / 造物间，`D:\Projects\dsh\webSite`）不再适合作为企业门户。用户拍板：域名 `www.dianfengsoft.cn`、全栏目进 P1、备案 `苏ICP备2026086890号-2` 有效（-2 与子域名无关）、技术沿用旧栈、商务走方案 A（表单+邮件/企微+回执，不建重型后台）、合规前置、过程中维护开发记录与开发文档。

**决策**：不推倒重来——整体复用旧 Astro 7 工程骨架（首屏预算制、证据链、静态优先、质量门禁），重构品牌与信息架构。方案文档 v0.2 → v0.3（实施版），并把用户拍板结论写入「实施锁定」表。

**工程盘点结论**（旧站实测，2026-11-22）：
- 技术栈：Astro 7.4.11 + @astrojs/mdx 8.1.5 + Tailwind 4.3.5 + zod 4.6.7 + Pagefind 1.6.0；Node >=22.23.4；pnpm@11.28.5（本机 Node v24.21.0 / pnpm 12.6.0）。
- 内容集合：`products`（3：atelier/huanming/mylock）、`log`（约20篇）、`capabilities`（9篇）、`cases`（空）、`pages`（about/now/uses）、`profile`（JSON 单条）。
- 三条构建期硬规则：E4-a `capability.evidence_ids` 非空；E4-b `case.consent===true`；E4-c 证据目标必须真实存在。
- 质量门禁：`pnpm quality`（build + CSP + check + 硬规则 + 单测 + CI 接线）、`quality:browser`（E2E + Lighthouse + axe + 线索闭环）。
- 严格 CSP：script-src 仅 'self' + 内联哈希 + 'wasm-unsafe-eval'（Pagefind WASM），无 unsafe-inline；由 `scripts/csp-check.mjs` 从产物生成 `public/_headers`。

**执行**：把旧工程骨架复制到 `D:\Projects\dsh\dianfengsoft`（排除 node_modules/.git/dist/.astro/test-results），保留 .github，共 85 个 src 文件。开始清洗与改造。

---

## 2026-11-22 · P1 全栏目改造完成 · 质量门禁全绿

**品牌与全局配置**：`constants.ts`（站名/定位/使命、NAV 5 项、CTA 商务咨询+看方案+试用焕名、COLLECTIONS 8 键）、`config.ts`（formEndpoint 空→mailto 降级、calUrl 默认空）、`astro.config.mjs`（默认 URL 改 www.dianfengsoft.cn、集成改名 dianfengsoft-pagefind）、`content.config.ts`（WORKSPACE 改 dianfengsoft；新增 `solutions`/`insights` 集合；cases 加 `kind=scene|client`；pages 加 `responsibility`；profile 企业化字段 mission/company_intro/icp_no）。

**lib 层改造**：`queries.ts` 加 getSolutions/getInsights；`evidence.ts` EVIDENCE_COLLECTIONS 扩到 7 项并加 solutions/insights 路由；`feeds.ts` 合并 insights 到 Feed；`seo.ts` publisher 改 Organization。

**真实内容（不空壳、不虚构）**：profile 企业化；solutions 2 篇（本地文件治理 / 隐私优先 AI 命名）；cases 2 篇均为 `kind=scene` 典型应用场景演示（焕名真实截图，**不指向任何客户**，无授权不发 client 案例）；insights 3 篇；about/responsibility 页企业化；旧 capabilities 9 篇 + log 约26篇 + products 3 篇保留（证据链引用指向原产品 id，未改）。

**页面与组件**：新建 solutions/cases/insights/responsibility/terms/refund 页面；首页重写为 6 步 progression（方案→作品→场景→洞察→能力→责任）；Hero/Nav/Footer/CTA/Seo 均企业化，Footer 加备案号+法务三页；BS 表单企业语气（来源留痕/同意/蜜罐/双兜底）。global.css 补新卡片/事实块样式。

**质量门禁结果（全绿）**：
- `astro check` 76 文件 0 error（修复 cases reference() 返回 `{collection,id}` 对象的类型问题，改 `productIdOf` 解析）。
- 单元测试 47/47（含 evidence.test.ts 扩到 7 集合路由断言）。
- 构建期硬规则 E4-a/b/c 三条探针 + 清理恢复，全部通过。
- CSP：内联脚本哈希全登记、drift=false、_headers 618B。
- 部署冒烟：16 核心页 200、首页零脚本、sitemap/RSS/JSON Feed/Pagefind 可消费、CSP 真响应头。
- E2E 7/7、Lighthouse 100/100/100/100、axe 0 违规、Pagefind 搜索 8 条、首屏 JS 0KB/LCP 1012ms、verify-lead 双表单闭环 PASS。
- verify-ci 27 项 PASS。

**关键排障**：`verify:ci` 曾因密钥扫描 scanned=0 失败——根因是新目录无 `.git`，`git ls-files` 返回空（不是假绿配置问题）。已 `git init` + 首次提交（commit 2f0817d，167 文件入库，.gitignore 正确排除 .env），重跑 scanned=167 / PASS。此坑说明「测试真的扫到了文件」本身也需要断言。

**部署状态**：代码与内容已就绪并入库，尚未部署到 Cloudflare Pages（待配置 `www.dianfengsoft.cn` CNAME 与构建环境变量，属外部操作）。

---

## 2026-11-22 · 科技感视觉改造 + 企业品牌 Logo 集成（本地完成，待用户确认）

**背景**：用户新指令（m00851③）——界面要与个人开发者区分、更体现企业特性、做科技感强的美化、改完先本地预览；随后（m00909）用户终止任务并说明在 `asserts/` 放了一组 dianfeng logo（基本图案一致），可作企业品牌标识。约束：只本地改+预览，**不上传 GitHub、不部署**（均"等确定版本再说"）。用户提供的 GitHub PAT 与上传部署属敏感/延后事项，绝不写入仓库与日志。

**配色系统改写**（`src/styles/global.css`）：从"暖纸底+墨色+赤陶"个人手作风改为冷白/深空蓝科技配色。浅色 `--paper #f5f8fc` / `--ink #0b1a2e` / `--accent #0891b2` / `--accent-2 #4f46e5`；深色 `--paper #070e1a` / `--ink #e8f1fb` / `--accent #22d3ee` / `--accent-2 #818cf8`；新增 `--grid-line`。Hero 细网格+radial mask、`.hero-art` 数据轨道（虚线圈 24s 旋转+中心光球）、status-chip 等宽青蓝描边；按钮/Card/Step/CTA/Header 加渐变与辉光。hero-title 因 axe color-contrast 保持纯色（放弃 background-clip 渐变）。赤陶硬编码 rgba 全部清除。

**Logo 集成**：`asserts/dianfeng1~4.png`（vision_colors 取色：白底+蓝灰 #687090+深蓝 #081850，与科技配色契合）。复制到 `public/images/logo/`（mark/horizontal-2/horizontal-3/banner）+ `public/favicon.png`；`Nav.astro` 手绘 A 字 SVG 换成 `<img class="brand-logo" src="/images/logo/dianfeng-mark.png" ...>`（品牌仍在 nav 外，nav 链接≤5 断言不破）；`BaseLayout.astro:62` favicon 改 PNG；`global.css` `.brand-mark`→`.brand-logo`；`Hero.astro` 头部注释更新。

**验证（全绿）**：build 60 页；astro check 0 error；单测 47/47；CSP drift=false/_headers 618B；E2E 7/7；axe 5 页 0 违规（深浅对比度达标）；Lighthouse 100/100/100/100（LCP 0.2s/CLS 0，failedBinaryAudits:["bf-cache"] 不影响阈值）。浅色/深色首页预览已截图并经 `vision_present` 呈现用户。

**工具坑**：①视觉推理后端本轮全部限流（vision_describe/ocr ok:false VISION_BACKEND_UNAVAILABLE_THIS_TURN，modlens 亦失败），本轮不改问法重试，改用 vision_colors（本地 sharp）+ vision_present 绕过；②预览脚本用 `import { chromium } from '@playwright/test'`（项目无 playwright 包）+ `findChrome()` 指向本机 Chrome（playwright 自带浏览器未下载）。

**用户确认（m01097）**：「深色款的吧」——选定深空蓝科技风为企业门户默认主题。已将 `global.css` `:root` 设为深色变量、`color-scheme: dark`，移除 `prefers-color-scheme: dark` 媒体查询（避免系统浅色偏好把默认主题切回浅色）。重跑全门禁全绿：build 60 页 / check 0 error / 单测 47/47 / CSP drift=false / E2E 7/7 / axe 0 违规 / Lighthouse 100/100/100/100。

**状态**：深色主题已锁定并本地 git 提交。**仍不上传 GitHub、不部署**——用户要求「先定版本再说」（GitHub 仓库 https://github.com/zjc99999/dianfengsoft、阿里云 ECS + caddy 均为待办，PAT 不入仓/不入日志）。

---

## 2026-11-22 · 引入 4 款新产品 + 提炼企业能力（只读梳理源项目）

**背景**：用户（m01147）要求把旧 webSite 的「能力」引入企业站（名称可润色），并把 4 个自研产品整理上传、从产品提炼能力展示。4 个源目录均为用户自己开发部署的项目，**全程只读、绝不修改源目录**：`D:\Projects\dsh\phoneFiles`、`D:\Projects\dsh\potentialProjects\locRecord`、`D:\Projects\WorkBuddy\Health`、`D:\Projects\WorkBuddy\ZenMind`。由 4 个并行探查 subagent 只读梳理文档/截图/证据，先前已产出完整报告。

**新增 4 款产品条目**（`src/content/products/`，均按真实文档摘取、不虚构）：
- `phonefiles.mdx`（PhoneFiles 手机数据归档助手）：只读 MTP 安卓归档 + SHA-256 清单，开源 MVP v0.6；真机 1211 文件/945MB 验证；无现成截图，条目注明早期版本边界。
- `locrecord.mdx`（静记 LocRecord 离线会议转写）：Tauri2+Rust 本地 ASR，stage=building（上线前准备，未开卖）；静态无 HTTP + 动态 79 次采样零连接的隐私双证据；无正式截图，条目注明发布时补齐、不虚构。
- `health-calculator.mdx`（代谢小算 微信小程序）：stage=live，1.0.3 已全量发布，81 项断言；封面 `health-home.jpg` 取自真机截图。
- `zenmind.mdx`（照水 ZenMind 修身交互平台）：stage=live，H5 已上线 zhaoshui.dianfengsoft.cn，商业化待激活；封面 `zenmind-zhaojian.png` 取自 out/ui 五步仪式截图。
- stage 设置遵循诚实原则：仅 phonefiles/health/zenmind 为 live，locrecord 为 building；未把"即将上线"写成已上线。

**能力引入与润色**：旧能力 9 篇保留，其中 4 篇的个人化措辞（「一个人」「独立开发者」「我这边能跑」「我以为对」「我觉得」）改为企业口径「独立」「小团队」「开发机上」「自以为对」「我们」。新增 5 篇从 4 产品提炼的企业能力：
- `privacy-first-engineering.md`（隐私优先的工程落地）→ evidence: locrecord/health-calculator/phonefiles/huanming
- `ai-engineering.md`（AI 应用工程化）→ evidence: zenmind/huanming + log 实测证据
- `growth-product-design.md`（增长与商业化产品设计）→ evidence: zenmind/huanming/solutions/local-file-governance
- `mobile-miniapp-delivery.md`（微信小程序与移动端交付）→ evidence: health-calculator/zenmind
- `interaction-experience-design.md`（交互与体验设计）→ evidence: zenmind/phonefiles/health-calculator
- 全部 evidence_ids 均指向真实存在的条目，E4-c 构建期校验通过。

**封面资源**：从源项目只读复制 `zenmind-zhaojian.png`、`health-home.jpg` 到 `src/assets/`（astro:assets 自动优化为 webp）；未引用的 health-qr/zenmind-zeshi 复制后删除，保持整洁。

**质量门禁（全绿）**：build 69 页（新增 9 页：4 产品详情+5 能力）；astro check 0 error；单测 47/47；硬规则 E4-a/b/c 全过（含 E4-c 证明所有新证据目标存在）；CSP drift=false/_headers 618B；部署冒烟 16 核心页 200；axe 5 页 0 违规；Lighthouse 100/100/100/100；verify-ci 27 项。产品/能力页预览经 vision_present 呈现用户。

**排障**：完整 E2E 两轮各 1 项失败且是不同用例、单独重跑均过——根因是残留预览服务器 `pwsh-343d840ba6654f00` 占用 4321 端口被 `reuseExistingServer` 复用（旧 dist 快照）。job_kill 后用干净端口 4399 重跑，E2E 7/7 全绿。教训：跑 E2E 前先确认无残留 serve 进程占用默认端口。

**状态**：新增产品/能力已本地提交。仍不上传 GitHub、不部署（用户「先定版本再说」约束持续有效，PAT 不入仓/不入日志）。

---

## 2026-11-22 · 补齐 PhoneFiles 与 LocRecord 产品截图

**背景**：用户 m01381 反馈上次引入产品时有几个没找到截图，已让制作用说明并配好截图，让我找找补充。源项目目录全程只读，不修改。

**找到的素材**：
- `D:\Projects\dsh\phoneFiles\screenshots\`：01-主界面-备份工作台 / 02-浏览目录树 / 03-连接扫描后 / 04-节点详情（均 1120×780）。
- `D:\Projects\dsh\potentialProjects\locRecord\docs\使用说明文档\images\`：01-主界面 / 07-转写完成（1202×832）、08-转写详情逐字稿 / 09-转写详情含纪要（1600×650）。

**执行**：
- 封面（走 astro:assets 优化）：复制 `phonefiles-main.png`（主界面）、`locrecord-summary.png`（转写详情含纪要）到 `src/assets/`，两个产品条目的 frontmatter 加 `cover`。
- 正文展示图（markdown 直接引用）：复制 6 张到 `public/images/products/`（phonefiles-main/tree/node，locrecord-main/done/transcript）。未引用的 phonefiles-scanned 删除。
- `phonefiles.mdx` / `locrecord.mdx` 新增「界面一览」章节配图；LocRecord 删除原文「正式版截图将在发布时补齐——本条目不虚构截图」，改为「截图来自产品使用说明文档，展示当前可交付版本真实界面」。

**质量门禁（全绿）**：build 69 页、astro check 0 error、单测 47/47、硬规则 E4-a/b/c 全过、CSP drift=false/_headers 618B、部署冒烟 16 核心页 200、E2E 7/7（跑前确认无残留 serve 占端口）、verify-ci 27 项、Lighthouse 100/100/100/100、axe 5 页 0 违规。产品页已截图经 vision_present 呈现用户。

**状态**：本轮补图已本地提交。仍不上传 GitHub、不部署（「先定版本再说」约束持续有效）。
