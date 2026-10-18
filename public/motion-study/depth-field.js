import { drawArchiveTracker } from './archive-tracker.js';

const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const n = clamp(value); return n * n * (3 - 2 * n); };
const envelope = (time, a, b, c, d) => smooth((time - a) / (b - a)) * (1 - smooth((time - c) / (d - c)));
const phi = (1 + Math.sqrt(5)) / 2;
const icoVertices = [[-1,phi,0],[1,phi,0],[-1,-phi,0],[1,-phi,0],[0,-1,phi],[0,1,phi],[0,-1,-phi],[0,1,-phi],[phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]].map(point => point.map(value => value / Math.hypot(1, phi)));
const icoFaces = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
let softCanvas,softContext;

function rotate([x, y, z], rx, ry, rz = 0) {
  const y1 = y * Math.cos(rx) - z * Math.sin(rx), z1 = y * Math.sin(rx) + z * Math.cos(rx);
  const x2 = x * Math.cos(ry) + z1 * Math.sin(ry), z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
  return [x2 * Math.cos(rz) - y1 * Math.sin(rz), x2 * Math.sin(rz) + y1 * Math.cos(rz), z2];
}
function projector(time, sequence) {
  const tactical = sequence === 'b';
  const rx = tactical ? .22 + Math.sin((time - 6) * .5) * .065 : .16 + Math.sin(time * .35) * .06;
  const ry = tactical ? -.31 + Math.sin((time - 6) * .4) * .09 : -.28 + Math.sin(time * .3) * .06;
  const rz = tactical ? -.027 + Math.sin(time * .3) * .018 : -.04;
  const dolly = tactical ? 13 * Math.sin((time - 6) * .36) : 18 * Math.cos(time * .35);
  const target=tactical?rotate([0,0,-24],rx,ry,rz):[0,0,0];
  const targetScale=1000/(1000+target[2]+dolly);
  return point => {
    const [x, y, z] = rotate(point, rx, ry, rz);
    const perspective = 1000 / (1000 + z + dolly);
    return [640 + x * perspective-target[0]*targetScale, 358 + y * perspective-target[1]*targetScale, z];
  };
}
function stroke(ctx, points, color, width = .7, close = false) {
  if (!points.length) return;
  ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  if (close) ctx.closePath();
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function polygon(ctx, points, color) {
  ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
const orbit = (radius, angle, z) => [Math.cos(angle) * radius, Math.sin(angle) * radius, z];

function annulus(ctx, project, radius, width, z, start, length, alpha) {
  const faces = [];
  const count = Math.max(8, Math.ceil(length * radius / 10));
  for (let i = 0; i < count; i++) {
    const a = start + i / count * length, b = start + (i + 1) / count * length;
    const points = [orbit(radius,a,z),orbit(radius,b,z),orbit(radius-width,b,z),orbit(radius-width,a,z)].map(project);
    faces.push({ points, depth: points.reduce((sum,p) => sum+p[2],0)/4, light:.5 + Math.sin(a + 1.1)*.28 });
  }
  faces.sort((a,b) => b.depth-a.depth);
  for (const face of faces) polygon(ctx,face.points,`rgba(159,185,193,${alpha*face.light})`);
}

function orbitText(ctx,project,radius,angle,z,value,color='#a9bfc3a1') {
  const point=project(orbit(radius,angle,z));
  if(point[0]<452||point[0]>836||point[1]<106||point[1]>626)return;
  const direction=project(orbit(radius,angle+.01,z));
  ctx.save();ctx.translate(point[0],point[1]);ctx.rotate(Math.atan2(direction[1]-point[1],direction[0]-point[0]));
  ctx.font='5.5px Consolas,Arial,sans-serif';ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(value,0,0);ctx.restore();
}

function orbitMarker(ctx,project,radius,angle,z,size,filled=false) {
  const center=orbit(radius,angle,z),radial=[Math.cos(angle),Math.sin(angle)],tangent=[-radial[1],radial[0]];
  const point=(r,t)=>project([center[0]+radial[0]*r+tangent[0]*t,center[1]+radial[1]*r+tangent[1]*t,z]);
  const triangle=[point(-size,0),point(size*.55,size*.66),point(size*.55,-size*.66)];
  if(filled)polygon(ctx,triangle,'#b7d9d0bd');else stroke(ctx,triangle,'#b6d2ceaa',.75,true);
}

function ring(ctx, project, radius, time, shell) {
  const spin = time * (shell % 2 ? -.085 : .065) + shell * 1.1;
  const front = -20 - shell * 4, back = 17 + shell * 3;
  const segments = 144;
  const path = (r,z,start=0,length=TAU) => Array.from({length:segments+1},(_,i)=>project(orbit(r,start+i/segments*length,z)));
  if(radius<45){
    stroke(ctx,path(Math.max(2,radius-9),front),'#e1f7eddd',1.9);
    stroke(ctx,path(Math.max(2,radius-13),front),'#a8c9bd8c',.7);
    return;
  }
  stroke(ctx,path(radius,back),'#66808b6b',.6);
  stroke(ctx,path(radius-5,back),'#67818a40',.5);
  for(let i=0;i<32;i++) {
    const a=i/32*TAU+spin;
    const p=project(orbit(radius,a,back)),q=project(orbit(radius,a,front));
    stroke(ctx,[p,q],i%4===0?'#a4c4cb81':'#89a8b340',i%4===0?.75:.45);
  }
  annulus(ctx,project,radius,5,front,0,TAU,.11);
  stroke(ctx,path(radius,front),'#b2e5dfbb',1.15);
  stroke(ctx,path(radius-5,front),'#7b9ca85c',.5);
  const ticks = shell === 2 ? 240 : shell === 1 ? 180 : 144;
  for(let i=0;i<ticks;i++) {
    const a=i/ticks*TAU+spin*.15;
    const major=i%10===0, medium=i%5===0;
    const r2=radius+(major?11:medium?7:4);
    stroke(ctx,[project(orbit(radius+2,a,front)),project(orbit(r2,a,front))],major?'#e1f6eee0':medium?'#badcd0a6':'#91acb574',major?1.05:.55);
  }
  const innerBand=shell===2?radius-21:shell===1?radius-17:radius-19;
  const inwardTicks=shell===2?300:shell===1?144:180;
  stroke(ctx,path(innerBand+1,front+3),'#b7c7c469',.55);
  stroke(ctx,path(innerBand-13,front+3),'#8aaba644',.5);
  for(let i=0;i<inwardTicks;i++) {
    const a=i/inwardTicks*TAU-spin*.12;
    const major=i%15===0,minor=i%5===0;
    const length=shell===2?(major?16:minor?12:9):(major?10:minor?7:4);
    stroke(ctx,[project(orbit(innerBand,a,front+3)),project(orbit(innerBand-length,a,front+3))],major?'#d4dfd3af':minor?'#bbc7bfa3':'#a6b9b19a',major?.75:.55);
  }
  if(shell===2) {
    stroke(ctx,path(radius-48,front+10),'#afc4bb61',.55);
    for(let i=0;i<18;i++) {
      const start=spin*.21+i/18*TAU+.022;
      annulus(ctx,project,radius-4,9,front+5,start,.238,i%3===0?.19:.065);
      if(i%3===0) {
        stroke(ctx,path(radius-43,front+7,start+.018,.145),'#9ab8b77b',2.1);
        orbitText(ctx,project,radius-54,start+.065,front+7,`${String(i*20).padStart(3,'0')} / ${i%2?'B':'A'}`,'#9eafb28e');
      }
    }
  }
  if(shell===1) {
    [radius-35,radius-43,radius-49].forEach((r,index)=>{
      stroke(ctx,path(r,front+9),'#7f9b9b3b',.5);
      const count=index===1?120:90;
      for(let i=0;i<count;i++) {
        const a=i/count*TAU-spin*.18+index*.021;
        const p=project(orbit(r,a,front+9));
        ctx.fillStyle=i%10===0?'#c0d6ccbd':index===1?'#a7c2b67a':'#87aaa453';
        const size=i%10===0?1.2:.7;ctx.fillRect(p[0]-size/2,p[1]-size/2,size,size);
      }
    });
    for(let i=0;i<6;i++)orbitText(ctx,project,radius-28,spin*.12+i/6*TAU+.18,front+6,['084.01','FIELD / B','128.036','SYNC / 61','AXIS / 03','M 1.6.2'][i],'#bacac39c');
  }
  for(let i=0;i<3;i++) {
    const start=spin+i*TAU/3;
    const arcWidth=shell===0?1.9+3.1*smooth((radius-44)/66):shell===1?1.2+2*smooth((radius-116)/64):1.65;
    ctx.save();ctx.shadowColor=shell===0?'#c9f7e8':'#77ddca';ctx.shadowBlur=shell===0?4:2.5;
    stroke(ctx,path(radius-9,front-1,start,shell===0?1.62:1.1),shell===0?'#effff6':'#a9f6e7eb',arcWidth);ctx.restore();
    if(shell===2) annulus(ctx,project,radius-19,11,front+8,start+.08,.59,.17);
  }
  for(let i=0;i<(shell===0?2:3);i++) {
    const a=spin*.38+i*TAU/3+(shell===0?.4:.1);
    orbitMarker(ctx,project,radius-(shell===0?2:11),a,front-2,shell===0?3:4,i===0);
  }
  if(shell===2) {
    for(let i=0;i<24;i++) {
      const a=i/24*TAU-Math.PI/2, point=project(orbit(radius+18,a,front));
      const direction=project(orbit(radius+18,a+.005,front));
      ctx.save();ctx.translate(point[0],point[1]);ctx.rotate(Math.atan2(direction[1]-point[1],direction[0]-point[0]));
      ctx.fillStyle='#b4c4c8a8';ctx.font='6px Consolas,Arial,sans-serif';ctx.textAlign='center';ctx.fillText(String(i*15).padStart(3,'0'),0,0);ctx.restore();
    }
  }
}

function tacticalAssembly(ctx, time) {
  const project = projector(time,'b');
  // Radii follow the measured expansion, not an instant fade to the final dial.
  const sizes=[[6.08,142,82,14],[6.125,172,116,22],[6.25,209,145,50],[6.5,228,162,101],[6.75,235,169,113],[7,240,174,114],[7.5,245,180,110]];
  let radii=sizes.at(-1).slice(1);
  for(let i=1;i<sizes.length;i++)if(time<sizes[i][0]){
    const a=sizes[i-1],b=sizes[i],p=clamp((time-a[0])/(b[0]-a[0]));radii=a.slice(1).map((v,j)=>v+(b[j+1]-v)*p);break;
  }
  const outerScale=radii[0]/245,coreScale=radii[2]/110;
  const rails = [[-255,-230,17],[-231,-254,17],[230,-254,17],[254,-230,17],[254,231,17],[230,255,17],[-231,255,17],[-255,231,17]].map(([x,y,z])=>[x*outerScale,y*outerScale,z]);
  stroke(ctx,rails.map(project),'#80a6b129',.55,true);
  stroke(ctx,rails.map(([x,y])=>project([x,y,-28])),'#a7c4cc3d',.6,true);
  for(const point of rails) stroke(ctx,[project(point),project([point[0],point[1],-28])],'#9bb9c742',.55);
  for(const radius of [29,40,52]) {
    const points=Array.from({length:97},(_,i)=>project(orbit(radius*coreScale,i/96*TAU,-28)));
    stroke(ctx,points,'#c7e9dfb0',radius===40?1.2:.9);
  }
  for(let i=0;i<4;i++) {
    const a=i*Math.PI/2;
    stroke(ctx,[project(orbit(25,a,-28)),project(orbit(270,a,-28))],'#b8ccca55',.55);
    stroke(ctx,[project(orbit(54,a+Math.PI/4,0)),project(orbit(234,a+Math.PI/4,0))],'#9bb5bf40',.55);
    const diagonal=a+Math.PI/4;
    for(let n=0;n<5;n++) {
      const radius=61+n*8,p=orbit(radius,diagonal,-12),half=n%2===0?2.5:1.5;
      stroke(ctx,[project([p[0]-Math.sin(diagonal)*half,p[1]+Math.cos(diagonal)*half,p[2]]),project([p[0]+Math.sin(diagonal)*half,p[1]-Math.cos(diagonal)*half,p[2]])],'#bccbc189',.6);
    }
  }
  // Shells share one camera; their rear rims and spacers stay visibly separated.
  radii.forEach((radius,index)=>ring(ctx,project,radius,time,2-index));
  for(let i=0;i<3;i++) {
    const a=-.85+i*2.1+time*.046;
    const center=orbit(i===1?191:226,a,-33);
    [12,8].forEach((radius,index)=> {
      const points=Array.from({length:41},(_,j)=>project([center[0]+Math.cos(j/40*TAU)*radius,center[1]+Math.sin(j/40*TAU)*radius,center[2]]));
      stroke(ctx,points,index?'#a0d7d492':'#c8e4dd80',index?.6:.85);
    });
    const front=project(center),back=project([center[0],center[1],22]);
    stroke(ctx,[front,back],'#9cb8c55e',.65);
    const inner=orbit(i===1?168:203,a+.13,-33),elbow=project(inner);
    stroke(ctx,[front,elbow],'#c0d4c17a',.6);
    const value=['N / 084','L / 61','S / 03'][i];
    orbitText(ctx,project,i===1?159:195,a+.15,-33,value,'#c2d5cbb8');
    const pointer=project(orbit(i===1?191:226,a+.06,-34));
    ctx.fillStyle='#c9eee5b0';ctx.fillRect(pointer[0]-1,pointer[1]-1,2,2);
  }
  for(let i=0;i<8;i++) {
    const a=i/8*TAU+time*.018,radius=i%2?76:66;
    const p=project(orbit(radius,a,-25));ctx.fillStyle='#c3d4c27b';ctx.fillRect(p[0]-.7,p[1]-.7,1.4,1.4);
    if(i%2===0)orbitText(ctx,project,80,a+.11,-25,String(i*45).padStart(3,'0'),'#829d995e');
  }
}

function solid(ctx, project, center, size, time, index, opacity = 1) {
  const positions=icoVertices.map(point=>rotate(point.map(value=>value*size),time*.19+index,time*.24-index*.7,.15)).map(point=>point.map((value,axis)=>value+center[axis]));
  const vertices=positions.map(project);
  const faces=icoFaces.map(face=>({points:face.map(i=>vertices[i]),face}));
  faces.sort((a,b)=>b.points.reduce((n,p)=>n+p[2],0)-a.points.reduce((n,p)=>n+p[2],0));
  for(const {points,face} of faces) {
    const [a3,b3,c3]=face.map(i=>positions[i]);
    const u=b3.map((v,i)=>v-a3[i]),v=c3.map((value,i)=>value-a3[i]);
    const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...n)||1;
    const diffuse=Math.max(0,(-n[0]*.3-n[1]*.6-n[2]*.74)/length),front=n[2]<0;
    const light=.02+Math.pow(diffuse,2.4)*.34;
    polygon(ctx,points,`rgba(185,213,224,${light*opacity})`);
    stroke(ctx,points,`rgba(202,233,234,${(front?.59:.28)*opacity})`,front?.85:.55,true);
    for(let i=1;i<8;i++)for(let j=1;j<8-i;j++){
      const q=(i+Math.sin(i*17+j*13+face[0])*.15)/8,r=(j+Math.cos(j*19+i+index)*.15)/8,s=1-q-r;
      const p=project(a3.map((value,axis)=>value*q+b3[axis]*r+c3[axis]*s));
      ctx.fillStyle=`rgba(222,239,234,${opacity*(front?.57:.23)})`;ctx.fillRect(p[0],p[1],.9,.9);
    }
  }
  for(const vertex of vertices){ctx.fillStyle=`rgba(228,251,241,${opacity*.95})`;ctx.fillRect(vertex[0]-1.1,vertex[1]-1.1,2.2,2.2);}
}

function panel(ctx, project, x, y, z, width, height, angle, alpha) {
  const points=[[-width/2,-height/2],[width/2,-height/2],[width/2,height/2],[-width/2,height/2]].map(([px,py])=>[x+px*Math.cos(angle)-py*Math.sin(angle),y+px*Math.sin(angle)+py*Math.cos(angle),z]);
  const face=points.map(project),back=points.map(([px,py,pz])=>project([px,py,pz+6]));
  const amber=x<0&&y<0&&width>140;
  polygon(ctx,face,amber?`rgba(199,134,64,${alpha*.10})`:`rgba(142,178,196,${alpha*.13})`);stroke(ctx,face,amber?'#edb76cde':`rgba(175,226,220,${alpha*.82})`,1.15,true);stroke(ctx,back,`rgba(146,185,201,${alpha*.28})`,.65,true);
  const label=project([x-width/2+12,y-height/2+17,z-1]);ctx.fillStyle=amber?'#dca65d':'#a5d4d6';ctx.fillRect(label[0],label[1]-5,12,4);ctx.font='6px Consolas,monospace';ctx.fillText(amber?'TEST / 084':'FIELD / STRUCTURE',label[0]+18,label[1]);
  for(let i=0;i<4;i++)stroke(ctx,[face[i],back[i]],`rgba(177,212,221,${alpha*.4})`,.55);
}

function archiveAssembly(ctx,time) {
  const project=projector(time,'a');
  const expansion=smooth((time-3.05)/.6);
  const objects=[[-350,-118,55,57],[465,-182,15,83],[-342,140,-45,94],[390,225,-110,103],[-165,216,83,42]];
  const opacity=envelope(time,2.7,3.45,5.15,5.72);
  if(opacity>0){
  ctx.save();ctx.globalAlpha*=opacity;
  for(let x=-220;x<=410;x+=24)stroke(ctx,[project([x*expansion,-245*expansion,70]),project([x*expansion,280*expansion,70])],'#93bdc122',.5);
  for(let y=-245;y<=280;y+=24)stroke(ctx,[project([-220*expansion,y*expansion,70]),project([410*expansion,y*expansion,70])],'#93bdc122',.5);
  [[-100,-96,50,205,191,.01],[105,-96,6,177,201,-.02],[-110,190,40,210,175,-.02],[400,190,-40,185,182,.02],[-440,-205,31,82,82,-.12]].forEach(([x,y,z,w,h,a])=>panel(ctx,project,x*expansion,y*expansion,z,w*expansion,h*expansion,a,1));
  objects.sort((a,b)=>b[2]-a[2]).forEach(([x,y,z,size],index)=>{
    const center=[x*expansion,y*expansion,z],radius=size*(.22+.78*expansion);
    if(z<-80){
      // Blur the assembled near object once, instead of hundreds of filtered point draws.
      if(!softCanvas){softCanvas=document.createElement('canvas');softCanvas.width=1280;softCanvas.height=720;softContext=softCanvas.getContext('2d');}
      softContext.clearRect(0,0,1280,720);softContext.globalAlpha=ctx.globalAlpha;
      solid(softContext,project,center,radius,time,index);
      ctx.save();ctx.globalAlpha=1;ctx.filter='blur(1.1px)';ctx.drawImage(softCanvas,0,0);ctx.restore();
    }else solid(ctx,project,center,radius,time,index);
  });
  ctx.restore();
  }
  drawArchiveTracker(ctx,time);
}

/** Draws the depth overlay at a fixed 1280×720 logical size. The caller owns time and RAF. */
export function drawDepthField(ctx,time,sequence,mode='auto') {
  ctx.clearRect(0,0,1280,720);
  if(!Number.isFinite(time)||mode==='off')return;
  ctx.save();ctx.shadowBlur=0;ctx.lineCap='butt';ctx.lineJoin='miter';
  if(sequence==='a'&&time>=2.7&&time<=7.05)archiveAssembly(ctx,time);
  if(sequence==='b'&&time>=6.08) {
    ctx.globalAlpha=smooth((time-6.05)/.13);
    tacticalAssembly(ctx,time);
  }
  ctx.restore();
}
