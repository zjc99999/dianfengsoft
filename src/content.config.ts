/**
 * Content Layer 配置（Astro 7：文件位于 src/content.config.ts）。
 *
 * 企业门户版扩展：在旧 6 集合基础上新增 `solutions`、`insights`，`cases` 细分 scene/client，
 * `profile` 企业化（使命/愿景/备案号等）。三条构建期硬规则保持：
 *  - capability.evidence_ids 必须非空且指向真实集合；
 *  - case.consent 必须严格为 true（场景案例=自有授权，客户案例=书面授权）；
 *  - 证据目标必须真实存在（由 src/lib/evidence.ts 在构建期解析）。
 * 新增 invariant：solution 至少关联 1 个产品或场景；scene 类案例不得含客户名。
 */
import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

// ---- 组织化字段：企业主体固定单值，用 default 保证手写内容也能构建 ----
const WORKSPACE = z.literal('dianfengsoft').default('dianfengsoft');
const OWNER = z.literal('me').default('me');

/** 可被证据指向的集合名（capability.evidence_ids 的格式约束） */
const EVIDENCE_COLLECTIONS = ['products', 'solutions', 'log', 'insights', 'cases', 'capabilities', 'pages'] as const;

/** 所有集合共享的 frontmatter 字段 */
const base = {
  workspace_id: WORKSPACE,
  owner_member_id: OWNER,
  title: z.string().min(1, { error: 'title 不能为空' }),
  summary: z.string().min(1, { error: 'summary 不能为空' }),
  // 收敛为 draft|published 两级：draft 由各页面 getCollection 过滤，不出现在产物里。
  status: z.enum(['draft', 'published']).default('published'),
  visibility: z.enum(['public', 'unlisted', 'private']).default('public'),
  published_at: z.coerce.date(),
  updated_at: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  locale: z.enum(['zh-CN', 'en']).default('zh-CN'),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      og: z.string().optional(),
    })
    .default({}),
};

const products = defineCollection({
  loader: glob({ base: './src/content/products', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      ...base,
      tagline: z.string().min(1, { error: 'tagline 不能为空' }),
      stage: z.enum(['idea', 'building', 'live', 'archived']).default('building'),
      url: z.string().optional(),
      repo_url: z.string().optional(),
      cover: image().optional(),
      metrics: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
      launch_date: z.coerce.date().optional(),
      featured: z.boolean().default(false),
      order: z.number().default(0),
    }),
});

/** 解决方案：按客户场景组织，必须至少关联 1 个产品或场景（避免空方案）。 */
const solutions = defineCollection({
  loader: glob({ base: './src/content/solutions', pattern: '**/*.{md,mdx}' }),
  schema: z
    .object({
      ...base,
      scene: z.string().min(1, { error: 'solution.scene（适用场景）不能为空' }),
      approach: z.string().min(1, { error: 'solution.approach（我们怎么做）不能为空' }),
      outcome: z.string().min(1, { error: 'solution.outcome（可量化结果）不能为空' }),
      related_product_ids: z.array(z.string()).default([]),
      related_scene_ids: z.array(z.string()).default([]),
      order: z.number().default(0),
    })
    .refine(
      (s) => s.related_product_ids.length + s.related_scene_ids.length > 0,
      { error: 'solution 必须至少关联 1 个产品或场景', path: ['related_product_ids'] },
    ),
});

const log = defineCollection({
  loader: glob({ base: './src/content/log', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...base,
    kind: z.enum(['build-log', 'decision', 'changelog', 'note', 'retro', 'now']),
    product_id: reference('products').optional(),
    related_ids: z.array(reference('log')).default([]),
    reading_time: z.number().optional(),
  }),
});

/**
 * 洞察与实践：自有内容（开发手记、版本更新、技术实践），不单设「AI 动态」。
 * 只写我们做过的事，用自有实践建立可信度，避免转载拼凑。
 */
const insights = defineCollection({
  loader: glob({ base: './src/content/insights', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...base,
    kind: z.enum(['dev-log', 'changelog', 'practice', 'note']).default('practice'),
    product_id: reference('products').optional(),
    related_ids: z.array(reference('insights')).default([]),
    reading_time: z.number().optional(),
  }),
});

const capabilities = defineCollection({
  loader: glob({ base: './src/content/capabilities', pattern: '**/*.{md,mdx}' }),
  // ★ E4 硬校验：无证据的能力不允许发布
  schema: z.object({
    ...base,
    category: z.string().min(1),
    statement: z.string().min(1),
    evidence_ids: z
      .array(z.string().min(1))
      .min(1, { error: 'capability 必须至少挂一条证据（evidence_ids 不能为空）' })
      .refine(
        (ids) =>
          ids.every((id) =>
            EVIDENCE_COLLECTIONS.some((c) => id.startsWith(`${c}/`) && id.length > c.length + 1),
          ),
        { error: 'evidence_ids 必须是 "<集合名>/<条目 id>" 格式，例如 "products/huanming"' },
      ),
  }),
});

/**
 * 案例分两类：
 *  - kind=scene（典型应用场景）：自有内容，用真实截图/工作流演示，不得指向任何客户；
 *  - kind=client（真实客户案例）：需书面授权，consent:true 且 consent_at 留痕。
 * 所有案例都要求 consent:true（场景案例即「我们同意发布自有场景」）。
 */
const cases = defineCollection({
  loader: glob({ base: './src/content/cases', pattern: '**/*.{md,mdx}' }),
  schema: z
    .object({
      ...base,
      kind: z.enum(['scene', 'client']).default('scene'),
      product_id: reference('products').optional(),
      client: z.string().optional(),
      industry: z.string().optional(),
      problem: z.string().min(1),
      solution: z.string().min(1),
      outcome: z.record(z.string(), z.string()).default({}),
      result_metrics: z.record(z.string(), z.string()).default({}),
      testimonial: z.string().optional(),
      consent: z.literal(true, { error: 'case.consent 必须为 true（未授权客户信息不公开）' }),
      consent_at: z.coerce.date(),
    })
    .refine(
      (c) => !(c.kind === 'scene' && c.client),
      { error: 'kind=scene 的典型场景演示不得填写 client（不得指向任何客户）', path: ['client'] },
    ),
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...base,
    key: z.enum(['about', 'now', 'uses', 'services', 'pricing', 'responsibility']),
  }),
});

/** 首屏与全站企业信息唯一数据源。file() 要求 JSON 为数组且每条带唯一 id。 */
const profile = defineCollection({
  loader: file('./src/content/profile.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(), // 企业名
    headline: z.string(), // 首屏身份一句话（定位句）
    value: z.string(), // 首屏价值主张一句话
    mission: z.string(), // 使命
    vision: z.string().optional(), // 愿景
    company_intro: z.string(), // 企业简介
    founded_at: z.string().optional(), // 成立年份
    business_scope: z.string().optional(), // 经营范围
    icp_no: z.string(), // 备案号
    bio: z.string(),
    availability: z.string(),
    location: z.string().optional(),
    contact_channels: z
      .array(z.object({ label: z.string(), url: z.string().optional(), value: z.string().optional() }))
      .default([]),
    socials: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
  }),
});

export const collections = {
  products,
  solutions,
  log,
  insights,
  capabilities,
  cases,
  pages,
  profile,
};
