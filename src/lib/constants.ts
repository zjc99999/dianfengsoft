/**
 * 全站常量：内容集合名、CTA 文案、导航项、社交外链预算。
 * 单一来源，便于逐项核对首屏预算（E6）与 SEO。
 *
 * 企业门户版（巅峰软件）：品牌主体由「独立开发者 Atelier」改为企业实体，
 * 导航与 CTA 相应企业化。信息架构比个人站复杂，「能力」从首页/页脚提升为
 * 主导航项，导航预算由 ≤5 放宽到 ≤6；主/次/软 CTA 各 1 保持不变。
 */
import type { CollectionKey } from 'astro:content';

export const SITE = {
  name: '巅峰软件',
  defaultTitle: '巅峰软件 · 用信息技术与 AI，做普通人用得上的软件',
  defaultDescription: '巅峰软件 —— 用信息技术与 AI，做普通人用得上的软件。从文件整理到智能应用，我们把复杂留给自己，把简单交给你。',
  locale: 'zh-CN',
} as const;

/** 导航：≤6 项（企业门户放宽）。取「产品 / 解决方案 / 场景案例 / 能力 / 关于 / 联系」。 */
/** 首页通过品牌 logo 返回；社会责任 / 洞察与实践 / 创作日志通过首页与页脚进入。 */
export const NAV: ReadonlyArray<{ label: string; href: string }> = [
  { label: '产品', href: '/products' },
  { label: '解决方案', href: '/solutions' },
  { label: '场景案例', href: '/cases' },
  { label: '能力', href: '/capabilities' },
  { label: '关于', href: '/about' },
  { label: '联系', href: '/contact' },
];

/** CTA 分层：主 1 / 次 1 / 软 1（E6、5.3） */
export const CTA = {
  primary: { label: '商务咨询', href: '/contact' },
  secondary: { label: '查看解决方案', href: '/solutions' },
  soft: { label: '免费试用焕名', href: 'https://ren.dianfengsoft.cn' },
} as const;

export const STAGE_LABEL: Record<string, string> = {
  idea: '想法中',
  building: '开发中',
  live: '已上线',
  archived: '已归档',
};

export const KIND_LABEL: Record<string, string> = {
  'build-log': '构建记录',
  decision: '决策',
  changelog: '变更',
  note: '随记',
  retro: '复盘',
  now: '近况',
};

/** 精选作品预算：≤3（E6） */
export const FEATURED_LIMIT = 3;
/** 首屏近期日志预算：≤3 */
export const RECENT_LOG_LIMIT = 3;
/** 能力概览预算：≤4 */
export const CAPABILITY_LIMIT = 4;
/** 社交外链预算：≤3，且只放页脚（E6） */
export const SOCIAL_LIMIT = 3;

/** 集合名常量，避免各处硬编码字符串 */
export const COLLECTIONS: Record<string, CollectionKey> = {
  products: 'products',
  solutions: 'solutions',
  log: 'log',
  insights: 'insights',
  capabilities: 'capabilities',
  cases: 'cases',
  pages: 'pages',
  profile: 'profile',
};

/**
 * 生产环境内容过滤：草稿与私有内容不出现在产物里（5.3）。
 * 用法：getCollection('log', isPublicProd) —— 注意返回布尔而非集合。
 */
export function isPublicProd(
  { data }: { data: { status: string; visibility: string } },
  isProd: boolean = import.meta.env.PROD,
) {
  return isProd ? data.status === 'published' && data.visibility !== 'private' : true;
}

/** 日期本地化（zh-CN，5.7 i18n 骨架） */
export function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai',
  }).format(date);
}
