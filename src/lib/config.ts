/**
 * 公开构建期配置的唯一读取点。
 *
 * 约定：这里的键全部以 PUBLIC_ 开头 —— Vite 会把值**内联进静态产物**，
 * 因此只能放公开信息（端点 URL、站点 ID、联系外链），绝不放密钥。
 * 密钥只存在于部署平台环境变量，由表单端点侧读取。
 *
 * 隐私政策页据此生成「当前构建实际启用了哪些第三方服务」，
 * 避免文案与产物不一致。改配置只改这一处。
 *
 * 方案 A（企业门户）：表单端点留空 → 降级为 mailto 邮件兜底；
 * 配置端点后走第三方表单/Serverless，通知邮件 + 提交回执。
 */
export const PUBLIC_CONFIG = {
  /** 方案 A 表单端点：留空 → SubscribeForm 整块降级为 mailto: */
  formEndpoint: import.meta.env.PUBLIC_FORM_ENDPOINT || '',
  /** 商务咨询收件邮箱（公开） */
  contactEmail: import.meta.env.PUBLIC_CONTACT_EMAIL || 'zjc_9999@163.com',
  /** 预约外链：企业门户默认不启用（近距离沟通走企业微信，见 profile），配置才渲染 */
  calUrl: import.meta.env.PUBLIC_CAL_URL || '',
  /** Umami 隐私友好分析：两项都配置才算启用 */
  umamiScriptUrl: import.meta.env.PUBLIC_UMAMI_SCRIPT_URL || '',
  umamiWebsiteId: import.meta.env.PUBLIC_UMAMI_WEBSITE_ID || '',
} as const;

/** 两个值必须同时存在，否则半配置状态会加载一个没有 website-id 的脚本 */
export const ANALYTICS_ENABLED = Boolean(
  PUBLIC_CONFIG.umamiScriptUrl && PUBLIC_CONFIG.umamiWebsiteId,
);
