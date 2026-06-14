/* ============================================
   论坛汇报 - 算法化信息聚合器
   交互与导航脚本（修复版）
   ============================================ */

(function() {
  'use strict';

  const TOTAL_SLIDES = 19;
  let currentSlide = 0;
  let isNavigating = false;   // 主动导航中，Observer 暂停更新
  let navTimer = null;

  const container = document.querySelector('.slide-container');
  const slides = document.querySelectorAll('.slide');

  /* ---- 初始化导航点 ---- */
  function initDotNav() {
    const nav = document.createElement('div');
    nav.className = 'dot-nav';

    const titles = [
      '封面', '困境引入', '经典理论', '算法中介', '双层操作',
      '类型辨析', '技术谱系', '研究定位', '三种机制',
      '机制一', '机制二', '机制三', '权利重构',
      '马赛克效应', '符号权力', '权利转向',
      '五项原则', '分层治理', '结语'
    ];

    for (let i = 0; i < TOTAL_SLIDES; i++) {
      const dot = document.createElement('button');
      dot.className = 'dot-nav-item' + (i === 0 ? ' active' : '');
      dot.dataset.index = i;
      dot.setAttribute('aria-label', titles[i] || `第${i + 1}页`);
      dot.setAttribute('type', 'button');

      const tooltip = document.createElement('span');
      tooltip.className = 'tooltip';
      tooltip.textContent = titles[i] || `第${i + 1}页`;
      tooltip.setAttribute('aria-hidden', 'true');
      dot.appendChild(tooltip);

      dot.addEventListener('click', () => goToSlide(i));
      nav.appendChild(dot);
    }

    document.body.appendChild(nav);
  }

  /* ---- 初始化翻页按钮 ---- */
  function initPageButtons() {
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn prev';
    prevBtn.innerHTML = '‹';
    prevBtn.setAttribute('aria-label', '上一页');
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToSlide(currentSlide - 1);
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn next';
    nextBtn.innerHTML = '›';
    nextBtn.setAttribute('aria-label', '下一页');
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToSlide(currentSlide + 1);
    });

    document.body.appendChild(prevBtn);
    document.body.appendChild(nextBtn);
  }

  /* ---- 全屏按钮 ---- */
  function initFullscreenButton() {
    const btn = document.createElement('button');
    btn.className = 'fullscreen-btn';
    btn.setAttribute('aria-label', '全屏展示');
    btn.setAttribute('title', '全屏展示 (F)');
    updateFullscreenIcon(btn);

    btn.addEventListener('click', () => toggleFullscreen());
    document.body.appendChild(btn);

    document.addEventListener('fullscreenchange', () => updateFullscreenIcon(btn));
  }

  function updateFullscreenIcon(btn) {
    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    btn.innerHTML = isFullscreen
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
  }

  function toggleFullscreen() {
    const doc = document;
    const el = doc.documentElement;
    const isFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

    if (!isFullscreen) {
      const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (req) req.call(el);
    } else {
      const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
      if (exit) exit.call(doc);
    }
  }

  /* ---- 滚动到指定 slide ---- */
  function goToSlide(index) {
    if (index < 0 || index >= TOTAL_SLIDES) return;

    // 切换页面时关闭浮层面板与粒子动画
    stopParticleAnimation();
    closeAllPanels();

    // 标记主动导航中，Observer 暂停更新 currentSlide
    isNavigating = true;
    if (navTimer) clearTimeout(navTimer);

    currentSlide = index;
    updateActiveState();
    slides[index].scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 平滑滚动约 500-800ms，期间 Observer 不更新 currentSlide
    // 滚动结束后，再允许 Observer 接管
    navTimer = setTimeout(() => {
      isNavigating = false;
      navTimer = null;
      // 最终同步：以当前最可见的 slide 为准
      syncCurrentFromVisibility();
    }, 900);
  }

  /* ---- IntersectionObserver：只负责添加/移除 active 类触发动画 ---- */
  function initObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        } else {
          entry.target.classList.remove('active');
        }
      });

      // 只有在非主动导航期间，才用 Observer 更新 currentSlide
      if (!isNavigating) {
        syncCurrentFromVisibility();
      }
    }, {
      root: container,
      threshold: 0.5
    });

    slides.forEach(slide => observer.observe(slide));
  }

  /* ---- 根据当前可见度最高的 slide 同步 currentSlide ---- */
  function syncCurrentFromVisibility() {
    let bestIdx = -1;
    let bestRatio = 0;

    slides.forEach((slide, i) => {
      const rect = slide.getBoundingClientRect();
      const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      const ratio = Math.max(0, visibleHeight / rect.height);
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestIdx = i;
      }
    });

    if (bestIdx !== -1 && bestIdx !== currentSlide) {
      currentSlide = bestIdx;
      updateActiveState();
      // 鼠标滚轮切换页面时，同样关闭浮层与动画
      stopParticleAnimation();
      closeAllPanels();
    }
  }

  /* ---- 更新导航状态 ---- */
  function updateActiveState() {
    // 圆点
    document.querySelectorAll('.dot-nav-item').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });

    // 翻页按钮
    const prevBtn = document.querySelector('.page-btn.prev');
    const nextBtn = document.querySelector('.page-btn.next');
    if (prevBtn) prevBtn.classList.toggle('hidden', currentSlide === 0);
    if (nextBtn) nextBtn.classList.toggle('hidden', currentSlide === TOTAL_SLIDES - 1);

    // 页码
    document.querySelectorAll('.slide-footer .page-num').forEach((el, i) => {
      el.textContent = `${i + 1} / ${TOTAL_SLIDES}`;
    });
  }

  /* ---- 键盘导航 ---- */
  function onKeyDown(e) {
    switch (e.key) {
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault();
        goToSlide(currentSlide + 1);
        break;
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        goToSlide(currentSlide - 1);
        break;
      case 'Home':
        e.preventDefault();
        goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        goToSlide(TOTAL_SLIDES - 1);
        break;
      case 'Escape':
        stopParticleAnimation();
        closeAllPanels();
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;
    }
  }

  /* ---- 粒子动画系统（P5页面内嵌） ---- */
  let p5Canvas = null;
  let p5AnimId = null;
  let p5FlowType = null;
  let p5Particles = [];
  let p5Nodes = [];
  let p5Clicked = [];

  function initParticleCards() {
    const wrapper = document.getElementById('particleCanvasWrapper');
    const canvas = document.getElementById('p5ParticleCanvas');
    const stopBtn = document.getElementById('stopParticleBtn');
    if (!wrapper || !canvas) return;

    // 点击卡片启动动画
    document.querySelectorAll('.particle-card[data-flow]').forEach(card => {
      card.addEventListener('click', () => {
        const flowType = card.dataset.flow;
        if (p5FlowType === flowType && p5AnimId) {
          // 正在播放同类型，停止
          stopParticleAnimation();
          return;
        }
        startPageParticleAnimation(flowType);
      });
    });

    // 停止按钮
    stopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stopParticleAnimation();
    });

    // 点击画布中的粒子改变形态
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      checkParticleClick(x, y);
    });

    // 窗口大小变化时调整
    window.addEventListener('resize', () => {
      if (p5AnimId) resizeP5Canvas();
    });
  }

  function resizeP5Canvas() {
    const canvas = document.getElementById('p5ParticleCanvas');
    const wrapper = document.getElementById('particleCanvasWrapper');
    if (!canvas || !wrapper) return;
    const w = wrapper.offsetWidth;
    canvas.width = w;
    canvas.height = 240;
  }

  function startPageParticleAnimation(flowType) {
    const wrapper = document.getElementById('particleCanvasWrapper');
    const canvas = document.getElementById('p5ParticleCanvas');
    const hint = document.getElementById('canvasHint');
    if (!wrapper || !canvas) return;

    // 展开画布区域
    wrapper.style.height = '280px';

    // 设置画布尺寸
    resizeP5Canvas();
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    p5FlowType = flowType;
    p5Clicked = [];

    // 定义节点
    if (flowType === 'info') {
      p5Nodes = [
        { label: '抓取', sub: '论文库、官网、社交媒体', x: W * 0.15, y: H * 0.5, color: '30, 50, 100', r: 30 },
        { label: '清洗', sub: '去重、格式化、去噪', x: W * 0.38, y: H * 0.5, color: '30, 50, 100', r: 28 },
        { label: '归类', sub: '按维度整理', x: W * 0.62, y: H * 0.5, color: '30, 50, 100', r: 26 },
        { label: '连接', sub: '形成关联网络', x: W * 0.85, y: H * 0.5, color: '30, 50, 100', r: 28 },
      ];
      hint.textContent = '信息层面：抓取 → 清洗 → 归类 → 连接（点击粒子改变形态）';
    } else {
      p5Nodes = [
        { label: '评分规则', sub: '六维质量评分', x: W * 0.2, y: H * 0.5, color: '180, 140, 80', r: 30 },
        { label: '比较基准', sub: '学科基准线引擎', x: W * 0.5, y: H * 0.5, color: '180, 140, 80', r: 30 },
        { label: '模式识别', sub: '异常检测与置信度', x: W * 0.8, y: H * 0.5, color: '180, 140, 80', r: 30 },
      ];
      hint.textContent = '认知层面：评分规则 → 比较基准 → 模式识别（点击粒子改变形态）';
    }

    p5Particles = [];

    // 停止之前的动画
    if (p5AnimId) cancelAnimationFrame(p5AnimId);

    let frame = 0;

    function animate() {
      if (!p5AnimId) return;
      ctx.clearRect(0, 0, W, H);
      frame++;

      // 绘制连线
      for (let i = 0; i < p5Nodes.length - 1; i++) {
        const a = p5Nodes[i];
        const b = p5Nodes[i + 1];
        ctx.beginPath();
        ctx.moveTo(a.x + a.r, a.y);
        ctx.lineTo(b.x - b.r, b.y);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.stroke();

        // 箭头
        const midX = (a.x + a.r + b.x - b.r) / 2;
        const midY = a.y;
        ctx.beginPath();
        ctx.moveTo(midX, midY - 5);
        ctx.lineTo(midX - 4, midY - 12);
        ctx.lineTo(midX + 4, midY - 12);
        ctx.closePath();
        ctx.fillStyle = 'rgba(200, 200, 200, 0.6)';
        ctx.fill();
      }

      // 生成新粒子
      if (frame % 40 === 0 && p5Particles.length < 25) {
        for (let i = 0; i < p5Nodes.length - 1; i++) {
          if (Math.random() > 0.5) continue;
          const from = p5Nodes[i];
          const to = p5Nodes[i + 1];
          p5Particles.push({
            x: from.x + from.r + (Math.random() - 0.5) * 10,
            y: from.y + (Math.random() - 0.5) * 20,
            targetX: to.x - to.r,
            targetY: to.y,
            progress: 0,
            speed: 0.005 + Math.random() * 0.004,
            r: 5 + Math.random() * 4,
            color: from.color,
            clicked: false,
            morphPhase: 0,
            nodeIdx: i,
            id: Date.now() + Math.random()
          });
        }
      }

      // 更新和绘制粒子
      p5Particles = p5Particles.filter(p => {
        p.progress += p.speed;
        if (p.progress >= 1) {
          const nextIdx = p.nodeIdx + 1;
          if (nextIdx < p5Nodes.length - 1) {
            p.nodeIdx = nextIdx;
            p.progress = 0;
            p.x = p5Nodes[nextIdx].x + p5Nodes[nextIdx].r;
            p.y = p5Nodes[nextIdx].y + (Math.random() - 0.5) * 20;
            p.targetX = p5Nodes[nextIdx + 1].x - p5Nodes[nextIdx + 1].r;
            p.targetY = p5Nodes[nextIdx + 1].y;
            p.color = p5Nodes[nextIdx].color;
          } else if (nextIdx === p5Nodes.length - 1) {
            // 到达最后一个节点，消散
            p.dissolve = true;
          } else {
            return false;
          }
        }

        // 计算位置
        const from = p5Nodes[p.nodeIdx];
        const to = p5Nodes[p.nodeIdx + 1] || from;
        const dx = to.x - to.r - (from.x + from.r);
        const dy = to.y - from.y;
        let curX, curY;

        if (p.dissolve) {
          curX = p.x + (Math.random() - 0.5) * 3;
          curY = p.y + (Math.random() - 0.5) * 3;
          p.r *= 0.96;
          if (p.r < 0.5) return false;
        } else {
          curX = from.x + from.r + dx * p.progress;
          curY = from.y + dy * p.progress + Math.sin(p.progress * Math.PI * 3) * 12;
        }

        p.x = curX;
        p.y = curY;

        // 绘制粒子
        if (p.clicked) {
          // 被点击后的形态：方形，闪烁
          p.morphPhase += 0.1;
          const size = p.r * (1 + Math.sin(p.morphPhase) * 0.3);
          const alpha = 0.6 + Math.sin(p.morphPhase * 2) * 0.4;
          ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
          ctx.fillRect(curX - size, curY - size, size * 2, size * 2);
          // 外圈
          ctx.strokeStyle = `rgba(${p.color}, 0.5)`;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(curX - size - 3, curY - size - 3, size * 2 + 6, size * 2 + 6);
        } else {
          // 正常形态：圆形，无光晕
          ctx.beginPath();
          ctx.arc(curX, curY, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${p.color})`;
          ctx.fill();
        }

        return true;
      });

      // 绘制节点
      p5Nodes.forEach((n, i) => {
        // 节点圆（无光晕）
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = `rgb(${n.color})`;
        ctx.stroke();

        // 标签
        ctx.font = 'bold 14px "SimHei", "Heiti SC", "PingFang SC", sans-serif';
        ctx.fillStyle = `rgb(${n.color})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.label, n.x, n.y);

        // 子标签
        ctx.font = '11px "SimSun", "Songti SC", serif';
        ctx.fillStyle = 'rgb(150, 150, 150)';
        ctx.fillText(n.sub, n.x, n.y + n.r + 14);
      });

      p5AnimId = requestAnimationFrame(animate);
    }

    p5AnimId = requestAnimationFrame(animate);
  }

  function stopParticleAnimation() {
    if (p5AnimId) {
      cancelAnimationFrame(p5AnimId);
      p5AnimId = null;
    }
    p5FlowType = null;
    p5Particles = [];
    p5Nodes = [];

    const wrapper = document.getElementById('particleCanvasWrapper');
    const canvas = document.getElementById('p5ParticleCanvas');
    if (wrapper) wrapper.style.height = '0';
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function checkParticleClick(mx, my) {
    // 检查点击是否命中粒子
    let hit = false;
    p5Particles.forEach(p => {
      const dx = mx - p.x;
      const dy = my - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < p.r + 8) {
        p.clicked = true;
        p.morphPhase = 0;
        hit = true;
      }
    });

    // 如果没有命中粒子，检查是否命中节点
    if (!hit) {
      p5Nodes.forEach(n => {
        const dx = mx - n.x;
        const dy = my - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < n.r) {
          // 节点被点击，生成一圈粒子
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            p5Particles.push({
              x: n.x + Math.cos(angle) * n.r,
              y: n.y + Math.sin(angle) * n.r,
              targetX: n.x + Math.cos(angle) * (n.r + 40),
              targetY: n.y + Math.sin(angle) * (n.r + 40),
              progress: 0,
              speed: 0.02,
              r: 4 + Math.random() * 3,
              color: n.color,
              clicked: false,
              morphPhase: 0,
              nodeIdx: -1,
              id: Date.now() + Math.random()
            });
          }
        }
      });
    }
  }

  /* ---- 理论面板系统 ---- */
  let activePanel = null;
  let activeOverlay = null;

  function initTheoryPanels() {
    const overlay = document.createElement('div');
    overlay.className = 'theory-panel-overlay';
    overlay.addEventListener('click', () => {
      if (overlay.classList.contains('open')) closeAllPanels();
    });
    document.body.appendChild(overlay);
    activeOverlay = overlay;

    document.querySelectorAll('.theory-card[data-theory]').forEach(card => {
      card.addEventListener('click', () => openTheoryPanel(card.dataset.theory));
    });
  }

  function openTheoryPanel(theoryId) {
    closeAllPanels();

    const data = THEORY_DATA[theoryId];
    if (!data) return;

    const panel = document.createElement('div');
    panel.className = 'theory-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'theory-panel-title');
    panel.innerHTML = `
      <button class="panel-close" aria-label="关闭">×</button>
      <div class="panel-title" id="theory-panel-title">${data.title}</div>
      <div class="panel-source">${data.source}</div>
      <div class="panel-body">${data.body}</div>
    `;

    panel.querySelector('.panel-close').addEventListener('click', closeAllPanels);
    document.body.appendChild(panel);
    activePanel = panel;

    panel.classList.add('open');
    activeOverlay.classList.add('open');
  }

  function closeAllPanels() {
    if (activePanel) {
      activePanel.classList.remove('open');
      setTimeout(() => {
        if (activePanel && activePanel.parentNode) {
          activePanel.parentNode.removeChild(activePanel);
        }
        activePanel = null;
      }, 400);
    }
    if (activeOverlay) {
      activeOverlay.classList.remove('open');
    }
  }

  /* ---- 理论数据 ---- */
  const THEORY_DATA = {
    akerlof: {
      title: 'Akerlof (1970) 柠檬市场',
      source: 'Akerlof, G. A. (1970). The Market for "Lemons": Quality Uncertainty and the Market Mechanism. The Quarterly Journal of Economics, 84(3), 488-500.',
      body: '核心命题：在信息不对称的市场中，买方无法分辨商品质量时，低质量商品（柠檬）会驱逐高质量商品，导致市场失灵。在导师选择场景中，学生作为信息劣势方，只能基于粗糙信号作出高风险决策。'
    },
    spence: {
      title: 'Spence (1973) 信号传递',
      source: 'Spence, M. (1973). Job Market Signaling. The Quarterly Journal of Economics, 87(3), 355-374.',
      body: '核心命题：信息优势方通过发送可观察且难以伪造的信号（如教育文凭），帮助劣势方识别质量差异。传统上导师通过职称、论文、机构声誉释放信号，但算法化信息聚合器改变了这一结构——信号由第三方系统逆向建构。'
    },
    gillespie: {
      title: 'Gillespie (2014) 信息中介',
      source: 'Gillespie, T. (2014). The Relevance of Algorithms. In Media Technologies: Essays on Communication, Materiality, and Society. MIT Press.',
      body: '核心命题：算法不仅是技术工具，更是一种信息中介（mediator）。它不只传递信息，而是通过排序、筛选和呈现重塑信息的可见性与社会意义。当算法把导师的论文、评价、合著网络放入同一框架时，它改变的不是信息本身，而是信息之间的关系。'
    },
    solove: {
      title: 'Solove (2006) 聚合侵害',
      source: 'Solove, D. J. (2006). A Taxonomy of Privacy. University of Pennsylvania Law Review, 154(3), 477-564.',
      body: '核心命题：即使单一数据是公开的，当它们被系统性连接后，也会产生超出原始披露预期的全新信息，构成独立的隐私侵害类型。对学者而言，发表记录可被讨论，但当署名模式、合作网络、学生评价和风险提示被放在同一份报告中时，这些原本分散的信息就会获得新的解释力。'
    },
    nissenbaum: {
      title: 'Nissenbaum (2010) 语境完整性',
      source: 'Nissenbaum, H. (2010). Privacy in Context: Technology, Policy, and the Integrity of Social Life. Stanford University Press.',
      body: '核心命题：信息的流通具有语境完整性（contextual integrity），信息使用是否正当，取决于是否偏离原始采集时的语境、角色与规则。一个学者的论文、职称和公开评价原本分布在不同语境中；当系统将其重组为一份风险画像时，数据主体未必能够控制这些信息被如何连接、如何命名。'
    },
    lustig: {
      title: 'Lustig & Nardi (2015) 算法权威',
      source: 'Lustig, C., & Nardi, B. (2015). Algorithmic Authority: The Case of Bitcoin. Proceedings of the 18th ACM Conference on Computer Supported Cooperative Work & Social Computing.',
      body: '核心命题：算法权威不是人们无条件信任算法，而是当复杂判断被转译为技术输出——比如分数、风险标签——时，这些输出更容易被感知为客观、中立、可信赖的。当学术质量被转换为分数和等级时，算法权威的生成条件就已经具备了。'
    },
    beer: {
      title: 'Beer (2016) 算法的社会权力',
      source: 'Beer, D. (2016). Metric Power. Palgrave Macmillan.',
      body: '核心命题：算法通过技术化的表达形式——分数、图谱、标签——提高了特定信息的可见性和可信度。"高风险""署名异常"等说法并不只是描述事实，它们会改变他人理解被评价者的方式。相比普通评论，算法标签常常和分数、报告结构一起出现，形式上更像系统结论，因此更容易被接受为客观判断。'
    }
  };

  /* ---- 初始化 ---- */
  function init() {
    initDotNav();
    initPageButtons();
    initFullscreenButton();
    initObserver();
    initTheoryPanels();
    initParticleCards();
    updateActiveState();
    document.addEventListener('keydown', onKeyDown);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
