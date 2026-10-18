// Deterministic control/lifecycle tests. These mocks do not render or assess audio.
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../public/soundtrack.js'), 'utf8');
const flush = () => new Promise(setImmediate);

function setup({ supported = true, deferred = false, nativeHold = true } = {}) {
  const listeners = {}, windows = {}, contexts = [], timers = new Map();
  const ids = ['archive-music', 'music-toggle', 'music-label', 'music-volume', 'music-volume-value', 'music-status'];
  const elements = Object.fromEntries(ids.map(id => [id, {
    hidden: true, value: '35', dataset: {}, attributes: {}, handlers: {},
    addEventListener(name, fn) { this.handlers[name] = fn; },
    setAttribute(name, value) { this.attributes[name] = value; }
  }]));
  let timer = 0;
  const param = () => {
    const result = { value: 0, calls: [] };
    for (const name of ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'cancelScheduledValues', 'setTargetAtTime']) {
      result[name] = (...args) => { result.calls.push({ name, args }); };
    }
    if (nativeHold) result.cancelAndHoldAtTime = (...args) => result.calls.push({ name: 'cancelAndHoldAtTime', args });
    return result;
  };
  const node = kind => ({
    kind, gain: param(), frequency: param(), detune: param(), delayTime: param(), Q: param(),
    connections: [], disconnectCalls: 0, startCalls: [], stopCalls: [],
    connect(target) { this.connections.push(target); },
    disconnect() { this.disconnectCalls++; this.connections = []; },
    start(...args) { this.startCalls.push(args); },
    stop(...args) { this.stopCalls.push(args); }
  });
  class Audio {
    constructor() {
      this.state = 'suspended'; this.currentTime = 0; this.destination = {};
      this.nodes = []; this.resumeCalls = 0; this.closeCalls = 0; contexts.push(this);
    }
    create(kind) { const n = node(kind); this.nodes.push(n); return n; }
    createGain() { return this.create('gain'); }
    createOscillator() { return this.create('oscillator'); }
    createBiquadFilter() { return this.create('filter'); }
    createDelay() { return this.create('delay'); }
    resume() {
      this.resumeCalls++;
      return new Promise((resolve, reject) => {
        this.resolve = () => { if (this.state !== 'closed') this.state = 'running'; resolve(); };
        this.reject = () => reject(new Error('Mock resume denied'));
        if (!deferred) this.resolve();
      });
    }
    close() { this.closeCalls++; this.state = 'closed'; return Promise.resolve(); }
    interrupt() { this.state = 'interrupted'; this.onstatechange?.(); }
  }
  const document = {
    hidden: false, getElementById: id => elements[id],
    addEventListener: (name, fn) => { listeners[name] = fn; }
  };
  vm.runInNewContext(source, {
    document,
    window: { AudioContext: supported ? Audio : undefined, addEventListener: (name, fn) => { windows[name] = fn; } },
    setTimeout: (fn, delay) => { fn.delay = delay; timers.set(++timer, fn); return timer; },
    clearTimeout: id => timers.delete(id)
  });
  const finishFade = () => {
    for (const [id, fn] of [...timers]) if (fn.delay === 50) { timers.delete(id); fn(); }
  };
  return {
    elements, contexts, timers, document, listeners, windows,
    // Most lifecycle cases explicitly advance the bounded outgoing fade.
    click: () => { elements['music-toggle'].handlers.click(); finishFade(); },
    rawClick: () => elements['music-toggle'].handlers.click(),
    finishFade,
    state: () => elements['archive-music'].dataset.state,
    volume(value) { elements['music-volume'].value = String(value); elements['music-volume'].handlers.input(); },
    visible(visible) { document.hidden = !visible; listeners.visibilitychange(); },
    tick(time) {
      const context = contexts.at(-1); context.currentTime = time;
      const [id, callback] = timers.entries().next().value;
      timers.delete(id); callback();
    }
  };
}

function assertDisposed(context) {
  assert.equal(context.state, 'closed');
  assert.equal(context.closeCalls, 1, 'context closed exactly once');
  assert.equal(context.onstatechange, null, 'context listener released');
  assert.ok(context.nodes.every(n => n.disconnectCalls > 0), 'every created node disconnected');
  for (const oscillator of context.nodes.filter(n => n.kind === 'oscillator')) {
    assert.ok(oscillator.stopCalls.some(args => args.length === 0), 'live voice stopped immediately');
    assert.equal(oscillator.onended, null, 'live voice callback released');
  }
}
function master(context) { return context.nodes.find(n => n.connections.includes(context.destination)); }
function assertUI(env, state, pressed, busy = false) {
  assert.equal(env.state(), state);
  assert.equal(env.elements['music-toggle'].attributes['aria-pressed'], String(pressed));
  assert.equal(env.elements['music-toggle'].attributes['aria-busy'], String(busy));
}

const tests = [
  ['history-restored range is synchronized and explicit play reads actual mute', async () => {
    const env = setup();
    env.elements['music-volume'].value = '0'; // Browser restoration emits no input.
    env.windows.popstate();
    assert.equal(env.elements['music-volume-value'].textContent, '0%');
    assert.equal(env.elements['music-volume'].attributes['aria-valuetext'], '静音');
    assert.equal(env.contexts.length, 0);
    env.click(); await flush();
    assert.equal(master(env.contexts[0]).gain.calls.find(c => c.name === 'linearRampToValueAtTime').args[0], 0);
    env.click();
    env.windows.pageshow({ persisted: true });
    env.elements['music-volume'].value = '50'; // Restoration can follow pageshow dispatch.
    for (const [id, fn] of [...env.timers]) if (fn.delay === 0) { env.timers.delete(id); fn(); }
    assert.equal(env.elements['music-volume-value'].textContent, '50%');
    env.elements['music-volume'].value = '0'; // Even a late restore before play stays muted.
    env.click(); await flush();
    assert.equal(master(env.contexts[1]).gain.calls.find(c => c.name === 'linearRampToValueAtTime').args[0], 0);
    env.click();
  }],
  ['no autoplay; explicit start/pause disposes voices, graph, timer', async () => {
    const env = setup();
    assert.equal(env.contexts.length, 0); assert.equal(env.timers.size, 0);
    assert.equal(env.elements['archive-music'].hidden, false); assertUI(env, 'idle', false);
    env.click(); assertUI(env, 'loading', false, true); await flush();
    assertUI(env, 'playing', true); assert.equal(env.contexts.length, 1); assert.equal(env.timers.size, 1);
    const context = env.contexts[0];
    assert.equal(context.nodes.filter(n => n.kind === 'oscillator').length, 8);
    assert.ok(context.nodes.filter(n => n.kind === 'oscillator').every(n => n.startCalls.length === 1));
    const staleTick = [...env.timers.values()][0];
    env.click(); assertUI(env, 'paused', false); assertDisposed(context); assert.equal(env.timers.size, 0);
    const nodeCount = context.nodes.length; staleTick();
    assert.equal(context.nodes.length, nodeCount); assert.equal(env.timers.size, 0, 'stale timer cannot reschedule');
  }],
  ['resume rejection cleans up and allows an explicit retry', async () => {
    const env = setup({ deferred: true }); env.click(); env.contexts[0].reject(); await flush();
    assertUI(env, 'paused', false); assertDisposed(env.contexts[0]); assert.equal(env.timers.size, 0);
    assert.match(env.elements['music-status'].textContent, /重试/);
    env.click(); env.contexts[1].resolve(); await flush(); assertUI(env, 'playing', true);
    env.click(); assertDisposed(env.contexts[1]);
  }],
  ['rapid pending play/pause: only newest generation can start', async () => {
    const env = setup({ deferred: true }); env.click(); env.click(); env.click();
    assert.equal(env.contexts.length, 2); assertDisposed(env.contexts[0]);
    env.contexts[1].resolve(); await flush(); assertUI(env, 'playing', true);
    env.contexts[0].resolve(); await flush(); assertUI(env, 'playing', true);
    assert.equal(env.contexts[0].nodes.length, 0); assert.equal(env.timers.size, 1);
    env.click(); assertDisposed(env.contexts[1]); assert.equal(env.timers.size, 0);
    // An old rejection likewise must not cancel a newer running session.
    env.click(); const old = env.contexts[2]; env.click(); env.click();
    env.contexts[3].resolve(); await flush(); old.reject(); await flush();
    assertUI(env, 'playing', true); assert.equal(env.timers.size, 1); assertDisposed(old);
    env.click(); assertDisposed(env.contexts[3]);
  }],
  ['zero volume schedules zero master gain and survives pause/replay', async () => {
    const env = setup(); env.click(); await flush();
    const firstMaster = master(env.contexts[0]);
    env.volume(0);
    assert.equal(env.elements['music-volume'].attributes['aria-valuetext'], '静音');
    assert.equal(env.elements['music-volume-value'].textContent, '0%');
    assert.equal(firstMaster.gain.calls.at(-1).name, 'setTargetAtTime');
    assert.equal(firstMaster.gain.calls.at(-1).args[0], 0);
    env.click(); env.click(); await flush();
    const replayMaster = master(env.contexts[1]);
    assert.ok(replayMaster.gain.calls.filter(c => c.name !== 'cancelScheduledValues').every(c => c.args[0] === 0));
    assert.equal(env.elements['music-volume'].value, '0');
    env.click(); assertDisposed(env.contexts[0]); assertDisposed(env.contexts[1]);
  }],
  ['hidden then visible pauses without automatic resume, including pending start', async () => {
    const env = setup(); env.click(); await flush(); env.visible(false);
    assertDisposed(env.contexts[0]); assertUI(env, 'paused', false); assert.equal(env.timers.size, 0);
    env.visible(true); await flush(); assert.equal(env.contexts.length, 1); assert.equal(env.contexts[0].resumeCalls, 1);
    assertUI(env, 'paused', false); assert.equal(env.timers.size, 0);
    const pending = setup({ deferred: true }); pending.click(); pending.visible(false);
    pending.contexts[0].resolve(); await flush(); pending.visible(true); await flush();
    assertDisposed(pending.contexts[0]); assert.equal(pending.contexts[0].nodes.length, 0);
    assert.equal(pending.timers.size, 0); assertUI(pending, 'paused', false);
  }],
  ['pagehide releases running and pending audio; repeated exit is safe', async () => {
    for (const deferred of [false, true]) {
      const env = setup({ deferred }); env.click(); await flush(); env.windows.pagehide();
      if (deferred) { env.contexts[0].resolve(); await flush(); }
      env.windows.pagehide(); assertDisposed(env.contexts[0]); assert.equal(env.timers.size, 0);
      assertUI(env, 'paused', false);
    }
  }],
  ['interrupted context stops with explicit restart required', async () => {
    const env = setup(); env.click(); await flush(); env.contexts[0].interrupt();
    assertDisposed(env.contexts[0]); assertUI(env, 'paused', false); assert.equal(env.timers.size, 0);
    assert.match(env.elements['music-status'].textContent, /中断/);
    env.visible(true); await flush(); assert.equal(env.contexts.length, 1);
    env.click(); await flush(); assertUI(env, 'playing', true); env.click(); assertDisposed(env.contexts[1]);
  }],
  ['natural voice completion disconnects and leaves the live-voice set', async () => {
    const env = setup(); env.click(); await flush(); const context = env.contexts[0];
    const oscillator = context.nodes.find(n => n.kind === 'oscillator');
    const gain = oscillator.connections[0]; const stopsBefore = oscillator.stopCalls.length;
    oscillator.onended();
    assert.equal(oscillator.disconnectCalls, 1); assert.equal(gain.disconnectCalls, 1);
    env.tick(1.3); assert.equal(env.timers.size, 1, 'scheduler maintains one pending timer');
    assert.equal(context.nodes.filter(n => n.kind === 'oscillator').length, 10, 'next melody pair scheduled');
    env.click();
    assert.equal(oscillator.stopCalls.length, stopsBefore, 'ended voice removed from disposal set');
    assert.equal(oscillator.disconnectCalls, 1); assert.ok(context.nodes.every(n => n.disconnectCalls > 0));
    assert.equal(context.closeCalls, 1); assert.equal(env.timers.size, 0);
  }],
  ['ordinary pause fades for 40ms; cleanup is bounded to one outgoing tail', async () => {
    const env = setup(); env.rawClick(); await flush(); const first = env.contexts[0];
    first.currentTime = 1; const firstMaster = master(first);
    env.rawClick(); assertUI(env, 'paused', false);
    assert.equal(first.state, 'running', 'outgoing context retained only for fade');
    assert.equal(firstMaster.gain.calls.at(-1).name, 'linearRampToValueAtTime');
    assert.deepEqual(firstMaster.gain.calls.at(-1).args, [0, 1.04]);
    assert.equal(env.timers.size, 1); assert.equal([...env.timers.values()][0].delay, 50);
    env.rawClick(); await flush(); assertUI(env, 'playing', true);
    assert.equal(env.timers.size, 2, 'one scheduler plus one cleanup timer during replay');
    const second = env.contexts[1]; const secondMaster = master(second);
    env.rawClick(); assertDisposed(first);
    assert.equal(env.timers.size, 1, 'a second pause replaces the old tail instead of accumulating');
    assert.equal(secondMaster.gain.calls.at(-1).args[0], 0);
    env.finishFade(); assertDisposed(second); assert.equal(env.timers.size, 0);
  }],
  ['visibility/pagehide immediately dispose an outgoing tail and any new session', async () => {
    for (const exit of ['hidden', 'pagehide']) {
      const env = setup(); env.rawClick(); await flush(); env.rawClick();
      env.rawClick(); await flush();
      if (exit === 'hidden') env.visible(false); else env.windows.pagehide();
      env.contexts.forEach(assertDisposed); assert.equal(env.timers.size, 0); assertUI(env, 'paused', false);
    }
  }],
  ['volume holds the initial fade and target envelope with native and fallback paths', async () => {
    for (const nativeHold of [true, false]) {
      const env = setup({ nativeHold }); env.click(); await flush();
      const context = env.contexts[0], gain = master(context).gain;
      const initialLevel = gain.calls.find(call => call.name === 'linearRampToValueAtTime').args[0];
      context.currentTime = 1; env.volume(70);
      if (nativeHold) assert.equal(gain.calls.at(-2).name, 'cancelAndHoldAtTime');
      else {
        assert.equal(gain.calls.at(-2).name, 'setValueAtTime');
        assert.equal(gain.calls.at(-2).args[0], initialLevel / 2, 'fallback holds actual midpoint of initial fade');
      }
      const target = gain.calls.at(-1).args[0];
      context.currentTime = 1.08; env.volume(0);
      if (!nativeHold) {
        const expected = target + (initialLevel / 2 - target) * Math.exp(-1);
        assert.ok(Math.abs(gain.calls.at(-2).args[0] - expected) < 1e-12, 'fallback holds exponential target envelope');
      }
      assert.equal(gain.calls.at(-1).args[0], 0); env.click(); assertDisposed(context);
    }
  }],
  ['unsupported browser exposes disabled controls without creating audio', async () => {
    const env = setup({ supported: false });
    assert.equal(env.elements['music-toggle'].disabled, true); assert.equal(env.elements['music-volume'].disabled, true);
    assertUI(env, 'unsupported', false); env.click(); await flush();
    assert.equal(env.contexts.length, 0); assert.equal(env.timers.size, 0);
  }]
];
(async () => {
  for (const [name, run] of tests) { await run(); console.log(`PASS: ${name}`); }
  console.log(`Soundtrack: ${tests.length} deterministic mock lifecycle tests passed. No waveform, loudness, listening, or browser audio-device validation.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
