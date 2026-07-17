(function () {
  'use strict';

  const PRESERVED_IDS = ['fanfamily-audio', 'fanfamily-audio-toggle', 'fanfamily-audio-styles', 'fanfamily-audio-hint', 'fan-lang-toggle', 'fan-i18n-styles'];

  function isInternalLink(el) {
    if (!el || el.tagName !== 'A') return false;
    if (el.target === '_blank' || el.getAttribute('data-no-pjax') !== null) return false;
    const href = el.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    try {
      const url = new URL(href, location.href);
      return url.origin === location.origin && url.pathname.endsWith('.html');
    } catch (e) {
      return false;
    }
  }

  function preserveElements() {
    const preserved = [];
    PRESERVED_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
        preserved.push(el);
      }
    });
    return preserved;
  }

  function restoreElements(preserved) {
    preserved.forEach(el => {
      if (!document.getElementById(el.id)) {
        document.body.appendChild(el);
      }
    });
  }

  async function navigate(url, push = true) {
    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('fetch failed');
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const preserved = preserveElements();

      // Replace head content (preserve audio styles if already injected)
      const newHead = doc.head;
      document.head.innerHTML = newHead.innerHTML;

      // Restore preserved elements into body
      document.body.innerHTML = doc.body.innerHTML;
      restoreElements(preserved);

      // Update title
      if (doc.title) document.title = doc.title;

      // Re-execute scripts in body
      const scripts = Array.from(document.body.querySelectorAll('script'));
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        if (oldScript.src) {
          newScript.src = oldScript.src;
        } else {
          newScript.textContent = oldScript.textContent;
        }
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });

      // Update history
      if (push) history.pushState({ url }, '', url);

      // Scroll to top
      window.scrollTo(0, 0);

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pjax:load', { detail: { url } }));
    } catch (err) {
      console.error('PJAX error:', err);
      location.href = url;
    }
  }

  function init() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!isInternalLink(link)) return;
      e.preventDefault();
      navigate(link.href);
    });

    window.addEventListener('popstate', (e) => {
      const url = e.state && e.state.url ? e.state.url : location.href;
      navigate(url, false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
