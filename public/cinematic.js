(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = () => document.body.dataset.effects !== 'off' && (!reduced.matches || document.body.dataset.motion === 'full');
  const radar = document.querySelector('#archive-radar');
  const intro = document.querySelector('#intro');
  const introCanvas = document.querySelector('#intro-canvas');
  const percent = document.querySelector('#intro-percent');
  let frame = 0, visible = true, introStart = 0, introWasOpen = false, pageActive = true;
  const layers = [radar, introCanvas].filter(Boolean).map(canvas => ({ canvas, ctx: canvas.getContext('2d'), width: 0, height: 0 }));
  const TAU = Math.PI * 2;
  function resize(layer) {
    const rect = layer.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (layer.width !== rect.width || layer.height !== rect.height || layer.dpr !== dpr) {
      layer.width = rect.width; layer.height = rect.height; layer.dpr = dpr;
      layer.canvas.width = Math.round(rect.width * dpr); layer.canvas.height = Math.round(rect.height * dpr);
      layer.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    return true;
  }
  function field(layer, seconds, opening) {
    if (!layer.ctx || !resize(layer)) return;
    const {ctx:c,width:w,height:h} = layer;
    c.clearRect(0, 0, w, h);
    const radius = Math.min(w, h) * (opening ? .32 : .37);
    const elapsed = opening ? Math.min(seconds, 4.4) : seconds;
    const assemble = opening ? Math.min(1, elapsed / 1.3) : 1;
    const scale = opening ? 1.45 - .45 * (1 - Math.pow(1-assemble,3)) : 1;
    c.save(); c.translate(w/2,h/2); c.scale(scale,scale);
    c.globalAlpha = opening ? Math.min(1,elapsed*3) * Math.min(1,Math.max(0,(3.75-elapsed)*2.5)) : 1;
    const arc = (r,a,b,color,line=1) => {c.beginPath(); c.strokeStyle=color; c.lineWidth=line; c.arc(0,0,r,a,b);c.stroke();};
    const line = (x1,y1,x2,y2,color,width=1) => {c.beginPath();c.strokeStyle=color;c.lineWidth=width;c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();};
    // All marks are deterministic, so a paused frame and the reduced-motion view stay stable.
    for(let i=0;i<120;i++) {
      const a=i*TAU/120, major=i%10===0, r=radius*1.14;
      line(Math.cos(a)*r,Math.sin(a)*r,Math.cos(a)*(r+(major?12:4)),Math.sin(a)*(r+(major?12:4)),major?'#779991':'#28433f');
      if(major){c.fillStyle='#6c8782';c.font='8px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText(String(i*3).padStart(3,'0'),Math.cos(a)*(r+24),Math.sin(a)*(r+24));}
    }
    [1.09,1,.91,.72,.64,.39,.34,.2].forEach((factor,i)=>arc(radius*factor,0,TAU,i===3?'#94eee06b':'#94eee026',i===3?2:1));
    const spin=elapsed*(opening?.6:.12);
    for(let j=0;j<3;j++) {
      const a=spin*(j%2?-1:1)+j*2.1;
      arc(radius*(.94-j*.105),a,a+1.15,j===1?'#e1e956a0':'#adfff1ae',j===1?2:3);
      arc(radius*(.94-j*.105),a+Math.PI,a+Math.PI+.48,'#94eee065',2);
    }
    for(let i=0;i<4;i++){const a=i*Math.PI/2;line(Math.cos(a)*radius*.23,Math.sin(a)*radius*.23,Math.cos(a)*radius*1.28,Math.sin(a)*radius*1.28,'#94eee02a');}
    c.save();c.rotate(-spin*.38+Math.PI/4);c.strokeStyle='#94eee037';c.lineWidth=1;c.strokeRect(-radius*.83,-radius*.83,radius*1.66,radius*1.66);c.restore();
    const a=spin*.6;
    c.save();c.rotate(a);
    c.beginPath();for(let i=0;i<3;i++){const angle=i*TAU/3-Math.PI/2;const x=Math.cos(angle)*radius*.98,y=Math.sin(angle)*radius*.98;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.strokeStyle='#94eee04f';c.stroke();c.restore();
    // Scan fan and moving nodes remain behind readable, stationary DOM links.
    for(let i=0;i<22;i++){const a=spin-i*.009;line(Math.cos(a)*radius*.25,Math.sin(a)*radius*.25,Math.cos(a)*radius*.89,Math.sin(a)*radius*.89,`rgba(148,238,224,${.035*(1-i/22)})`);}
    [0.3,2.55,4.35].forEach((angle,i)=>{const a=angle+spin*.22,r=radius*(.61+i*.13),x=Math.cos(a)*r,y=Math.sin(a)*r;c.beginPath();c.arc(x,y,4,0,TAU);c.fillStyle=i===1?'#e1e956':'#a8ffed';c.fill();c.beginPath();c.arc(x,y,10+Math.sin(elapsed*1.4+i)*2,0,TAU);c.strokeStyle='#a8ffed44';c.stroke();});
    if(opening){
      for(let i=0;i<8;i++){const a=i*TAU/8+spin*.25,r=radius*(.55+Math.max(0,1-elapsed)*2);line(Math.cos(a)*r,Math.sin(a)*r,Math.cos(a+.12)*radius*3.2,Math.sin(a+.12)*radius*3.2,'#94eee050',i%2?1:2);}
    }else{
      for(let i=0;i<28;i++){const a=i*2.399+spin*.05,r=radius*(1.2+(i%5)*.08),x=Math.cos(a)*r,y=Math.sin(a)*r;c.fillStyle=i%7===0?'#e1e95666':'#94eee038';c.fillRect(x,y,i%7===0?3:1, i%7===0?3:1);}
    }
    c.restore();
  }
  function draw(now=performance.now()) {
    frame=0;
    if (!pageActive || document.hidden) return;
    const introOpen=!!intro && !intro.hidden;
    if(introOpen && !introWasOpen) introStart=now;
    introWasOpen=introOpen;
    const elapsed=(now-introStart)/1000;
    layers.forEach(layer=>{
      if(layer.canvas===introCanvas){if(introOpen)field(layer,elapsed,true);}
      else if(visible)field(layer,motion()?now/1000:0,false);
    });
    if(introOpen && percent)percent.textContent=String(Math.min(100,Math.floor(elapsed/4.1*100))).padStart(2,'0');
    if(motion() && ((visible && !!radar) || introOpen))frame=requestAnimationFrame(draw);
  }
  function sync(){cancelAnimationFrame(frame);frame=0;document.body.classList.toggle('cinematic-paused',document.hidden || !pageActive);draw();}
  if(radar && 'IntersectionObserver' in window)new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();},{threshold:0}).observe(radar);
  if(intro)new MutationObserver(()=>{if(intro.hidden)introWasOpen=false;sync();}).observe(intro,{attributes:true,attributeFilter:['hidden']});
  addEventListener('resize',sync);reduced.addEventListener('change',sync);document.addEventListener('theater-effects-change',sync);document.addEventListener('visibilitychange',sync);
  addEventListener('pagehide',()=>{pageActive=false;sync();});addEventListener('pageshow',()=>{pageActive=true;sync();});
  const transition=document.createElement('div');transition.className='chapter-transition';transition.setAttribute('aria-hidden','true');transition.innerHTML='<i></i><i></i><i></i><span>THEATER / ARCHIVE</span>';document.body.append(transition);
  let wipe=[];
  const cancelWipe=()=>{wipe.forEach(animation=>animation.cancel());wipe=[];};
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');
    if(!link || !motion() || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
    if(link.origin!==location.origin || link.pathname!==location.pathname || !link.hash || !document.getElementById(link.hash.slice(1)) || link.matches('[data-project]'))return;
    cancelWipe();
    wipe=[...transition.querySelectorAll('i')].map((node,index)=>node.animate([{transform:'translateX(-120%) skewX(-22deg)',opacity:0},{transform:'translateX(0) skewX(-22deg)',opacity:.96,offset:.42},{transform:'translateX(120%) skewX(-22deg)',opacity:0}],{duration:680,delay:index*60,easing:'cubic-bezier(.7,0,.2,1)'}));
    wipe.push(transition.querySelector('span').animate([{opacity:0},{opacity:1,offset:.4},{opacity:0}],{duration:700}));
  });
  document.addEventListener('theater-effects-change',()=>{if(!motion())cancelWipe();});
  sync();
})();
