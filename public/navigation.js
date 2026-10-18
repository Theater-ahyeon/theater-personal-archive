/* Native document navigation stays native: no fetch router, history rewrite or exit delay.
 * Cross-document snapshots are optional and cancelled for every disabled-motion path.
 * API: https://developer.chrome.com/docs/web-platform/view-transitions/cross-document */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function preference() {
    try { return localStorage.getItem('theater-effects'); } catch { return null; }
  }
  function enabled() {
    const state = document.body?.dataset;
    if (state?.effects) return state.effects !== 'off' && (state.motion === 'full' || !reduced.matches);
    const value = preference();
    return value !== 'off' && (value === 'full' || !reduced.matches);
  }
  function sync() { document.documentElement.dataset.navigationMotion = enabled() ? 'on' : 'off'; }
  let transition = null;
  function cancelIfNeeded(event) {
    sync();
    transition = event.viewTransition || null;
    if (!transition) return;
    if (!enabled()) transition.skipTransition();
    // Skipping can reject ready; never let an optional animation surface an error.
    transition.ready?.catch(() => {});
    const current = transition;
    transition.finished?.then(() => { if (transition === current) transition = null; }, () => { if (transition === current) transition = null; });
  }
  addEventListener('pageswap', cancelIfNeeded);
  addEventListener('pagereveal', cancelIfNeeded);
  const changed = () => { sync(); if (!enabled()) transition?.skipTransition(); };
  reduced.addEventListener('change', changed);
  document.addEventListener('theater-effects-change', changed);
  addEventListener('storage', changed);
  addEventListener('pageshow', sync);
  sync();
})();
