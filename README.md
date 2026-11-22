# 巅峰软件 · 企业门户

> 用信息技术与 AI，做普通人用得上的软件。
> 从文件整理到智能应用，我们把复杂留给自己，把简单交给你。

这是巅峰软件（个体工商户 / 小微企业，苏ICP备2026086890号-2）的官方门户站：表达企业初衷、作品/产品、解决方案、专业能力、社会责任，并提供商务沟通入口。站点理念、决策与市场调研见 [docs/巅峰软件门户网站建设方案.md](docs/巅峰软件门户网站建设方案.md)；过程证据见 [DEV_LOG.md](DEV_LOG.md)。

## 设计原则

- **静态优先**：读路径全静态、写路径尽量为零。内容与代码同仓、明文 Markdown/MDX，`git push` 即发布；即使表单/分析等动态层全部宕机，网站仍完整可读。
- **真实不空壳**：每个栏目至少一条真实内容打底；没有授权的客户案例绝不虚构、绝不冠名（场景演示明确标注、不指向客户）。
- **证据链能力**：能力条目必须挂 `evidence_ids` 且目标真实存在；无证据的能力不允许发布。
- **合规前置**：隐私政策 / 服务条款 / 退款说明三页齐备、页脚展示备案号、表单显式同意与来源留痕、发布主体一致。
- **克制轻量**：沿用旧站 Astro 7 静态栈与首屏/性能预算，不引入 CMS / 数据库后台。

## 环境要求

- Node `>=22.23.4`（本机实测 `v24.21.0` 可用）
- pnpm `11.28.5`（`packageManager` 已锁定）
- 精确锁定依赖版本，禁止随意 `pnpm update`；尤其 TypeScript 停在 `6.0.3`（`@astrojs/check` 的 peer 只接受 `^5 || ^6`）。
- 浏览器回归依赖系统 Chrome（`PW_CHROME` / `CHROME_PATH` 可覆盖）。

## 常用命令

```bash
pnpm install                       # 首次 / 换机器后（国内网络可设 HTTPS_PROXY）
pnpm dev                           # 本地预览 http://localhost:4321
pnpm build                         # 产出 dist/ 纯静态（含 pagefind 索引）
pnpm preview                       # 预览构建产物
pnpm check                         # astro check（TS 类型 + Astro 模板校验）
pnpm sync                          # 生成 .astro/ 类型（内容集合变更后跑）
pnpm new:log                       # 新建一条创作日志/洞察草稿
pnpm new:product                   # 交互式新建一个作品 .mdx
pnpm run quality                   # ★ 主门禁：build + CSP + check + 硬规则 + 单测 + CI 链自检
pnpm run quality:browser           # ★ 浏览器门禁：E2E + Lighthouse + axe（需系统 Chrome）
pnpm test                          # = check + test:rules + test:unit
pnpm test:rules                    # 三条构建期硬校验（E4-a/b/c）被违反时 build 必须失败
pnpm test:unit                     # vitest 单测（47 项）
pnpm test:perf                     # 浏览器实测 LCP/CLS/首屏 JS（Slow 4G + CPU×4）
pnpm test:search                   # 验证 Pagefind 站内搜索能初始化并返回结果
pnpm test:lead                     # 真实提交订阅/联系表单，校验字段与来源留痕、邮件兜底
pnpm test:nodynamic                # 拔掉全部动态层后，读路径仍完整
pnpm test:pw                       # Playwright 冒烟（首屏预算/导航/CTA/Feed/CSP 响应头）
pnpm test:lh                       # Lighthouse 四类分数（实测 100/100/100/100，门槛 95）
pnpm test:axe                      # axe-core 页面 a11y violations（实测 0）
pnpm test:csp                      # 由产物生成严格 CSP → public/_headers + dist/_headers
pnpm verify:ci                     # quality 链完整性、ci.yml、密钥未入库自检
pnpm serve                         # 本地静态预览（把 CSP 作为真实响应头发出）
pnpm deploy:smoke                  # 部署前冒烟：本地托管 dist/ 验核心页 + feed + sitemap + 搜索
pnpm deploy:smoke:remote https://www.dianfengsoft.cn  # 部署/回滚后对线上跑同一套检查
```

> Windows 若 PATH 无裸 `pnpm`，用 `node node_modules/<工具>/...` 直调（见 [docs/命令手册.md](docs/命令手册.md)）。

## 内容集合与栏目

站点地图：`/` `/solutions` `/solutions/[id]` `/products` `/products/[id]` `/cases` `/cases/[id]` `/capabilities` `/about` `/responsibility` `/insights` `/insights/[id]` `/contact` `/privacy` `/terms` `/refund` `/search`。

| 集合 | 用途 | 关键约束 |
| --- | --- | --- |
| `profile` | 企业身份/使命/价值主张/备案号（JSON 单条 `me`） | mission/company_intro/icp_no 必填 |
| `solutions` | 解决方案（场景/做法/成效） | 至少关联 1 个产品或场景 |
| `products` | 作品/产品（焕名、MyLock、早期作品 Atelier） | cover/order/stage；featured 进首页 |
| `cases` | 场景案例（`kind=scene\|client`） | 初期只发 scene（不指向客户）；client 必须 `consent:true` 且有书面授权 |
| `insights` | 洞察与实践（开发手记/版本更新/实践） | 只写自有内容，不搬运“AI 动态” |
| `capabilities` | 专业能力 | `evidence_ids` 非空且目标真实存在（E4-a/c） |
| `pages` | about/now/uses/responsibility | key 枚举受 schema 约束 |

新增内容：在对应目录新建 `.md`/`.mdx`，frontmatter 按 `src/content.config.ts` 的 Zod schema 填写（schema 即文档）。**可选字段留空时省略整行**（写 `repo_url:` 空值会被 YAML 解析为 null 报错）。构建期 Zod 校验会拦住不合规内容。

## 配置（方案 A 动态薄层，零后端零密钥）

`.env` 里全部是 `PUBLIC_` 前缀的**公开**值，由 Vite 内联进静态产物，绝不放密钥。留空即不启用、不留死链：

| 变量 | 留空时的行为 |
| --- | --- |
| `PUBLIC_FORM_ENDPOINT` | 表单整块降级为 `mailto:` 邮件链接（当前默认） |
| `PUBLIC_CONTACT_EMAIL` | 邮件兜底链接收件人（默认 zjc_9999@163.com） |
| `PUBLIC_CAL_URL` | 不渲染预约入口（企业门户默认空，走企微/邮件） |
| `PUBLIC_UMAMI_SCRIPT_URL` + `PUBLIC_UMAMI_WEBSITE_ID` | 必须同时配置才加载；留空则全站零客户端 JS |

商务闭环（当前）：表单 POST → 第三方端点或 serverless（待配置）→ 邮件/企业微信通知 → 显式同意 + 来源留痕 + 蜜罐 + mailto 双兜底。企业微信客服二维码作为“拉近客户距离”的近距离入口（待接入）。外部送达需配置真实端点后人工确认一次。

`astro.config.mjs` 的 `SITE_URL` 默认 `https://www.dianfengsoft.cn`（可用 `PUBLIC_SITE_URL` 覆盖），一处驱动 canonical / sitemap / OG / RSS / JSON Feed。`privacy.astro` 的第三方清单由当前构建的实际配置生成，不会出现“文案说启用、产物里却没有”。

**CSP**：`script-src` 仅 `'self'` + 构建期内联脚本 sha256 + `'wasm-unsafe-eval'`（Pagefind WASM），不放 `unsafe-inline`；`style-src` 因 Pagefind UI 运行时内联样式放开 `'unsafe-inline'`（记录在案的取舍）。`/search` 是全站唯一内联可执行脚本，改它必须重跑 `pnpm test:csp` 更新哈希。

**构建钩子**：`astro.config.mjs` 的 `dianfengsoftPagefind` 集成在 `astro:build:done` 生成 `dist/pagefind/`，**不要**把 `build` 改成 `astro build && ...`，否则 E4 违规探针回归会被污染。`/search` 页 `noindex` 且被 sitemap 的 `filter` 排除。

## 目录速查

| 路径 | 作用 |
| --- | --- |
| `src/content.config.ts` | Content Layer 集合定义与 Zod schema |
| `src/content/` | 全部明文内容，唯一内容源 |
| `src/content/profile.json` | 企业身份/使命/备案号唯一数据源 |
| `src/pages/` | 路由与静态生成（含 solutions/cases/insights/responsibility/terms/refund） |
| `src/components/` | Hero / Nav / Footer / CTA / Seo / SubscribeForm / ProductCard / LogTimeline / CapabilityList 等 |
| `src/lib/` | constants / config / evidence / queries / feeds |
| `src/styles/global.css` | 设计系统（品牌色变量在 `:root` 与 dark 媒体查询） |
| `scripts/` | 硬校验回归、CSP、性能/搜索/线索/不变量实测、部署冒烟、内容生成工具 |
| `tests/` | vitest 单测 + stub + Playwright E2E（`e2e/site.spec.ts`） |
| `public/_headers` | 由 test:csp 生成的严格 CSP + 安全响应头（入库，部署平台消费） |
| `public/images/` | 场景案例截图、MyLock 截图等 |
| `.github/workflows/ci.yml` | verify → quality → browser → audit 四段串行门禁 |
| `docs/` | 建设方案、部署与回滚演练、命令手册、使用指南 |
| `DEV_LOG.md` | 开发过程证据（可回流为 /insights 素材） |

## 质量门禁（已实测全绿）

- `pnpm run quality`：build + CSP + check（76 文件 0 error）+ 硬规则 E4-a/b/c + 47 单测 + verify:ci（27 项）。
- `pnpm run quality:browser`：E2E 7/7、Lighthouse 100/100/100/100、axe 0 违规、搜索/线索/不变量/perf 全 PASS。
- `pnpm test:rules` 故意破 schema 必红：写违规内容 → 断言 build 非 0 → 清理 → 恢复 0。
- `pnpm verify:ci` 断言密钥扫描**真的扫到了文件**（`git ls-files` 非空）——新目录必须先 `git init` 并至少一次提交，否则 scanned=0 会判失败。

## 约束

- 首屏硬性预算：身份 1 句、价值主张 1 句、作品 ≤3、主 CTA 1、次 CTA 1、导航 ≤6（企业门户含「能力」项，由个人站 ≤5 放宽）。
- 性能预算：首屏 JS ≤50KB、LCP <1.5s、CLS <0.1、Lighthouse ≥95。
- 范围冻结：不做 CMS / 评论库 / 搜索服务 / 邮件队列 / 分析后端 / 登录体系 / 重型商务后台。
- 案例红线：无书面授权不发客户案例；场景演示明确标注、不指向任何客户。
