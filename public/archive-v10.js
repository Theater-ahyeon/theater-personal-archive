(() => {
  const intro = document.querySelector('#intro');
  const introCanvas = document.querySelector('#intro-canvas');
  const hero = document.querySelector('.hero');
  const heroCanvas = document.querySelector('#hero-field');
  const sculpture = document.querySelector('.hero-sculpture');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const allowed = () => document.body.dataset.effects !== 'off' && (!reduced.matches || document.body.dataset.motion === 'full');
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const phase = (time, start, end) => { const p = clamp((time - start) / (end - start)); return p * p * (3 - 2 * p); };
  const TAU = Math.PI * 2;
  let introFrame = 0, heroFrame = 0, introStart = 0, introOpen = false, manualIntro = null;
  let heroVisible = true, pageActive = true, introDraws = 0, heroDraws = 0, lastHeroPaint = 0;
  const introPhase = document.querySelector('#intro-phase');
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const animations = new Set();
  const relicImage = document.querySelector('.hero-relic') || new Image();
  if (!relicImage.src) {
    relicImage.decoding = 'async';
    relicImage.src = new URL('v10/relic.webp', document.currentScript?.src || new URL('assets/archive-v10.js', document.baseURI)).href;
  }
  let materialSurface = null;
  const makeLayer = canvas => canvas ? { canvas, ctx: canvas.getContext('2d'), width: 0, height: 0, dpr: 0 } : null;
  const opening = makeLayer(introCanvas);
  const front = makeLayer(heroCanvas);
  let rear = null;
  if (hero && front?.ctx) {
    const canvas = document.createElement('canvas');
    canvas.id = 'hero-field-rear'; canvas.className = 'hero-field-rear'; canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2';
    hero.prepend(canvas); rear = makeLayer(canvas);
    heroCanvas.style.pointerEvents = 'none';
  }
  document.body.classList.add('v10-motion-ready');

  function size(layer) {
    if (!layer?.ctx) return false;
    const rect = layer.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const dpr = Math.min(devicePixelRatio || 1, innerWidth <= 600 ? 1.5 : 2);
    if (layer.width !== rect.width || layer.height !== rect.height || layer.dpr !== dpr) {
      layer.width = rect.width; layer.height = rect.height; layer.dpr = dpr;
      layer.canvas.width = Math.round(rect.width * dpr); layer.canvas.height = Math.round(rect.height * dpr);
      layer.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    layer.ctx.clearRect(0, 0, rect.width, rect.height);
    return true;
  }

  function rotate([x, y, z], rx, ry, rz) {
    const yy = y * Math.cos(rx) - z * Math.sin(rx), zz = y * Math.sin(rx) + z * Math.cos(rx);
    const xx = x * Math.cos(ry) + zz * Math.sin(ry), depth = -x * Math.sin(ry) + zz * Math.cos(ry);
    return [xx * Math.cos(rz) - yy * Math.sin(rz), xx * Math.sin(rz) + yy * Math.cos(rz), depth];
  }
  function camera(x, y, scale, rx, ry, rz = 0) {
    const view = point => rotate(point, rx, ry, rz);
    const project = point => {
      const [px, py, z] = view(point), perspective = 4.8 / (4.8 - z);
      return [x + px * scale * perspective, y + py * scale * perspective, z];
    };
    project.view = view;
    return project;
  }
  function primitive(scene, points, color, width = 1, fill = null) {
    scene.push({ points, color, width, fill, depth: points.reduce((n, p) => n + p[2], 0) / points.length });
  }
  function paint(ctx, scene, alpha = 1, side = 0) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineJoin = 'miter';
    scene.sort((a, b) => a.depth - b.depth);
    for (const face of scene) {
      if ((side < 0 && face.depth >= 0) || (side > 0 && face.depth < 0)) continue;
      ctx.beginPath(); ctx.moveTo(face.points[0][0], face.points[0][1]);
      for (let i = 1; i < face.points.length; i++) ctx.lineTo(face.points[i][0], face.points[i][1]);
      if (face.fill) { ctx.closePath(); ctx.fillStyle = face.fill; ctx.fill(); }
      if (face.color && face.width) { ctx.strokeStyle = face.color; ctx.lineWidth = face.width; ctx.stroke(); }
    }
    ctx.restore();
  }
  function stroke(ctx, x, y, xx, yy, color, width = 1) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(xx, yy); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }

  function orbit(scene, project, radius, tilt, turn, reveal = 1, crimson = false) {
    const count = 72, limit = Math.floor(count * reveal);
    for (let i = 0; i < limit; i++) {
      const a = turn + i / count * TAU, b = turn + (i + 1) / count * TAU;
      const point = (angle, r) => project(rotate([Math.cos(angle) * r, Math.sin(angle) * r, 0], tilt, .12, -.28));
      const bright = i % 18 < 4;
      primitive(scene, [point(a, radius), point(b, radius)], crimson ? '#b32b40b8' : bright ? '#d3e6e8ba' : '#91a3b649', bright ? 1.15 : .65);
      if (i % 9 === 0) primitive(scene, [point(a, radius - .035), point(a, radius + .025)], '#a0b7c17a', .7);
      if (crimson && i > 7 && i < 27) primitive(scene, [point(a, radius), point(b, radius), point(b, radius + .025), point(a, radius + .025)], null, 0, i % 4 ? '#8d182cc2' : '#ce4a54bc');
    }
  }

  function diamond(scene, project, time, assemble) {
    const outer = [[0, -1.32], [.78, 0], [0, 1.32], [-.78, 0]];
    const inner = [[0, -1.03], [.57, 0], [0, 1.03], [-.57, 0]];
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4, p = phase(assemble, i * .1, .68 + i * .1);
      const cx = (outer[i][0] + outer[j][0]) / 2, cy = (outer[i][1] + outer[j][1]) / 2;
      const map = (point, z) => [point[0] + cx * (1 - p) * 2.4, point[1] + cy * (1 - p) * 1.2, z - (1 - p) * .7];
      const ridge = index => outer[index].map((value, axis) => value * .48 + inner[index][axis] * .52);
      const surfaces = [
        [map(outer[i], .06), map(outer[j], .06), map(ridge(j), .22), map(ridge(i), .22)],
        [map(ridge(i), .22), map(ridge(j), .22), map(inner[j], .07), map(inner[i], .07)],
        [map(outer[i], -.13), map(outer[j], -.13), map(outer[j], .06), map(outer[i], .06)],
        [map(inner[i], .07), map(inner[j], .07), map(inner[j], -.13), map(inner[i], -.13)]
      ];
      surfaces.forEach((points, side) => {
        const [a, b, c] = points.map(project.view), u = b.map((v, axis) => v - a[axis]), v = c.map((n, axis) => n - a[axis]);
        const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        const light = clamp((normal[0] * (-.45 + Math.sin(time * .4) * .1) - normal[1] * .6 + normal[2] * .65) / Math.max(.0001, Math.hypot(...normal)));
        const shade = Math.round((side > 1 ? 12 : 20) + light * 40 + Math.pow(light, 10) * 65);
        primitive(scene, points.map(project), side > 1 ? '#8396a258' : '#d1dbe5ad', side > 1 ? .65 : 1.05, `rgb(${shade},${shade + 5},${shade + 12})`);
      });
      const edge = [map(outer[i], .115), map(outer[j], .115)].map(project);
      if (i === 0 || i === 2) primitive(scene, edge, '#e1edf3d1', 1.6);
    }
  }

  function shards(scene, project, time, amount = 8) {
    for (let i = 0; i < amount; i++) {
      const angle = i * 2.399 + time * .024, radius = 1.55 + (i % 3) * .16;
      const center = [Math.cos(angle) * radius, Math.sin(angle) * radius * .83, Math.sin(i * 2.4 + time * .09) * .8];
      const size = .035 + (i % 4) * .015;
      const points = [[-size, -size * .7, 0], [size * .7, 0, size * .6], [0, size * 1.6, 0]].map(p => rotate(p, time * .08 + i, i * .9, i * .6)).map(p => p.map((v, axis) => v + center[axis])).map(project);
      primitive(scene, points, '#cfdae585', .55, i % 3 ? '#8394a252' : '#c7d2d387');
    }
  }

  function materialTexture() {
    if (materialSurface) return materialSurface;
    if (!relicImage.complete || !relicImage.naturalWidth) return null;
    const surface = document.createElement('canvas'), ratio = Math.min(1, 1024 / relicImage.naturalWidth);
    surface.width = Math.round(relicImage.naturalWidth * ratio); surface.height = Math.round(relicImage.naturalHeight * ratio);
    const c = surface.getContext('2d');
    if (!c) return null;
    c.drawImage(relicImage, 0, 0, surface.width, surface.height);
    // Cache the soft title opening once, so material never competes with the readable wordmark.
    c.globalCompositeOperation = 'destination-out';
    c.translate(surface.width * .5, surface.height * .53); c.scale(surface.width * .39, surface.height * .105);
    const opening = c.createRadialGradient(0, 0, 0, 0, 0, 1);
    opening.addColorStop(0, '#000'); opening.addColorStop(.58, '#000000f2'); opening.addColorStop(1, '#0000');
    c.fillStyle = opening; c.fillRect(-1, -1, 2, 2);
    materialSurface = surface;
    return surface;
  }

  const aperture = [...document.querySelectorAll('#intro .intro-aperture i')];
  const perimeter = [[50, 0], [100, 0], [100, 50], [100, 100], [50, 100], [0, 100], [0, 50], [0, 0]];
  aperture.forEach((pane, i) => {
    const a = perimeter[i % 8], b = perimeter[(i + 1) % 8];
    pane.style.cssText = `position:absolute;inset:0;pointer-events:none;clip-path:polygon(50% 50%,${a[0]}% ${a[1]}%,${b[0]}% ${b[1]}%);background:linear-gradient(${i * 45}deg,#070c14 32%,#202a38 99%,#c0cbd4);transform-origin:50% 50%;opacity:0`;
  });

  function drawIntro(time) {
    if (!size(opening)) return;
    introDraws++;
    const { ctx: c, width: w, height: h } = opening;
    if (introPhase) introPhase.textContent = time < 1.65 ? 'ASSEMBLE / 结构显影' : time < 2.88 ? 'RESONATE / 轨道共振' : 'ENTER / 档案展开';
    const assembly = phase(time, .35, 1.9), reveal = phase(time, 3.05, 4.28);
    const objectAlpha = phase(time, .12, .55) * (1 - phase(time, 2.88, 3.24));
    c.fillStyle = `rgba(3,7,14,${1 - phase(time, 3.05, 4.12)})`; c.fillRect(0, 0, w, h);
    const scale = Math.min(w * .29, h * .265), x = w / 2, y = h * .475;
    const halo = c.createRadialGradient(x, y, 0, x, y, scale * 1.75);
    halo.addColorStop(0, `rgba(47,68,99,${.24 * objectAlpha})`); halo.addColorStop(1, 'rgba(7,14,23,0)');
    c.fillStyle = halo; c.fillRect(x - scale * 1.75, y - scale * 1.75, scale * 3.5, scale * 3.5);
    c.save(); c.globalAlpha = objectAlpha;
    const lineLength = phase(time, 0, .65);
    stroke(c, x, y - 55, x, y - 55 - (h * .36 - 55) * lineLength, '#dbe8f6b5', 1);
    stroke(c, x, y + 62, x, y + 62 + (h * .37 - 62) * lineLength, '#bcd0e6a0', .8);
    stroke(c, x + 3, y + scale * 1.25, x + 3, y + scale * 1.63, '#b02741b0', 1.3);
    c.restore();
    const project = camera(x, y, scale, -.16 + Math.sin(time * .32) * .06, -.55 + assembly * .27, Math.sin(time * .21) * .035);
    const structure = [], orbital = [];
    diamond(structure, project, time, assembly);
    orbit(orbital, project, 1.40, .82, -.25 + time * .09, phase(time, .9, 2.35));
    orbit(orbital, project, 1.66, -.87, 1.2 - time * .065, phase(time, 1.35, 2.65));
    orbit(orbital, project, 1.23, .32, time * .09, phase(time, 1.65, 2.72), true);
    shards(orbital, project, time, innerWidth < 600 ? 5 : 8);
    const material = materialTexture(), materialReveal = material ? phase(time, 1.65, 2.45) : 0;
    paint(c, [...structure, ...orbital], objectAlpha * (1 - materialReveal));
    if (materialReveal > 0) {
      paint(c, orbital, objectAlpha * materialReveal, -1);
      const ratio = material.width / material.height;
      const height = Math.min(h * .86, w * .98 / ratio) * (1.035 - materialReveal * .035), width = height * ratio;
      c.save(); c.globalAlpha = objectAlpha * materialReveal * .95;
      c.drawImage(material, x - width / 2, y - height / 2, width, height); c.restore();
      paint(c, orbital, objectAlpha * materialReveal, 1);
    }
    intro.style.setProperty('--intro-progress', String(clamp(time / 4.15)));
    intro.style.setProperty('--intro-reveal', String(reveal));
    intro.style.setProperty('--intro-object-opacity', String(objectAlpha));
    const center = intro.querySelector('.intro-center');
    if (center) center.style.opacity = String(phase(time, .7, 1.25) * (1 - phase(time, 2.8, 3.12)));
    const percent = intro.querySelector('#intro-percent');
    if (percent) percent.textContent = String(Math.floor(clamp(time / 4.15) * 100)).padStart(2, '0');
    aperture.forEach((pane, i) => {
      const a = perimeter[i % 8], b = perimeter[(i + 1) % 8], dx = (a[0] + b[0]) / 2 - 50, dy = (a[1] + b[1]) / 2 - 50;
      const p = phase(time, 3.02 + (i % 2) * .07, 4.23 + (i % 2) * .05);
      pane.style.opacity = String(phase(time, 2.86, 3.035) * (1 - phase(time, 4.12, 4.32)));
      pane.style.transform = `perspective(1000px) translate3d(${dx / 50 * w * p}px,${dy / 50 * h * p}px,${p * 110}px) rotate3d(${dy / 50},${-dx / 50},0,${p * 18}deg)`;
    });
  }

  function resetPointer() {
    pointer.x = pointer.y = pointer.targetX = pointer.targetY = 0;
    hero?.style.setProperty('--hero-x', '0px'); hero?.style.setProperty('--hero-y', '0px');
  }
  function drawHero(time) {
    if (!size(front) || !size(rear)) return;
    heroDraws++;
    const bounds = hero.getBoundingClientRect(), relic = sculpture?.getBoundingClientRect();
    const x = relic?.width ? relic.left - bounds.left + relic.width / 2 : front.width * .7;
    const y = relic?.height ? relic.top - bounds.top + relic.height * .48 : front.height * .48;
    const scale = relic?.width ? Math.min(relic.width, relic.height || relic.width) * .34 : Math.min(front.width, front.height) * .25;
    const project = camera(x + pointer.x * .35, y + pointer.y * .35, scale, -.18 + pointer.y * .002, -.27 + pointer.x * .002, -.08);
    const scene = [];
    orbit(scene, project, 1.38, .81, time * .025, .87);
    orbit(scene, project, 1.62, -.78, .8 - time * .018, .73, true);
    shards(scene, project, time, innerWidth <= 600 ? 5 : 9);
    paint(rear.ctx, scene, .58, -1); paint(front.ctx, scene, .74, 1);
    const light = .5 + Math.sin(time * .22) * .16;
    hero.style.setProperty('--relic-light', light.toFixed(3));
    hero.style.setProperty('--hero-glint-x', `${46 + Math.sin(time * .17) * 9}%`);
  }

  function tickIntro(now) {
    introFrame = 0;
    if (!introOpen || !allowed() || !pageActive || document.hidden || manualIntro !== null) return;
    const elapsed = Math.min(4.4, (now - introStart) / 1000);
    drawIntro(elapsed);
    if (elapsed < 4.4) introFrame = requestAnimationFrame(tickIntro);
  }
  function tickHero(now) {
    heroFrame = 0;
    if (!allowed() || !heroVisible || introOpen || !pageActive || document.hidden) return;
    // Atmospheric geometry needs no more than 30fps; pointer easing is time-based.
    if (now - lastHeroPaint < 1000 / 30 - .5) { heroFrame = requestAnimationFrame(tickHero); return; }
    const delta = Math.min(100, now - lastHeroPaint || 1000 / 30); lastHeroPaint = now;
    const ease = 1 - Math.pow(.925, delta / (1000 / 60));
    pointer.x += (pointer.targetX - pointer.x) * ease; pointer.y += (pointer.targetY - pointer.y) * ease;
    hero.style.setProperty('--hero-x', `${pointer.x.toFixed(2)}px`); hero.style.setProperty('--hero-y', `${pointer.y.toFixed(2)}px`);
    drawHero(now / 1000);
    heroFrame = requestAnimationFrame(tickHero);
  }
  function stopAnimations() { for (const animation of animations) animation.cancel(); animations.clear(); }
  function sync() {
    cancelAnimationFrame(introFrame); cancelAnimationFrame(heroFrame); introFrame = heroFrame = 0;
    if (!pageActive || document.hidden) { stopAnimations(); resetPointer(); return; }
    if (!allowed()) {
      stopAnimations(); resetPointer(); drawHero(0);
      if (introOpen) drawIntro(4.4);
      return;
    }
    if (introOpen) {
      if (manualIntro === null) introFrame = requestAnimationFrame(tickIntro);
      else drawIntro(manualIntro);
    } else if (front?.ctx && heroVisible) heroFrame = requestAnimationFrame(tickHero);
  }
  function introChanged() {
    const next = !!intro && !intro.hidden;
    if (next && !introOpen) { introStart = performance.now(); manualIntro = null; stopAnimations(); resetPointer(); drawHero(0); }
    if (!next) manualIntro = null;
    introOpen = next; sync();
  }
  if (intro) new MutationObserver(introChanged).observe(intro, { attributes: true, attributeFilter: ['hidden'] });
  relicImage.addEventListener('load', () => {
    if (introOpen && allowed() && pageActive && !document.hidden && manualIntro !== null) drawIntro(manualIntro);
  }, { once: true });

  function animate(node, frames, options) {
    if (!node?.animate || !allowed() || document.hidden || !pageActive || introOpen) return;
    const animation = node.animate(frames, { duration: 650, easing: 'cubic-bezier(.22,.7,.2,1)', ...options });
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
  }
  const sections = [...document.querySelectorAll('.works-stage,.journal-stage,.profile-stage')];
  for (const section of sections) {
    const lines = document.createElement('span'); lines.className = 'v10-section-lines'; lines.setAttribute('aria-hidden', 'true');
    lines.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden';
    for (let i = 0; i < 2; i++) {
      const line = document.createElement('i');
      line.style.cssText = i ? 'position:absolute;right:0;top:0;width:1px;height:100%;background:currentColor;opacity:.12;transform-origin:top' : 'position:absolute;left:0;top:0;width:100%;height:1px;background:currentColor;opacity:.24;transform-origin:left';
      lines.append(line);
    }
    section.prepend(lines);
  }
  function revealSection(section) {
    const lines = section.querySelector('.v10-section-lines');
    animate(lines?.children[0], [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 730 });
    animate(lines?.children[1], [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 730, delay: 90 });
    if (section.matches('.works-stage')) animate(section.querySelector('.work-layout'), [{ clipPath: 'polygon(0 0,0 0,0 100%,0 100%)', opacity: .35 }, { clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)', opacity: 1 }], { duration: 760 });
    if (section.matches('.journal-stage')) [...section.querySelectorAll('.journal-row')].forEach((row, i) => animate(row, [{ clipPath: 'inset(0 100% 0 0)', transform: 'translateX(-12px)' }, { clipPath: 'inset(0 0 0 0)', transform: 'translateX(0)' }], { duration: 580, delay: i * 70 }));
    if (section.matches('.profile-stage')) animate(section.querySelector('.profile-dossier'), [{ clipPath: 'inset(0 0 100% 0)', transform: 'translateY(16px)', opacity: .3 }, { clipPath: 'inset(0)', transform: 'translateY(0)', opacity: 1 }], { duration: 720 });
  }
  if ('IntersectionObserver' in window) {
    const seen = new WeakSet();
    const observer = new IntersectionObserver(entries => {
      for (const { target, isIntersecting } of entries) if (isIntersecting && !seen.has(target)) { seen.add(target); revealSection(target); }
    }, { threshold: .08 });
    sections.forEach(section => observer.observe(section));
    if (hero) new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; sync(); }, { threshold: 0 }).observe(hero);
  }
  const panes = [...document.querySelectorAll('.project-pane')];
  const paneObserver = new MutationObserver(entries => {
    for (const { target } of entries) if (!target.hidden) animate(target, [{ clipPath: 'polygon(0 0,84% 0,72% 100%,0 100%)', opacity: .4 }, { clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)', opacity: 1 }], { duration: 420 });
  });
  panes.forEach(pane => paneObserver.observe(pane, { attributes: true, attributeFilter: ['hidden'] }));
  document.addEventListener('focusin', event => {
    for (const animation of animations) if (animation.effect?.target?.contains?.(event.target)) { animation.cancel(); animations.delete(animation); }
  });
  hero?.addEventListener('pointermove', event => {
    if (!allowed() || !finePointer.matches || event.pointerType === 'touch' || introOpen) return;
    const rect = hero.getBoundingClientRect();
    pointer.targetX = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1) * 12;
    pointer.targetY = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1) * 8;
  }, { passive: true });
  hero?.addEventListener('pointerleave', () => { pointer.targetX = pointer.targetY = 0; });
  addEventListener('resize', () => {
    if (pageActive && !document.hidden) {
      if (heroVisible) drawHero(allowed() ? performance.now() / 1000 : 0);
      if (introOpen) drawIntro(manualIntro ?? Math.min(4.4, (performance.now() - introStart) / 1000));
    }
    sync();
  });
  reduced.addEventListener('change', sync); finePointer.addEventListener('change', () => { resetPointer(); sync(); });
  document.addEventListener('theater-effects-change', sync);
  document.addEventListener('visibilitychange', sync);
  addEventListener('pagehide', () => { pageActive = false; sync(); });
  addEventListener('pageshow', () => { pageActive = true; sync(); });
  window.TheaterV10 = Object.freeze({
    seekIntro(seconds) {
      if (!introOpen || !allowed() || !Number.isFinite(seconds)) return false;
      manualIntro = clamp(seconds, 0, 4.4); cancelAnimationFrame(introFrame); introFrame = 0; drawIntro(manualIntro); return true;
    },
    getState: () => ({ motion: allowed(), introOpen, introRunning: !!introFrame, heroRunning: !!heroFrame, heroVisible, manualIntro, introDraws, heroDraws, heroDpr: front?.dpr || 0, introDpr: opening?.dpr || 0, introMaterialReady: !!materialSurface })
  });
  introChanged();
})();
