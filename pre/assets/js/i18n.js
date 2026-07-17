(function () {
  'use strict';

  const STORAGE_KEY = 'fanfamily_lang';
  const DEFAULT_LANG = 'zh';

  function getLang() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    } catch (e) {
      return DEFAULT_LANG;
    }
  }

  function setLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
  }

  function injectStyles() {
    if (document.getElementById('fan-i18n-styles')) return;
    const style = document.createElement('style');
    style.id = 'fan-i18n-styles';
    style.textContent = `
      .fan-lang-toggle {
        position: fixed;
        top: 50%;
        right: 1.2rem;
        transform: translateY(-50%);
        z-index: 9998;
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.45rem 0.75rem;
        border-radius: 999px;
        border: 1px solid rgba(139, 69, 19, 0.18);
        background: rgba(247, 243, 236, 0.92);
        backdrop-filter: blur(6px);
        color: #8b4513;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 0.72rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), background 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 16px rgba(44, 36, 27, 0.08);
        pointer-events: auto;
      }
      .fan-lang-toggle:hover {
        transform: translateY(-50%) scale(1.05);
        background: rgba(255, 254, 248, 0.96);
        box-shadow: 0 6px 20px rgba(44, 36, 27, 0.12);
      }
      .fan-lang-toggle .sep { opacity: 0.4; }
      .fan-lang-toggle .lang { transition: opacity 0.2s; }
      .fan-lang-toggle .lang.active { opacity: 1; font-weight: 700; }
      .fan-lang-toggle .lang:not(.active) { opacity: 0.5; }
      @media (max-width: 768px) {
        .fan-lang-toggle { right: 0.8rem; padding: 0.35rem 0.6rem; font-size: 0.65rem; }
      }
    `;
    document.head.appendChild(style);
  }

  function createToggle() {
    if (document.getElementById('fan-lang-toggle')) return;
    injectStyles();
    const btn = document.createElement('button');
    btn.id = 'fan-lang-toggle';
    btn.className = 'fan-lang-toggle';
    btn.setAttribute('aria-label', '中英文切换');
    btn.innerHTML = `
      <span class="lang zh" data-lang="zh">中</span>
      <span class="sep">/</span>
      <span class="lang en" data-lang="en">EN</span>
    `;
    document.body.appendChild(btn);

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = getLang();
      const next = current === 'zh' ? 'en' : 'zh';
      setLang(next);
      applyLang(next);
    });

    updateToggleState(getLang());
  }

  function updateToggleState(lang) {
    const btn = document.getElementById('fan-lang-toggle');
    if (!btn) return;
    btn.querySelectorAll('.lang').forEach(el => {
      el.classList.toggle('active', el.dataset.lang === lang);
    });
  }

  function applyLang(lang) {
    updateToggleState(lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const dict = window.fanI18nDict || {};
      if (dict[key] && dict[key][lang]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = dict[key][lang];
        } else {
          el.innerHTML = dict[key][lang];
        }
      }
    });
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }

  function init() {
    createToggle();
    const lang = getLang();
    applyLang(lang);
    // 如果 toggle 已存在（如 PJAX 保留），确保状态同步
    updateToggleState(lang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.fanSetLang = setLang;
  window.fanApplyLang = applyLang;
})();
