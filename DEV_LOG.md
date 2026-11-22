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

**执行**：把旧工程骨架复制到 `D:\Projects\dsh\dianfengsoft`（排除 node_modules/.git/dist/.astro/test-results/.github），共 85 个 src 文件。开始清洗与改造。
