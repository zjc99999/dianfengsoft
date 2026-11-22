/**
 * M6-d：黑盒 E2E smoke。测的是「构建后的真实静态站点」，不是组件单元。
 *
 * 覆盖 WBS 要求的首屏、导航、CTA 可达，并额外锁住两条本项目不变量：
 *  - 首屏可执行脚本受控（E7）：首页仅允许 /theme.js 一个首方外链脚本（深浅色切换必需），
 *    不得有内联脚本或其它外链脚本；
 *  - CSP 作为真实响应头发出（M6-e）：且 script-src 是严格策略（无 unsafe-inline）。
 *
 * 这些断言与 Lighthouse / axe / CSP 检查互补：那边看分数与 violations，
 * 这里看「访问者点下去到底能不能走通」。
 */
import { test, expect } from '@playwright/test';

/** Chromium 会把中文 slug 百分号编码，比较前统一解码，避免假阴性。 */
const pathOf = (u: string) => decodeURIComponent(new URL(u).pathname).replace(/\/$/, '');

test.describe('首屏（L1 / 3 秒层）', () => {
  test('身份、价值主张、主次 CTA 都在首屏且不滚动可见', async ({ page }) => {
    const resp = await page.goto('/');
    expect(resp?.status()).toBe(200);

    // E6 预算只约束「首屏 L1」，因此断言限定在 Hero 内，而不是整页：
    // 页面下方的 L2 次级 CTA 区还会再出现一次主 CTA（设计如此，不算超预算）。
    const hero = page.locator('section[aria-labelledby="hero-title"]');
    const h1 = hero.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toBeVisible();
    await expect(h1).not.toBeEmpty();

    await expect(hero.getByRole('link', { name: '商务咨询' })).toHaveCount(1);
    await expect(hero.getByRole('link', { name: '查看解决方案' })).toHaveCount(1);
    await expect(hero.getByRole('link', { name: '商务咨询' })).toBeVisible();

    const nav = page.getByRole('navigation', { name: '主导航' });
    expect(await nav.getByRole('link').count()).toBeLessThanOrEqual(6);
  });

  test('首页仅一个主题脚本、无内联脚本（E7 受控例外）', async ({ page }) => {
    await page.goto('/');
    const scripts = page.locator('script:not([type="application/ld+json"])');
    expect(await scripts.count()).toBe(1);
    expect(await scripts.first().getAttribute('src')).toBe('/theme.js');
    // 外链脚本不应携带内联内容（防偷偷塞代码块绕过预算）
    expect((await scripts.first().textContent())?.trim() ?? '').toBe('');
  });

  test('深浅色切换：图标按钮可切换 data-theme 并记忆', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('html');
    const btn = page.getByRole('button', { name: '切换深浅色主题' });
    await expect(btn).toHaveCount(1);
    // 默认深色
    await expect(root).toHaveAttribute('data-theme', 'dark');

    // 切到浅色
    await btn.click();
    await expect(root).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate(() => window.localStorage.getItem('df-theme'))).toBe('light');
    // 切回深色
    await btn.click();
    await expect(root).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => window.localStorage.getItem('df-theme'))).toBe('dark');

    // 记忆：刷新后仍为深色；再切浅色后刷新仍为浅色
    await btn.click();
    await page.reload();
    await expect(root).toHaveAttribute('data-theme', 'light');
    await page.evaluate(() => window.localStorage.removeItem('df-theme'));
  });

  test('CSP 作为真实响应头发出且 script-src 为严格策略（M6-e）', async ({ page }) => {
    const resp = await page.goto('/');
    const csp = resp?.headers()['content-security-policy'] ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    // 只检查 script-src 这一条指令：style-src 为了让 Pagefind UI 运行时注入样式，
    // 明确放开了 'unsafe-inline'（记录在案的取舍），不能因此判整条策略不合格。
    const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src')) ?? '';
    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).toContain("'wasm-unsafe-eval'");
    expect(scriptSrc).toMatch(/'sha256-/);
    expect(scriptSrc).not.toContain('unsafe-inline');
    expect(resp?.headers()['x-content-type-options']).toBe('nosniff');
  });
});

test.describe('导航与 CTA 可达', () => {
  test('主导航每一项都能打开且带一个标题', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: '主导航' });
    const links = await nav.getByRole('link').evaluateAll(
      (as) => as.map((a) => ({ href: (a as HTMLAnchorElement).getAttribute('href')! })),
    );
    expect(links.length).toBeLessThanOrEqual(6);
    for (const { href } of links) {
      const r = await page.goto(href);
      expect(r?.status(), `${href} 应可访问`).toBe(200);
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });

  test('站内跳转链接在新标签打开，页内锚点保持本页', async ({ page }) => {
    await page.goto('/');
    // 主导航 / 页脚均为新标签；页内锚点（阅读路径）不新开标签。
    const nav = page.getByRole('navigation', { name: '主导航' });
    const navTargets = await nav.getByRole('link').evaluateAll(
      (as) => as.map((a) => (a as HTMLAnchorElement).target),
    );
    expect(navTargets.length).toBeGreaterThan(0);
    expect(navTargets.every((t) => t === '_blank')).toBe(true);
    const anchors = await page.locator('a[href^="#"]').evaluateAll(
      (as) => as.map((a) => (a as HTMLAnchorElement).target),
    );
    expect(anchors.every((t) => t !== '_blank')).toBe(true);
  });

  test('主 CTA 到联系页、次 CTA 到解决方案页（新标签）', async ({ page }) => {
    await page.goto('/');
    // 首屏与页尾 CTA 区各有一枚同文案链接，点第一枚即可（首屏那枚）。
    const [contact] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('link', { name: '商务咨询' }).first().click(),
    ]);
    await expect.poll(() => pathOf(contact.url())).toBe('/contact');
    await expect(contact.getByRole('heading', { level: 1 })).toBeVisible();
    await contact.close();

    const [solutions] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('link', { name: '查看解决方案' }).first().click(),
    ]);
    await expect.poll(() => pathOf(solutions.url())).toBe('/solutions');
    await expect(solutions.getByRole('heading', { level: 1 })).toBeVisible();
    await solutions.close();
  });

  test('作品详情与创作日志详情可从列表页抵达（新标签）', async ({ page }) => {
    await page.goto('/products/');
    const first = page.locator('main a[href^="/products/"]').first();
    await expect(first).toBeVisible();
    const href = (await first.getAttribute('href'))!;
    const [product] = await Promise.all([page.waitForEvent('popup'), first.click()]);
    await expect.poll(() => pathOf(product.url())).toBe(pathOf(`http://x${href}`));
    await expect(product.locator('h1').first()).toBeVisible();
    await product.close();

    await page.goto('/log/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const logItem = page.locator('main a[href^="/log/"]').first();
    await expect(logItem).toBeVisible();
    const logHref = (await logItem.getAttribute('href'))!;
    const [log] = await Promise.all([page.waitForEvent('popup'), logItem.click()]);
    await expect.poll(() => pathOf(log.url())).toBe(pathOf(`http://x${logHref}`));
    await expect(log.locator('h1').first()).toBeVisible();
    await log.close();
  });

  test('RSS / JSON Feed / sitemap 可被阅读器与搜索引擎消费', async ({ request }) => {
    for (const path of ['/rss.xml', '/feed.json', '/sitemap-index.xml']) {
      const r = await request.get(path);
      expect(r.status(), `${path} 应可访问`).toBe(200);
      expect((await r.body()).length).toBeGreaterThan(100);
    }
  });
});
