/* Theater's peripheral instruments. No content is gated by animation. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer: fine)');
  const allowed = () => document.body.dataset.effects !== 'off' && (!reduced.matches || document.body.dataset.motion === 'full');
  const player = document.querySelector('#archive-music');
  const settings = document.querySelector('#music-settings');
  const options = document.querySelector('#music-options');
  const volume = document.querySelector('#music-volume');
  const summary = document.querySelector('#music-volume-summary');
  const narrow = matchMedia('(max-width: 900px)');
  let expanded = false;
  function syncPlayer() {
    if (!player || !settings || !options) return;
    const visible = !narrow.matches || expanded;
    const focusInOptions = options.contains(document.activeElement);
    const focusOnSettings = document.activeElement === settings;
    // Reveal the destination before transferring focus across a breakpoint.
    if (narrow.matches) settings.hidden = false;
    options.hidden = !visible;
    if (!visible && focusInOptions) settings.focus({ preventScroll: true });
    if (!narrow.matches) {
      if (focusOnSettings) document.querySelector('#music-toggle')?.focus({ preventScroll: true });
      settings.hidden = true;
    }
    settings.setAttribute('aria-expanded', String(visible));
    player.dataset.expanded = String(visible);
  }
  function syncVolumeSummary() {
    if (!volume || !summary || !settings) return;
    const value = Math.max(0, Math.min(100, Number(volume.value) || 0));
    summary.textContent = value === 0 ? '静音' : `${value}%`;
    settings.setAttribute('aria-label', `音量设置，当前${value === 0 ? '静音' : value + '%'}`);
  }
  settings?.addEventListener('click', () => { expanded = !expanded; syncPlayer(); });
  player?.addEventListener('keydown', event => {
    if (event.key === 'Escape' && narrow.matches && expanded) {
      event.preventDefault(); event.stopPropagation(); expanded = false; syncPlayer(); settings.focus({ preventScroll: true });
    }
  });
  volume?.addEventListener('input', syncVolumeSummary);
  addEventListener('pageshow', () => setTimeout(syncVolumeSummary, 0));
  addEventListener('popstate', syncVolumeSummary);
  document.querySelector('#music-toggle')?.addEventListener('click', syncVolumeSummary);
  narrow.addEventListener('change', syncPlayer);
  syncPlayer(); syncVolumeSummary();
  const sections = [...document.querySelectorAll('.works-stage,.journal-stage,.profile-stage')];
  let frame = 0;
  const update = () => {
    frame = 0;
    const range = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty('--reading-progress', String(range > 0 ? Math.max(0, Math.min(1, scrollY / range)) : 0));
  };
  const request = () => { if (!document.hidden && !frame) frame = requestAnimationFrame(update); };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request, { passive: true });
  addEventListener('pageshow', request);
  addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; });
  sections.forEach((section, index) => {
    const device = document.createElement('div');
    device.className = 'chapter-instrument'; device.setAttribute('aria-hidden', 'true');
    device.innerHTML = `<svg viewBox="0 0 240 240"><circle class="instrument-orbit" cx="120" cy="120" r="93"/><path class="instrument-axis" d="M120 8v32m0 160v32M8 120h32m160 0h32M120 48l72 72-72 72-72-72Z"/><path class="instrument-core" d="m120 78 42 42-42 42-42-42Z"/><circle cx="120" cy="120" r="5"/></svg><span>0${index + 1} / THEATER</span>`;
    section.append(device);
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => target.classList.toggle('instrument-active', isIntersecting)), { threshold: .05 });
    sections.forEach(section => observer.observe(section));
  }
  const targets = [...document.querySelectorAll('.hero-project-index a,.project-tabs a,.action-link,.journal-row')];
  targets.forEach(node => {
    let pointerFrame = 0, pointer = null;
    const reset = () => { cancelAnimationFrame(pointerFrame); pointerFrame = 0; pointer = null; node.classList.remove('pointer-lit'); };
    node.addEventListener('pointermove', event => {
      if (!allowed() || !fine.matches || event.pointerType === 'touch') return;
      pointer = { x: event.clientX, y: event.clientY };
      if (!pointerFrame) pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        if (!pointer) return;
        const box = node.getBoundingClientRect();
        node.style.setProperty('--focus-x', `${pointer.x - box.left}px`);
        node.style.setProperty('--focus-y', `${pointer.y - box.top}px`);
        node.classList.add('pointer-lit');
      });
    }, { passive: true });
    node.addEventListener('pointerleave', reset);
    document.addEventListener('theater-effects-change', reset);
    document.addEventListener('visibilitychange', reset);
    addEventListener('blur', reset);
  });
  const sync = () => document.documentElement.classList.toggle('experience-paused', document.hidden || !allowed());
  document.addEventListener('theater-effects-change', sync);
  document.addEventListener('visibilitychange', () => { sync(); if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else request(); });
  reduced.addEventListener('change', sync);
  sync(); request();
})();
