/*
 * Homepage choreography, built from the two native motion studies.
 * A: perspective archive planes, staggered card assembly and a settling camera.
 * B: segmented radial assembly, the native wire device and four folding faces.
 *
 * This is an enhancement of the real document. Navigation, project selection,
 * focus, scrolling and the intro's close button remain owned by app.js. Nothing
 * here hides content, intercepts a click, waits for an animation, or runs at idle.
 */
import { drawDepthField } from './motion-study/depth-field.js';
import { drawWireDevice } from './motion-study/wire-device.js';

(() => {
  if (document.body.dataset.page !== 'home') return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const motionAllowed = () => document.body.dataset.effects !== 'off'
    && (!reduced.matches || document.body.dataset.motion === 'full');
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const ease = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
  const phase = (value, start, end) => ease((value - start) / (end - start));
  const mix = (a, b, p) => a + (b - a) * p;
  const TAU = Math.PI * 2;
  const intro = document.querySelector('#intro');
  const introCanvas = document.querySelector('#intro-canvas');
  const hero = document.querySelector('.hero');
  const heroCanvas = document.querySelector('#hero-instrument');
  const projectStage = document.querySelector('.project-stage');
  const projects = [...document.querySelectorAll('.project-stage > .project-pane')];
  const sections = [...document.querySelectorAll('#about, #projects, #journal, #profile')];
  const jobs = new Map();
  const seenSections = new Set();
  const visibleSections = new Set();
  const canvasLayers = new Map();
  let frame = 0, pageActive = true, introOpen = false, manualIntro = null;
  let currentProject = projects.find(pane => !pane.hidden) || null;
  let heroDraws = 0, introDraws = 0, transitionDraws = 0;
  let renderFailures = 0;
  let lastReason = 'initial', lastPaint = -Infinity;
  let previousMotionAllowed = motionAllowed();
  let pointerPosition = null;
  const restoreHeroPointer = heroCanvas ? restoreStyles(heroCanvas, ['transform']) : () => {};

  const active = () => pageActive && !document.hidden && motionAllowed();
  const now = () => performance.now();
  const onScreen = node => {
    if (!node || node.hidden) return false;
    const r = node.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight
      && r.right > 0 && r.left < innerWidth;
  };

  function cancel(key, reason = 'interrupted') {
    const job = jobs.get(key);
    if (!job) return;
    jobs.delete(key);
    finishJob(job, false);
    lastReason = reason;
    if (!jobs.size && frame) { cancelAnimationFrame(frame); frame = 0; }
  }

  function finishJob(job, completed) {
    try { job.finish?.(completed); } catch { renderFailures++; }
  }

  function renderJob(key, job, p, elapsed) {
    let succeeded = false;
    try { succeeded = job.render(p, elapsed) !== false; } catch { renderFailures++; }
    if (succeeded) return true;
    cancel(key, 'render-failed');
    // Use the app's established close path, including its focus/inert cleanup,
    // rather than leaving an unsupported canvas intro in front of the page.
    if (key === 'intro' && introOpen && !intro?.hidden) document.querySelector('#skip-intro')?.click();
    return false;
  }

  function cancelAll(reason) {
    for (const key of [...jobs.keys()]) cancel(key, reason);
    cancelAnimationFrame(frame); frame = 0;
    lastReason = reason;
  }

  function tick(stamp) {
    frame = 0;
    if (!active()) { cancelAll('motion-suspended'); return; }
    // Native study geometry is deliberately capped at 30 fps. DOM and canvas
    // share one finite clock, so no hidden per-element animation loops survive.
    const paint = stamp - lastPaint >= 1000 / 30 - .5;
    if (paint) lastPaint = stamp;
    for (const [key, job] of [...jobs]) {
      if (jobs.get(key) !== job) continue;
      const elapsed = Math.max(0, stamp - job.start);
      const p = clamp(elapsed / job.duration);
      if ((paint || p === 1) && !renderJob(key, job, p, elapsed)) continue;
      if (p === 1 && jobs.get(key) === job) {
        jobs.delete(key); finishJob(job, true);
      }
    }
    if (jobs.size) frame = requestAnimationFrame(tick);
  }

  function run(key, duration, render, finish) {
    cancel(key, 'superseded');
    if (!active()) { finishJob({ finish }, false); return false; }
    const job = { start: now(), duration, render, finish };
    jobs.set(key, job);
    if (!renderJob(key, job, 0, 0)) return false;
    if (jobs.size && !frame) frame = requestAnimationFrame(tick);
    return jobs.has(key);
  }

  function layerFor(canvas) {
    if (!canvas) return null;
    if (!canvasLayers.has(canvas)) {
      let ctx;
      try { ctx = canvas.getContext('2d'); } catch { return null; }
      if (!ctx) return null;
      canvasLayers.set(canvas, { canvas, ctx, width: 0, height: 0, dpr: 0 });
    }
    return canvasLayers.get(canvas);
  }

  function sizeLayer(layer) {
    if (!layer) return false;
    const box = layer.canvas.getBoundingClientRect();
    if (!box.width || !box.height) return false;
    const dpr = Math.min(devicePixelRatio || 1, innerWidth <= 620 ? 1.5 : 2);
    if (layer.width !== box.width || layer.height !== box.height || layer.dpr !== dpr) {
      layer.width = box.width; layer.height = box.height; layer.dpr = dpr;
      layer.canvas.width = Math.round(box.width * dpr);
      layer.canvas.height = Math.round(box.height * dpr);
    }
    layer.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  function clearLayer(layer) {
    if (!layer) return;
    layer.ctx.setTransform(layer.dpr || 1, 0, 0, layer.dpr || 1, 0, 0);
    layer.ctx.clearRect(0, 0, layer.width, layer.height);
  }

  function line(c, x, y, xx, yy, color = '#b5e5d08a', width = .75) {
    c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy);
    c.strokeStyle = color; c.lineWidth = width; c.stroke();
  }

  function path(c, points, color, width = 1, fill = false) {
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.closePath();
    if (fill) { c.fillStyle = color; c.fill(); }
    else { c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
  }

  function corners(c, x, y, w, h, amount = 1, color = '#b5e5d0') {
    c.save(); c.globalAlpha *= amount;
    c.strokeStyle = '#b5e5d030'; c.lineWidth = .6; c.strokeRect(x, y, w, h);
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]
      .forEach(([px, py, sx, sy]) => {
        line(c, px, py, px + sx * 19, py, color, 1.35);
        line(c, px, py, px, py + sy * 13, color, 1.35);
      });
    c.restore();
  }

  function label(c, value, x, y, size = 8, color = '#b5e5d0a0') {
    c.font = `${size}px "IBM Plex Mono",Consolas,monospace`;
    c.fillStyle = color; c.fillText(value, x, y);
  }

  /* The study's B assembly is reused without its demo player or demo markup. */
  function paintHero(p = 1) {
    const layer = layerFor(heroCanvas);
    if (!sizeLayer(layer)) return false;
    heroDraws++;
    const { ctx: c, width: w, height: h } = layer;
    clearLayer(layer);
    const scale = Math.min(w, h) / 620;
    c.save(); c.translate(w / 2, h / 2); c.scale(scale, scale); c.translate(-640, -358);
    drawDepthField(c, 6.08 + ease(p) * 1.12, 'b');
    // A's triangular rail lives in the same depth space as B's segmented dial.
    c.save(); c.globalAlpha = .48 * phase(p, .2, .9);
    path(c, [[640, 64], [904, 510], [375, 510]], '#b5e5d05e', .8);
    path(c, [[651, 78], [890, 500], [390, 500]], '#d8c96b54', .55);
    c.restore();
    drawWireDevice(c, 3.65 + p * .68, {
      x: 640, y: 358, scale: .50 + .04 * ease(p), roll: -.36, yaw: -.18,
      alpha: phase(p, .22, .78) * .9, annotations: false,
    });
    c.save(); c.globalAlpha = phase(p, .3, 1);
    label(c, 'ARCHIVE / STRUCTURE 01', 396, 86, 7, '#d8c96b');
    label(c, 'NATIVE GEOMETRY', 741, 624, 7);
    c.restore(); c.restore();
    heroCanvas.dataset.ready = 'true';
    return true;
  }

  function drawHero(p = 1) {
    try { return paintHero(p); } catch {
      renderFailures++;
      heroCanvas?.removeAttribute('data-ready');
      try { clearLayer(canvasLayers.get(heroCanvas)); } catch { /* Keep the static SVG fallback. */ }
      canvasLayers.delete(heroCanvas);
      return false;
    }
  }

  function assembleHero() {
    if (!heroCanvas || !onScreen(hero) || introOpen) return;
    if (!active()) { drawHero(1); return; }
    run('hero', 1500, p => drawHero(p), completed => { if (!completed) drawHero(1); });
  }

  function decorativeLayer(host, className) {
    const node = document.createElement('div');
    node.className = `cinematic-layer ${className}`;
    node.setAttribute('aria-hidden', 'true'); node.inert = true;
    node.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:6;contain:layout paint;';
    host.append(node);
    return node;
  }

  function decorativeCanvas(host) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
    host.append(canvas);
    return canvas;
  }

  function restoreStyles(node, keys) {
    const values = keys.map(key => [key, node.style.getPropertyValue(key), node.style.getPropertyPriority(key)]);
    return () => values.forEach(([key, value, priority]) => value
      ? node.style.setProperty(key, value, priority) : node.style.removeProperty(key));
  }

  function sectionCards(section) {
    const explicit = [...section.querySelectorAll('[data-cinematic-card]')];
    const selectors = section.id === 'about' ? '.hero-project-index > a'
      : section.id === 'projects' ? '.project-tabs > a, .project-pane:not([hidden])'
      : section.id === 'journal' ? '.journal-row'
      : '.profile-dossier, .profile-intro';
    return (explicit.length ? explicit : [...section.querySelectorAll(selectors)]).slice(0, 8)
      .filter(node => !node.hidden && !node.closest('[hidden]'));
  }

  /* A's -18° archive camera and independently staggered cards now settle the
   * actual homepage content. Cancelling always restores the untouched layout. */
  function enterSection(section, force = false) {
    if (!section || introOpen || !active() || (!force && seenSections.has(section))) return false;
    // Both entry and project selection can write the selected pane's transform.
    // Cancel the other owner before taking restoration snapshots, including
    // repeated Works-link clicks midway through a project fold.
    if (section.id === 'projects') cancel('project', 'project-section-entered');
    const cards = sectionCards(section);
    if (!cards.length || !cards.some(onScreen)) return false;
    seenSections.add(section);
    const key = `section:${section.id}`;
    cancel(key, 'new-section-entry');
    const cleanup = cards.map(node => restoreStyles(node, ['transform', 'transform-origin', 'will-change', 'opacity']));
    const miniature = innerWidth <= 620;
    const perspective = miniature ? 1100 : 1400;
    cards.forEach(node => {
      node.style.willChange = 'transform, opacity';
      node.style.transformOrigin = '50% 50%';
    });
    section.dataset.cinematicEntry = 'archive-a';
    return run(key, miniature ? 1050 : 1380, p => {
      cards.forEach((card, index) => {
        const settle = phase(p, index * .055, .71 + index * .035);
        const arrival = 1 - settle;
        const direction = index % 2 ? 1 : -1;
        card.style.transform = `perspective(${perspective}px) translate3d(${direction * arrival * (miniature ? 15 : 38)}px,${arrival * (miniature ? 20 : 32)}px,${arrival * -155}px) rotateY(${arrival * (miniature ? -7 : -18)}deg) rotateX(${arrival * 3}deg) scale(${.92 + settle * .08})`;
        card.style.opacity = String(.58 + settle * .42);
      });
    }, () => {
      cleanup.forEach(restore => restore());
      delete section.dataset.cinematicEntry;
    });
  }

  const faceClips = [
    'polygon(0 0,50% 0,50% 13%,16% 50%,0 50%)',
    'polygon(50% 0,100% 0,100% 50%,84% 50%,50% 13%)',
    'polygon(0 50%,16% 50%,50% 87%,50% 100%,0 100%)',
    'polygon(50% 87%,84% 50%,100% 50%,100% 100%,50% 100%)',
  ];

  function makeFaces(host, previous = null) {
    const faces = faceClips.map((clip, i) => {
      const face = document.createElement('div');
      face.className = 'cinematic-fold-face';
      face.style.cssText = `position:absolute;inset:0;pointer-events:none;clip-path:${clip};transform-origin:${i % 2 ? 68 : 32}% ${i < 2 ? 32 : 68}%;background:repeating-linear-gradient(0deg,transparent 0 35px,#b5e5d00b 35px 36px),repeating-linear-gradient(90deg,transparent 0 35px,#b5e5d00b 35px 36px),linear-gradient(${i % 2 ? 130 : 40}deg,#0a1114,#1b2a2c);box-shadow:inset 0 0 0 1px #b5e5d04a;will-change:transform,opacity;backface-visibility:visible;opacity:0;`;
      // The departing project's own image is folded into the panels. It is a
      // noninteractive decoration, with all IDs and references removed.
      const source = previous?.querySelector('.project-preview img');
      if (source?.currentSrc || source?.src) {
        const image = document.createElement('img'); image.alt = '';
        image.src = source.currentSrc || source.src;
        image.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.17;filter:grayscale(1);pointer-events:none;';
        face.append(image);
      }
      const strut = document.createElement('i');
      strut.style.cssText = `position:absolute;left:${i % 2 ? 50 : 16}%;top:${i < 2 ? 13 : 50}%;width:50%;height:1px;transform:rotate(${i % 2 === (i < 2 ? 1 : 0) ? 45 : -45}deg);transform-origin:left;background:linear-gradient(90deg,#b5e5d0,#b5e5d000);`;
      face.append(strut); host.append(face); return face;
    });
    return faces;
  }

  function poseFaces(faces, p, width, height, opacity = 1) {
    faces.forEach((face, i) => {
      const sx = i % 2 ? 1 : -1, sy = i < 2 ? -1 : 1;
      const fold = phase(p, .2 + (i % 2) * .035, .77);
      const leave = phase(p, .38, .96);
      face.style.opacity = String(opacity * phase(p, 0, .1) * (1 - phase(p, .68, 1)));
      face.style.transform = `perspective(1200px) translate3d(${sx * leave * width * .55}px,${sy * leave * height * .40}px,${Math.sin(fold * Math.PI) * 95}px) rotate3d(1,${i === 0 || i === 3 ? -1 : 1},0,${sy * fold * 68}deg)`;
    });
  }

  function projectTransition(selected, previous) {
    cancel('project', 'project-superseded');
    cancel('section:projects', 'project-selected');
    if (!projectStage || !selected || !active() || introOpen || !onScreen(projectStage)) return;
    const host = decorativeLayer(projectStage, 'cinematic-project-transition');
    host.dataset.sequence = 'b-to-a';
    const canvas = decorativeCanvas(host), layer = layerFor(canvas);
    const faces = makeFaces(host, previous);
    const box = projectStage.getBoundingClientRect();
    sizeLayer(layer);
    const restore = restoreStyles(selected, ['transform', 'transform-origin', 'will-change']);
    selected.style.transformOrigin = '50% 45%'; selected.style.willChange = 'transform';
    projectStage.dataset.cinematicTransition = 'wire-fold-archive';
    run('project', innerWidth <= 620 ? 900 : 1200, p => {
      transitionDraws++;
      const settle = phase(p, .06, .9), arrival = 1 - settle;
      selected.style.transform = `perspective(1300px) translate3d(${arrival * 23}px,${arrival * 16}px,${arrival * -150}px) rotateY(${arrival * -15}deg) scale(${.94 + settle * .06})`;
      poseFaces(faces, p, box.width, box.height, .96);
      if (!layer) return;
      const { ctx: c, width: w, height: h } = layer;
      clearLayer(layer);
      const scan = phase(p, 0, .1) * (1 - phase(p, .35, .7));
      const s = Math.min(w / 640, h / 400, 1.1);
      c.save(); c.globalAlpha = scan; c.translate(w / 2, Math.min(h * .46, 240));
      c.scale(s, s);
      corners(c, -245, -130, 490, 260, .8);
      path(c, [[0, -142], [178, 0], [0, 142], [-178, 0]], '#b5e5d08f', 1.1);
      drawWireDevice(c, 3.1 + p * 1.3, { x: 0, y: 0, scale: .72, roll: -.24 + p * .11, yaw: -.44 + p * .3, annotations: false });
      label(c, 'STRUCTURE / RECOMPOSE', -235, -141, 7, '#d8c96b');
      c.restore();
    }, () => {
      restore(); host.remove(); canvasLayers.delete(canvas);
      delete projectStage.dataset.cinematicTransition;
    });
  }

  /* B's offset radial shells and diagonal beams, compact enough for the intro.
   * Every point is deterministic; screenshots and interrupted playback agree. */
  function radial(c, x, y, radius, time, alpha = 1) {
    c.save(); c.translate(x, y); c.globalAlpha *= alpha;
    const assemble = phase(time, 0, 1.1), rotation = -.35 + time * .34;
    for (let shell = 0; shell < 3; shell++) {
      const r = radius * [.99, .73, .39][shell] * (.28 + assemble * .72);
      const offset = shell === 1 ? 6 * (1 - assemble) : 0;
      c.save(); c.translate(offset, -offset); c.scale(1, .94);
      c.strokeStyle = shell ? '#b5e5d04b' : '#b5e5d087'; c.lineWidth = .8;
      c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
      const count = [96, 72, 40][shell];
      for (let i = 0; i < count; i++) {
        const a = i / count * TAU + rotation * (shell % 2 ? -1 : 1) * .25;
        const length = i % 8 ? 4 : 10;
        line(c, Math.cos(a) * r, Math.sin(a) * r, Math.cos(a) * (r - length), Math.sin(a) * (r - length), i % 8 ? '#b5e5d04d' : '#e7e8dcc7', i % 8 ? .6 : 1.2);
      }
      for (let i = 0; i < 3; i++) {
        const a = rotation * (shell % 2 ? -1 : 1) + i / 3 * TAU;
        c.beginPath(); c.arc(0, 0, Math.max(0, r - 16), a, a + (.3 + assemble * .65));
        c.lineWidth = shell === 1 ? 5 : 2; c.strokeStyle = shell === 1 ? '#b5e5d0df' : '#d8c96ba0'; c.stroke();
      }
      c.restore();
    }
    const beam = phase(time, .4, 1.1), q = radius * 1.2;
    c.globalAlpha *= beam;
    for (const sign of [-1, 1]) {
      line(c, -q, -q * sign, q, q * sign, '#b5e5d03d', .8);
      line(c, -q - 7, -q * sign + 7, q + 7, q * sign + 7, '#b5e5d01b', 2);
    }
    corners(c, -q, -q, q * 2, q * 2, .8);
    c.restore();
  }

  const introCards = projects.slice(0, 3).map((pane, index) => {
    const source = pane.querySelector('.project-preview img');
    let image = source;
    // Homepage-only small previews share the preloaded URL. They avoid waiting
    // for a full-size lazy project image during a cold first-load opening.
    if (source?.dataset.introSrc) {
      image = document.createElement('img');
      image.decoding = 'async'; image.src = source.dataset.introSrc;
    }
    return {
      title: pane.querySelector('h3')?.textContent?.trim() || `ARCHIVE ${index + 1}`,
      code: pane.querySelector('.eyebrow')?.textContent?.trim() || `PROJECT / 0${index + 1}`,
      image,
    };
  });

  function archivePlanes(c, width, height, time) {
    const camera = phase(time, 1.22, 2.78), departure = phase(time, 2.85, 3.6);
    const scale = Math.min(width / 1050, height / 670);
    const cardWidth = 240, cardHeight = 270;
    c.save(); c.translate(width / 2, height * .49); c.scale(scale, scale);
    c.globalAlpha = phase(time, 1.12, 1.56) * (1 - departure);
    // A1.7's offset rings and triangular rail provide the depth cues around the
    // three real homepage archive cards, rather than replaying study contents.
    c.save(); c.globalAlpha *= .45; c.translate(-310, -10); c.rotate(-.28); c.scale(.6, 1);
    for (const r of [105, 140, 156]) {
      c.beginPath(); c.arc(0, 0, r, -.6, TAU - .9); c.strokeStyle = '#b5e5d09a'; c.lineWidth = r === 140 ? 3 : .8; c.stroke();
    }
    c.restore();
    path(c, [[-460, 160], [45, -246], [430, 180]], '#b5e5d04b', .75);
    const cards = introCards.length ? introCards : [{ title: 'THEATER', code: 'PERSONAL ARCHIVE' }];
    cards.forEach((card, i) => {
      const local = phase(camera, i * .12, .78 + i * .1);
      const spread = (i - (cards.length - 1) / 2);
      const x = spread * 267 + (1 - local) * 85 + departure * spread * 200;
      const y = (i % 2 ? -19 : 17) + (1 - local) * 44;
      const yaw = (-.33 + local * .27) + spread * .045;
      const depth = 850 / (850 + (1 - local) * 170);
      c.save(); c.translate(x, y); c.transform(Math.cos(yaw), -.045, Math.sin(yaw) * .2, 1, 0, 0); c.scale(depth, depth);
      c.fillStyle = '#101d21f0'; c.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
      corners(c, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, .8);
      const image = card.image;
      if (image?.complete && image.naturalWidth) {
        c.save(); c.beginPath(); c.rect(-108, -120, 216, 151); c.clip();
        const imageScale = Math.max(216 / image.naturalWidth, 151 / image.naturalHeight);
        c.globalAlpha *= .65;
        c.drawImage(image, -image.naturalWidth * imageScale / 2, -120 + (151 - image.naturalHeight * imageScale) / 2, image.naturalWidth * imageScale, image.naturalHeight * imageScale);
        c.restore();
      } else {
        c.save(); c.globalAlpha *= .55;
        drawWireDevice(c, 3.6 + i * .3, { x: 0, y: -42, scale: .48, roll: -.3, yaw: -.3, annotations: false });
        c.restore();
      }
      label(c, `0${i + 1} / ${card.code}`, -106, 55, 7, '#d8c96b');
      c.font = '17px "Noto Serif SC",serif'; c.fillStyle = '#e7e8dc'; c.fillText(card.title, -106, 86, 210);
      line(c, -106, 105, 106, 105, '#b5e5d04d');
      label(c, 'THEATER / PROJECT ARCHIVE', -106, 122, 6);
      c.restore();
    });
    c.restore();
  }

  let introLayer = null, introFaces = [];
  function prepareIntro() {
    if (!intro || introLayer) return;
    introLayer = decorativeLayer(intro, 'cinematic-intro-fold');
    introLayer.style.zIndex = '2';
    introFaces = makeFaces(introLayer);
  }

  function drawIntro(seconds) {
    const layer = layerFor(introCanvas);
    if (!sizeLayer(layer)) return false;
    introDraws++;
    const { ctx: c, width: w, height: h } = layer;
    clearLayer(layer);
    const reveal = phase(seconds, 3.16, 4.2);
    c.fillStyle = `rgba(10,17,20,${1 - reveal})`; c.fillRect(0, 0, w, h);
    const radius = Math.min(w * .29, h * .28, 225);
    radial(c, w / 2, h * .48, radius, seconds, (1 - phase(seconds, 1.18, 1.76)) * phase(seconds, 0, .18));
    archivePlanes(c, w, h, seconds);
    // Four independent faces follow B5's fold axes, opening directly onto the
    // live homepage. Skip remains outside this decorative, inert layer.
    const fold = clamp((seconds - 2.70) / 1.5);
    poseFaces(introFaces, fold, w, h, phase(seconds, 2.7, 2.89));
    intro.style.setProperty('--intro-progress', String(clamp(seconds / 4.2)));
    intro.style.setProperty('--intro-reveal', String(reveal));
    const center = intro.querySelector('.intro-center');
    if (center) center.style.opacity = String(phase(seconds, .25, .7) * (1 - phase(seconds, 1.04, 1.3)));
    const percent = intro.querySelector('#intro-percent');
    if (percent) percent.textContent = String(Math.floor(clamp(seconds / 4.2) * 100)).padStart(2, '0');
    const phaseLabel = intro.querySelector('#intro-phase');
    if (phaseLabel) phaseLabel.textContent = seconds < 1.25 ? '01 / RADIAL ASSEMBLY · 径向校准'
      : seconds < 2.7 ? '02 / ARCHIVE PLANES · 档案展开' : '03 / ENTER ARCHIVE · 进入档案';
  }

  function resetIntro() {
    if (introLayer) { introLayer.remove(); introLayer = null; introFaces = []; }
    intro?.style.removeProperty('--intro-progress');
    intro?.style.removeProperty('--intro-reveal');
    intro?.querySelector('.intro-center')?.style.removeProperty('opacity');
  }

  function syncIntro() {
    const open = !!intro && !intro.hidden;
    if (open === introOpen) return;
    introOpen = open; manualIntro = null;
    if (open) {
      cancelAll('intro-opened'); resetHeroPointer();
      if (!active()) return;
      prepareIntro();
      run('intro', 4200, (p, elapsed) => drawIntro(Math.min(elapsed / 1000, 4.2)), completed => {
        if (!completed) resetIntro();
      });
    } else {
      cancel('intro', 'intro-closed'); resetIntro();
      if (active()) { assembleHero(); enterSection(hero, true); }
    }
  }

  function settle(reason) {
    cancelAll(reason); manualIntro = null; resetIntro(); resetHeroPointer();
    if (pageActive && !document.hidden) drawHero(1);
  }

  function preferencesChanged() {
    const allowed = motionAllowed();
    // terminal.js synchronizes the same preference again at initial pageshow
    // and on storage events. Those notifications do not represent a change:
    // cancelling here would erase an already-playing first-load intro.
    if (allowed === previousMotionAllowed) {
      document.body.classList.toggle('cinematic-integration-paused', !active());
      return;
    }
    previousMotionAllowed = allowed;
    settle('preferences-changed');
    document.body.classList.toggle('cinematic-integration-paused', !active());
    // A changed preference never replays entrance motion unexpectedly.
  }

  if (intro) new MutationObserver(syncIntro).observe(intro, { attributes: true, attributeFilter: ['hidden'] });
  if (projectStage && projects.length) {
    new MutationObserver(() => {
      const selected = projects.find(pane => !pane.hidden) || null;
      if (selected === currentProject) return;
      const previous = currentProject; currentProject = selected;
      projectTransition(selected, previous);
    }).observe(projectStage, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const { target, isIntersecting } of entries) {
        const section = target.matches('.stage') ? target : target.closest('.stage');
        if (!section) continue;
        if (isIntersecting) {
          visibleSections.add(section); enterSection(section);
        } else if (target === section) {
          visibleSections.delete(section); cancel(`section:${section.id}`, 'section-offscreen');
          if (section === hero) { cancel('hero', 'hero-offscreen'); resetHeroPointer(); }
          if (section.id === 'projects') cancel('project', 'project-offscreen');
        }
      }
    }, { threshold: .12 });
    sections.forEach(section => {
      observer.observe(section);
      // A tall chapter heading can enter long before its cards, especially on
      // phones. Observe the first real card as well so its entrance isn't spent
      // offscreen while the reader is still looking at the chapter heading.
      const firstCard = sectionCards(section)[0];
      if (firstCard) observer.observe(firstCard);
    });
  }

  // No event below changes native navigation. Repeated activation is safe;
  // the document owns its destination while a new finite camera settles it.
  document.addEventListener('click', event => {
    if (event.button > 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.hasAttribute('data-project') || !link.hash
      || link.origin !== location.origin || link.pathname !== location.pathname) return;
    let id;
    try { id = decodeURIComponent(link.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    const section = target.matches('.stage') ? target : target.closest('.stage');
    if (section && onScreen(section)) enterSection(section, true);
  });

  // A user choosing an actual control always wins over moving decoration.
  document.addEventListener('focusin', event => {
    if (event.target.closest?.('#intro')) return;
    const section = event.target.closest?.('.stage');
    if (section) cancel(`section:${section.id}`, 'keyboard-focus');
    if (event.target.closest?.('.project-pane')) cancel('project', 'project-focus');
  });
  document.addEventListener('pointerdown', event => {
    if (event.target.closest?.('.project-pane a, .project-pane button')) cancel('project', 'project-activated');
  }, { passive: true });

  function resetHeroPointer() {
    cancel('hero-pointer', 'pointer-reset');
    pointerPosition = null; restoreHeroPointer();
  }

  const instrument = heroCanvas?.closest('.hero-instrument') || heroCanvas;
  instrument?.addEventListener('pointermove', event => {
    if (!active() || !finePointer.matches || introOpen || event.pointerType === 'touch') {
      resetHeroPointer(); return;
    }
    const box = instrument.getBoundingClientRect();
    if (!box.width || !box.height) return;
    pointerPosition = {
      x: clamp((event.clientX - box.left) / box.width * 2 - 1, -1, 1),
      y: clamp((event.clientY - box.top) / box.height * 2 - 1, -1, 1),
    };
    if (jobs.has('hero-pointer')) return;
    // Coalesce pointer events into one paint. This transforms the cached
    // instrument canvas; it never redraws thousands of wire vertices at idle.
    run('hero-pointer', 1, p => {
      if (p < 1 || !pointerPosition) return;
      const { x, y } = pointerPosition;
      heroCanvas.style.transform = `perspective(750px) translate3d(${x * 4}px,${y * 4}px,0) rotateX(${-y * 2}deg) rotateY(${x * 2}deg)`;
    }, completed => { if (!completed) restoreHeroPointer(); });
  }, { passive: true });
  instrument?.addEventListener('pointerleave', resetHeroPointer);
  instrument?.addEventListener('pointercancel', resetHeroPointer);
  finePointer.addEventListener('change', resetHeroPointer);
  addEventListener('blur', resetHeroPointer);

  reduced.addEventListener('change', preferencesChanged);
  document.addEventListener('theater-effects-change', preferencesChanged);
  new MutationObserver(preferencesChanged).observe(document.body, { attributes: true, attributeFilter: ['data-effects', 'data-motion'] });
  document.addEventListener('visibilitychange', () => {
    const interruptedIntro = !!intro && !intro.hidden;
    settle(document.hidden ? 'document-hidden' : 'document-visible');
    // Do not return from another tab to a frozen or never-painted modal. The
    // app owns close/focus/inert restoration; use its ordinary skip path.
    if (interruptedIntro) document.querySelector('#skip-intro')?.click();
    document.body.classList.toggle('cinematic-integration-paused', !active());
  });
  addEventListener('pagehide', () => { pageActive = false; settle('pagehide'); });
  addEventListener('pageshow', event => {
    // The first pageshow follows module initialization. It must not cancel the
    // first intro; only a restored document needs to settle an old timeline.
    if (pageActive && !event.persisted) return;
    pageActive = true; settle('pageshow');
  });
  addEventListener('resize', () => {
    cancel('project', 'resize');
    if (!pageActive || document.hidden) return;
    drawHero(1);
    if (introOpen && manualIntro !== null) {
      try { drawIntro(manualIntro); } catch { renderFailures++; resetIntro(); }
    }
  }, { passive: true });

  // Small deterministic inspection API for visual QA. It never opens an intro,
  // selects content, changes history or starts a persistent playback clock.
  window.TheaterCinematics = Object.freeze({
    getState: () => ({
      motion: motionAllowed(), active: active(), running: !!frame,
      jobs: [...jobs.keys()], introOpen, manualIntro,
      heroDraws, introDraws, transitionDraws, renderFailures,
      heroDpr: layerFor(heroCanvas)?.dpr || 0,
      introDpr: layerFor(introCanvas)?.dpr || 0,
      currentProject: currentProject?.id || null, lastReason,
    }),
    seekIntro(seconds) {
      if (!introOpen || !active() || !Number.isFinite(seconds)) return false;
      cancel('intro', 'manual-inspection');
      manualIntro = clamp(seconds, 0, 4.2); prepareIntro();
      try { return drawIntro(manualIntro) !== false; } catch {
        renderFailures++; resetIntro(); return false;
      }
    },
    replaySection(id) {
      const section = sections.find(node => node.id === id);
      return !!section && onScreen(section) && enterSection(section, true);
    },
    cancel: () => settle('explicit-cancel'),
  });

  document.body.classList.add('cinematic-integration-ready');
  drawHero(1);
  syncIntro();
  if (!introOpen) { assembleHero(); if (onScreen(hero)) enterSection(hero); }
})();
