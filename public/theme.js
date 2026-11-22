/**
 * 巅峰软件企业门户 — 深浅色主题切换（首方脚本，CSP `'self'` 放行）
 *
 * 设计约束：
 *  - 零依赖、零构建，直接由 public/ 原样发布到 /theme.js；
 *  - 在 <head> 阻塞式执行，先于首屏绘制写入 data-theme，避免深色/浅色闪烁（FOUC）；
 *  - 交互按钮事件的绑定推迟到 DOMContentLoaded，不在 HTML 上写 on* 属性（CSP 门禁）；
 *  - 默认深色（延续用户此前确认的「深色款」决定），仅用户主动点击后切换并记忆；
 *  - localStorage 全程 try/catch，隐私模式下退化为「本次会话内有效」而不报错。
 *
 * 注意：这是全站唯一允许的可执行脚本（E7 受控例外），三处零脚本断言已同步放宽为
 * 「仅允许 /theme.js 一个首方外链脚本，且无内联脚本」。
 */
(function () {
  'use strict';

  var KEY = 'df-theme';
  var DARK = 'dark';
  var LIGHT = 'light';
  var root = document.documentElement;

  function read() {
    try {
      return window.localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  function save(theme) {
    try {
      window.localStorage.setItem(KEY, theme);
    } catch (e) {
      /* 隐私模式 / 禁用存储：忽略，切换仍即时生效 */
    }
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === LIGHT ? '#f5f8fc' : '#070e1a');
    }
  }

  // 早执行：只在用户明确选过浅色时用浅色，其余一律深色（与既有品牌默认一致）。
  apply(read() === LIGHT ? LIGHT : DARK);

  function bind() {
    var btn = document.getElementById('themeToggle');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === LIGHT ? DARK : LIGHT;
      apply(next);
      save(next);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
