/* Original score: Tidal Archive. Synthesized locally; no recording or external asset.
 * Audio is created only by the music button. Playback is never persisted/resumed. */
(() => {
  'use strict';
  const panel = document.getElementById('archive-music');
  const button = document.getElementById('music-toggle');
  const label = document.getElementById('music-label');
  const slider = document.getElementById('music-volume');
  const value = document.getElementById('music-volume-value');
  const status = document.getElementById('music-status');
  if (!panel || !button || !label || !slider || !status) return;
  const Audio = window.AudioContext || window.webkitAudioContext;
  let current = null, retiring = null;
  let volume = Math.max(0, Math.min(100, Number(slider.value) || 0));
  const level = () => (volume / 100) ** 1.6 * 0.52;
  const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
  // D minor(add9), Bbmaj7, Fmaj9, C suspended: a restrained 48-second tide.
  const chords = [[38, 50, 57, 64, 65], [34, 50, 53, 57, 60], [41, 53, 57, 60, 67], [36, 48, 55, 62, 65]];
  const melody = [74, null, 69, 76, 77, null, 72, 69, 72, 79, null, 76, 74, null, 67, 72];

  function render(state, message) {
    panel.dataset.state = state;
    const playing = state === 'playing';
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-busy', String(state === 'loading'));
    label.textContent = playing ? '暂停氛围音乐' : state === 'loading' ? '取消加载' : '播放氛围音乐';
    status.textContent = message;
  }

  function dispose(session) {
    clearTimeout(session.timer);
    clearTimeout(session.cleanupTimer);
    if (retiring === session) retiring = null;
    session.context.onstatechange = null;
    for (const voice of session.voices) {
      voice.oscillator.onended = null;
      try { voice.oscillator.stop(); } catch { /* May already have ended. */ }
      voice.oscillator.disconnect();
      voice.gain.disconnect();
    }
    session.voices.clear();
    for (const node of session.nodes) node.disconnect();
    if (session.context.state !== 'closed') session.context.close().catch(() => {});
  }

  // Track the scheduled master envelope for browsers without cancelAndHoldAtTime.
  function holdMaster(session, now) {
    const envelope = session.envelope;
    const elapsed = Math.max(0, now - envelope.time);
    const held = envelope.kind === 'target'
      ? envelope.target + (envelope.value - envelope.target) * Math.exp(-elapsed / envelope.duration)
      : envelope.value + (envelope.target - envelope.value) * Math.min(1, elapsed / envelope.duration);
    const gain = session.master.gain;
    if (typeof gain.cancelAndHoldAtTime === 'function') gain.cancelAndHoldAtTime(now);
    else { gain.cancelScheduledValues(now); gain.setValueAtTime(held, now); }
    return held;
  }

  function pause(message = '已暂停 · 点击继续', fade = false) {
    const previous = current;
    current = null; // Invalidates an outstanding resume before cleanup.
    if (retiring) dispose(retiring); // At most one short outgoing tail.
    if (previous) {
      clearTimeout(previous.timer);
      previous.context.onstatechange = null;
      if (fade && previous.master && previous.context.state === 'running') {
        retiring = previous;
        const now = previous.context.currentTime;
        holdMaster(previous, now);
        previous.master.gain.linearRampToValueAtTime(0, now + 0.04);
        // Audio reaches silence on its own clock even if the cleanup timer stalls.
        previous.cleanupTimer = setTimeout(() => dispose(previous), 50);
      } else dispose(previous);
    }
    render('paused', message);
  }

  function voice(session, midi, start, duration, amplitude, type = 'sine', detune = 0) {
    const context = session.context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const entry = { oscillator, gain };
    session.voices.add(entry);
    oscillator.type = type;
    oscillator.frequency.value = frequency(midi);
    oscillator.detune.value = detune;
    const attack = type === 'triangle' ? 2.2 : Math.min(0.65, duration / 4);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(amplitude, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    gain.gain.linearRampToValueAtTime(0, start + duration + 0.08);
    oscillator.connect(gain);
    gain.connect(session.filter);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      session.voices.delete(entry);
    };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.1);
  }

  function schedule(session) {
    if (current !== session || document.hidden) return;
    try {
      const now = session.context.currentTime;
      // A throttled foreground timer skips missed notes instead of bursting them.
      if (session.nextChord < now - 1) session.nextChord = now + 0.06;
      if (session.nextNote < now - 1) session.nextNote = now + 0.3;
      while (session.nextChord < now + 0.7) {
        const chord = chords[session.chord++ % chords.length];
        chord.forEach((note, index) => {
          voice(session, note, session.nextChord + index * 0.11, 15, index ? 0.044 : 0.075, 'triangle', index % 2 ? -4 : 4);
          if (index > 1) voice(session, note, session.nextChord + index * 0.11, 14, 0.018, 'sine', -7);
        });
        session.nextChord += 12;
      }
      while (session.nextNote < now + 0.7) {
        const note = melody[session.note++ % melody.length];
        if (note !== null) {
          voice(session, note, session.nextNote, 5.5, 0.043);
          voice(session, note + 12, session.nextNote, 3.8, 0.009);
        }
        session.nextNote += 3;
      }
      session.timer = setTimeout(() => schedule(session), 250);
    } catch {
      if (current === session) pause('播放中断，请点击重试');
    }
  }

  async function play() {
    syncVolume(); // History may restore a range without firing input.
    let session;
    try {
      const context = new Audio();
      session = { context, nodes: [], voices: new Set(), timer: 0, ready: false, chord: 0, note: 0 };
      current = session;
      render('loading', '正在准备原创氛围音乐…');
      // Called synchronously inside the user gesture, before any asynchronous work.
      await context.resume();
      if (current !== session) return;
      if (document.hidden || context.state !== 'running') {
        pause('已暂停 · 点击播放');
        return;
      }
      const filter = context.createBiquadFilter();
      session.nodes.push(filter);
      filter.type = 'lowpass'; filter.frequency.value = 1900; filter.Q.value = 0.45;
      const master = context.createGain();
      session.nodes.push(master);
      master.gain.setValueAtTime(0, context.currentTime);
      master.gain.linearRampToValueAtTime(level(), context.currentTime + 2);
      // A quiet non-feedback echo gives space without an accumulating delay loop.
      const delay = context.createDelay(2);
      session.nodes.push(delay);
      delay.delayTime.value = 0.72;
      const wet = context.createGain();
      session.nodes.push(wet);
      wet.gain.value = 0.18;
      filter.connect(master); filter.connect(delay); delay.connect(wet); wet.connect(master);
      master.connect(context.destination);
      Object.assign(session, { filter, master, envelope: { kind: 'linear', time: context.currentTime, value: 0, target: level(), duration: 2 }, ready: true, nextChord: context.currentTime + 0.06, nextNote: context.currentTime + 1.8 });
      context.onstatechange = () => {
        if (current === session && session.ready && context.state !== 'running') pause('播放已中断 · 点击继续');
      };
      render('playing', 'TIDAL ARCHIVE · 原创氛围');
      schedule(session);
    } catch {
      if (current === session || !session) pause('暂时无法播放，请点击重试');
    }
  }

  button.addEventListener('click', () => {
    if (!Audio) return;
    if (current) pause(undefined, true);
    else if (!document.hidden) void play();
  });
  function syncVolume() {
    volume = Math.max(0, Math.min(100, Number(slider.value) || 0));
    if (value) value.textContent = `${volume}%`;
    slider.setAttribute('aria-valuetext', volume === 0 ? '静音' : `${volume}%`);
    if (current?.master) {
      const now = current.context.currentTime;
      const held = holdMaster(current, now);
      current.master.gain.setTargetAtTime(level(), now, 0.08);
      current.envelope = { kind: 'target', time: now, value: held, target: level(), duration: 0.08 };
    }
  }
  slider.addEventListener('input', syncVolume);
  // Persisted form values may be restored after pageshow; popstate and the
  // next task cover that ordering without restoring playback.
  window.addEventListener('pageshow', () => setTimeout(syncVolume, 0));
  window.addEventListener('popstate', syncVolume);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (current || retiring)) pause('页面离开时已暂停 · 点击继续');
  });
  window.addEventListener('pagehide', () => { if (current || retiring) pause(); });
  if (value) value.textContent = `${volume}%`;
  slider.setAttribute('aria-valuetext', volume === 0 ? '静音' : `${volume}%`);
  panel.hidden = false;
  if (!Audio) {
    button.disabled = true;
    slider.disabled = true;
    render('unsupported', '此浏览器不支持合成音频');
    label.textContent = '音乐不可用';
  } else render('idle', '原创合成 · 点击播放');
})();
