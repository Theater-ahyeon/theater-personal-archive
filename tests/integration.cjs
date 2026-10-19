/* Finite native-study homepage integration: lifecycle and interaction contract.
 * Canvas rendering is mocked here; screenshot QA remains a separate check. */
const { JSDOM } = require('jsdom');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');

let revision = 0;
async function setup({ reduced = false, effects = 'on', introOpen = false, width = 1440, canvasMode = 'normal', terminal = false } = {}) {
  const dom = new JSDOM(`<!doctype html><body data-page="home" data-effects="${effects}" data-motion="system">
    <div id="intro" ${introOpen ? '' : 'hidden'}><canvas id="intro-canvas"></canvas><div class="intro-center"></div><span id="intro-percent"></span><span id="intro-phase"></span><button id="skip-intro">Skip</button></div>
    <main><section class="stage hero" id="about" data-top="0"><canvas id="hero-instrument"></canvas><nav class="hero-project-index"><a href="#work-0">First project</a><a href="#work-1">Second project</a></nav></section>
    <section class="stage" id="projects" data-top="950"><nav class="project-tabs"><a href="#work-0" data-project="work-0">First</a><a href="#work-1" data-project="work-1">Second</a><a href="#work-2" data-project="work-2">Third</a></nav>
    <div class="project-stage">${[0, 1, 2].map(i => `<article class="project-pane" id="work-${i}" ${i ? 'hidden' : ''}><h3>Project ${i}</h3><p class="eyebrow">CODE / ${i}</p><figure class="project-preview"><img src="project-${i}.png" alt="Preview"></figure><a href="https://example.com/project/${i}">Open</a></article>`).join('')}</div></section>
    <section class="stage" id="journal" data-top="1700"><a class="journal-row" href="/blog/first">First note</a><a class="journal-row" href="/blog/second">Second note</a></section>
    <section class="stage" id="profile" data-top="2300"><div class="profile-intro">Profile</div><div class="profile-dossier">Dossier</div></section></main>
    <a id="native-link" href="#projects">Projects</a></body>`, {
    url: 'https://example.com/', pretendToBeVisual: true,
  });
  const w = dom.window, d = w.document, viewportWidth = width;
  d.getElementById('skip-intro').addEventListener('click', () => { d.getElementById('intro').hidden = true; });
  const frames = new Map(), observers = [], mediaListeners = [];
  let next = 0, stamp = 0, hidden = false, failCanvas = canvasMode === 'throw';
  const media = { matches: reduced, addEventListener(name, listener) { mediaListeners.push(listener); } };
  const pointerMedia = { matches: true, addEventListener() {} };
  const contexts = new WeakMap();
  w.HTMLCanvasElement.prototype.getContext = function () {
    if (canvasMode === 'null') return null;
    if (!contexts.has(this)) contexts.set(this, new Proxy({ globalAlpha: 1 }, {
      get(object, key) {
        if (key === 'arc') return (_x, _y, radius) => assert.ok(Number.isFinite(radius) && radius >= 0, `Canvas arc radius must be nonnegative: ${radius}`);
        if (key === 'stroke') return () => { if (failCanvas) throw new Error('Simulated renderer failure'); };
        if (key in object) return object[key];
        if (String(key).startsWith('create')) return () => ({ addColorStop() {} });
        return () => {};
      },
      set(object, key, value) { object[key] = value; return true; },
    }));
    return contexts.get(this);
  };
  w.HTMLElement.prototype.getBoundingClientRect = function () {
    const section = this.matches('section') ? this : this.closest('section');
    const top = Number(section?.dataset.top || 0);
    const isHeroCanvas = this.id === 'hero-instrument';
    const width = isHeroCanvas ? 360 : this.id === 'intro-canvas' ? Math.min(900, viewportWidth) : 900;
    const height = isHeroCanvas ? 280 : 600;
    return { x: 0, y: top, left: 0, top, width, height, right: width, bottom: top + height };
  };
  Object.defineProperty(d, 'hidden', { configurable: true, get: () => hidden });
  class IntersectionObserver {
    constructor(fn) { this.fn = fn; this.targets = []; observers.push(this); }
    observe(target) { this.targets.push(target); }
  }
  w.IntersectionObserver = IntersectionObserver;
  Object.assign(global, {
    window: w, document: d, location: w.location,
    localStorage: w.localStorage, CustomEvent: w.CustomEvent,
    matchMedia: query => query.includes('pointer') ? pointerMedia : media,
    MutationObserver: w.MutationObserver, IntersectionObserver,
    innerWidth: width, innerHeight: 900, devicePixelRatio: 3,
    performance: { now: () => stamp },
    requestAnimationFrame: fn => { frames.set(++next, fn); return next; },
    cancelAnimationFrame: id => frames.delete(id),
    addEventListener: w.addEventListener.bind(w),
  });
  if (terminal) vm.runInThisContext(fs.readFileSync('public/terminal.js', 'utf8'));
  await import(`${pathToFileURL(path.resolve('public/cinematic-integration.js')).href}?test=${revision++}`);
  const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
  return {
    dom, w, d, frames, observers, media, api: w.TheaterCinematics, flush,
    tick(delta) {
      stamp += delta;
      const callbacks = [...frames.values()]; frames.clear();
      callbacks.forEach(fn => fn(stamp));
    },
    async select(index) {
      for (const pane of d.querySelectorAll('.project-pane')) pane.hidden = pane.id !== `work-${index}`;
      await flush();
    },
    async effects(value, motion = 'system') {
      d.body.dataset.effects = value; d.body.dataset.motion = motion;
      d.dispatchEvent(new w.Event('theater-effects-change')); await flush();
    },
    visibility(value) { hidden = value; d.dispatchEvent(new w.Event('visibilitychange')); },
    failCanvas(value) { failCanvas = value; },
    enter(id, visible = true) {
      const target = d.getElementById(id);
      observers[0].fn([{ target, isIntersecting: visible }]);
    },
    showProjectStage() { d.getElementById('projects').dataset.top = '100'; },
  };
}

(async () => {
  {
    const t = await setup();
    assert.equal(t.frames.size, 1, 'all finite jobs share one RAF');
    assert.equal(t.api.getState().heroDpr, 2);
    assert.equal(t.d.getElementById('hero-instrument').dataset.ready, 'true');
    t.w.dispatchEvent(new t.w.PageTransitionEvent('pageshow', { persisted: false }));
    assert.equal(t.frames.size, 1, 'first pageshow does not kill startup');
    t.tick(1700);
    assert.equal(t.frames.size, 0, 'entrance stops at rest');
    assert.deepEqual(t.api.getState().jobs, []);
    const draws = t.api.getState().heroDraws;
    t.tick(50000); assert.equal(t.api.getState().heroDraws, draws, 'no idle canvas drawing');
    assert.equal(t.d.querySelector('.hero-project-index a').style.transform, '', 'camera styles restored');
    const link = t.d.getElementById('native-link');
    const event = new t.w.MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    link.dispatchEvent(event); assert.equal(event.defaultPrevented, false, 'modified navigation is native');
    t.dom.window.close();
  }
  {
    const t = await setup({ reduced: true, width: 390 });
    assert.equal(t.frames.size, 0, 'system reduced motion is static');
    assert.equal(t.api.getState().heroDpr, 1.5);
    assert.equal(t.api.replaySection('about'), false);
    await t.effects('on', 'full');
    assert.equal(t.api.getState().motion, true, 'full is an explicit system override');
    assert.equal(t.api.replaySection('about'), true);
    assert.equal(t.frames.size, 1);
    await t.effects('off', 'full');
    assert.equal(t.frames.size, 0, 'effects off wins over full override');
    assert.equal(t.d.querySelector('.hero-project-index a').style.transform, '');
    t.dom.window.close();
  }
  {
    const t = await setup(); t.tick(1700); t.showProjectStage();
    const focus = t.d.querySelector('.project-tabs a'); focus.focus();
    await t.select(1);
    assert.equal(t.api.getState().currentProject, 'work-1');
    assert.equal(t.d.querySelectorAll('.cinematic-project-transition').length, 1);
    assert.equal(t.d.getElementById('work-1').hidden, false, 'new project is readable immediately');
    assert.equal(t.d.activeElement, focus, 'transition does not steal focus');
    assert.equal(t.d.querySelector('.cinematic-project-transition').style.pointerEvents, 'none');
    assert.equal(t.d.querySelector('.cinematic-project-transition').getAttribute('aria-hidden'), 'true');
    assert.equal(t.d.querySelector('.cinematic-project-transition').inert, true);
    t.tick(150); await t.select(2);
    assert.equal(t.d.querySelectorAll('.cinematic-project-transition').length, 1, 'new selection replaces old faces');
    assert.equal(t.d.getElementById('work-1').style.transform, '', 'superseded pane restored');
    t.tick(1300);
    assert.equal(t.frames.size, 0); assert.equal(t.d.querySelectorAll('.cinematic-project-transition').length, 0);
    assert.equal(t.d.getElementById('work-2').style.transform, '');
    await t.select(0); t.tick(180);
    assert.notEqual(t.d.getElementById('work-0').style.transform, '');
    t.api.replaySection('projects');
    assert.equal(t.d.querySelectorAll('.cinematic-project-transition').length, 0, 'section entry cancels project fold before snapshots');
    t.tick(1500);
    assert.equal(t.d.getElementById('work-0').style.transform, '', 'section entry cannot restore an intermediate project tilt');
    t.api.replaySection('projects'); t.tick(180); await t.select(2);
    t.tick(1300);
    assert.equal(t.d.getElementById('work-0').style.transform, '', 'project selection cancels previous section owner');
    assert.equal(t.d.getElementById('work-2').style.transform, '');
    await t.select(0); t.visibility(true);
    assert.equal(t.frames.size, 0); assert.equal(t.d.querySelectorAll('.cinematic-layer').length, 0);
    t.visibility(false); assert.equal(t.frames.size, 0, 'visibility return does not replay');
    await t.select(1); t.w.dispatchEvent(new t.w.PageTransitionEvent('pagehide'));
    assert.equal(t.frames.size, 0); assert.equal(t.d.querySelectorAll('.cinematic-layer').length, 0);
    t.w.dispatchEvent(new t.w.PageTransitionEvent('pageshow', { persisted: true }));
    assert.equal(t.frames.size, 0, 'bfcache restore is static');
    t.dom.window.close();
  }
  {
    const t = await setup({ introOpen: true });
    assert.deepEqual(t.api.getState().jobs, ['intro'], 'already-open intro is observed on module load');
    await t.effects('on', 'system');
    assert.deepEqual(t.api.getState().jobs, ['intro'], 'redundant effects event and identical attributes preserve first-load intro');
    t.w.dispatchEvent(new t.w.PageTransitionEvent('pageshow', { persisted: false }));
    await t.effects('on', 'system');
    assert.deepEqual(t.api.getState().jobs, ['intro'], 'terminal pageshow preference synchronization preserves intro');
    t.tick(1200); assert.match(t.d.getElementById('intro-phase').textContent, /RADIAL/);
    t.tick(600); assert.match(t.d.getElementById('intro-phase').textContent, /ARCHIVE PLANES/);
    assert.equal(t.api.seekIntro(3.35), true); assert.equal(t.frames.size, 0);
    assert.equal(t.d.querySelectorAll('.cinematic-fold-face').length, 4);
    assert.match(t.d.getElementById('intro-phase').textContent, /ENTER ARCHIVE/);
    t.d.getElementById('intro').hidden = true; await t.flush();
    assert.equal(t.api.getState().introOpen, false);
    assert.equal(t.d.querySelectorAll('.cinematic-intro-fold').length, 0);
    t.tick(1700); assert.equal(t.frames.size, 0);
    t.d.getElementById('intro').hidden = false; await t.flush();
    assert.deepEqual(t.api.getState().jobs, ['intro']);
    await t.effects('off'); assert.equal(t.frames.size, 0);
    assert.equal(t.d.querySelectorAll('.cinematic-intro-fold').length, 0);
    t.dom.window.close();
  }
  {
    const t = await setup({ introOpen: true }); t.tick(300);
    t.visibility(true); await t.flush();
    assert.equal(t.d.getElementById('intro').hidden, true, 'tab interruption closes intro through app skip');
    assert.equal(t.frames.size, 0);
    t.visibility(false); await t.flush();
    assert.equal(t.d.getElementById('intro').hidden, true, 'return from hidden document has no frozen modal');
    assert.equal(t.frames.size, 0);
    t.dom.window.close();
  }
  {
    const t = await setup({ introOpen: true, terminal: true });
    t.w.dispatchEvent(new t.w.PageTransitionEvent('pageshow', { persisted: false }));
    await t.flush();
    assert.deepEqual(t.api.getState().jobs, ['intro'], 'actual terminal.js pageshow sync cannot cancel initial intro');
    t.tick(1200);
    assert.ok(t.api.getState().introDraws > 1, 'first-load intro keeps painting after terminal pageshow');
    assert.equal(t.api.getState().renderFailures, 0);
    t.tick(3200); assert.equal(t.frames.size, 0);
    t.dom.window.close();
  }
  {
    const t = await setup(); t.tick(1700);
    t.d.getElementById('journal').dataset.top = '100'; t.enter('journal');
    assert.equal(t.frames.size, 1); t.tick(220);
    t.d.querySelector('.journal-row').focus();
    assert.equal(t.frames.size, 0, 'keyboard focus settles moving content');
    assert.equal(t.d.querySelector('.journal-row').style.transform, '');
    t.api.replaySection('journal'); t.enter('journal', false);
    assert.equal(t.frames.size, 0, 'offscreen section stops');
    t.dom.window.close();
  }
  {
    const t = await setup({ canvasMode: 'null' });
    t.tick(1700);
    assert.equal(t.d.getElementById('hero-instrument').hasAttribute('data-ready'), false, 'null context retains SVG fallback');
    assert.equal(t.frames.size, 0);
    assert.equal(t.d.querySelector('.hero-project-index a').style.transform, '');
    t.dom.window.close();
  }
  {
    const t = await setup({ introOpen: true, width: 320 });
    assert.equal(t.api.getState().renderFailures, 0, 'small viewport first frame has valid arc radii');
    for (let index = 0; index < 45; index++) t.tick(100);
    assert.equal(t.api.getState().renderFailures, 0, 'all mobile intro geometry is valid');
    assert.equal(t.frames.size, 0);
    t.dom.window.close();
  }
  {
    const t = await setup(); t.tick(1700);
    const canvas = t.d.getElementById('hero-instrument');
    const move = (x, y, type = 'mouse') => {
      const event = new t.w.MouseEvent('pointermove', { clientX: x, clientY: y, bubbles: true });
      Object.defineProperty(event, 'pointerType', { value: type }); canvas.dispatchEvent(event);
    };
    const draws = t.api.getState().heroDraws;
    move(300, 200); move(360, 280); move(240, 180);
    assert.equal(t.frames.size, 1, 'fine pointer movement coalesces');
    t.tick(20); assert.equal(t.frames.size, 0, 'pointer paint has no idle continuation');
    assert.match(canvas.style.transform, /perspective/);
    assert.equal(t.api.getState().heroDraws, draws, 'pointer reuses cached geometry');
    canvas.dispatchEvent(new t.w.Event('pointerleave')); assert.equal(canvas.style.transform, '');
    move(300, 200, 'touch'); assert.equal(t.frames.size, 0, 'touch does not tilt');
    move(300, 200); t.tick(20); t.visibility(true); assert.equal(canvas.style.transform, '');
    assert.equal(t.frames.size, 0);
    t.dom.window.close();
  }
  {
    const t = await setup({ canvasMode: 'throw' });
    t.tick(1700);
    assert.equal(t.d.getElementById('hero-instrument').hasAttribute('data-ready'), false, 'throwing context retains SVG fallback');
    assert.equal(t.frames.size, 0, 'failed geometry leaves no animation clock');
    assert.ok(t.api.getState().renderFailures > 0);
    t.failCanvas(false); t.showProjectStage(); await t.select(1); t.tick(180);
    assert.notEqual(t.d.getElementById('work-1').style.transform, '');
    t.failCanvas(true); t.tick(100);
    assert.equal(t.frames.size, 0, 'mid-flight renderer failure cancels the job');
    assert.equal(t.d.getElementById('work-1').style.transform, '', 'failed renderer restores actual content');
    assert.equal(t.d.querySelectorAll('.cinematic-layer').length, 0, 'failed renderer removes faces');
    t.dom.window.close();
  }
  console.log('PASS integration: native A/B reuse, finite shared RAF/no idle loop, initial pageshow, DPR bounds, reduced/full/off, immediate repeated project selection, inert faces, focus, hidden/pagehide/BFCache, intro interruption, deterministic seek and offscreen cancellation. Pixel quality is checked separately.');
})().catch(error => { console.error(error); process.exitCode = 1; });
