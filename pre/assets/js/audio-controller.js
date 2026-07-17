(function () {
  'use strict';

  const AUDIO_SRC = './assets/audio/尕尔东,戈桑玛 - 在日落前拥抱.mp3';
  const STORAGE_KEY = 'fanfamily_audio_state';
  const UPDATE_INTERVAL = 500;

  let audio = null;
  let updateTimer = null;
  let hasUserInteracted = false;

  function getState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function setState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function createAudio() {
    if (audio) return audio;
    const existing = document.getElementById('fanfamily-audio');
    if (existing) {
      audio = existing;
      return audio;
    }
    audio = document.createElement('audio');
    audio.id = 'fanfamily-audio';
    audio.src = AUDIO_SRC;
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 1.0;
    audio.muted = false;
    audio.crossOrigin = 'anonymous';
    audio.style.display = 'none';
    document.body.appendChild(audio);

    audio.addEventListener('play', () => {
      syncToStorage();
      updateGlobalToggle(true);
    });
    audio.addEventListener('pause', () => {
      syncToStorage();
      updateGlobalToggle(false);
    });
    audio.addEventListener('timeupdate', () => {
      if (Math.floor(audio.currentTime) % 2 === 0) syncToStorage();
    });
    audio.addEventListener('ended', () => {
      setState({ playing: false, currentTime: 0, updatedAt: Date.now() });
      updateGlobalToggle(false);
    });
    audio.addEventListener('error', (e) => {
      console.error('FanFamily audio error:', e);
      updateGlobalToggle(false);
    });

    return audio;
  }

  function syncToStorage() {
    if (!audio) return;
    setState({
      playing: !audio.paused,
      currentTime: audio.currentTime,
      updatedAt: Date.now()
    });
  }

  function restoreFromStorage() {
    const state = getState();
    if (!state || !audio) return;
    const age = Date.now() - (state.updatedAt || 0);
    if (age > 60000) return;

    if (state.currentTime && !isNaN(state.currentTime)) {
      audio.currentTime = state.currentTime;
    }
    return state.playing;
  }

  function injectStyles() {
    if (document.getElementById('fanfamily-audio-styles')) {
      const existing = document.getElementById('fanfamily-audio-styles');
      if (!existing.parentNode) document.head.appendChild(existing);
      return;
    }
    const style = document.createElement('style');
    style.id = 'fanfamily-audio-styles';
    style.textContent = `
      .fanfamily-audio-toggle {
        position: fixed;
        top: 1.2rem;
        right: 1.2rem;
        z-index: 9999;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 1px solid rgba(139, 69, 19, 0.18);
        background: rgba(247, 243, 236, 0.9);
        backdrop-filter: blur(6px);
        color: #8b4513;
        font-size: 1.1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), background 0.25s, box-shadow 0.25s;
        box-shadow: 0 4px 16px rgba(44, 36, 27, 0.08);
        pointer-events: auto;
      }
      .fanfamily-audio-toggle:hover { transform: scale(1.08); background: rgba(255, 254, 248, 0.96); }
      .fanfamily-audio-toggle.playing { background: #8b4513; color: #fffef8; border-color: #8b4513; }
      .fanfamily-audio-toggle .wave {
        display: flex;
        align-items: center;
        gap: 2px;
        height: 16px;
      }
      .fanfamily-audio-toggle .wave span {
        width: 3px;
        background: currentColor;
        border-radius: 2px;
        animation: fan-wave 0.8s ease-in-out infinite;
      }
      .fanfamily-audio-toggle .wave span:nth-child(1) { animation-delay: 0s; height: 6px; }
      .fanfamily-audio-toggle .wave span:nth-child(2) { animation-delay: 0.15s; height: 12px; }
      .fanfamily-audio-toggle .wave span:nth-child(3) { animation-delay: 0.3s; height: 8px; }
      .fanfamily-audio-toggle .wave span:nth-child(4) { animation-delay: 0.45s; height: 10px; }
      @keyframes fan-wave {
        0%, 100% { transform: scaleY(0.6); }
        50% { transform: scaleY(1); }
      }
      .fanfamily-audio-toggle .wave.paused span { animation-play-state: paused; transform: scaleY(0.6); }
      @media (max-width: 768px) {
        .fanfamily-audio-toggle { top: 0.8rem; right: 0.8rem; width: 36px; height: 36px; font-size: 1rem; }
      }
    `;
    document.head.appendChild(style);
  }

  function createGlobalToggle() {
    if (document.getElementById('fanfamily-audio-toggle')) return;
    injectStyles();
    const btn = document.createElement('button');
    btn.id = 'fanfamily-audio-toggle';
    btn.className = 'fanfamily-audio-toggle';
    btn.innerHTML = '<div class="wave paused"><span></span><span></span><span></span><span></span></div>';
    btn.title = '音乐：尕尔东,戈桑玛 - 在日落前拥抱';
    btn.setAttribute('aria-label', '音乐开关');
    document.body.appendChild(btn);
    btn.addEventListener('click', toggleAudio);
  }

  function updateGlobalToggle(isPlaying) {
    const btn = document.getElementById('fanfamily-audio-toggle');
    if (!btn) return;
    btn.classList.toggle('playing', isPlaying);
    const wave = btn.querySelector('.wave');
    if (wave) wave.classList.toggle('paused', !isPlaying);
  }

  function createIntroButton() {
    if (document.getElementById('fanfamily-intro-play')) return;
    const existing = document.querySelector('.intro-music-btn, [data-audio-intro]');
    if (!existing) return;
    const btn = document.createElement('button');
    btn.id = 'fanfamily-intro-play';
    btn.className = 'fanfamily-intro-play';
    btn.innerHTML = '<span>♪</span> 播放音乐';
    existing.appendChild(btn);
    btn.addEventListener('click', () => {
      startAudio();
      btn.style.opacity = '0';
      btn.style.pointerEvents = 'none';
    });
  }

  function showAudioHint(text) {
    let el = document.getElementById('fanfamily-audio-hint');
    if (!el) {
      el = document.createElement('div');
      el.id = 'fanfamily-audio-hint';
      el.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);z-index:10000;background:rgba(44,36,27,0.85);color:#fffef8;padding:0.6rem 1.2rem;border-radius:999px;font-size:0.78rem;font-family:sans-serif;backdrop-filter:blur(6px);transition:opacity 0.4s;pointer-events:none;';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 3000);
  }

  function startAudio() {
    hasUserInteracted = true;
    createAudio();
    createGlobalToggle();
    restoreFromStorage();
    audio.muted = false;
    audio.volume = 1.0;
    return audio.play().then(() => {
      updateGlobalToggle(true);
      return true;
    }).catch((err) => {
      updateGlobalToggle(false);
      console.warn('FanFamily audio play blocked:', err);
      showAudioHint('请点击页面任意位置开启音乐');
      return false;
    });
  }

  function toggleAudio() {
    if (!audio) {
      startAudio();
      return;
    }
    hasUserInteracted = true;
    if (audio.paused) {
      audio.play().then(() => updateGlobalToggle(true)).catch(() => updateGlobalToggle(false));
    } else {
      audio.pause();
      updateGlobalToggle(false);
    }
  }

  function init() {
    createGlobalToggle();
    const existingAudio = document.getElementById('fanfamily-audio');
    if (existingAudio) {
      audio = existingAudio;
      updateGlobalToggle(!audio.paused);
      return;
    }
    const state = getState();
    if (state && state.playing && (Date.now() - (state.updatedAt || 0)) < 60000) {
      startAudio().then((ok) => {
        if (!ok && audio && audio.paused) {
          const resume = () => { startAudio(); document.removeEventListener('click', resume); };
          document.addEventListener('click', resume);
        }
      });
    }
    createIntroButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
