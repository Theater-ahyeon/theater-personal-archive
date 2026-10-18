(() => {
  const canvas = document.querySelector('#hologram-canvas');
  if (!canvas) return;
  const stage = canvas.parentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  let gl, program, buffers = [], uniforms, frame = 0, visible = true, lost = false, disposed = false;
  let time = 0, previous = 0, width = 1, height = 1, dragging = false;
  const pointer = { x: 0, y: 0, rx: 0, ry: 0 };
  const vertexSource = `
    precision mediump float;
    attribute vec3 aPosition, aNormal, aColor;
    attribute float aSeed;
    uniform float uTime, uAspect, uMode, uPixel;
    uniform vec2 uPointer;
    varying vec3 vColor, vNormal, vPosition;
    varying float vDepth;
    mat3 rx(float a) { float c=cos(a),s=sin(a); return mat3(1.,0.,0.,0.,c,s,0.,-s,c); }
    mat3 ry(float a) { float c=cos(a),s=sin(a); return mat3(c,0.,-s,0.,1.,0.,s,0.,c); }
    void main() {
      vec3 p=aPosition;
      if(aSeed>0. && aSeed<10.) {
        float split=.065+.07*(.5+.5*sin(uTime*.52));
        p+=vec3(cos(aSeed*1.0472),sin(aSeed*2.)*.55,sin(aSeed*1.0472))*split;
        p.y+=sin(uTime*.7+aSeed)*.045;
      }
      mat3 rotation=rx(-.19+uPointer.y)*ry(.52+uTime*.105+uPointer.x);
      if(aSeed>=20.) rotation=rx(-.19+uPointer.y)*ry(.52+uTime*.035+uPointer.x);
      p=rotation*p;
      float distance=6.-p.z;
      gl_Position=vec4(p.x*2.45/uAspect,p.y*2.45,distance*1.01005-.201,distance);
      if(uMode==1.) gl_Position.z-=.001;
      gl_PointSize=(aSeed>30. ? 3.8 : 2.2)*uPixel;
      vPosition=p; vNormal=rotation*aNormal; vColor=aColor; vDepth=clamp((p.z+2.6)/5.2,.2,1.);
    }
  `;
  const fragmentSource = `
    precision mediump float;
    uniform float uTime, uMode;
    varying vec3 vColor, vNormal, vPosition;
    varying float vDepth;
    void main() {
      float scan=pow(max(0.,1.-abs(vPosition.y-(mod(uTime*.42,4.8)-2.4))/.10),3.);
      if(uMode==0.) {
        float light=.25+.75*abs(dot(normalize(vNormal),normalize(vec3(-.5,.8,1.))));
        float rim=pow(1.-abs(normalize(vNormal).z),3.);
        float grid=step(.965,fract(vPosition.y*27.))* .035;
        float glint=pow(max(0.,dot(reflect(-normalize(vec3(-.5,.8,1.)),normalize(vNormal)),vec3(0.,0.,1.))),28.);
        gl_FragColor=vec4(vColor*light+vec3(.18,.16,.12)*rim+vec3(.55,.45,.28)*glint+vec3(.4,.35,.23)*scan+grid,.88);
      } else {
        float alpha=(.27+vDepth*.55)+scan*.3;
        if(uMode==2.) {
          float d=length(gl_PointCoord-.5)*2.;
          alpha*=1.-smoothstep(.25,1.,d);
        }
        gl_FragColor=vec4(vColor*(.75+vDepth*.45)+scan*.2,alpha);
      }
    }
  `;
  const surfaces = [], edges = [], particles = [];
  const add = (list, p, normal, seed, color) => list.push(...p, ...normal, seed, ...color);
  function triangle(a, b, c, seed) {
    const ab = b.map((v, i) => v-a[i]), ac = c.map((v, i) => v-a[i]);
    const normal = [ab[1]*ac[2]-ab[2]*ac[1], ab[2]*ac[0]-ab[0]*ac[2], ab[0]*ac[1]-ab[1]*ac[0]];
    const length = Math.hypot(...normal);
    normal.forEach((v, i) => normal[i] = v/length);
    [a,b,c].forEach((p) => add(surfaces, p, normal, seed, [.18,.19,.21]));
    [a,b,b,c,c,a].forEach((p) => add(edges, p, [0,0,0], seed, [.70,.62,.44]));
  }
  function crystal(radius, length, center, seed, twist) {
    const point = (r, y, a) => [center[0]+Math.cos(a)*r, center[1]+y, center[2]+Math.sin(a)*r];
    const top = point(radius*.23, length*.6, twist), bottom = point(radius*.2, -length*.57, twist+Math.PI);
    const upper = [], lower = [];
    for(let i=0; i<5; i++) {
      upper.push(point(radius, length*.22, twist+i*Math.PI*.4));
      lower.push(point(radius*.8, -length*.26, twist+i*Math.PI*.4));
    }
    for(let i=0; i<5; i++) {
      const next=(i+1)%5;
      triangle(top, upper[i], upper[next], seed);
      triangle(upper[i], lower[i], upper[next], seed);
      triangle(upper[next], lower[i], lower[next], seed);
      triangle(lower[next], lower[i], bottom, seed);
    }
  }
  crystal(.55, 2.75, [0,.05,0], 0, .3);
  for(let i=0; i<6; i++) {
    const angle=(i+1)*Math.PI/3;
    crystal(.24+(i%2)*.055, 1.5+(i%3)*.25, [Math.cos(angle)*.8, Math.sin(i*2)*.2, Math.sin(angle)*.8], i+1, angle);
  }
  function orbitPoint(angle, radius, tilt, turn) {
    const x=Math.cos(angle)*radius, z=Math.sin(angle)*radius;
    return [x*Math.cos(turn)-z*Math.sin(tilt)*Math.sin(turn), x*Math.sin(turn)+z*Math.sin(tilt)*Math.cos(turn), z*Math.cos(tilt)];
  }
  [[1.9,.28,.08],[2.06,1.3,.52],[1.72,1.13,-.85],[2.24,.55,-.3]].forEach(([radius,tilt,turn], ring) => {
    const color=ring===1 ? [.76,.67,.36] : [.42,.42,.38];
    for(let i=0; i<192; i++) {
      const angle=i*Math.PI/96;
      if(i%48<38) {
        add(edges, orbitPoint(angle,radius,tilt,turn), [0,0,0], 20, color);
        add(edges, orbitPoint(angle+.0328,radius,tilt,turn), [0,0,0], 20, color);
      }
      if(i%8===0) {
        [radius-.015,radius+(i%24===0 ? .075 : .035)].forEach((r) => add(edges,orbitPoint(angle,r,tilt,turn),[0,0,0],20,color));
      }
      if(i%48===0) add(particles,orbitPoint(angle,radius,tilt,turn),[0,0,0],31,[.92,.87,.74]);
    }
  });
  // Deterministic dust keeps reloads and the reduced-motion composition identical.
  for(let i=0; i<76; i++) {
    const a=i*2.399963, radius=1.1+(i%13)/13*1.25, y=((i*37)%79)/79*3.7-1.85;
    add(particles,[Math.cos(a)*radius,y,Math.sin(a)*radius*.55],[0,0,0],30,[.61,.55,.40]);
  }
  function status(value) { canvas.dataset.status=value; canvas.dataset.renderer=value==='ready' ? 'webgl' : 'fallback'; stage.dataset.renderer=canvas.dataset.renderer; }
  function compile(type, source) {
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source); gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) {
      const reason=gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error(`Scene shader unavailable: ${reason}`);
    }
    return shader;
  }
  function initialize() {
    try {
      gl=canvas.getContext('webgl',{ alpha:true, antialias:true, powerPreference:'low-power', premultipliedAlpha:false });
      if(!gl) throw new Error('Scene context unavailable');
      const shaders=[compile(gl.VERTEX_SHADER,vertexSource),compile(gl.FRAGMENT_SHADER,fragmentSource)];
      program=gl.createProgram(); shaders.forEach((shader) => gl.attachShader(program,shader)); gl.linkProgram(program);
      shaders.forEach((shader) => gl.deleteShader(shader));
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(`Scene program unavailable: ${gl.getProgramInfoLog(program)}`);
      gl.useProgram(program);
      uniforms=Object.fromEntries(['Time','Aspect','Mode','Pointer','Pixel'].map((name) => [name,gl.getUniformLocation(program,`u${name}`)]));
      buffers=[surfaces,edges,particles].map((data) => {
        const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
        return { buffer, count:data.length/10 };
      });
      gl.enable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
      gl.clearColor(0,0,0,0); lost=false; status('ready'); resize();
      canvas.dispatchEvent(new CustomEvent('scene-ready')); sync();
    } catch(error) { console.warn('Hologram uses its static fallback.',error.message); status('fallback'); lost=true; cleanupGPU(); }
  }
  function draw() {
    if(!gl || lost || disposed) return;
    gl.viewport(0,0,canvas.width,canvas.height); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(uniforms.Time,time); gl.uniform1f(uniforms.Aspect,width/height);
    gl.uniform1f(uniforms.Pixel,Math.min(devicePixelRatio||1,1.5)); gl.uniform2f(uniforms.Pointer,pointer.rx,pointer.ry);
    buffers.forEach(({buffer,count}, mode) => {
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      [['Position',3,0],['Normal',3,3],['Seed',1,6],['Color',3,7]].forEach(([name,size,offset]) => {
        const location=gl.getAttribLocation(program,`a${name}`); gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location,size,gl.FLOAT,false,40,offset*4);
      });
      gl.uniform1f(uniforms.Mode,mode); gl.depthMask(mode===0);
      gl.blendFunc(gl.SRC_ALPHA,mode===0 ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
      gl.drawArrays([gl.TRIANGLES,gl.LINES,gl.POINTS][mode],0,count);
    });
    gl.depthMask(true);
  }
  const systemStatic = () => reduced.matches && document.body.dataset.motion!=='full';
  function canAnimate() { return !disposed && !lost && visible && !document.hidden && !systemStatic() && document.body.dataset.effects!=='off'; }
  function tick(now) {
    frame=0;
    if(!canAnimate()) { previous=0; return; }
    const delta=previous ? Math.min((now-previous)/1000,.05) : 0; previous=now; time+=delta;
    const ease=1-Math.exp(-delta*4);
    pointer.rx+=(pointer.x-pointer.rx)*ease; pointer.ry+=(pointer.y-pointer.ry)*ease;
    draw(); frame=requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame=0; previous=0;
    if(systemStatic()) { time=0; pointer.rx=pointer.ry=pointer.x=pointer.y=0; }
    draw(); if(canAnimate()) frame=requestAnimationFrame(tick);
  }
  function resize() {
    const rect=stage.getBoundingClientRect(); width=Math.max(rect.width,1); height=Math.max(rect.height,1);
    const ratio=Math.min(devicePixelRatio||1,1.5); canvas.width=Math.round(width*ratio); canvas.height=Math.round(height*ratio); draw();
  }
  function move(event) {
    if(!finePointer.matches || event.pointerType==='touch' || !canAnimate()) return;
    const rect=canvas.getBoundingClientRect();
    pointer.x=((event.clientX-rect.left)/rect.width-.5)*(dragging ? 2.6 : .9);
    pointer.y=((event.clientY-rect.top)/rect.height-.5)*(dragging ? 1.2 : .45);
  }
  const resetPointer=() => { if(!dragging) pointer.x=pointer.y=0; };
  function down(event) { if(event.pointerType==='mouse' && event.button===0 && canAnimate()) { dragging=true; canvas.setPointerCapture(event.pointerId); move(event); } }
  function up(event) { dragging=false; if(canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); }
  function cleanupGPU() { if(gl) { buffers.forEach(({buffer}) => gl.deleteBuffer(buffer)); if(program) gl.deleteProgram(program); } buffers=[]; program=null; }
  function contextLost(event) { event.preventDefault(); lost=true; cancelAnimationFrame(frame); frame=0; status('fallback'); }
  function contextRestored() { if(!disposed) initialize(); }
  const resizeObserver=new ResizeObserver(resize);
  const visibilityObserver=new IntersectionObserver(([entry]) => { visible=entry.isIntersecting; sync(); });
  resizeObserver.observe(stage); visibilityObserver.observe(stage);
  canvas.addEventListener('pointermove',move); canvas.addEventListener('pointerleave',resetPointer);
  canvas.addEventListener('pointerdown',down); canvas.addEventListener('pointerup',up); canvas.addEventListener('pointercancel',up);
  canvas.addEventListener('webglcontextlost',contextLost); canvas.addEventListener('webglcontextrestored',contextRestored);
  document.addEventListener('visibilitychange',sync); document.addEventListener('theater-effects-change',sync); reduced.addEventListener('change',sync);
  window.addEventListener('pagehide',(event) => {
    cancelAnimationFrame(frame); frame=0; previous=0;
    if(event.persisted) return;
    disposed=true; resizeObserver.disconnect(); visibilityObserver.disconnect(); cleanupGPU();
    document.removeEventListener('visibilitychange',sync); document.removeEventListener('theater-effects-change',sync); reduced.removeEventListener('change',sync);
    canvas.removeEventListener('pointermove',move); canvas.removeEventListener('pointerleave',resetPointer);
    canvas.removeEventListener('pointerdown',down); canvas.removeEventListener('pointerup',up); canvas.removeEventListener('pointercancel',up);
    canvas.removeEventListener('webglcontextlost',contextLost); canvas.removeEventListener('webglcontextrestored',contextRestored);
  });
  window.addEventListener('pageshow',(event) => { if(event.persisted) sync(); });
  initialize();
})();
