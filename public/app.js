(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const intro = document.querySelector('#intro');
  const shell = document.querySelector('#site-shell');
  const skip = document.querySelector('#skip-intro');
  const replay = document.querySelector('#replay-intro');
  const motionOff = () => (reduced.matches && document.body.dataset.motion !== 'full') || document.body.dataset.effects === 'off';
  let timer, active = false, previousFocus, previousInert, previousOverflow;

  const menuToggle = document.querySelector('#menu-toggle');
  const sidebar = document.querySelector('#sidebar');
  const shade = document.querySelector('#sidebar-shade');
  const mobile = matchMedia('(max-width: 900px)');
  let menuOpen = false, menuOverflow;
  function closeSidebar(restoreFocus = true) {
    if (!menuToggle || !sidebar || !shade) return;
    const wasOpen = menuOpen;
    menuOpen = false;
    sidebar.classList.remove('is-open');
    sidebar.inert = mobile.matches;
    shade.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', '展开导航');
    if (wasOpen) {
      document.documentElement.style.overflow = menuOverflow;
      if (restoreFocus) menuToggle.focus({ preventScroll: true });
    }
  }
  if (menuToggle && sidebar && shade) {
    menuToggle.addEventListener('click', () => {
      if (menuOpen) { closeSidebar(); return; }
      if (!mobile.matches || active) return;
      menuOverflow = document.documentElement.style.overflow;
      menuOpen = true;
      sidebar.inert = false;
      sidebar.classList.add('is-open');
      shade.hidden = false;
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', '关闭导航');
      document.documentElement.style.overflow = 'hidden';
      sidebar.querySelector('a[href]')?.focus({ preventScroll: true });
    });
    shade.addEventListener('click', () => closeSidebar());
    document.addEventListener('click', (event) => {
      const link = event.target.closest?.('a[href]');
      if (!menuOpen || !link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      closeSidebar(false);
      const target = link.origin === location.origin && link.pathname === location.pathname && link.hash
        ? document.getElementById(link.hash.slice(1)) : null;
      if (target) {
        if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
        target.focus({ preventScroll: true });
      } else menuToggle.focus({ preventScroll: true });
    });
    document.addEventListener('keydown', (event) => {
      if (!menuOpen || event.target.closest?.('dialog[open]')) return;
      if (event.key === 'Escape') { event.preventDefault(); closeSidebar(); return; }
      if (event.key !== 'Tab') return;
      const items = [menuToggle, ...sidebar.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((node) => node.getClientRects().length && !node.closest('[hidden], [inert]'));
      const current = items.indexOf(document.activeElement);
      const next = current < 0 ? (event.shiftKey ? items.length - 1 : 0)
        : (current + (event.shiftKey ? -1 : 1) + items.length) % items.length;
      event.preventDefault();
      items[next]?.focus({ preventScroll: true });
    });
    mobile.addEventListener('change', () => {
      const inside = sidebar.contains(document.activeElement);
      const onToggle = document.activeElement === menuToggle;
      closeSidebar(false);
      if (mobile.matches && inside) menuToggle.focus({ preventScroll: true });
      if (!mobile.matches && onToggle) sidebar.querySelector('a[href]')?.focus({ preventScroll: true });
    });
    window.addEventListener('pagehide', () => closeSidebar(false));
    closeSidebar(false);
    document.body.classList.add('has-ui');
  }

  function closeIntro() {
    document.body.classList.add('scene-entered');
    document.body.classList.remove('intro-playing');
    if (!active) return;
    active = false;
    clearTimeout(timer);
    intro.hidden = true;
    shell.inert = previousInert;
    document.documentElement.style.overflow = previousOverflow;
    const restore = [previousFocus, document.querySelector('#effects-toggle'), menuToggle]
      .find((node) => node?.isConnected && node.getClientRects().length && !node.closest('[hidden], [inert]'));
    restore?.focus({ preventScroll: true });
  }

  function openIntro() {
    if (!intro || !shell || !skip || motionOff()) return;
    closeSidebar();
    closeIntro();
    previousFocus = document.activeElement;
    previousInert = shell.inert;
    previousOverflow = document.documentElement.style.overflow;
    active = true;
    shell.inert = true;
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.remove('scene-entered');
    document.body.classList.add('intro-playing');
    intro.hidden = false;
    const emblem = intro.querySelector('.intro-emblem');
    let destination = document.querySelector(mobile.matches ? '#section-number' : '.sidebar-emblem');
    let bounds = destination?.getBoundingClientRect();
    if (!bounds?.width || bounds.right <= 0 || bounds.left >= innerWidth || bounds.bottom <= 0 || bounds.top >= innerHeight) {
      destination = document.querySelector('#section-number');
      bounds = destination?.getBoundingClientRect();
    }
    if (emblem && bounds?.width && emblem.offsetWidth) {
      intro.style.setProperty('--sigil-x', `${bounds.left + bounds.width / 2 - emblem.offsetLeft}px`);
      intro.style.setProperty('--sigil-y', `${bounds.top + bounds.height / 2 - emblem.offsetTop}px`);
      intro.style.setProperty('--sigil-scale', String(Math.min(bounds.width / emblem.offsetWidth, bounds.height / emblem.offsetHeight)));
    }
    skip.focus({ preventScroll: true });
    timer = setTimeout(closeIntro, 4400);
    try { sessionStorage.setItem('theater-intro-v10-seen', '1'); } catch { /* Private storage is optional. */ }
  }

  skip?.addEventListener('click', closeIntro);
  replay?.addEventListener('click', openIntro);
  document.querySelector('#experience-intro')?.addEventListener('click', openIntro);
  window.addEventListener('pagehide', closeIntro);
  intro?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); closeIntro(); }
    if (event.key === 'Tab') { event.preventDefault(); skip?.focus(); }
  });
  function syncMotion() {
    if (replay) replay.hidden = !intro || !shell || !skip || motionOff();
    if (motionOff()) {
      closeIntro();
      document.querySelectorAll('.will-reveal').forEach((node) => node.classList.add('is-visible'));
    }
  }
  reduced.addEventListener('change', syncMotion);
  document.addEventListener('theater-effects-change', syncMotion);
  syncMotion();

  let seen = false;
  try { seen = sessionStorage.getItem('theater-intro-v10-seen') === '1'; } catch { /* Continue without storage. */ }
  if (document.body.dataset.page === 'home' && !seen) openIntro();
  if (!active) document.body.classList.add('scene-entered');

  if (!motionOff() && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) { target.classList.add('is-visible'); observer.unobserve(target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    document.querySelectorAll('.reveal').forEach((node) => { node.classList.add('will-reveal'); observer.observe(node); });
    document.addEventListener('focusin', (event) => event.target.closest?.('.will-reveal')?.classList.add('is-visible'));
  }

  const work = document.querySelector('.work-layout');
  const projectTabs = [...document.querySelectorAll('.project-tabs a[data-project]')];
  const projects = projectTabs.map((tab) => ({ tab, pane: document.getElementById(tab.dataset.project) })).filter(({ pane }) => pane);
  if (work && projects.length) {
    function selectProject(project) {
      projects.forEach(({ tab, pane }) => {
        const selected = tab === project.tab;
        pane.hidden = !selected;
        tab.classList.toggle('is-active', selected);
        if (selected) tab.setAttribute('aria-current', 'true');
        else tab.removeAttribute('aria-current');
      });
    }
    projects.forEach((project, index) => {
      project.tab.setAttribute('aria-controls', project.pane.id);
      project.tab.addEventListener('click', (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        selectProject(project);
      });
      project.tab.addEventListener('keydown', (event) => {
        let next;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % projects.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + projects.length - 1) % projects.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = projects.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        selectProject(projects[next]);
        projects[next].tab.focus({ preventScroll: true });
      });
    });
    const selectHashProject = () => {
      const project = projects.find(({ pane }) => `#${pane.id}` === location.hash);
      if (project) {
        selectProject(project);
        project.pane.scrollIntoView({ block: 'start' });
      }
    };
    document.querySelectorAll('.hero-project-index a[href]').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const project = projects.find(({ pane }) => `#${pane.id}` === link.hash);
        if (project) selectProject(project);
      });
    });
    selectProject(projects[0]);
    work.classList.add('enhanced');
    selectHashProject();
    window.addEventListener('hashchange', selectHashProject);
  }

  if (document.body.dataset.page !== 'home') return;
  const railLinks = [...document.querySelectorAll('.section-rail a[data-section]')];
  const mainLinks = [...document.querySelectorAll('.main-nav a[href]')];
  const sectionNumber = document.querySelector('#section-number');
  const sectionLabel = document.querySelector('#section-label');
  const labels = { about: 'INDEX', projects: 'WORKS', journal: 'NOTES', profile: 'PROFILE' };
  const sections = railLinks.map((link) => ({ link, node: document.getElementById(link.dataset.section) })).filter(({ node }) => node);
  function markSection(section) {
    sections.forEach(({ link }) => {
      const current = link === section.link;
      link.classList.toggle('is-active', current);
      if (current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    mainLinks.forEach((link) => {
      const current = link.hash === `#${section.node.id}`;
      link.classList.toggle('is-active', current);
      if (current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (sectionNumber) sectionNumber.textContent = String(sections.indexOf(section) + 1).padStart(2, '0');
    if (sectionLabel) sectionLabel.textContent = labels[section.node.id] || section.node.id.toUpperCase();
  }
  if (sections.length) {
    markSection(sections.find(({ node }) => `#${node.id}` === location.hash) || sections[0]);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) markSection(sections.find(({ node }) => node === visible.target));
      }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
      sections.forEach(({ node }) => observer.observe(node));
    }
  }
})();
