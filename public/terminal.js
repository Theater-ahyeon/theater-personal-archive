(() => {
  if (!document.body) return;
  const $ = (selector) => document.querySelector(selector);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer: fine)');
  const dialog = $('#command-dialog'), input = $('#command-input');
  const results = [...document.querySelectorAll('#command-results a[data-command]')];
  const empty = $('#command-empty'), effectsButton = $('#effects-toggle'), soundButton = $('#sound-toggle');
  const reticle = $('#cursor-reticle'), clock = $('#local-clock');
  const tilts = [...document.querySelectorAll('[data-tilt]')];
  const magnets = [...document.querySelectorAll('[data-magnetic]')];
  const storageKey = 'theater-effects';
  let preference = 'on', effects = false, frame = 0, timer = 0, pageActive = true;
  let activeTilt, activeMagnet, pointer, audio, sound = false, lastClick = 0, audioGeneration = 0;
  let visibleResults = results, selected = -1, backdropDown = false;
  try {
    const saved = localStorage.getItem(storageKey);
    preference = saved === 'off' || saved === 'full' ? saved : 'on';
  } catch { /* Storage is optional. */ }

  function markResult(index) {
    selected = index;
    results.forEach((link) => link.classList.toggle('is-active', link === visibleResults[index]));
  }
  function filterResults() {
    const query = (input?.value || '').trim().toLocaleLowerCase();
    results.forEach((link) => {
      link.hidden = !`${link.textContent} ${link.dataset.search || ''}`.toLocaleLowerCase().includes(query);
    });
    visibleResults = results.filter((link) => !link.hidden);
    if (empty) empty.hidden = visibleResults.length > 0;
    markResult(-1);
  }
  function openCommand() {
    if (!dialog || !input || dialog.open || dialog.closest('[inert]') || $('#intro:not([hidden])')) return;
    input.value = '';
    filterResults();
    dialog.showModal();
    input.focus({ preventScroll: true });
  }
  document.querySelectorAll('.command-trigger').forEach((button) => button.addEventListener('click', openCommand));
  $('#command-close')?.addEventListener('click', () => dialog?.close());
  input?.addEventListener('input', filterResults);
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openCommand();
    }
  });
  dialog?.addEventListener('keydown', (event) => {
    if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      dialog.close();
      return;
    }
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && visibleResults.length) {
      event.preventDefault();
      const current = visibleResults.indexOf(document.activeElement);
      const next = current < 0 ? (event.key === 'ArrowDown' ? 0 : visibleResults.length - 1)
        : (current + (event.key === 'ArrowDown' ? 1 : -1) + visibleResults.length) % visibleResults.length;
      markResult(next);
      visibleResults[next].focus({ preventScroll: true });
      visibleResults[next].scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' && event.target === input) {
      event.preventDefault();
      (visibleResults[selected] || visibleResults[0])?.click();
    }
  });
  const isBackdrop = (event) => {
    const rect = dialog.getBoundingClientRect();
    return event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
  };
  dialog?.addEventListener('pointerdown', (event) => { backdropDown = isBackdrop(event); });
  dialog?.addEventListener('click', (event) => { if (backdropDown && isBackdrop(event)) dialog.close(); backdropDown = false; });
  results.forEach((link) => {
    link.addEventListener('focus', () => markResult(visibleResults.indexOf(link)));
    link.addEventListener('click', () => dialog?.close());
  });

  function resetTilt(node) {
    node.style.setProperty('--tilt-x', '0deg');
    node.style.setProperty('--tilt-y', '0deg');
    node.style.setProperty('--pointer-x', '50%');
    node.style.setProperty('--pointer-y', '50%');
  }
  function resetMagnet(node) {
    node.style.setProperty('--magnet-x', '0px');
    node.style.setProperty('--magnet-y', '0px');
  }
  function clearPointer() {
    cancelAnimationFrame(frame); frame = 0;
    tilts.forEach(resetTilt); magnets.forEach(resetMagnet);
    activeTilt = activeMagnet = pointer = null;
    reticle?.classList.remove('is-visible', 'is-hover');
  }
  function syncEffects() {
    effects = preference === 'full' || (preference !== 'off' && !reduced.matches);
    document.body.dataset.motion = preference === 'full' ? 'full' : 'system';
    document.body.dataset.effects = effects ? 'on' : 'off';
    document.documentElement.dataset.effects = effects ? 'on' : 'off';
    if (effectsButton) {
      effectsButton.setAttribute('aria-pressed', String(effects));
      effectsButton.disabled = false;
      effectsButton.title = effects ? '关闭动态效果' : reduced.matches ? '开启完整动效，覆盖系统动态效果偏好' : '开启完整动效';
      const label = effectsButton.querySelector('.effects-label');
      if (label) label.textContent = effects ? '动效开启' : '开启完整动效';
    }
    if (!effects || !fine.matches) clearPointer();
    document.dispatchEvent(new CustomEvent('theater-effects-change', { detail: { enabled: effects } }));
  }
  function setEffectsPreference(value) {
    preference = value;
    try { localStorage.setItem(storageKey, preference); } catch { /* Preference still works for this page. */ }
    syncEffects();
  }
  effectsButton?.addEventListener('click', () => setEffectsPreference(effects ? 'off' : 'full'));
  $('#experience-intro')?.addEventListener('click', () => setEffectsPreference('full'));
  reduced.addEventListener('change', syncEffects);
  fine.addEventListener('change', syncEffects);
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey || event.key === null) {
      preference = event.newValue === 'off' || event.newValue === 'full' ? event.newValue : 'on';
      syncEffects();
    }
  });
  const canPoint = (event) => effects && fine.matches && pageActive && !document.hidden && event.pointerType !== 'touch';
  function paintPointer() {
    frame = 0;
    if (!pointer) return;
    const { x, y } = pointer;
    if (reticle) { reticle.style.transform = `translate3d(${x}px, ${y}px, 0)`; reticle.classList.add('is-visible'); }
    if (activeTilt) {
      const rect = activeTilt.getBoundingClientRect();
      const px = Math.max(0, Math.min(1, (x - rect.left) / Math.max(rect.width, 1)));
      const py = Math.max(0, Math.min(1, (y - rect.top) / Math.max(rect.height, 1)));
      activeTilt.style.setProperty('--tilt-x', `${(0.5 - py) * 7}deg`);
      activeTilt.style.setProperty('--tilt-y', `${(px - 0.5) * 9}deg`);
      activeTilt.style.setProperty('--pointer-x', `${px * 100}%`);
      activeTilt.style.setProperty('--pointer-y', `${py * 100}%`);
    }
    if (activeMagnet) {
      const rect = activeMagnet.getBoundingClientRect();
      activeMagnet.style.setProperty('--magnet-x', `${Math.max(-9, Math.min(9, (x - rect.left - rect.width / 2) * 0.12))}px`);
      activeMagnet.style.setProperty('--magnet-y', `${Math.max(-6, Math.min(6, (y - rect.top - rect.height / 2) * 0.15))}px`);
    }
  }
  tilts.forEach((node) => {
    node.addEventListener('pointermove', (event) => { if (canPoint(event)) activeTilt = node; });
    node.addEventListener('pointerleave', () => { resetTilt(node); if (activeTilt === node) activeTilt = null; });
  });
  magnets.forEach((node) => {
    node.addEventListener('pointermove', (event) => { if (canPoint(event)) activeMagnet = node; });
    node.addEventListener('pointerleave', () => { resetMagnet(node); if (activeMagnet === node) activeMagnet = null; });
  });
  document.addEventListener('pointermove', (event) => {
    if (!canPoint(event)) return;
    pointer = { x: event.clientX, y: event.clientY };
    reticle?.classList.toggle('is-hover', !!event.target.closest?.('a, button, input, [data-tilt]'));
    if (!frame) frame = requestAnimationFrame(paintPointer);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', clearPointer);
  window.addEventListener('blur', clearPointer);

  function syncSound() {
    soundButton?.setAttribute('aria-pressed', String(sound));
    const label = soundButton?.querySelector('.sound-label');
    if (label) label.textContent = sound ? '音效开启' : '音效关闭';
  }
  function closeAudio() {
    const previous = audio;
    audioGeneration++;
    audio = null; sound = false; syncSound();
    if (previous && previous.state !== 'closed') previous.close().catch(() => {});
  }
  soundButton?.addEventListener('click', async () => {
    if (sound) { closeAudio(); return; }
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    const generation = ++audioGeneration;
    try {
      const context = new Audio(); audio = context; sound = true; syncSound();
      await context.resume();
      if (generation !== audioGeneration && context.state !== 'closed') context.close().catch(() => {});
    } catch { if (generation === audioGeneration) closeAudio(); }
  });
  document.addEventListener('click', (event) => {
    const target = event.target.closest?.('a, button');
    if (!sound || !audio || audio.state !== 'running' || !target || target === soundButton || performance.now() - lastClick < 70) return;
    lastClick = performance.now();
    try {
      const oscillator = audio.createOscillator(), gain = audio.createGain(), now = audio.currentTime;
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(620, now);
      oscillator.frequency.exponentialRampToValueAtTime(230, now + 0.055);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.024, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);
      oscillator.connect(gain); gain.connect(audio.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(now); oscillator.stop(now + 0.07);
    } catch { closeAudio(); }
  });
  const timeFormat = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  function updateClock() {
    if (!clock) return;
    const now = new Date(); clock.textContent = timeFormat.format(now); clock.dateTime = now.toISOString();
  }
  function syncClock() {
    clearInterval(timer); timer = 0;
    updateClock();
    if (clock && pageActive && !document.hidden) timer = setInterval(updateClock, 1000);
  }
  document.addEventListener('visibilitychange', () => { syncClock(); if (document.hidden) { clearPointer(); closeAudio(); } });
  window.addEventListener('pagehide', () => { pageActive = false; clearPointer(); clearInterval(timer); timer = 0; closeAudio(); dialog?.close(); });
  window.addEventListener('pageshow', () => { pageActive = true; syncEffects(); syncClock(); });
  syncEffects(); syncSound(); syncClock();
})();
