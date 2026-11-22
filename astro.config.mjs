import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { buildPagefindIndex } from './scripts/pagefind-index.mjs';

/**
 * 本地集成：构建完成后生成 Pagefind 静态索引。
 * 用 astro:build:done 钩子，pnpm build 一条命令原子产出 dist/pagefind/，
 * 且 E4 违规探针期间故意失败的构建不会走到这个钩子。
 * 传 outDir：astro.config.mjs 会被 esbuild 打包成临时文件，
 * pagefind-index.mjs 内 import.meta.url 可能不再指向项目根，用钩子给的 dir 最可靠。
 */
function dianfengPagefind() {
  return {
    name: 'dianfengsoft-pagefind',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        try {
          const { pageCount, outputPath } = await buildPagefindIndex({ outDir });
          logger.info(`[pagefind] 已索引 ${pageCount} 个页面 → ${outputPath}`);
        } catch (err) {
          logger.error(`[pagefind] 构建索引失败：${err.message}`);
          throw err;
        }
      },
    },
  };
}

/**
 * 站点公开 URL：由部署平台的环境变量 PUBLIC_SITE_URL 驱动，
 * 默认值为企业门户域名 www.dianfengsoft.cn（Cloudflare Pages）。
 * 这一处同时决定 canonical / sitemap / OG / RSS / JSON Feed 的绝对地址；
 * 用 process.env 而非 import.meta.env —— astro.config.mjs 在 Vite 加载 env 之前执行。
 */
const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://www.dianfengsoft.cn';

export default defineConfig({
  site: SITE_URL,
  integrations: [
    mdx(),
    // /search 页在 Seo.astro 里标了 noindex（站内搜索结果页无需被搜索引擎收录），
    sitemap({ filter: (page) => !page.endsWith('/search/') }),
    dianfengPagefind(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  // 严格 CSP 要求产物零内联 style 属性；关闭 Shiki 高亮避免 <pre style>。
  markdown: { syntaxHighlight: false },
  // 中文文案与行内链接较多，显式恢复 HTML 语义压缩（EX-2）。
  compressHTML: true,
});
