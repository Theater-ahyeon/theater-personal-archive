(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer: fine)');
  let frame = 0, pointer = null, visible = true;
  const enabled = () => visible && !document.hidden && (!reduced.matches || document.body.dataset.motion === 'full') && document.body.dataset.effects !== 'off';
  function render() {
    frame = 0;
    const rect = hero.getBoundingClientRect();
    const x = enabled() && pointer && fine.matches ? (pointer.x - rect.left - rect.width / 2) / rect.width * 20 : 0;
    const y = enabled() && pointer && fine.matches ? (pointer.y - rect.top - rect.height / 2) / rect.height * 16 : 0;
    hero.style.setProperty('--scene-x', `${x.toFixed(2)}px`);
    hero.style.setProperty('--scene-y', `${y.toFixed(2)}px`);
    hero.style.setProperty('--scene-scroll', `${enabled() ? Math.min(Math.max(-rect.top, 0), rect.height) * .065 : 0}px`);
    hero.classList.toggle('scene-paused', !enabled());
  }
  function queue() {
    if (document.hidden) { cancelAnimationFrame(frame); render(); }
    else if (!frame) frame = requestAnimationFrame(render);
  }
  hero.addEventListener('pointermove', event => { if (event.pointerType === 'mouse' && enabled()) { pointer = { x: event.clientX, y: event.clientY }; queue(); } });
  hero.addEventListener('pointerleave', () => { pointer = null; queue(); });
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; queue(); });
  observer.observe(hero);
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  document.addEventListener('visibilitychange', queue);
  document.addEventListener('theater-effects-change', queue);
  reduced.addEventListener('change', queue);
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; });
  window.addEventListener('pageshow', queue);
  render();
})();

// Chapter choreography observes the application's state; navigation stays in app.js.
(() => {
  const main = document.querySelector('#main');
  if (!main || !Element.prototype.animate || !window.IntersectionObserver) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const records = new Map();
  let pageActive = true, keyboard = false;
  const motionAllowed = () => document.body.dataset.effects !== 'off' &&
    (!reduced.matches || document.body.dataset.motion === 'full');
  const onScreen = node => {
    const rect = node.getBoundingClientRect();
    return !!node.getClientRects().length && !node.closest('[hidden], [inert]') &&
      rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
  };

  function record(node, kind) {
    const item = { node, kind, visible: false, seen: false, open: false, animations: new Set() };
    records.set(node, item);
    return item;
  }
  function settle(item) {
    for (const animation of [...item.animations]) animation.cancel();
    item.animations.clear();
  }
  function animate(item, node, frames, duration = 700, delay = 0) {
    if (!node) return;
    const animation = node.animate(frames, {
      duration, delay, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards'
    });
    item.animations.add(animation);
    const release = () => item.animations.delete(animation);
    animation.addEventListener('finish', release, { once: true });
    animation.addEventListener('cancel', release, { once: true });
  }
  function reveal(item, node, delay = 0, sliced = false) {
    if (!node || node.contains(document.activeElement)) return;
    const from = { opacity: 0, translate: `0 ${item.kind === 'prose' ? 5 : 16}px` };
    const to = { opacity: getComputedStyle(node).opacity, translate: '0 0' };
    if (sliced) {
      from.clipPath = 'polygon(0 0, 0 0, -14% 100%, 0 100%)';
      to.clipPath = 'polygon(0 0, 114% 0, 100% 100%, 0 100%)';
    }
    animate(item, node, [from, to], item.kind === 'prose' ? 420 : 640, delay);
  }
  function decoration(node, className, markup) {
    const layer = document.createElement('div');
    layer.className = className;
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = markup;
    node.append(layer);
    return layer;
  }
  const edges = '<i class="mv-edge mv-edge-top"></i><i class="mv-edge mv-edge-right"></i>' +
    '<i class="mv-edge mv-edge-bottom"></i><i class="mv-edge mv-edge-left"></i>';
  const tiles = '<i class="mv-tile"></i>'.repeat(6);
  function assemble(item, layer, delay = 0) {
    if (!layer) return;
    layer.querySelectorAll('.mv-edge').forEach((edge, index) => {
      animate(item, edge, [{ scale: index % 2 ? '1 0' : '0 1', opacity: 0 },
        { scale: '1 1', opacity: .85, offset: .75 }, { scale: '1 1', opacity: .32 }], 880, delay + index * 85);
    });
    layer.querySelectorAll('.mv-tile').forEach((tile, index) => {
      animate(item, tile, [
        { opacity: 0, translate: `${index % 2 ? 64 : -64}px ${index < 3 ? -55 : 55}px`, rotate: `${index % 2 ? 24 : -24}deg`, scale: .45 },
        { opacity: .55, translate: '0 0', rotate: '0deg', scale: 1, offset: .58 },
        { opacity: 0, translate: '0 0', rotate: '0deg', scale: 1 }
      ], 1050, delay + index * 48);
    });
  }
  function scan(item, container, delay = 0) {
    const beam = container?.querySelector(':scope > .mv-scan');
    if (!beam) return;
    animate(item, beam, [
      { opacity: 0, translate: '0 0' },
      { opacity: .8, translate: `0 ${container.clientHeight * .12}px`, offset: .12 },
      { opacity: .8, translate: `0 ${container.clientHeight * .88}px`, offset: .85 },
      { opacity: 0, translate: `0 ${container.clientHeight}px` }
    ], 1100, delay);
  }
  function geometry(item) {
    const ornament = item.node.querySelector(':scope > .mv-chapter-geometry');
    if (!ornament) return;
    ornament.querySelectorAll('.mv-rule').forEach((line, index) => {
      animate(item, line, [{ scale: index ? '1 0' : '0 1', opacity: 0 }, { scale: '1 1', opacity: .48 }], 1040, index * 85);
    });
    ornament.querySelectorAll('.mv-coordinate').forEach((mark, index) => {
      animate(item, mark, [{ opacity: 0, scale: 2.4, rotate: '-30deg' },
        { opacity: .6, scale: 1, rotate: '0deg', offset: .7 }, { opacity: .18, scale: 1, rotate: '0deg' }], 1200, index * 130);
    });
    ornament.querySelectorAll('.mv-link-map path').forEach((line, index) =>
      animate(item, line, [{ strokeDashoffset: 1, opacity: .1 }, { strokeDashoffset: 0, opacity: .55 }], 1500, index * 95));
    ornament.querySelectorAll('.mv-timeline i').forEach((line, index) =>
      animate(item, line, [{ scale: '0 1', opacity: 0 }, { scale: '1 1', opacity: .35 }], 600, index * 90));
    assemble(item, ornament);
    scan(item, ornament, 140);
  }
  function play(item) {
    if (item.seen || !item.visible || item.kind === 'nav' || item.node.closest('[inert]')) return;
    if (!pageActive || document.hidden) return;
    item.seen = true;
    item.node.dataset.mvEntered = 'true';
    const overlay = item.kind === 'search' || item.kind === 'drawer';
    if (!motionAllowed() || keyboard || (!overlay && item.node.contains(document.activeElement))) return;
    const node = item.node;
    if (item.kind === 'hero') {
      const instrument = node.querySelector('.hero-instrument');
      if (instrument) animate(item, instrument, [
        { opacity: 0, clipPath: 'polygon(50% 50%,50% 50%,50% 50%,50% 50%)', transform: 'scale(1.12) rotate(8deg)' },
        { opacity: .8, clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)', transform: 'scale(1) rotate(0)', offset: .65 },
        { opacity: 1, clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)', transform: 'none' }
      ], 1400, 80);
      node.querySelectorAll('.hero-kicker, #hero-title, .hero-subtitle, .hero-actions, .hero-study, .hero-summary > a, .hero-bottom')
        .forEach((part, index) => reveal(item, part, 130 + index * 95, part.matches('#hero-title')));
      node.querySelectorAll('.hero-halo i').forEach((part, index) => animate(item, part,
        [{ opacity: 0, scale: 1.18 }, { opacity: 1, scale: 1 }], 1000, index * 120));
    } else if (item.kind === 'chapter') {
      geometry(item);
      const headings = node.querySelectorAll(
        '.section-heading > div > *, .section-heading > p, .notes-heading > *, .profile-intro > *, ' +
        ':scope > .eyebrow, :scope > h1, :scope > h2, :scope > p, :scope > .post-meta, :scope > .quiet-link, :scope > .archive-count'
      );
      headings.forEach((heading, index) => reveal(item, heading, 80 + Math.min(index, 6) * 75, heading.matches('h1,h2,.notes-display')));
      node.querySelectorAll('.project-tabs a, .feed-topline, .feed-end, .stage-footer').forEach((part, index) => reveal(item, part, 180 + index * 85, part.matches('.project-tabs a')));
    } else if (item.kind === 'project') {
      assemble(item, node.querySelector(':scope > .mv-frame'));
      const preview = node.querySelector('.project-preview');
      if (preview) animate(item, preview, [
        { opacity: .35, clipPath: 'inset(0 0 100% 0)' },
        { opacity: 1, clipPath: 'inset(0 0 0 0)' }
      ], 1050, 100);
      scan(item, preview, 100);
      node.querySelectorAll('.project-caption .eyebrow, .project-caption h3, .project-caption p, .project-caption .action-link, .tags > span')
        .forEach((part, index) => reveal(item, part, 130 + Math.min(index, 7) * 48, part.matches('h3')));
    } else if (item.kind === 'journal') {
      assemble(item, node.querySelector(':scope > .mv-frame'));
      animate(item, node.querySelector('.mv-row-rule'), [{ scale: '0 1', opacity: 0 }, { scale: '1 1', opacity: .55 }], 800);
      const date = node.querySelector('.journal-date');
      if (date) animate(item, date, [{ clipPath: 'inset(0 0 100% 0)', translate: '0 -12px' },
        { clipPath: 'inset(0)', translate: '0 0' }], 760, 70);
      node.querySelectorAll('.post-meta, h3, .journal-copy > p, .journal-read')
        .forEach((part, index) => reveal(item, part, 160 + index * 90, part.matches('h3')));
    } else if (item.kind === 'dossier') {
      assemble(item, node.querySelector(':scope > .mv-frame'));
      scan(item, node.querySelector('.profile-image'), 160);
      node.querySelectorAll('.dossier-heading, .profile-image, dl > div, .dossier-caption')
        .forEach((part, index) => reveal(item, part, 150 + index * 95, part.matches('.profile-image')));
    } else if (overlay) {
      assemble(item, node.querySelector(':scope > .mv-frame'));
      if (item.kind === 'search') {
        node.querySelectorAll('.command-header, #command-results > a:not([hidden]), .command-hint')
          .forEach((part, index) => reveal(item, part, 60 + Math.min(index, 7) * 45, false));
      } else {
        node.querySelectorAll('.sidebar-rule, .operator-card, .nav-caption, .main-nav > a, .sidebar-index, .terminal-controls, .sidebar-clock')
          .forEach((part, index) => reveal(item, part, 70 + index * 48, part.matches('.main-nav > a')));
      }
    } else if (node.matches('h2,h3')) {
      scan(item, node);
      animate(item, node, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0)' }], 650);
    } else reveal(item, node);
  }
  function sync(item) {
    if (!motionAllowed()) {
      settle(item);
      if (item.visible) item.seen = true;
      return;
    }
    for (const animation of item.animations) {
      if (item.visible && pageActive && !document.hidden && !item.node.closest('[inert]')) animation.play();
      else animation.pause();
    }
    if (item.visible && pageActive && !document.hidden) play(item);
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const item = records.get(entry.target);
      if (!item) continue;
      item.visible = entry.isIntersecting && !item.node.closest('[hidden]') &&
        (item.kind !== 'search' && item.kind !== 'drawer' || item.open);
      sync(item);
    }
  }, { threshold: 0, rootMargin: '0px 0px -5% 0px' });

  const hero = main.querySelector('.hero');
  if (hero) record(hero, 'hero');
  main.querySelectorAll('section:not(.hero), .archive-header, .post-header').forEach(node => {
    node.classList.add('mv-chapter');
    const mode = node.id === 'projects' ? 'works' : node.id === 'journal' ? 'notes' : node.id === 'profile' ? 'profile' : 'archive';
    let markup = '<i class="mv-rule mv-rule-top"></i><i class="mv-rule mv-rule-side"></i>';
    if (mode === 'works') markup += tiles + '<i class="mv-coordinate"></i><i class="mv-coordinate mv-coordinate-second"></i>';
    if (mode === 'notes') markup += '<div class="mv-timeline">' + '<i></i>'.repeat(7) + '</div>';
    if (mode === 'profile') markup += '<svg class="mv-link-map" viewBox="0 0 1000 600" preserveAspectRatio="none">' +
      '<path pathLength="1" d="M20 130H380L460 210H640L710 140H980"/>' +
      '<path pathLength="1" d="M20 450H390L470 370H640L720 450H980"/>' +
      '<path pathLength="1" d="M510 50V160L580 230V380L520 440V550"/>' +
      '<circle cx="380" cy="130" r="5"/><circle cx="390" cy="450" r="5"/><circle cx="580" cy="230" r="5"/></svg>';
    if (mode === 'archive') markup += '<i class="mv-index-grid"></i><i class="mv-scan"></i>';
    const ornament = decoration(node, 'mv-chapter-geometry', markup);
    ornament.dataset.mode = mode;
    record(node, 'chapter');
  });
  main.querySelectorAll('.journal-row').forEach(node => {
    node.classList.add('mv-journal-row');
    decoration(node, 'mv-frame', edges);
    decoration(node, 'mv-row-rule', '');
    record(node, 'journal');
  });
  main.querySelectorAll('.profile-dossier').forEach(node => {
    decoration(node, 'mv-frame', edges + tiles);
    const portrait = node.querySelector('.profile-image');
    if (portrait) decoration(portrait, 'mv-scan', '');
    record(node, 'dossier');
  });
  main.querySelectorAll('.prose > *').forEach(node => {
    if (node.matches('h2,h3')) { node.classList.add('mv-prose-heading'); decoration(node, 'mv-scan', ''); }
    record(node, 'prose');
  });
  const panes = [...main.querySelectorAll('.project-pane')];
  for (const node of panes) {
    node.classList.add('mv-project-pane');
    decoration(node, 'mv-frame', edges + tiles);
    const preview = node.querySelector('.project-preview');
    if (preview) decoration(preview, 'mv-scan', '');
    record(node, 'project');
  }
  const projectObserver = new MutationObserver(changes => {
    for (const { target } of changes) {
      const item = records.get(target);
      if (!item || item.kind !== 'project') continue;
      settle(item);
      item.visible = !target.hidden && onScreen(target);
      item.seen = false;
      sync(item);
    }
  });

  const navLinks = [...document.querySelectorAll('.main-nav a, .section-rail a[data-section], .project-tabs a')];
  const navState = new WeakMap();
  for (const link of navLinks) {
    link.classList.add('mv-nav-link');
    const trace = document.createElement('span');
    trace.className = 'mv-nav-trace';
    trace.setAttribute('aria-hidden', 'true');
    trace.innerHTML = '<i></i><i></i><i></i>';
    link.append(trace);
    navState.set(link, link.hasAttribute('aria-current'));
    record(link, 'nav');
  }
  const navObserver = new MutationObserver(changes => {
    for (const { target: link } of changes) {
      const current = link.hasAttribute('aria-current');
      if (navState.get(link) === current) continue;
      navState.set(link, current);
      const item = records.get(link);
      settle(item);
      if (!current || !motionAllowed() || keyboard || document.hidden || !pageActive || !onScreen(link)) continue;
      item.visible = true;
      link.querySelectorAll('.mv-nav-trace i').forEach((line, index) => animate(item, line, [
        { scale: '0 1', translate: `${index % 2 ? 12 : -12}px 0`, opacity: 0 },
        { scale: '1 1', translate: '0 0', opacity: 1 }
      ], 460, index * 55));
    }
  });
  const overlays = [...document.querySelectorAll('#command-dialog, #sidebar')];
  for (const node of overlays) {
    decoration(node, 'mv-frame mv-overlay-frame', edges + (node.id === 'command-dialog' ? tiles : ''));
    record(node, node.id === 'command-dialog' ? 'search' : 'drawer');
  }
  const overlayObserver = new MutationObserver(changes => {
    for (const { target } of changes) {
      const item = records.get(target);
      const open = item.kind === 'search' ? target.open : target.classList.contains('is-open') && !target.inert;
      if (item.open === open) continue;
      item.open = open;
      item.visible = open && onScreen(target);
      item.seen = false;
      settle(item);
      if (open) play(item);
    }
  });
  function connect() {
    records.forEach(item => observer.observe(item.node));
    panes.forEach(pane => projectObserver.observe(pane, { attributes: true, attributeFilter: ['hidden'] }));
    navLinks.forEach(link => navObserver.observe(link, { attributes: true, attributeFilter: ['aria-current'] }));
    overlays.forEach(node => overlayObserver.observe(node, { attributes: true, attributeFilter: ['open', 'class', 'inert'] }));
    if (shell) shellObserver.observe(shell, { attributes: true, attributeFilter: ['inert'] });
  }
  const syncAll = () => {
    document.body.classList.toggle('mv-page-paused', document.hidden || !pageActive);
    records.forEach(sync);
  };
  const shell = document.querySelector('#site-shell');
  const shellObserver = new MutationObserver(() => {
    if (!shell.inert && hero) records.get(hero).seen = false;
    syncAll();
  });
  document.addEventListener('keydown', event => {
    if (['Tab', 'Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) keyboard = true;
  }, true);
  document.addEventListener('pointerdown', () => { keyboard = false; }, { passive: true, capture: true });
  document.addEventListener('wheel', () => { keyboard = false; }, { passive: true });
  document.addEventListener('focusin', event => {
    records.forEach(item => {
      if (item.node.contains(event.target) &&
        (keyboard || item.kind !== 'search' && item.kind !== 'drawer')) { settle(item); item.seen = true; }
    });
  });
  document.addEventListener('visibilitychange', syncAll);
  document.addEventListener('theater-effects-change', syncAll);
  reduced.addEventListener('change', syncAll);
  window.addEventListener('pagehide', () => {
    pageActive = false;
    syncAll();
    observer.disconnect();
    projectObserver.disconnect();
    navObserver.disconnect();
    overlayObserver.disconnect();
    shellObserver.disconnect();
  });
  window.addEventListener('pageshow', () => { pageActive = true; connect(); syncAll(); });
  connect();
})();
