const clamp = value => Math.max(0, Math.min(1, value));
const svg = (viewBox, content, className) => `<svg class="${className}" viewBox="${viewBox}" aria-hidden="true">${content}</svg>`;

export function createInstrumentDetail(stage) {
  if (!stage?.querySelector) throw new TypeError('Instrument detail requires the motion-study stage.');
  const dashboard = stage.querySelector('.dashboard');
  const wireWindow = stage.querySelector('.wire-window');
  const wireLog = stage.querySelector('.wire-log');
  const wireSpecs = stage.querySelector('.wire-specs');
  if (!dashboard || !wireWindow || !wireLog || !wireSpecs) throw new Error('Instrument detail requires dashboard and wire-scene panels.');

  const style = document.createElement('style');
  style.dataset.instrumentStyle = '';
  style.textContent = `
    .stage .instrument-detail{pointer-events:none;box-sizing:border-box;color:#acc2c3;font-family:Consolas,monospace}
    .stage .instrument-detail svg{display:block}
    .stage .instrument-leaders{position:absolute;inset:0;width:1280px;height:720px;overflow:visible;z-index:2;fill:none;stroke:#b9d9d2;stroke-width:.8}
    .stage .instrument-leaders text{fill:#bdcfcc;stroke:none;font:8px Consolas,monospace;letter-spacing:.4px}
    .stage .instrument-leaders .leader-end{fill:#d9f4e8;stroke:none}
    .stage .instrument-leaders .leader-box{fill:#101b21bf;stroke:#adc9c75c;stroke-width:.5}
    .stage .dashboard:has(.instrument-leaders) .dashboard-label{width:103px;height:22px;font:8px/13px Consolas,monospace;padding:4px 6px;background:#506669ab}
    .stage .dashboard:has(.instrument-leaders) .dashboard-label>small{display:none}
    .stage .dashboard:has(.instrument-leaders) .dashboard-label.right{left:448px;right:auto;top:75px}
    .stage .instrument-readout{position:absolute;left:1081px;top:141px;width:110px;border:1px solid #8ea9aa80;background:#0b141aaf;padding:0 5px 5px;z-index:3}
    .stage .instrument-readout h4{margin:0 -5px 6px;padding:3px 6px;background:#a1d5cf;color:#14262a;font:7px/10px Consolas,monospace;letter-spacing:1px}
    .stage .instrument-readout dl{margin:0}.stage .instrument-readout dl>div{display:flex;justify-content:space-between;font-size:6px;line-height:13px;border-bottom:1px solid #aac9c318}
    .stage .instrument-readout dt,.stage .instrument-readout dd{margin:0}.stage .instrument-readout dd{color:#d5e6df}
    .stage .instrument-mini-dials{display:flex;justify-content:space-around;border-top:1px solid #8fa9a85c;padding-top:6px;margin-top:6px}
    .stage .instrument-mini-dials svg{width:43px;height:34px;stroke:#aaccc5;fill:none;stroke-width:1.4}
    .stage .instrument-mini-dials text{font:5px Consolas,monospace;fill:#adcbc0;stroke:none}
    .stage .instrument-meter{position:absolute;right:0;top:12px;width:155px;height:59px;background:#0b1319ed;z-index:2}
    .stage .data-row:has(.instrument-meter)>.data-lines{visibility:hidden}
    .stage .data-row.right>.instrument-meter{width:221px}
    .stage .instrument-meter table{border-collapse:collapse;width:100%;font:7px/11px Consolas,monospace;color:#c0cdcb}
    .stage .instrument-meter td{padding:0 3px;height:11px;border-bottom:1px solid #a1bfc226;white-space:nowrap}
    .stage .instrument-meter td:first-child{width:46px;color:#a8babe;background:#5a6f7924}
    .stage .instrument-meter td:last-child{width:24px;text-align:right;font-size:6px;color:#c8ddd4}
    .stage .instrument-meter td:nth-child(2){min-width:40px;padding-inline:3px}
    .stage .instrument-meter .meter-track{display:block;height:5px;background:#42555b91}
    .stage .instrument-meter .meter-track i{display:block;height:100%;background:#c1d0ca;transform-origin:left}
    .stage .instrument-row-caption{position:absolute;left:4px;right:3px;top:-10px;display:flex;justify-content:space-between;font:6px/9px Consolas,monospace;color:#d0dcdb;letter-spacing:.3px}
    .stage .instrument-chart-labels{position:absolute;inset:0;pointer-events:none}
    .stage .instrument-chart-axes{position:absolute;inset:0;width:100%;height:100%;overflow:visible;z-index:2;stroke-dasharray:none;stroke-dashoffset:0;pointer-events:none}
    .stage .instrument-chart-axes text{font:6px Consolas,monospace;fill:#91a9a9;stroke:none}
    .stage .instrument-chart-axes .axis-rule{stroke:#b4cbc65e;stroke-width:.65;fill:none}
    .stage .instrument-chart-axes .axis-dot{fill:#b6e8da;stroke:none}
    .stage .instrument-secondary-line{fill:none;stroke:#b3ede0;stroke-width:1.5;stroke-dasharray:1}
    .stage .bar-chart{left:117px;width:272px;bottom:108px;height:145px;gap:11px;padding:10px 9px 0}
    .stage .bar-chart i{background:linear-gradient(0deg,#57bad0,#d7de71)}
    .stage .bar-chart i:nth-child(3){background:linear-gradient(0deg,#b176a4,#ea7fac)}
    .stage .bar-chart i:nth-child(4){background:linear-gradient(0deg,#57bad0,#d7de71)}
    .stage .line-chart{left:883px;right:auto;width:285px;bottom:110px;height:147px}
    .stage .line-chart>svg{stroke-dasharray:none;stroke-dashoffset:0;clip-path:inset(0 calc((1 - var(--series-progress,0))*100%) 0 0)}
    .stage .instrument-chart-axes .chart-sample{font-size:6px;fill:#8dafa5}
    .stage .instrument-callouts{position:absolute;inset:0;width:100%;height:100%;overflow:visible;fill:none;stroke:#a7c7c580;stroke-width:.75;z-index:3;pointer-events:none}
    .stage .instrument-callouts text{font:6px Consolas,monospace;fill:#afc8c3;stroke:none;letter-spacing:.3px}
    .stage .instrument-callouts circle{fill:#c8e7db;stroke:none}
    .stage .instrument-callouts .annotation-slot{stroke:#d1e4dc6b;stroke-width:.6;fill:#a7c6bc14}
    .stage .wire-log:has(>.instrument-log)>p,.stage .wire-specs:has(>.instrument-spec-table)>p{display:none}
    .stage .instrument-log{list-style:none;padding:0 0 0 6px;margin:10px 0 0;border-left:1px solid #b3c9c956;font:8px/14px Consolas,monospace;color:#aabfc0}
    .stage .instrument-log li{position:relative;padding-left:7px;white-space:nowrap}
    .stage .instrument-log li::before{content:'';position:absolute;left:-6px;top:7px;width:6px;border-top:1px solid #b3c9c95e}
    .stage .instrument-log li[data-group]{margin-top:6px;color:#d2ded7}
    .stage .instrument-log li[data-level='1']{padding-left:15px;color:#91abad}
    .stage .instrument-log b{font-weight:400;color:#d2e2d9}.stage .instrument-log small{float:right;font-size:6px;color:#769a94}
    .stage .instrument-log-footer{position:absolute;left:17px;right:15px;bottom:10px;display:flex;justify-content:space-between;border-top:1px solid #8daea742;padding-top:5px;font:6px/1.5 Consolas,monospace;color:#718f8d}
    .stage .instrument-spec-table{width:100%;border-collapse:collapse;margin-top:6px;font:8px/16px Consolas,monospace;color:#aec4c3}
    .stage .instrument-spec-table td{padding:1px 6px;border-bottom:1px solid #8aaba825}
    .stage .instrument-spec-table td:first-child{border-left:1px solid #a5c3c579}
    .stage .instrument-spec-table td:last-child{text-align:right;color:#d0ded6}
    .stage .instrument-spec-table tr[data-emphasis]{background:#9cb4b140;color:#eef7ed}
    .stage .instrument-spec-table tr[data-divider] td{border-top:1px solid #b8d0c763}
    .stage .instrument-spec-footer{display:flex;justify-content:space-between;margin:7px 4px 0;padding-top:5px;border-top:1px solid #9fbcbc3d;font:6px/1.6 Consolas,monospace;color:#7ea29c}
  `;
  stage.append(style);

  function append(parent, tag, className, markup) {
    const node = document.createElement(tag);
    node.className = `instrument-detail ${className}`;
    node.setAttribute('aria-hidden', 'true');
    node.innerHTML = markup;
    parent.append(node);
    return node;
  }

  const leaders = append(dashboard, 'div', 'instrument-leader-layer', svg('0 0 1280 720', `
    <path d="M195 94 222 121 237 134M299 144 341 104H398M204 269 166 296H103M303 250 354 263H407M548 93 578 131 602 147M992 119 1046 92H1134M1005 255 1033 280H1077"/>
    <path d="M450 79v-6h7M1077 139h-7v130h7M104 464v-7h12M1174 464v-7h-12" opacity=".65"/>
    <g class="leader-end"><circle cx="237" cy="134" r="2"/><circle cx="299" cy="144" r="2"/><circle cx="204" cy="269" r="2"/><circle cx="303" cy="250" r="2"/><circle cx="602" cy="147" r="2"/><circle cx="992" cy="119" r="2"/><circle cx="1005" cy="255" r="2"/></g>
    <path class="leader-box" d="M342 87h68v17h-68zM1045 75h89v17h-89z"/>
    <text x="346" y="99">084 / DEMO</text><text x="1049" y="87">ORBIT / 02</text><text x="103" y="289">SPHERE.360</text><text x="358" y="258">Z / 0.84</text>
  `, 'instrument-leaders'));
  leaders.style.cssText = 'position:absolute;inset:0;pointer-events:none';
  const readout = append(dashboard, 'aside', 'instrument-readout', `<h4>DEMO / ORBIT</h4><dl>
    <div><dt>SEQUENCE</dt><dd>A / 01</dd></div><div><dt>FRAME</dt><dd data-instrument-frame>000</dd></div>
    <div><dt>TIME / SEC</dt><dd data-instrument-time>0.00</dd></div><div><dt>SOURCE FPS</dt><dd>24.00</dd></div>
    </dl><div class="instrument-mini-dials">${[0,1].map(index => svg('0 0 44 34', `<path d="M7 22a15 15 0 0 1 30 0M10 22a12 12 0 0 1 24 0" opacity=".6"/><path d="M22 22 15 13" data-instrument-needle="${index}"/><circle cx="22" cy="22" r="2"/><text x="6" y="32">${index ? 'PHASE B' : 'PHASE A'}</text>`, '')).join('')}</div>`);

  const values = [[83,60,32,46,18],[76,63,24,39,12]];
  const meterBars = [];
  dashboard.querySelectorAll('.data-row').forEach((row, side) => {
    append(row, 'div', 'instrument-row-caption', `<span>构图样本 / DEMO</span><span>0${side+1} / 05</span>`);
    const meter = append(row, 'div', 'instrument-meter', `<table><tbody>${['结构','轮廓','光照','节奏','背景'].map((label, index) => `<tr><td>${label}</td><td><span class="meter-track"><i style="width:${values[side][index]}%"></i></span></td><td>${values[side][index]}%</td></tr>`).join('')}</tbody></table>`);
    meterBars.push(...meter.querySelectorAll('.meter-track i'));
  });

  const tracePoints = [[16,63],[36,32],[69,18],[113,51],[148,26],[182,67],[232,7]];
  const tracePath = tracePoints.map(([x,y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join('');
  dashboard.querySelectorAll('.dashboard-chart').forEach((chart, index) => {
    const labelsX = Array.from({length:10},(_,i)=>`<text x="${13+i*30}" y="157" text-anchor="middle">${String(i+1).padStart(2,'0')}</text>`).join('');
    const labelsY = Array.from({length:6},(_,i)=>`<text x="-8" y="${145-i*28}" text-anchor="end">${String(i*20).padStart(3,'0')}</text>`).join('');
    const ticks = Array.from({length:11},(_,i)=>`M${i*30} 145v3`).join('');
    const overlay = index ? '' : `<path class="instrument-secondary-line" pathLength="1" d="${tracePath}"/>${tracePoints.map(([x,y])=>`<circle class="axis-dot" cx="${x}" cy="${y}" r="2"/>`).join('')}`;
    append(chart, 'div', 'instrument-chart-labels', svg('0 0 305 145', `<path class="axis-rule" d="M0 0V145H305${ticks}"/>${labelsX}${labelsY}${overlay}<text class="chart-sample" x="0" y="-8">${index ? '02 / SIGNAL ENVELOPE' : '01 / COMPOSITION SAMPLES'} — DEMO</text>`, 'instrument-chart-axes'));
  });

  const callouts = append(wireWindow, 'div', 'instrument-annotation-layer', svg('0 0 494 371', `
    <path class="annotation-slot" d="M12 13h76v7H12zM14 15h61v3H14z"/>
    <path d="M360 14h13m4 0h3m4 0h3M385 12v4m4-4v4m4-4v4" opacity=".6"/>
    <path data-instrument-leader d="M18 250H64L160 135"/><circle data-instrument-anchor cx="160" cy="135" r="2"/>
    <path d="M326 175 371 143H465"/><circle cx="326" cy="175" r="2"/>
    <path d="M321 276 345 308H425"/><circle cx="321" cy="276" r="2"/>
    <text x="18" y="244">01 / AXIAL SHELL</text><text x="380" y="137">02 / COLLAR</text><text x="348" y="320">03 / TERMINAL RIM</text>
    <text x="16" y="350">DEMO MESH / <tspan data-instrument-model-frame>000</tspan> F</text>
  `, 'instrument-callouts'));
  callouts.style.cssText = 'position:absolute;inset:0;pointer-events:none';

  const log = append(wireLog, 'ol', 'instrument-log', `
    <li data-group>01　同轴外壳 <small>DEMO</small></li><li data-level="1">├─ 主轮廓 / CYLINDER</li><li data-level="1">└─ 环形截面 / COLLAR</li>
    <li data-group>02　显示分层</li><li data-level="1">├─ 表面 / 低透明度</li><li data-level="1">├─ 线框 / 深度排序</li><li data-level="1">└─ 标注 / 独立平面</li>
    <li data-group>03　回放观测</li><li data-level="1">├─ 当前帧 / <b data-instrument-frame>000</b></li><li data-level="1">├─ 时间 / <b data-instrument-time>0.00</b> s</li><li data-level="1">└─ 参考片段 / B</li>`);
  append(wireLog, 'div', 'instrument-log-footer', '<span>LOCAL DEMONSTRATION</span><span>NO TELEMETRY</span>');

  const specs = [
    ['数据性质','构图演示'],['参考帧率','24.000'],['画幅宽度','1280'],['画幅高度','720'],
    ['序列编号','02 / B'],['时间位置','<span data-instrument-time>0.00</span> s'],['参考帧号','<span data-instrument-frame>000</span>'],
    ['回放进度','<span data-instrument-progress>0.0</span>%'],['轮廓分类','同轴组件'],['结构层次','外壳 / 内环'],
    ['视图投影','透视'],['表面显示','半透明'],['前后关系','深度排序'],['控制来源','统一时间轴']
  ];
  append(wireSpecs, 'table', 'instrument-spec-table', `<tbody>${specs.map(([label,value],index)=>`<tr${index===7?' data-emphasis=""':''}${index===4||index===8?' data-divider=""':''}><td>${label}</td><td>${value}</td></tr>`).join('')}</tbody>`);
  append(wireSpecs, 'div', 'instrument-spec-footer', '<span>REFERENCE / 10.005 SEC</span><span>DEMO DATA</span>');

  const frames = [readout, log, wireSpecs].flatMap(node => [...node.querySelectorAll('[data-instrument-frame]')]);
  const times = [readout, log, wireSpecs].flatMap(node => [...node.querySelectorAll('[data-instrument-time]')]);
  const progressLabel = wireSpecs.querySelector('[data-instrument-progress]');
  const modelFrame = callouts.querySelector('[data-instrument-model-frame]');
  const leader = callouts.querySelector('[data-instrument-leader]');
  const anchor = callouts.querySelector('[data-instrument-anchor]');
  const trace = dashboard.querySelector('.instrument-secondary-line');
  const needles = [...readout.querySelectorAll('[data-instrument-needle]')];

  return function render(time, sequence) {
    const seconds = Number.isFinite(time) ? Math.max(0, Math.min(10, time)) : 0;
    const frame = String(Math.min(239, Math.floor(seconds * 24 + .0001))).padStart(3,'0');
    if (sequence === 'a') {
      const growth = clamp((seconds - 7.35) / .65);
      meterBars.forEach(bar => { bar.style.transform = `scaleX(${growth})`; });
      const traceGrowth=clamp((seconds-7.4)/.8);
      trace.style.strokeDashoffset = String(1-traceGrowth);
      dashboard.querySelectorAll('.bar-chart .axis-dot').forEach((dot,index)=>{dot.style.opacity=tracePoints[index][0]<=305*traceGrowth?'1':'0'});
      needles.forEach((needle,index)=>needle.setAttribute('transform',`rotate(${Math.sin(seconds*.6+index)*28} 22 22)`));
    } else if (sequence === 'b') {
      const orbit = clamp((seconds - 3.35) / 1.05);
      const x = 182 - orbit * 46;
      const y = 113 + orbit * 36;
      leader.setAttribute('d',`M18 250H64L${x.toFixed(2)} ${y.toFixed(2)}`);
      anchor.setAttribute('cx',x.toFixed(2));
      anchor.setAttribute('cy',y.toFixed(2));
      modelFrame.textContent = frame;
    }
    frames.forEach(node => { node.textContent = frame; });
    times.forEach(node => { node.textContent = seconds.toFixed(2); });
    progressLabel.textContent = (seconds * 10).toFixed(1);
  };
}
