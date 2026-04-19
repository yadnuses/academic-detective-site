(function() {
  function setLang(lang) {
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'zh-CN');
    var t = window.translations || {};
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.getAttribute('data-i18n');
      if (t[key] && t[key][lang]) {
        el.textContent = t[key][lang];
      }
    }
    var htmlEls = document.querySelectorAll('[data-i18n-html]');
    for (var j = 0; j < htmlEls.length; j++) {
      var hel = htmlEls[j];
      var hkey = hel.getAttribute('data-i18n-html');
      if (t[hkey] && t[hkey][lang]) {
        hel.innerHTML = t[hkey][lang];
      }
    }
    var zhSpans = document.querySelectorAll('.lang-switch .lang-zh');
    var enSpans = document.querySelectorAll('.lang-switch .lang-en');
    for (var a = 0; a < zhSpans.length; a++) {
      zhSpans[a].classList.toggle('active', lang !== 'en');
    }
    for (var b = 0; b < enSpans.length; b++) {
      enSpans[b].classList.toggle('active', lang === 'en');
    }
    var pdfTemplate = document.getElementById('pdf-template-download');
    if (pdfTemplate) {
      pdfTemplate.href = lang === 'en' ? 'Scholar_A_Report_Anonymous.pdf' : '学术档案调查报告示例.pdf';
    }
    var pdfCase = document.getElementById('pdf-case-download');
    if (pdfCase) {
      pdfCase.href = lang === 'en' ? 'Scholar_A_Report_Anonymous.pdf' : '学术档案调查报告示例.pdf';
    }
  }

  window.toggleLang = function() {
    var current = localStorage.getItem('lang') || 'zh';
    setLang(current === 'zh' ? 'en' : 'zh');
    if (typeof window.initChat === 'function') {
      window.initChat();
    }
  };

  window.addEventListener('load', function() {
    var saved = localStorage.getItem('lang') || 'zh';
    if (saved !== 'zh') setLang(saved);
  });
})();
