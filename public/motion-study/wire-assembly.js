const clamp=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const p=clamp(value);return p*p*(3-2*p);};
const progress=(time,a,b)=>ease((time-a)/(b-a));
const mix=(a,b,p)=>a+(b-a)*p;
function line(ctx,x,y,xx,yy,color='#a7c6c487',width=.7){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function frame(ctx,[x,y,w,h],alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle='#879f9d73';ctx.lineWidth=.65;ctx.strokeRect(x,y,w,h);[[x,y,1,1],[x+w,y,-1,1],[x+w,y+h,-1,-1],[x,y+h,1,-1]].forEach(([px,py,sx,sy])=>{line(ctx,px,py,px+sx*18,py,'#d1eee8',1.4);line(ctx,px,py,px,py+sy*20,'#abd4cc',1.1);});ctx.restore();}
function interpolate(time,a,b,c){const p=time<=3?progress(time,2.7,3):progress(time,3,3.25);return(time<=3?a:b).map((value,index)=>mix(value,(time<=3?b:c)[index],p));}

/** Empty frame assembly before the detailed wire scene; the caller supplies time. */
export function createWireAssembly(stage){
 const style=document.createElement('style');style.textContent='.stage[data-wire-assembly] .wire-scene{opacity:var(--wire-reveal,0)!important}.stage #wire-assembly{position:absolute;inset:0;width:1280px;height:720px;pointer-events:none;z-index:8}';
 const canvas=document.createElement('canvas');canvas.id='wire-assembly';canvas.width=1280;canvas.height=720;canvas.setAttribute('aria-hidden','true');canvas.style.display='none';const ctx=canvas.getContext('2d');stage.append(style,canvas);
 return function render(time,sequence){
  const active=sequence==='b'&&time>=2.68&&time<3.55;
  canvas.style.display=active?'block':'none';stage.toggleAttribute('data-wire-assembly',active);
  if(!active){stage.style.removeProperty('--wire-reveal');return;}
  const reveal=progress(time,3.27,3.53);stage.style.setProperty('--wire-reveal',reveal.toFixed(4));canvas.style.opacity=String(1-reveal);
  ctx.clearRect(0,0,1280,720);ctx.fillStyle='#020608';ctx.fillRect(390,0,890,720);
  const main=interpolate(time,[625,281,65,65],[490,155,365,300],[429,118,494,371]);
  const upper=interpolate(time,[1080,185,35,35],[1000,117,160,153],[955,74,259,241]);
  const lower=interpolate(time,[813,439,23,23],[806,377,116,111],[1024,414,130,142]);
  const strip= time<3.25?mix(1030,810,progress(time,2.92,3.25)):mix(810,430,progress(time,3.25,3.55));
  ctx.save();ctx.globalAlpha=progress(time,3.04,3.25)*.15;
  for(let x=strip;x<strip+145;x+=7){ctx.fillStyle='#78959e';ctx.fillRect(x,0,3,720);}ctx.restore();
  frame(ctx,main);frame(ctx,upper,.88);frame(ctx,lower,.83);
  frame(ctx,interpolate(time,[728,566,5,5],[728,566,13,13],[694,532,80,80]),.65);
  const turn=mix(.03,-.18,progress(time,2.7,3.3));
  ctx.save();ctx.translate(671,300);ctx.rotate(turn);
  const size=mix(24,69,progress(time,2.7,3));ctx.strokeStyle='#c3ceca';ctx.lineWidth=1;ctx.strokeRect(-size/2,-size/2,size,size);
  const outer=mix(47,211,progress(time,2.7,3.25));
  line(ctx,-outer/2,-outer/2,outer/2-34,-outer/2,'#a8b9b66e',.8);line(ctx,-outer/2,-outer/2,-outer/2,outer/2,'#a8b9b66e',.8);line(ctx,-outer/2,outer/2,outer/2,outer/2,'#a8b9b66e',.8);line(ctx,outer/2,outer/2,outer/2,-outer/2+28,'#a8b9b66e',.8);ctx.restore();
  [[main[0]+41,main[1]+27,-.35],[main[0]+main[2]-41,main[1]+main[3]-28,2.79]].forEach(([x,y,a])=>{ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#f0f6ee';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(18,2);ctx.lineTo(2,18);ctx.closePath();ctx.fill();ctx.restore();});
  for(const[x,y,dx,dy]of[[430,574,6,-2],[587,622,5,-20],[1170,107,0,-19],[976,72,-10,8],[414,185,1,-18],[1187,395,-16,-1],[878,42,-9,-14],[690,551,-4,-7]]){const drift=Math.sin(time*1.2+x*.01)*7;line(ctx,x+drift,y,x+dx+drift,y+dy,'#bdd2cc67',.7);}
  for(const[x,y]of[[784,194],[555,607],[1225,648],[484,623],[1082,484]]){ctx.fillStyle='#d9e4df';ctx.fillRect(x,y,2.4,2.4);}
 };
}
