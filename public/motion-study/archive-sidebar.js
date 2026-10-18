const ease = (time, start, end) => {
  const value = Math.max(0, Math.min(1, (time - start) / (end - start)));
  return value * value * (3 - 2 * value);
};

export function createArchiveSidebar(stage) {
  const sidebar = stage?.querySelector('.a-sidebar');
  const inner = sidebar?.querySelector('.armor-inner');
  if (!sidebar || !inner) throw new Error('Archive sidebar assembly requires the A sidebar.');
  const style = document.createElement('style');
  style.dataset.archiveAssemblyStyle = '';
  style.textContent = `
    .a-sidebar .archive-assembly{position:absolute;inset:0;z-index:3;pointer-events:none;color:#a3e6df}
    .a-sidebar .archive-assembly-grid{position:absolute;left:40px;top:205px;width:203px;height:237px;background:repeating-linear-gradient(0deg,transparent 0 77px,#92c4c321 78px,transparent 79px),repeating-linear-gradient(90deg,transparent 0 66px,#92c4c31c 67px,transparent 68px)}
    .a-sidebar .archive-glyph-slot{position:absolute;left:107px;top:205px;width:69px;height:75px;display:grid;place-content:center;border:1px solid #8bbdb920;background:radial-gradient(ellipse,#85d6cc08,transparent 75%);transform-origin:center}
    .a-sidebar .archive-glyph-slot:nth-of-type(3){top:286px}.a-sidebar .archive-glyph-slot:nth-of-type(4){top:367px}
    .a-sidebar .archive-glyph-slot::before,.a-sidebar .archive-glyph-slot::after{content:'';position:absolute;width:7px;height:7px;border:solid #9ed1c794;border-width:1px 0 0 1px;top:-1px;left:-1px}
    .a-sidebar .archive-glyph-slot::after{inset:auto -1px -1px auto;border-width:0 1px 1px 0}
    .a-sidebar .archive-glyph-slot>svg{display:block;width:53px;height:56px;max-width:none;max-height:none;overflow:visible;fill:currentColor;stroke:none;filter:drop-shadow(0 0 3px #9deedf28)}
    .a-sidebar .archive-glyph-slot>svg.archive-outline-glyph{fill:none;stroke:currentColor;stroke-width:2}
    .a-sidebar .archive-glyph-slot>svg.archive-triangle-glyph{width:60px;height:58px;fill:none;stroke:currentColor}
    .a-sidebar .archive-assembly-tile{position:absolute;left:40px;top:286px;width:68px;height:76px;background:#41646662;border:1px solid #9bc8c543;clip-path:polygon(0 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%)}
    .a-sidebar .archive-assembly-tile.second{left:175px;top:367px;background:#34525330}
    .a-sidebar[data-archive-assembly] .armor-inner>.waveform{transform-origin:left center}
  `;
  stage.append(style);
  sidebar.dataset.archiveAssembly = '';

  const assembly = document.createElement('div');
  assembly.className = 'archive-assembly';
  assembly.setAttribute('aria-hidden','true');
  assembly.innerHTML = '<div class="archive-assembly-grid"></div>';
  const glyphSources = [
    sidebar.querySelector('.sigils .sigil svg'),
    sidebar.querySelector('.operator-symbols svg'),
    stage.querySelector('.emblem-panel svg')
  ];
  if (glyphSources.some(node => !node)) throw new Error('Archive assembly requires the existing native glyphs.');
  const glyphs = glyphSources.map((source,index) => {
    const slot = document.createElement('div');
    slot.className = 'archive-glyph-slot';
    const glyph = source.cloneNode(true);
    glyph.removeAttribute('style');
    glyph.removeAttribute('id');
    glyph.setAttribute('aria-hidden','true');
    if (index === 1) glyph.classList.add('archive-outline-glyph');
    if (index === 2) glyph.classList.add('archive-triangle-glyph');
    glyph.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    slot.append(glyph);
    assembly.append(slot);
    return slot;
  });
  const tiles = [0,1].map(index => {
    const tile = document.createElement('i');
    tile.className = `archive-assembly-tile${index ? ' second' : ''}`;
    assembly.append(tile);
    return tile;
  });
  sidebar.append(assembly);

  const gauges = [...inner.querySelectorAll('.small-gauges .mini-ring')];
  const ledger = inner.querySelector('.gauge-ledger');
  const waves = [...inner.querySelectorAll(':scope > .waveform')];
  const sigils = inner.querySelector('.sigils');
  const signalLabel = inner.querySelectorAll(':scope > .mini-label')[1];
  const operatorStrip = inner.querySelector('.slash-strip.muted');
  const operator = inner.querySelector('.operator');
  const avatar = operator?.querySelector('img');
  const operatorName = operator?.querySelector('b');
  const operatorCopy = operator?.querySelector('small');
  const operatorSymbols = operator?.querySelector('.operator-symbols');
  const note = inner.querySelector('.side-note');
  const setOpacity = (node, value) => { if (node) node.style.opacity = value.toFixed(4); };
  const reveal = (node, value) => {
    if (!node) return;
    node.style.opacity = value.toFixed(4);
    node.style.clipPath = `inset(0 ${(1-value)*100}% 0 0)`;
  };

  return function render(time, sequence) {
    if (sequence !== 'a') { assembly.hidden = true; return; }
    assembly.hidden = false;
    const t = Number.isFinite(time) ? Math.max(0, Math.min(10,time)) : 0;
    const collapse = ease(t,3.65,4.38);
    const vertical = 1-collapse;
    assembly.style.opacity = vertical.toFixed(4);
    glyphs.forEach((slot,index) => {
      const appear = ease(t,2.08+index*.17,2.38+index*.17);
      slot.style.opacity = appear.toFixed(4);
      slot.style.transform = `translateY(${(1-appear)*14}px) scale(${.82+appear*.18})`;
    });
    tiles.forEach((tile,index) => {
      const appear=ease(t,2.19+index*.24,2.54+index*.24);
      tile.style.opacity=(appear*.9).toFixed(4);
      tile.style.clipPath=`inset(0 ${(1-appear)*100}% 0 0)`;
    });
    gauges.forEach((gauge,index)=>setOpacity(gauge,ease(t,4.10+index*.06,4.55+index*.06)));
    setOpacity(ledger,ease(t,2.02,2.38));
    reveal(waves[0],ease(t,4.13,4.73));
    reveal(sigils,ease(t,4.16,4.63));
    reveal(signalLabel,ease(t,4.42,4.79));
    reveal(waves[1],ease(t,5.06,5.53));

    // The first load and the camera's return are separate assembly beats in the source.
    const returning = t >= 4;
    reveal(operatorStrip,returning ? ease(t,4.38,4.70) : ease(t,2.34,2.68));
    setOpacity(operator,returning ? ease(t,4.49,4.82) : 1);
    setOpacity(avatar,returning ? ease(t,4.73,5.15) : ease(t,2.62,3.04));
    reveal(operatorName,returning ? ease(t,4.53,4.93) : ease(t,2.42,2.73));
    reveal(operatorCopy,returning ? ease(t,4.65,5.06) : ease(t,2.69,3.02));
    reveal(operatorSymbols,returning ? ease(t,4.77,5.16) : ease(t,2.84,3.10));
    reveal(note,returning ? ease(t,4.76,5.25) : ease(t,2.83,3.12));
  };
}
