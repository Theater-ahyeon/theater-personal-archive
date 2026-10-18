import { drawWireDevice } from './wire-device.js';
import { drawDepthField } from './depth-field.js';
import { createFoldSequence } from './fold-sequence.js';
import { createInstrumentDetail } from './instrument-detail.js';
import { createEndingScene } from './ending-scene.js';
import { createArchiveCards } from './archive-cards.js';
import { createArchiveSidebar } from './archive-sidebar.js';
import { createWireAssembly } from './wire-assembly.js';
import { mountReferenceIdentity } from './reference-identity.js';
import { createEmblemAssembly } from './emblem-assembly.js';
const $ = (selector) => document.querySelector(selector);
const canvas = $('#scene');
const ctx = canvas.getContext('2d');
const dashboardBlurCanvas = document.createElement('canvas');
dashboardBlurCanvas.width = canvas.width; dashboardBlurCanvas.height = canvas.height;
const dashboardBlurContext = dashboardBlurCanvas.getContext('2d');
const stage = $('#stage');
mountReferenceIdentity(stage);
const renderFold = createFoldSequence(stage);
const renderInstrumentDetail = createInstrumentDetail(stage);
const drawEnding = createEndingScene();
const renderArchiveCards=createArchiveCards(stage);
const renderArchiveSidebar=createArchiveSidebar(stage);
const renderWireAssembly=createWireAssembly(stage);
const renderEmblemAssembly=createEmblemAssembly(stage);
const depthCanvas = document.createElement('canvas');
depthCanvas.id = 'depth-field'; depthCanvas.width = 1280; depthCanvas.height = 720;
depthCanvas.setAttribute('aria-hidden', 'true'); stage.append(depthCanvas);
const depthContext = depthCanvas.getContext('2d');
const foregroundCanvas = document.createElement('canvas');
foregroundCanvas.id = 'foreground-field'; foregroundCanvas.width = 1280; foregroundCanvas.height = 720;
foregroundCanvas.setAttribute('aria-hidden','true'); foregroundCanvas.style.zIndex='16'; stage.append(foregroundCanvas);
const foregroundContext=foregroundCanvas.getContext('2d');
const viewport = $('#viewport');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const duration = 10;
let sequence = 'a';
let time = reducedMotion.matches ? 6 : 0;
let playing = !reducedMotion.matches;
let lastStamp = 0;
let frame = 0;
const referenceVideo = $('#reference-video');
const referencePanel = $('#reference');
let videoFrame = null, referenceRevision = 0, playRevision = 0, presentedTime = null;
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const ease = (value) => { const n = clamp(value); return n * n * (3 - 2 * n); };
const progress = (t, start, end) => ease((t - start) / (end - start));
const visible = (t, enter, inEnd, exit, outEnd) => progress(t, enter, inEnd) * (1 - progress(t, exit, outEnd));
const layers = Object.fromEntries(['a-sidebar', 'article-scene', 'dashboard', 'endmark', 'b-sidebar', 'wire-scene', 'terminal', 'diamond-wipe'].map((id) => [id, $(`#${id}`)]));
const cards = [...document.querySelectorAll('.study-card')];
const chapters = {
  a: [[0, '几何校准'], [1.7, '框架装配'], [3.3, '空间展开'], [5.5, '文章档案'], [7.65, '数据构图'], [8.8, '字标解构']],
  b: [[0, '径向启动'], [1.6, '终端载入'], [3.6, '线框解析'], [5, '菱形重构'], [6.7, '控制中心'], [8.8, '持续扫描']],
};
const random = (seed) => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const stars = Array.from({ length: 170 }, (_, i) => ({ x: random(i + 1) * 1280, y: random(i + 301) * 720, size: random(i + 601) * 1.5 + .3 }));

for (const waveform of document.querySelectorAll('.waveform')) {
  const seed = Number(waveform.dataset.wave);
  for (let i = 0; i < 42; i++) {
    const bar = document.createElement('i');
    bar.style.height = `${8 + random(i + seed * 60) * 34}px`;
    waveform.append(bar);
  }
}
for (const selector of ['.bar-chart', '.terminal-bars']) {
  const target = $(selector);
  for (let i = 0; i < 11; i++) {
    const bar = document.createElement('i');
    bar.style.height = `${24 + random(i + 1843) * 72}%`;
    target.append(bar);
  }
}
const archiveBars=[...document.querySelectorAll('.bar-chart>i')];
const barFrames=[[7.2,[0,0,0,0,0,0,0,0,0,0,0]],[7.5,[60,90,66,72,62,24,11,8,8,0,0]],[7.8,[62,108,85,100,120,93,37,80,113,96,68]],[8,[60,103,83,96,119,92,36,83,119,124,117]]];

function line(x1, y1, x2, y2, color = '#86b6a8', width = 1) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function circle(x, y, radius, color = '#99d0bc', width = 1, start = 0, end = Math.PI * 2) {
  ctx.beginPath(); ctx.arc(x, y, Math.max(0, radius), start, end); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function polygon(x, y, radius, sides, angle, color, width = 1) {
  ctx.beginPath();
  for (let i = 0; i <= sides; i++) {
    const a = angle + i / sides * Math.PI * 2;
    if (i === 0) ctx.moveTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
    else ctx.lineTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
  }
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function label(text, x, y, color = '#8fac98', size = 7) {
  ctx.fillStyle = color; ctx.font = `${size}px Consolas, Arial, sans-serif`; ctx.fillText(text, x, y);
}
function background(t) {
  ctx.clearRect(0, 0, 1280, 720);
  const glow = ctx.createRadialGradient(640, 430, 30, 640, 390, 760);
  glow.addColorStop(0, sequence === 'a' ? '#0d171c' : '#0b1218'); glow.addColorStop(1, sequence === 'a' ? '#070d12' : '#020406');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, 1280, 720);
  ctx.save();
  ctx.shadowBlur = 0;
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    const x = (star.x + t * (i % 2 ? 1 : -1) * 2 + 1280) % 1280;
    const y = (star.y + t * .8) % 720;
    ctx.globalAlpha = (sequence === 'a' ? .18 : .06) + random(i + 901) * .17;
    ctx.fillStyle = '#c3d2d0'; ctx.fillRect(x, y, star.size, star.size);
    if (i % 19 === 0) { line(x - 2, y, x + 3, y, '#a9c3c4', .5); line(x, y - 2, x, y + 3, '#a9c3c4', .5); }
  }
  if(sequence==='a'&&t<2.85){
    const presence=1-progress(t,2.15,2.85);
    for(let i=0;i<145;i++){
      const near=random(i+7100),x=(random(i+7200)*1280+t*(2+near*12))%1280,y=(random(i+7300)*720+t*(1+near*5))%720;
      const direction=random(i+7400)*Math.PI,length=1.5+near*near*8;
      ctx.globalAlpha=presence*(.06+near*.22);
      line(x,y,x+Math.cos(direction)*length,y+Math.sin(direction)*length,'#b5c1bd',.5+near*.8);
    }
  }
  const terminal = sequence === 'b' ? progress(t, 4.8, 6.2) : .13;
  ctx.globalAlpha = terminal;
  for (let x = 252; x <= 1224; x += 36) line(x, 42, x, 673, '#8db8b412', .5);
  for (let y = 61; y <= 670; y += 36) line(239, y, 1235, y, '#8db8b412', .5);
  [[456,110,84,30],[807,157,45,-40],[455,604,119,-29],[919,649,104,-17],[1130,342,60,15]].forEach(([x,y,length,dy], i) => {
    line(x,y,x+length*.56,y,'#b2c4be27',.6);
    line(x+length*.56,y,x+length*.56+Math.abs(dy),y+dy,'#b2c4be27',.6);
    line(x+length*.56+Math.abs(dy),y+dy,x+length,y+dy,'#b2c4be27',.6);
    circle(x,y,2,'#b5cfca57',.6); label(`0${i+1} / ${[128,346,720,84,61][i]}`,x+3,y-6,'#829c944e',5);
  });
  ctx.globalAlpha = .1;
  for (let i = 0; i < 230; i++) {
    ctx.fillStyle = i % 3 ? '#c0ccca' : '#526f75';
    ctx.fillRect(random(i+4000)*1280,random(i+4600)*720,.5,.5);
  }
  ctx.restore();
}
function grid(t, alpha) {
  ctx.save(); ctx.globalAlpha = alpha;
  if(sequence==='a'&&t<2.2){const width=24+1256*progress(t,1.37,2.2);ctx.beginPath();ctx.rect(640-width/2,0,width,720);ctx.clip();}
  if(sequence==='a'&&t<2.3){
    line(640,0,640,720,'#acbfb4aa',.7);
    for(let y=40;y<720;y+=80)line(640-90*progress(t,1.37,2.1),y,640+90*progress(t,1.37,2.1),y,'#a3b8ad80',.6);
  }
  for (let x = 285; x < 1250; x += 15) line(x, 40, x, 679, x % 90 === 15 ? '#9db5ad99' : '#7a948e50', .6);
  for (let y = 40; y < 680; y += 20) line(285, y, 1248, y, y % 80 === 40 ? '#9db5ad99' : '#7a948e50', .6);
  for (let x = 290; x < 1220; x += 90) for (let y = 120; y < 660; y += 80) { ctx.fillStyle = '#d2e0d6b0'; ctx.fillRect(x, y, 3, 3); }
  [[454, 246], [898, 341], [457, 594], [969, 561]].forEach(([x, y], i) => {
    circle(x, y, 13 + Math.sin(t + i) * 2, '#83b29c99', .6); circle(x, y, 6, '#a0c8ab', .7);
    line(x, y, x + 63, y - 79, '#aacabc88', .6); line(x + 63, y - 79, x + 139, y - 79, '#8fbd9e88', .6);
    label(`0${i + 1}.034.080`, x + 63, y - 88, '#93ad96', 7);
  });
  ctx.restore();
}
function introA(t, alpha) {
  if(alpha<=0)return;
  ctx.save();ctx.globalAlpha=alpha;
  const split=progress(t,1.32,1.95),centers=split>0?[-1,1]:[0];
  for(const side of centers){
    const x=640+side*split*730,yaw=side*progress(t,1.32,1.75)*.48;
    const scale=1-split*.13;
    // Each dial turns away as a plane; its near edge and far edge have different depths.
    const project=([px,py,z=0])=>{
      const depth=px*Math.sin(yaw)+z,foreshorten=1150/(1150+depth);
      return[x+px*Math.cos(yaw)*scale*foreshorten,360+py*scale*foreshorten];
    };
    const path=(points,color,width=1,fill=false)=>{
      ctx.beginPath();points.map(project).forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));
      if(fill){ctx.closePath();ctx.fillStyle=color;ctx.fill();}
      else{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
    };
    const arc=(cx,cy,r,color,width=1,start=0,end=Math.PI*2)=>{
      const steps=Math.max(20,Math.ceil(Math.abs(end-start)*r/7));
      const points=(a,b,returnFace=false)=>Array.from({length:steps+1},(_,i)=>{
        const angle=a+(b-a)*i/steps;return[cx+Math.cos(angle)*r*(returnFace?.45:1),cy+Math.sin(angle)*r];
      });
      const cleave=side===0?0:progress(t,1.32,1.40);
      ctx.save();ctx.globalAlpha*=1-cleave;path(points(start,end),color,width);ctx.restore();
      if(cleave>0&&cx===0&&cy===0){
        const halfStart=side<0?Math.PI/2:-Math.PI/2;
        ctx.save();ctx.globalAlpha*=cleave;path(points(halfStart,halfStart+Math.PI),color,width);
        if(r<=229){ctx.globalAlpha*=.27;path(points(halfStart+Math.PI,halfStart+Math.PI*2,true),color,width*.8);}
        ctx.restore();
      }else if(cleave>0){ctx.save();ctx.globalAlpha*=cleave;path(points(start,end),color,width);ctx.restore();}
    };
    const shape=(r,sides,angle,color,width)=>path(Array.from({length:sides+1},(_,i)=>{const a=angle+i/sides*Math.PI*2;return[Math.cos(a)*r,Math.sin(a)*r]}),color,width);
    ctx.save();ctx.globalAlpha*=side===0?1:.5+.5*progress(t,1.32,1.55);
    const rings=[[100,'#c5cc83bf',.95],[142,'#e2e9e9dd',1.05],[210,'#d1dcd7ba',.9],[229,'#e4ebe5c7',.9],[333,'#e8f0e8de',1.45],[437,'#b4c35ba3',1],[640,'#b6c6bb35',.7]];
    rings.forEach(([radius,color,width],i)=>{
      const turn=t*(i%2?.16:-.11)+i*.63,draw=.62+.38*progress(t,.02+i*.012,.29+i*.012);
      arc(0,0,radius,color,width,turn,turn+5.92*draw);
    });
    shape(330,3,t*.23-1.54,'#c0ca67df',1.05);
    shape(355,3,-.38-t*.19,'#d5dd86b9',.85);
    shape(252,4,t*.21+.36,'#adc17b85',.65);
    arc(0,0,153,'#e2e9e0bb',.8,-t*.16+2.13,-t*.16+4.05);
    for(let i=0;i<5;i++){
      const a=t*.15+i*1.33,r=i%2?333:437;
      arc(Math.cos(a)*r,Math.sin(a)*r,6+(i%3)*3,'#c8d57da8',.85);
      if(i<3){const turn=a+.8;path([[-7,-11],[14,0],[-7,11]].map(([px,py])=>[Math.cos(turn)*(294+px)-Math.sin(turn)*py,Math.sin(turn)*(294+px)+Math.cos(turn)*py]),'#cad970c9',1,true);}
    }
    ctx.restore();
  }
  const typeAlpha=(.3+.7*progress(t,.03,.2))*(1-progress(t,1.23,1.51));
  if(typeAlpha>0){
    ctx.save();ctx.globalAlpha*=typeAlpha;ctx.font='500 49px Oswald, Arial, sans-serif';ctx.fillStyle='#e2ebe9df';
    const letters='THEATER';
    for(let i=0;i<letters.length;i++)ctx.fillText(letters[i],202+i*144+Math.sin(t*2.4+i)*43,238+Math.sin(i*1.5+t*3)*87);
    label('CALIBRATING THE ARCHIVE',73,602,'#b8c7a3',8);label('989.034 / ∆',1014,587,'#c9d6a6',7);
    label('4.038.603.981',978,115,'#d2debd',6);label('923.9331',1134,289,'#d2debd',6);
    for(let i=0;i<4;i++){line(149,52+i*14,155,58+i*14,'#c9d772',1.2);line(155,58+i*14,161,52+i*14,'#c9d772',1.2);}
    for(let i=0;i<5;i++){line(81+i*9,615,87+i*9,620,'#b8c9bbaa',.85);line(87+i*9,620,81+i*9,625,'#b8c9bbaa',.85);}
    ctx.restore();
  }
  ctx.restore();
}
function wirePoly(x, y, size, t, alpha = 1) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const points = [[-1,phi,0],[1,phi,0],[-1,-phi,0],[1,-phi,0],[0,-1,phi],[0,1,phi],[0,-1,-phi],[0,1,-phi],[phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]];
  const faces = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  const projected = points.map(([px, py, pz]) => {
    px /= 1.902; py /= 1.902; pz /= 1.902;
    const rx = px * Math.cos(t) - pz * Math.sin(t);
    const rz = px * Math.sin(t) + pz * Math.cos(t);
    const ry = py * Math.cos(.43 + t * .31) - rz * Math.sin(.43 + t * .31);
    const depth = py * Math.sin(.43 + t * .31) + rz * Math.cos(.43 + t * .31);
    const perspective = 4 / (4 + depth);
    return [x + rx * size * perspective, y + ry * size * perspective, depth];
  });
  ctx.save(); ctx.globalAlpha = alpha;
  const ordered = faces.map((face, index) => ({ face, index, depth: face.reduce((sum, vertex) => sum + projected[vertex][2], 0) / 3 })).sort((a,b) => b.depth-a.depth);
  for (const { face, depth, index } of ordered) {
    const [a,b,c] = face.map(vertex => projected[vertex]);
    ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.lineTo(c[0],c[1]); ctx.closePath();
    ctx.fillStyle = `rgba(190,215,222,${.018 + (1-depth)*.04 + (index%7===0?.08:0)})`; ctx.fill();
    if (depth < .25 && size > 45) {
      for (let i=1;i<6;i++) for (let j=1;j<6-i;j++) {
        const u=i/6, v=j/6, w=1-u-v;
        ctx.fillStyle=`rgba(211,230,232,${.26+(1-depth)*.14})`;
        ctx.fillRect(a[0]*u+b[0]*v+c[0]*w,a[1]*u+b[1]*v+c[1]*w,.9,.9);
      }
    }
  }
  const edges = new Set();
  for (const face of faces) for (let i=0;i<3;i++) {
    const a=face[i], b=face[(i+1)%3], key=[Math.min(a,b),Math.max(a,b)].join(':');
    if (edges.has(key)) continue;
    edges.add(key);
    const p=projected[a], q=projected[b], depth=(p[2]+q[2])/2;
    line(p[0],p[1],q[0],q[1],`rgba(190,218,224,${.27+(1-depth)*.23})`,depth<0?.8:.55);
  }
  projected.forEach(([px, py, depth]) => { ctx.fillStyle = depth<0?'#e5f0ed':'#91acb488'; ctx.fillRect(px - 1, py - 1, 1.6, 1.6); });
  ctx.restore();
}
function floatingGeometry(t, alpha) {
  ctx.save();ctx.globalAlpha=alpha;
  const tilt=1-progress(t,3.7,5.05);
  ctx.transform(1,-.045*tilt,.055*tilt,1,-20*tilt,40*tilt);
  [[367, 230, 57], [1057, 222, 80], [384, 550, 83], [1070, 545, 100], [642, 585, 39]].forEach(([x, y, r], i) => {
    const converge = 1 - progress(t, 2.8, 4.3);
    wirePoly(x + (750 - x) * converge, y + (370 - y) * converge, r * (1 - converge * .8), t * .35 + i, alpha);
  });
  [[481, 231, 177, 210], [716, 231, 177, 210], [469, 504, 170, 134], [949, 479, 203, 134]].forEach(([x, y, w, h], i) => {
    const p = progress(t, 3 + i * .1, 4.35 + i * .1);
    const color=i===0?'#cc9a59a6':'#b2d1cfaa';
    ctx.strokeStyle = color;ctx.lineWidth=.65;ctx.strokeRect(x, y, w * p, h * p);
    ctx.fillStyle = i===0?'#b9873c08':'#95afb51a'; ctx.fillRect(x, y, w * p, h * p);
    [[x,y,1,1],[x+w*p,y,-1,1],[x,y+h*p,1,-1],[x+w*p,y+h*p,-1,-1]].forEach(([xx,yy,dx,dy])=>{line(xx,yy,xx+dx*14,yy,color,1.2);line(xx,yy,xx,yy+dy*10,color,1.2);});
    if(i<2){ctx.fillStyle=i===0?'#db9c45':'#a5e7e2';ctx.fillRect(x+8,y+9,13,5);label(i===0?'TEST / FRAME':'FIELD / MATRIX',x+27,y+14,i===0?'#d9ad6d':'#aad1cf',6);}
  });
  [[330,99,51,-.13],[840,269,86,.04],[879,146,38,-.17],[598,552,42,.19]].forEach(([x,y,size,angle],i)=>{
    const p=progress(t,2.9+i*.12,4.1+i*.08);
    ctx.save();ctx.globalAlpha*=p*.68;ctx.translate(x,y);ctx.rotate(angle+Math.sin(t*.25+i)*.04);
    ctx.fillStyle='#a8c5cb20';ctx.fillRect(0,0,size,size);ctx.strokeStyle='#a5c1c474';ctx.lineWidth=.5;ctx.strokeRect(0,0,size,size);line(0,0,8,0,'#cde8e1',1);line(size,size,size-8,size,'#cde8e1',1);ctx.restore();
  });
  ctx.restore();
}
function radar(x, y, radius, t, alpha = 1, cyan = false) {
  if (alpha <= 0 || radius <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowBlur = 0;
  radius *= .97;
  const white = '#d9e5e0', bright = cyan ? '#a3e4d9' : '#c3d5ce';
  const rotation = t * .12;
  const scale = Math.max(.5, radius / 235);
  [1.066,1.049,1.005,.967,.902,.849,.803,.729,.699,.621,.526,.495,.404,.201,.155,.108].forEach((r,i) => circle(x,y,radius*r,i%4===0?'#b9cdcb70':'#95b4b044',.6));
  const inner = cyan ? .92 : 1;
  const tickBands = [[360,.931,.973,.989,.09],[180,1.02,1.036,1.053,0],[150,.412*inner,.437*inner,.449*inner,-.15],[120,.646,.652,.660,.18]];
  for (const [count,inner,outer,major,speed] of tickBands) {
    for (let i=0;i<count;i++) {
      const a=i/count*Math.PI*2+rotation*speed;
      const isMajor=i%10===0, isMedium=i%5===0;
      const r1=radius*inner, r2=radius*(isMajor?major:outer);
      line(x+Math.cos(a)*r1,y+Math.sin(a)*r1,x+Math.cos(a)*r2,y+Math.sin(a)*r2,isMajor?white:isMedium?'#c3d1ccab':'#a9beb78c',isMajor?.85:.55);
    }
  }
  for (let i=0;i<24;i++) {
    const a=i*Math.PI/12-Math.PI/2;
    ctx.save(); ctx.translate(x+Math.cos(a)*radius*1.079,y+Math.sin(a)*radius*1.079); ctx.rotate(a+Math.PI/2);
    ctx.textAlign='center'; label(String(i*15).padStart(3,'0'),0,0,'#b7c5bd',5.4*scale+1); ctx.restore();
  }
  for (let i=0;i<4;i++) {
    const a=rotation*.22+i*Math.PI/2;
    circle(x,y,radius*.862,'#78949335',radius*.075,a+.14,a+.76);
    circle(x,y,radius*.862,'#78949322',radius*.075,a+.8,a+.88);
    circle(x,y,radius*.747,'#b3c9c163',radius*.027,-rotation*.33+i*1.57+.5,-rotation*.33+i*1.57+1.17);
  }
  const arcs = [[.688,3.1,rotation,1.58],[.479*inner,4.8,-rotation*.75,1.91],[.467*inner,1.2,-rotation*.75,.9]];
  for (const [r,width,offset,length] of arcs) for(let i=0;i<3;i++) circle(x,y,radius*r,r>.6?bright:white,width*scale,offset+i*2.094,offset+i*2.094+length);
  circle(x,y,radius*.695,'#d8eee870',.7); circle(x,y,radius*.482*inner,'#dcece4a3',.7);
  for(let i=0;i<4;i++) {
    const a=i*Math.PI/2;
    line(x+Math.cos(a)*radius*.11,y+Math.sin(a)*radius*.11,x+Math.cos(a)*radius*1.14,y+Math.sin(a)*radius*1.14,'#c4d4ca7a',.65);
    const diagonal=a+Math.PI/4;
    line(x+Math.cos(diagonal)*radius*.155,y+Math.sin(diagonal)*radius*.155,x+Math.cos(diagonal)*radius*.91,y+Math.sin(diagonal)*radius*.91,'#b0c6bd50',.6);
  }
  polygon(x,y,radius*.87,4,Math.PI/4,'#c1d2c82b',.55);
  circle(x,y,radius*.201,'#ccdad0a6',.8); circle(x,y,radius*.172,'#a9c6bcb0',.65);
  line(x-5,y,x+5,y,'#c9d9d197',.5);line(x,y-5,x,y+5,'#c9d9d197',.5);
  for(let i=0;i<3;i++) {
    const a=-.85+rotation*.55+i*2.15, rr=radius*(i===1?.718:.887);
    const cx=x+Math.cos(a)*rr, cy=y+Math.sin(a)*rr;
    circle(cx,cy,11*scale+3,'#c9e7da99',.75);circle(cx,cy,7*scale+2,'#9fe4d494',.6);
    circle(cx,cy,4*scale,'#d5f2e5',1.2,.2,2.5);
    line(cx-19*scale,cy,cx+19*scale,cy,'#aecfc141',.5);line(cx,cy-19*scale,cx,cy+19*scale,'#aecfc141',.5);
  }
  if(radius>140) {
    const cx=x+radius*.77, cy=y+radius*.76;
    [24,19,13].forEach((r,i)=>circle(cx,cy,r,'#beded7a1',i===2?1:.6));
    ctx.fillStyle='#b2e9dc';ctx.beginPath();ctx.arc(cx,cy,6,0,Math.PI*2);ctx.fill();
    line(cx+17,cy+18,cx+31,cy+33,'#b5d7c992',.7);
    for(let i=0;i<6;i++) label(['084','01B','128','036','097','SYS'][i],x-16+Math.cos(i*1.04+.6)*radius*.59,y+Math.sin(i*1.04+.6)*radius*.59,'#a0bab779',4.5);
  }
  ctx.restore();
}
function globe(x, y, radius, t, alpha) {
  ctx.save(); ctx.globalAlpha = alpha;
  for (let lat = -4; lat <= 4; lat++) {
    const latitude = lat / 5 * Math.PI / 2;
    const yy = Math.sin(latitude) * radius; const rr = Math.cos(latitude) * radius;
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) { const a = i / 30 * Math.PI * 2; const px = Math.cos(a) * rr; const pz = Math.sin(a) * rr; const py = yy * .8 + pz * .55; if (i === 0) ctx.moveTo(x + px, y + py); else ctx.lineTo(x + px, y + py); }
    ctx.strokeStyle = '#b5d9c397'; ctx.lineWidth = .55; ctx.stroke();
  }
  for (let lon = 0; lon < 13; lon++) {
    const a = lon / 13 * Math.PI * 2 + t * .2; ctx.beginPath();
    for (let i = 0; i <= 30; i++) { const lat = i / 30 * Math.PI - Math.PI / 2; const px = Math.cos(a) * Math.cos(lat) * radius; const py = Math.sin(lat) * radius * .8 + Math.sin(a) * Math.cos(lat) * radius * .55; if (i === 0) ctx.moveTo(x + px, y + py); else ctx.lineTo(x + px, y + py); }
    ctx.strokeStyle = '#b5d9c37f'; ctx.lineWidth = .5; ctx.stroke();
  }
  ctx.restore();
}
function introB(t, alpha) {
  alpha*=progress(t,.04,.208333);
  if(alpha<=0)return;
  const x=640,y=360,expansion=progress(t,0,.75),radius=3+expansion*237;
  const peak=Math.exp(-Math.pow((t-.78)/.36,2)),beamGate=1-progress(t,1.06,1.58);
  const lock=progress(t,1.36,1.63);
  ctx.save();ctx.globalAlpha=alpha;
  ctx.fillStyle='#000204';ctx.globalAlpha*=.94*(1-progress(t,1.8,2.68));ctx.fillRect(0,0,1280,720);ctx.globalAlpha=alpha;

  // Perspective wedges widen towards the camera; a narrow white core carries the pulse.
  const angles0=[161,18,-48,52,103,-148,-12,137,-110,74];
  const angles1=[-164,-17,-112,124,69,165,-46,11,-75,48];
  const angles2=[151,28,-133,48,-150,166,-31,118,-74,77];
  const weights=[1,.92,.95,.78,.84,.42,.23,.34,.24,.3];
  const peakWeights=[1,1,1,.14,.23,.1,.1,.2,.2,.1];
  const turnTo=(from,to,p)=>from+((to-from+540)%360-180)*p;
  function wedge(angle,width,intensity){
    const length=1600,far=width*length/700;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=intensity;
    ctx.shadowColor='#83ffdf';ctx.shadowBlur=9;ctx.fillStyle='#86e8d324';
    ctx.beginPath();ctx.moveTo(0,-.3);ctx.lineTo(length,-far*.56);ctx.lineTo(length,far*.56);ctx.lineTo(0,.3);ctx.closePath();ctx.fill();
    ctx.shadowBlur=4;
    const color=ctx.createLinearGradient(0,0,length,0);color.addColorStop(0,'#b5ffeb8c');color.addColorStop(.24,'#b5ffedee');color.addColorStop(1,'#b5ffed');ctx.fillStyle=color;
    ctx.beginPath();ctx.moveTo(0,-.45);ctx.lineTo(length,-far*.5);ctx.lineTo(length,far*.5);ctx.lineTo(0,.45);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;ctx.fillStyle='#f3fffaff';
    ctx.beginPath();ctx.moveTo(0,-.25);ctx.lineTo(length,-far*.435);ctx.lineTo(length,far*.435);ctx.lineTo(0,.25);ctx.closePath();ctx.fill();ctx.restore();
  }
  if(beamGate>0){
    angles0.forEach((start,i)=>{
      const align=progress(t,.67,1.0);
      const angle=t<.67?turnTo(start,angles1[i],progress(t,.28,.56)):turnTo(angles1[i],angles2[i],align);
      const width=(14+peak*38)*(weights[i]+(peakWeights[i]-weights[i])*align);
      wedge(angle*Math.PI/180,width,beamGate*(i<5?.96:.43));
    });
    ctx.save();ctx.globalAlpha*=beamGate;ctx.shadowColor='#80efdb';ctx.shadowBlur=6;
    const bent=[[[552,-40],[658,140],[535,224]],[[0,248],[367,488],[486,254]],[[576,570],[913,655],[898,766]],[[1090,276],[1178,276],[1081,494]]];
    for(let i=0;i<bent.length;i++){
      const p=bent[i].map(([px,py],j)=>[px+Math.sin(t*1.7+i)*32,py+Math.cos(t*1.2+j)*18]);
      for(let j=0;j<p.length-1;j++)line(p[j][0],p[j][1],p[j+1][0],p[j+1][1],'#b1fce7bd',1.5+peak*1.5);
    }
    ctx.restore();
  }

  // The bootstrap dial uses a clean, bright hierarchy, distinct from the later dense radar.
  ctx.save();ctx.translate(x,y);ctx.shadowBlur=0;
  [1,.86,.73,.64,.5,.38,.23,.12].forEach((r,i)=>circle(0,0,radius*r,i===0?'#e7fff2e8':i%2?'#a6efe19e':'#d5f5e299',i===0?1.6:.9));
  const turn=t*1.3;
  for(let i=0;i<96;i++){
    const a=i/96*Math.PI*2,major=i%8===0;
    line(Math.cos(a)*radius*.84,Math.sin(a)*radius*.84,Math.cos(a)*radius*(major?.90:.88),Math.sin(a)*radius*(major?.90:.88),'#b7ebdca3',major?1.25:.7);
  }
  for(let i=0;i<72;i++){
    const a=i/72*Math.PI*2-turn*.25;
    line(Math.cos(a)*radius*.405,Math.sin(a)*radius*.405,Math.cos(a)*radius*.44,Math.sin(a)*radius*.44,'#bceee590',.8);
  }
  ctx.shadowColor='#87f5d7';ctx.shadowBlur=6;
  for(let i=0;i<2;i++){
    const a=turn+i*Math.PI;
    circle(0,0,radius*.60,'#b7ffea',6+peak*2,a,a+1.34);
    circle(0,0,radius*.54,'#d4fff1',2.4,a+.2,a+1.57);
    circle(0,0,radius*.235,'#d7fff2',1.9,-a,-a+2.6);
  }
  ctx.shadowBlur=0;
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2;
    line(Math.cos(a)*radius*.06,Math.sin(a)*radius*.06,Math.cos(a)*radius*1.16,Math.sin(a)*radius*1.16,'#9debd87d',1);
    const px=Math.cos(a)*radius*1.14,py=Math.sin(a)*radius*1.14;
    ctx.save();ctx.translate(px,py);ctx.rotate(a+Math.PI/2);ctx.beginPath();ctx.moveTo(0,7);ctx.lineTo(-7,-7);ctx.lineTo(7,-7);ctx.closePath();ctx.fillStyle='#a5fbe4d9';ctx.fill();ctx.restore();
  }
  const q=radius*1.03;
  for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){
    line(sx*q,sy*q,sx*(q-31),sy*q,'#9cf1dbdf',2.1);line(sx*q,sy*q,sx*q,sy*(q-31),'#9cf1dbdf',2.1);
  }
  ctx.restore();

  const triangleAlpha=visible(t,.78,.96,1.12,1.57);
  if(triangleAlpha>0){
    const p=progress(t,.78,1.0);
    const from=[[1200,-150],[810,990],[-240,550]],to=[[956,16],[866,686],[354,268]];
    const points=to.map(([tx,ty],i)=>[from[i][0]+(tx-from[i][0])*p,from[i][1]+(ty-from[i][1])*p]);
    ctx.save();ctx.globalAlpha*=triangleAlpha;ctx.shadowColor='#91ffe0';ctx.shadowBlur=12;
    const stroke=(color,width)=>{ctx.beginPath();points.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
    stroke('#91ffe399',13);ctx.shadowBlur=4;stroke('#eafff5',8.8);ctx.restore();
  }

  if(lock>0){
    ctx.save();ctx.globalAlpha*=lock;ctx.shadowColor='#80e7cc';ctx.shadowBlur=4;
    const q=radius*1.15;
    for(const xx of [x-q,x,x+q])line(xx,0,xx,720,'#9debd68c',1.2);
    for(const yy of [y-q,y,y+q])line(0,yy,1280,yy,'#9debd68c',1.2);
    ctx.strokeStyle='#b2fce2bd';ctx.lineWidth=1.6;ctx.strokeRect(x-q,y-q,q*2,q*2);
    polygon(x,y,q*Math.SQRT2,4,Math.PI/4,'#b4f8e1aa',1.1);ctx.restore();
  }
  ctx.save();ctx.globalAlpha*=1-progress(t,1.1,1.4);
  ctx.font='600 26px Arial, sans-serif';ctx.fillStyle='#edf8ef';ctx.fillText('启动',58,78);ctx.fillText('控制',58,644);
  for(const [cx,cy] of [[45,43],[44,605]]){line(cx,cy,cx+9,cy,'#86b7a9',.8);line(cx,cy,cx,cy+9,'#86b7a9',.8);}
  label('THEATER / SEQUENCE 02',60,656,'#7daca0',6);line(60,663,203,663,'#a2c6ba9c',.7);ctx.restore();
  ctx.font='600 26px Arial, sans-serif';ctx.fillStyle='#edf8ef';ctx.fillText('终端',1169,644);
  line(1155,608,1164,608,'#86b7a9',.8);line(1155,608,1155,617,'#86b7a9',.8);
  const rows=['ARCHIVE / INITIALIZATION','SIGNAL ALIGNMENT','ORBITAL ASSEMBLY  /  024','RADIAL VECTOR FIELD','FRAME '+String(Math.floor(t*24)).padStart(3,'0'),'LOCAL / TRANSMISSION'];
  rows.forEach((text,i)=>label(text,1056,72+i*12,i%2?'#88a59d':'#b5c8bd',6));
  ctx.restore();
}
function capsule(t, alpha) {
  const assembled=progress(t,3.28,3.65);
  if(alpha<=0)return;
  if(assembled<1){
    ctx.save();ctx.globalAlpha=alpha*(1-assembled);
    polygon(676,306,48,4,-.19+t*.06,'#c8e1dfbd',1);
    ctx.restore();
  }
  if(assembled>0)drawWireDevice(ctx,t,{alpha:alpha*assembled,scale:.88+.12*assembled});
}
function floatingTriangles(t, alpha) {
  ctx.save(); ctx.globalAlpha = alpha;
  for (let i = 0; i < 9; i++) {
    const x = i<3?70+i*530:i<6?18:1262;
    const y = i<3?(i%2?32:696):(random(i + 3350) * 830 - t * (5+i)) % 820;
    polygon(x+Math.sin(t*.17+i)*13, y < 0 ? y + 820 : y, 9 + random(i + 3500) * 14, 3, t * .055 + i, '#abd8ce94', .85);
  }
  ctx.restore();
}

function opacity(id, amount, transform = '') {
  const layer = layers[id]; layer.style.opacity = amount.toFixed(4); layer.style.transform = transform;
  layer.style.pointerEvents = amount > .8 ? 'auto' : 'none';
  layer.inert = amount <= .8;
}
function renderA(t) {
  const enterSide = progress(t, 1.3, 2.08);
  const exitSide = progress(t, 6.85, 7.3);
  const passCamera=progress(t,3.1,3.65)*(1-progress(t,4.0,4.8));
  opacity('a-sidebar', enterSide * (1 - exitSide), `translateX(${(1 - enterSide) * -285 - exitSide * 300 - passCamera*310}px)`);
  introA(t, 1 - progress(t, 1.92, 2.42));
  grid(t, visible(t, 1.37, 1.78, 2.9, 3.25) * .8);
  const articles = visible(t, 3.25, 4.05, 7.3, 7.48);
  const perspective = 1 - progress(t, 3.9, 5.8);
  const articleExit = progress(t, 7.0, 7.45);
  opacity('article-scene', articles, `perspective(1100px) translate3d(${-articleExit * 980}px,0,${articleExit*290}px) rotateY(${perspective * -18 + articleExit * 27}deg) scale(${.9 + progress(t, 4.1, 5.75) * .1})`);
  renderArchiveCards(t,'a');
  const dash = visible(t, 7.1, 7.55, 8.79, 8.885);
  const dolly = clamp((t-8.25)/.583333);
  const dashboardScale = .94 + progress(t,7.1,7.7)*.06 + dolly*dolly*1.1 + dolly*dolly*dolly;
  opacity('dashboard', dash, `scale(${dashboardScale})`);
  layers.dashboard.style.filter=dolly>0?`blur(${dolly*dolly*1.75}px)`:'none';
  if (dash > 0) {
    ctx.save();ctx.translate(640,360);ctx.scale(dashboardScale,dashboardScale);ctx.translate(-640,-360);
    ctx.save(); ctx.translate(249, 222); ctx.rotate(-.5); ctx.scale(1,.82);
    radar(0, 0, 117, t, dash); globe(0, 0, 69, t, dash); ctx.restore();
    ctx.save(); ctx.translate(954, 179); ctx.rotate(.5); ctx.scale(1,.72);
    radar(0, 0, 114, t * 1.2, dash); ctx.restore();
    ctx.restore();
    if(dolly>0) {
      // Composite the blur once; filtering each radar tick stalls playback.
      dashboardBlurContext.clearRect(0,0,canvas.width,canvas.height);
      dashboardBlurContext.drawImage(canvas,0,0);
      ctx.save();ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.filter=`blur(${dolly*dolly*1.75}px)`;
      ctx.drawImage(dashboardBlurCanvas,0,0);ctx.restore();
    }
    let heights=barFrames.at(-1)[1];
    for(let i=1;i<barFrames.length;i++)if(t<barFrames[i][0]){
      const [start,a]=barFrames[i-1],[end,b]=barFrames[i],p=clamp((t-start)/(end-start));heights=a.map((height,j)=>height+(b[j]-height)*p);break;
    }
    archiveBars.forEach((bar,i)=>{bar.style.height=`${heights[i]}px`;bar.style.transform='none'});
    $('.line-chart').style.setProperty('--series-progress',clamp((t-7.17)/1.06));
  }
  opacity('endmark', progress(t,8.8,9), '');
}
function renderB(t) {
  const enter = progress(t, 1.15, 1.85);
  opacity('b-sidebar', enter, `translateX(${(1 - enter) * -260}px)`);
  layers['b-sidebar'].style.setProperty('--sidebar-data', visible(t, 1.7, 2.1, 4.45, 5.15));
  const compact = 1 - progress(t, 4.5, 5.5);
  layers['b-sidebar'].style.setProperty('--side-compact', 1 - compact);
  const selection=1-compact;
  const tone=(from,to)=>'rgb('+from.map((value,i)=>Math.round(value+(to[i]-value)*selection)).join(',')+')';
  layers['b-sidebar'].style.setProperty('--selected-a',tone([36,52,59],[177,247,232]));
  layers['b-sidebar'].style.setProperty('--selected-b',tone([20,34,41],[120,200,190]));
  layers['b-sidebar'].style.setProperty('--selected-ink',tone([226,237,234],[9,45,44]));
  layers['b-sidebar'].style.setProperty('--selected-edge',tone([83,108,113],[184,255,238]));
  layers['b-sidebar'].style.setProperty('--selected-glow',selection===1?'-4px 0 0 -1px #a4ffdf,0 0 17px #8effdf21':'none');
  for (const [i, button] of [...document.querySelectorAll('.b-sidebar nav button')].entries()) {
    button.style.height = `${61 + compact * 17}px`; button.style.opacity = i < 3 ? 1 : 1 - compact;
    button.inert = i >= 3 && compact > .2;
  }
  introB(t, 1 - progress(t, 2.15, 2.7));
  const wire = visible(t, 2.7, 3.5, 4.4, 4.9);
  opacity('wire-scene', wire, `perspective(1000px) rotateY(${progress(t, 4.4, 4.9) * 18}deg) scale(${.78 + progress(t, 2.65, 3.4) * .22})`);
  capsule(t, wire);
  const terminal = progress(t, 6.07, 6.33);
  opacity('terminal', terminal, `scale(${.82 + terminal * .18})`);
  const ring = progress(t, 6.15, 6.65);
  radar(640, 358, 260 * (.65 + ring * .35), t, ring * .12 * progress(t,6.7,7.5), true);
  layers.terminal.style.setProperty('--chart-growth', progress(t, 5.55, 6.6));
  $('#radar-coordinate').textContent = `${String(Math.round((t * 39) % 360)).padStart(3, '0')}° / 128°`;
  $('.emblem-panel svg').style.transform = `rotate(${Math.sin(t * .4) * 4}deg)`;
  const wipe = 0;
  opacity('diamond-wipe', wipe);
  for (const [i, blade] of [...document.querySelectorAll('.diamond-wipe i')].entries()) {
    const direction = i * Math.PI / 2 + Math.PI / 4;
    const distance = 790 - Math.sin(progress(t, 4.3, 5.6) * Math.PI) * 390;
    blade.style.transform = `translate(-50%,-50%) translate(${Math.cos(direction) * distance}px,${Math.sin(direction) * distance}px) rotate(45deg)`;
  }
  // Foreground geometry is rendered above the panels in its own depth layer.
}
function renderForeground(t,sequence){
  const c=foregroundContext;if(!c)return;c.clearRect(0,0,1280,720);
  if(sequence==='a'){drawEnding(c,t);return;}
  if(sequence!=='b'||t<6.25)return;
  c.save();c.globalAlpha=progress(t,6.25,6.67);c.lineWidth=2.3;c.strokeStyle='#bdffe9';c.shadowColor='#8cffe1';c.shadowBlur=6;
  const triangles=[[1092,28,31,-160],[111,2,17,-20],[1260,185,18,-80],[117,363,32,-210],[38,677,19,-110],[1010,648,26,-65],[282,700,14,55]];
  for(let index=0;index<triangles.length;index++){
    const [x,y,r,z]=triangles[index],phase=t-7.5,angle=index*.79+phase*.13;
    c.beginPath();
    for(let i=0;i<4;i++){
      const a=i/3*Math.PI*2+angle,xx=Math.cos(a)*r,yy=Math.sin(a)*r;
      const tilt=.23+Math.sin(t*.3+index)*.14,zz=z+xx*Math.sin(tilt),k=900/(900+zz);
      const px=x+(xx*Math.cos(tilt)+Math.sin(phase*.6+index)*9)*k,py=y+(yy-phase*(7+index*2))*k;
      if(i===0)c.moveTo(px,py);else c.lineTo(px,py);
    }
    c.stroke();
  }
  c.restore();
}
function render() {
  background(time);
  for (const id of Object.keys(layers)) opacity(id, 0);
  if (sequence === 'a') renderA(time); else renderB(time);
  stage.style.setProperty('--camera-y', `${Math.sin(time*.5)*1.6}deg`);
  stage.style.setProperty('--camera-depth', `${Math.sin(time*.36)*9}px`);
  depthCanvas.style.zIndex = sequence === 'a' && time > 5.4 ? '9' : '2';
  if (depthContext) drawDepthField(depthContext, time, sequence);
  renderFold(time, sequence);
  renderInstrumentDetail(time, sequence);
  renderForeground(time, sequence);
  renderArchiveSidebar(time,sequence);
  renderWireAssembly(time,sequence);
  renderEmblemAssembly(time,sequence);
  stage.style.setProperty('--pulse', .82 + Math.sin(time * 5) * .18);
  $('#time').value = time.toFixed(2).padStart(5, '0');
  $('#timeline').value = time.toFixed(2);
  $('#timeline').style.setProperty('--position', `${time*10}%`);
  $('#scene-counter').textContent = `SEQ.0${sequence === 'a' ? 1 : 2} / ${String(Math.min(239, Math.floor(time * 24 + .0001))).padStart(3, '0')}`;
  const chapter = chapters[sequence].filter(([start]) => time >= start).at(-1) || chapters[sequence][0];
  $('#frame-title').textContent = `${sequence === 'a' ? '01' : '02'} / ${chapter[1]}`;
  for (const button of document.querySelectorAll('#chapters button')) button.classList.toggle('active', Number(button.dataset.start) === chapter[0]);
}
function alignReference() {
  if (referencePanel.hidden || referenceVideo.readyState < 1) return;
  if (Math.abs(referenceVideo.currentTime - time) > .001) referenceVideo.currentTime = Math.min(time, referenceVideo.duration || duration);
}
function stopClock() {
  cancelAnimationFrame(frame); frame = 0; lastStamp = 0;
  if (videoFrame !== null && referenceVideo.cancelVideoFrameCallback) referenceVideo.cancelVideoFrameCallback(videoFrame);
  videoFrame = null;
}
function nextReferenceFrame() {
  if (!playing || referencePanel.hidden || videoFrame !== null) return;
  const revision = referenceRevision;
  videoFrame = referenceVideo.requestVideoFrameCallback((_now, metadata) => {
    videoFrame = null;
    if (revision !== referenceRevision || !playing || referencePanel.hidden) return;
    // Use the presented video frame as the sole clock; never seek the video from this callback.
    if (!referenceVideo.seeking) {
      presentedTime = metadata.mediaTime;
      time = Math.min(duration, metadata.mediaTime);
      render();
    }
    nextReferenceFrame();
  });
}
function startClock() {
  stopClock();
  if (!playing) return;
  if (!referencePanel.hidden && referenceVideo.requestVideoFrameCallback) nextReferenceFrame();
  else frame = requestAnimationFrame(tick);
}
function updatePlayButton() {
  $('#play').innerHTML = playing ? 'Ⅱ <span>暂停</span>' : '▷ <span>播放</span>';
  $('#play').setAttribute('aria-label', playing ? '暂停动画' : '播放动画');
}
function tick(stamp) {
  frame = 0;
  if (!playing) return;
  if (!referencePanel.hidden) {
    if (referenceVideo.readyState >= 2 && !referenceVideo.seeking) time = Math.min(duration, referenceVideo.currentTime);
  } else if (lastStamp) time = Math.min(duration, time + (stamp - lastStamp) / 1000);
  lastStamp = stamp;
  render();
  if (time >= duration) { setPlaying(false); return; }
  frame = requestAnimationFrame(tick);
}
function setPlaying(next) {
  const revision = ++playRevision;
  if (next && !referencePanel.hidden && referenceVideo.ended) seek(0, false);
  playing = next; updatePlayButton(); startClock();
  if (!referencePanel.hidden) {
    if (playing) {
      alignReference();
      referenceVideo.play().catch(error => {
        if (revision !== playRevision || !playing || referencePanel.hidden) return;
        setPlaying(false);
        if (error.name !== 'AbortError') {
          $('#motion-note').dataset.playbackError = 'true';
          $('#motion-note').textContent = '原片未能启动，请点击播放重试。';
        }
      });
    } else referenceVideo.pause();
  }
}
function seek(nextTime, pause = true) {
  if (!Number.isFinite(nextTime)) return;
  time = clamp(nextTime, 0, duration);
  presentedTime = null;
  if (pause) setPlaying(false);
  render();
  alignReference();
}
function setSequence(next) {
  if (!['a', 'b'].includes(next)) return;
  setPlaying(false);
  sequence = next; stage.dataset.sequence = next;
  for (const button of document.querySelectorAll('[data-sequence]')) {
    if (button.tagName !== 'BUTTON') continue;
    button.classList.toggle('active', button.dataset.sequence === next);
    button.setAttribute('aria-pressed', String(button.dataset.sequence === next));
  }
  $('#chapters').replaceChildren(...chapters[next].map(([start, name]) => {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.start = start;
    const value = document.createElement('span'); value.textContent = `${start.toFixed(1)}s`;
    button.append(value, name); button.addEventListener('click', () => seek(start)); return button;
  }));
  if (!$('#reference').hidden) setReference();
  seek(reducedMotion.matches ? (next === 'a' ? 6 : 7) : 0, false);
  setPlaying(!reducedMotion.matches);
}
function setReference() {
  const video = referenceVideo;
  video.preload = 'auto';
  const source = `reference-${sequence}.mp4`;
  if (video.getAttribute('src') !== source) {
    stopClock(); ++referenceRevision; presentedTime = null; video.src = source;
  }
  $('#reference-label').textContent = `用户提供的视频 ${sequence.toUpperCase()} · 10.005 秒 · 1280 × 720 · 24 fps`;
  alignReference();
}
referenceVideo.addEventListener('loadedmetadata', alignReference);
referenceVideo.addEventListener('play', () => {
  if (referencePanel.hidden || referenceVideo.paused) return;
  const note = $('#motion-note');
  if (note.dataset.playbackError) {
    delete note.dataset.playbackError;
    note.textContent = reducedMotion.matches ? '已遵循系统的减少动态设置：默认暂停，可手动播放。' : '';
  }
  playing = true; updatePlayButton(); startClock();
});
referenceVideo.addEventListener('pause', () => {
  if (referencePanel.hidden || !referenceVideo.paused) return;
  playing = false; ++playRevision; updatePlayButton(); stopClock();
});
referenceVideo.addEventListener('seeking', () => {
  if (referencePanel.hidden) return;
  // Invalidate callbacks from before a seek, rather than dropping delayed valid frames under load.
  ++referenceRevision; stopClock();
});
referenceVideo.addEventListener('seeked', () => {
  if (referencePanel.hidden) return;
  time = Math.min(duration, referenceVideo.currentTime); presentedTime = null; render();
  if (playing) startClock();
});
referenceVideo.addEventListener('ended', () => {
  if (referencePanel.hidden) return;
  playing = false; updatePlayButton(); stopClock();
  time = Math.min(duration, referenceVideo.currentTime); render();
});
referenceVideo.addEventListener('error', () => {
  if (referencePanel.hidden || !referenceVideo.error) return;
  setPlaying(false); $('#motion-note').dataset.playbackError = 'true';
  $('#motion-note').textContent = '原片加载失败，请检查本地预览服务后重试。';
});
$('#play').addEventListener('click', () => { if (time >= duration) seek(0, false); setPlaying(!playing); });
$('#replay').addEventListener('click', () => { seek(0, false); setPlaying(true); });
$('#timeline').addEventListener('input', (event) => seek(Number(event.target.value)));
document.querySelector('.card-preview-play')?.addEventListener('click', () => seek(7.7));
const secondControls = document.createElement('div');
secondControls.className = 'second-controls';
for (const [offset, text] of [[-1, '−1 帧'], [1, '+1 帧']]) {
  const button = document.createElement('button');button.type='button';button.textContent=text;
  button.setAttribute('aria-label',offset<0?'后退一帧':'前进一帧');
  button.addEventListener('click',()=>{
    const currentFrame = presentedTime === null ? Math.floor(time*24+1e-6) : Math.round(presentedTime*24);
    seek(clamp(currentFrame+offset,0,239)/24);
  });
  secondControls.append(button);
}
for (const [offset, text] of [[-1, '−1 秒'], [1, '+1 秒']]) {
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = text;
  button.setAttribute('aria-label', offset < 0 ? '后退一秒' : '前进一秒');
  button.addEventListener('click', () => seek(time + offset));
  secondControls.append(button);
}
$('#chapters').before(secondControls);
for (const button of document.querySelectorAll('button[data-sequence]')) button.addEventListener('click', () => setSequence(button.dataset.sequence));
for (const button of document.querySelectorAll('[data-jump]')) button.addEventListener('click', () => seek(Number(button.dataset.jump)));
$('#compare').addEventListener('click', () => {
  const reference = $('#reference'); reference.hidden = !reference.hidden;
  $('#comparison-layout').classList.toggle('reference-open', !reference.hidden);
  $('#compare').setAttribute('aria-expanded', String(!reference.hidden));
  if (!reference.hidden) { setPlaying(false); setReference(); alignReference(); }
  else { referenceVideo.pause(); startClock(); }
});
$('#fullscreen').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await $('.screen-frame').requestFullscreen(); }
  catch { $('#fullscreen').setAttribute('aria-label', '当前浏览器不支持全屏'); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) setPlaying(false); });
window.addEventListener('pagehide', () => { setPlaying(false); stopClock(); referenceVideo.pause(); });
reducedMotion.addEventListener('change', (event) => {
  if (event.matches) { seek(sequence === 'a' ? 6 : 7); $('#motion-note').textContent = '已遵循系统的减少动态设置：默认暂停，可手动播放。'; }
  else $('#motion-note').textContent = '';
});
new ResizeObserver(() => stage.style.setProperty('--stage-scale', viewport.clientWidth / 1280)).observe(viewport);
if (reducedMotion.matches) $('#motion-note').textContent = '已遵循系统的减少动态设置：默认暂停，可手动播放。';
setSequence('a');
const params = new URLSearchParams(location.search);
if (params.get('sequence') === 'b') setSequence('b');
if (params.has('t')) seek(Number(params.get('t')));
if (params.get('compare') === '1') $('#compare').click();

// A deterministic seek lets visual checks capture any storyboard frame without timing races.
window.motionStudy = Object.freeze({ seek, setSequence, getState: () => ({ sequence, time, playing, clock: referencePanel.hidden ? 'native' : 'reference', presentedTime }), selfCheck: () => {
  console.assert(clamp(-1) === 0 && clamp(11, 0, 10) === 10, 'Timeline bounds must hold');
  console.assert(progress(0, 1, 2) === 0 && progress(3, 1, 2) === 1, 'Scene transitions must clamp');
  console.assert(visible(3, 0, 1, 4, 5) === 1 && visible(6, 0, 1, 4, 5) === 0, 'Scenes must finish cleanly');
  return chapters.a.length === 6 && chapters.b.length === 6 && cards.length === 6;
} });
