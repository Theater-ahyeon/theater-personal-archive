import { drawWireDevice } from './wire-device.js';
const clamp=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const p=clamp(value);return p*p*(3-2*p);};
const range=(t,a,b)=>ease((t-a)/(b-a));
const fade=(t,a,b,c,d)=>range(t,a,b)*(1-range(t,c,d));

function line(ctx,x,y,xx,yy,color='#9dc5c477',width=.75){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function text(ctx,value,x,y,size=8,color='#b8c9c8'){ctx.font=`${size}px Consolas,Arial,sans-serif`;ctx.fillStyle=color;ctx.fillText(value,x,y);}
function frame(ctx,x,y,w,h){ctx.strokeStyle='#78989968';ctx.lineWidth=.6;ctx.strokeRect(x,y,w,h);[[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]].forEach(([xx,yy,dx,dy])=>{line(ctx,xx,yy,xx+13*dx,yy,'#c8e3dcbb',1);line(ctx,xx,yy,xx,yy+10*dy,'#c8e3dcbb',1);});}
function bars(ctx,x,y,w,h){for(let i=0;i<13;i++){const v=.2+Math.abs(Math.sin(i*2.1+.8))*.75;ctx.fillStyle=i%4===0?'#b2eee1':'#76bfb5';ctx.fillRect(x+i*w/13,y+h-h*v,w/18,h*v);}}
function waveform(ctx,x,y,w,h){frame(ctx,x,y,w,h);ctx.beginPath();for(let i=0;i<64;i++){const px=x+i/63*w,py=y+h*.5+Math.sin(i*1.7)*Math.sin(i*.7)*h*.39;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.strokeStyle='#b9e6dd';ctx.lineWidth=.85;ctx.stroke();}
function diamond(ctx,x,y,size,symbol){ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle='#80999e3c';ctx.fillRect(-size/2,-size/2,size,size);ctx.strokeStyle='#9bb4ba28';ctx.strokeRect(-size/2,-size/2,size,size);ctx.rotate(-Math.PI/4);ctx.textAlign='center';text(ctx,symbol,0,13,size*.63,'#d3e7e5');ctx.restore();}

function panelArtwork(){
 const canvas=document.createElement('canvas');canvas.width=1070;canvas.height=680;const ctx=canvas.getContext('2d');
 const glyph=(x,y,size,kind)=>{
  ctx.save();ctx.translate(x,y);ctx.scale(size/40,size/40);ctx.strokeStyle='#dae9e5';ctx.fillStyle='#dae9e5';ctx.lineWidth=2.6;ctx.lineJoin='miter';ctx.beginPath();
  if(kind===0){ctx.moveTo(-15,-16);ctx.lineTo(-15,6);ctx.lineTo(-3,6);ctx.lineTo(-3,-15);ctx.moveTo(4,-15);ctx.lineTo(17,-15);ctx.lineTo(5,-3);ctx.lineTo(17,9);ctx.moveTo(-3,6);ctx.lineTo(-3,17);ctx.lineTo(-10,20);}
  if(kind===1){ctx.moveTo(0,-16);ctx.lineTo(-17,14);ctx.lineTo(17,14);ctx.moveTo(-10,2);ctx.lineTo(-3,2);ctx.lineTo(-3,-5);ctx.moveTo(7,-12);ctx.lineTo(7,-2);ctx.moveTo(2,-7);ctx.lineTo(12,-7);}
  if(kind===2){ctx.moveTo(-17,-11);ctx.lineTo(17,-11);ctx.lineTo(0,18);ctx.closePath();ctx.moveTo(-8,-5);ctx.lineTo(8,-5);ctx.lineTo(0,8);ctx.closePath();}
  if(kind===3){ctx.moveTo(-16,8);ctx.bezierCurveTo(-10,-6,-5,11,2,-3);ctx.bezierCurveTo(7,-14,13,1,18,-3);ctx.moveTo(-14,1);ctx.bezierCurveTo(-8,-12,-1,6,5,-10);ctx.moveTo(-10,14);ctx.lineTo(0,18);ctx.lineTo(13,12);}
  if(kind===4){ctx.moveTo(-18,-10);ctx.lineTo(18,-10);ctx.lineTo(12,-4);ctx.lineTo(-8,-4);ctx.lineTo(-1,7);ctx.moveTo(-2,0);ctx.lineTo(9,0);ctx.lineTo(1,16);}
  ctx.stroke();ctx.restore();
 };
 const gradient=ctx.createLinearGradient(0,0,1070,680);gradient.addColorStop(0,'#141e23');gradient.addColorStop(.6,'#0b151b');gradient.addColorStop(1,'#142329');ctx.fillStyle=gradient;ctx.fillRect(0,0,1070,680);
 for(let x=18;x<1070;x+=36)line(ctx,x,10,x,675,'#8aa5a810',.5);
 for(let y=19;y<680;y+=36)line(ctx,8,y,1060,y,'#8aa5a810',.5);
 for(let i=0;i<100;i++){ctx.fillStyle='#d4e9e229';ctx.fillRect((i*179)%1061,(i*101)%673,1,1);}
 frame(ctx,7,7,1056,666);line(ctx,445,20,1050,20,'#adc4c1b1',1);line(ctx,19,652,416,652,'#aac9c2ac',1);
 ctx.fillStyle='#687e8080';ctx.fillRect(38,33,176,19);text(ctx,'终端 / CONTROL',44,46,9,'#d3e1de');
 ctx.fillStyle='#bca33a28';ctx.fillRect(38,59,176,55);text(ctx,'控制',47,99,36,'#dbc95c');text(ctx,'01B',157,98,20,'#cfbd5c');
 for(let i=0;i<18;i++)line(ctx,40+i*10,60,58+i*10,60,'#c5b44e30',4);
 frame(ctx,38,127,176,63);text(ctx,'终端观测 / LOCAL',45,143,8);line(ctx,43,151,208,151);text(ctx,'结构编号        15589',45,164,8);text(ctx,'连接状态        19.3%',45,179,8);
 line(ctx,244,48,320,48,'#9db7b49e');line(ctx,320,48,366,8,'#9db7b49e');ctx.fillStyle='#d5e8df';ctx.fillRect(362,4,7,7);
 text(ctx,'SYSTEM.084 / LAYER A',243,39,5,'#a2b5b670');
 text(ctx,'AXIS LOCK',245,68,6,'#97afae');text(ctx,'X  038.51',245,80,6);text(ctx,'Y  093.86',245,91,6);text(ctx,'Z  016.02',245,102,6);
 for(let i=0;i<3;i++){ctx.fillStyle='#8ba4a248';ctx.fillRect(299,74+i*11,26-i*6,3);}
 text(ctx,'STRUCTURE TELEMETRY',44,207,6,'#7f9c9c');frame(ctx,36,215,166,89);
 line(ctx,43,234,192,234,'#7c959742',.5);line(ctx,43,284,192,284,'#7c959742',.5);
 ctx.save();ctx.translate(130,256);ctx.rotate(.26);ctx.strokeStyle='#d4ebe4';ctx.lineWidth=1.2;ctx.strokeRect(-6,-6,12,12);ctx.restore();
 text(ctx,'TARGET / 01',45,226,5);text(ctx,'SYNC  00.084',45,297,5,'#849e9b');text(ctx,'LOCAL',165,297,5,'#849e9b');
 for(const[x,y]of[[35,201],[205,201],[35,312]]){line(ctx,x-3,y,x+3,y,'#b5ccc69a');line(ctx,x,y-3,x,y+3,'#b5ccc69a');}
 ctx.fillStyle='#8093976b';ctx.fillRect(35,356,137,18);text(ctx,'SIGNAL / PREVIEW',42,369,9);
 for(let i=1;i<6;i++)line(ctx,37+i*24,383,37+i*24,453,'#9bb5b027',.5);
 for(let i=1;i<4;i++)line(ctx,37,383+i*17.5,182,383+i*17.5,'#9bb5b027',.5);
 waveform(ctx,37,383,145,70);text(ctx,'03.5 / 128Hz',112,380,5,'#a7c8bc');
 ctx.beginPath();for(let i=0;i<64;i++){const x=37+i*145/63,y=418+Math.sin(i*.38+.9)*18*Math.exp(-i/80);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.strokeStyle='#83cbb56b';ctx.lineWidth=.65;ctx.stroke();
 bars(ctx,39,478,150,83);frame(ctx,32,470,165,98);text(ctx,'012240   006622   014530',39,581,6,'#98b3b5');
 for(let i=1;i<4;i++)line(ctx,33,471+i*23,196,471+i*23,'#bad6ca22',.5);
 frame(ctx,222,490,50,72);ctx.fillStyle='#8faeaa25';ctx.fillRect(227,495,40,62);text(ctx,'CHANNEL',220,482,5,'#bdcdc7');
 line(ctx,225,552,238,539,'#adc8bf8c',.6);line(ctx,238,539,251,546,'#adc8bf8c',.6);line(ctx,251,546,269,516,'#adc8bf8c',.6);
 line(ctx,302,535,302,577,'#a6c8bd8a',.7);for(let i=0;i<9;i++)line(ctx,302,535+i*5,302+(i%2?4:8),535+i*5,'#a6c8bd8a',.6);
 text(ctx,'FFT / 13 BANDS',38,591,5,'#7e9e9b');text(ctx,'-24dB',286,588,5,'#9fbbb4');
 for(let i=0;i<23;i++){ctx.fillStyle=i<15?'#88a3a369':'#6e888527';ctx.fillRect(39+i*9,598,6,4);}
 ctx.fillStyle='#80989755';ctx.fillRect(39,608,205,15);text(ctx,'FIELD / METRICS',44,619,7);text(ctx,'100%       M 65%     —',45,641,10);
 line(ctx,244,632,295,632,'#abc9bf9c',1);ctx.fillStyle='#c4d9cf';ctx.fillRect(310,630,2,2);ctx.fillRect(316,630,2,2);
 frame(ctx,631,60,315,191);drawWireDevice(ctx,4.1,{x:751,y:135,scale:.66,roll:-.24,yaw:-.25,annotations:false});diamond(ctx,754,139,102,'');
 line(ctx,710,233,774,233,'#c5dedb',2);line(ctx,724,239,761,239,'#b2c8c4',1);
 text(ctx,'STRUCTURE / 01',639,78,6);text(ctx,'NATIVE WIREFRAME',916,30,5,'#a7baba');
 line(ctx,653,169,646,194,'#a9c5bf9b',.65);line(ctx,646,194,678,207,'#a9c5bf9b',.65);ctx.fillStyle='#d9e9e2';ctx.fillRect(651,167,3,3);text(ctx,'A0 / 038.16',650,218,5,'#a9c5bf');
 line(ctx,809,115,859,103,'#a9c5bf9b',.65);line(ctx,859,103,883,103,'#a9c5bf9b',.65);text(ctx,'B1 / 027.08',859,98,5,'#a9c5bf');
 text(ctx,'MESH 084 / INDEX 13',639,90,5,'#779592');text(ctx,'VERT 0252',861,72,5,'#98b3aa');
 diamond(ctx,951,180,81,'');glyph(951,180,39,0);diamond(ctx,885,245,78,'');glyph(885,245,37,1);text(ctx,'230.40680',787,309,8,'#bdcac6');line(ctx,792,318,1036,318,'#b2c9c49c');
 for(let i=0;i<3;i++)line(ctx,1014,245+i*7,1028,245+i*7,i===0?'#dcece4':'#9eb4b266',i===0?2:1);
 text(ctx,'MODEL / AXIAL',940,281,5,'#87a29b');text(ctx,'00.11.06',990,309,6,'#c0cfc9');
 diamond(ctx,871,410,72,'');glyph(871,410,41,1);diamond(ctx,979,410,72,'▲');diamond(ctx,811,515,63,'');glyph(811,515,33,3);diamond(ctx,883,522,63,'');glyph(883,522,35,4);diamond(ctx,848,581,63,'');glyph(848,581,33,2);
 ctx.fillStyle='#d0bd4c';ctx.fillRect(633,441,363,19);text(ctx,'图形档案 / GEOMETRY FIELD',641,454,9,'#172426');
 for(let i=0;i<6;i++)line(ctx,984+i*8,441,970+i*8,460,'#111a1e',3);
 frame(ctx,933,484,107,145);line(ctx,952,518,1022,603,'#a4c4c478');line(ctx,1022,518,952,603,'#a4c4c478');
 ctx.fillStyle='#71919138';ctx.fillRect(938,489,97,11);text(ctx,'REGION / 04',942,497,5,'#b8d2c8');
 for(let i=0;i<4;i++)line(ctx,1032,509+i*8,1036,509+i*8,'#c0d8ca77',.6);
 text(ctx,'SCAN 016.80',941,619,5,'#9cb6ab');line(ctx,912,645,1039,645,'#98b9b078',.6);line(ctx,912,642,912,648,'#98b9b078',.7);
 text(ctx,'SYMBOL INDEX 03 / 06',779,472,5,'#a6c1b3');
 text(ctx,'GEOMETRY / SURFACE DATA',505,613,5,'#a8c0b7');
 [['NORMAL','0.084 / 1.62'],['SURFACE','TRIANGULATED'],['CHANNEL','LOCAL / 02']].forEach(([label,value],i)=>{text(ctx,label,505,626+i*10,5,'#839f98');text(ctx,value,549,626+i*10,5,'#b4cbc0');});
 text(ctx,'THEATER / RECONSTRUCTION',779,655,5,'#6e939e');
 for(const [x,y,xx,yy] of [[430,45,145,329],[445,45,720,329],[145,345,430,625],[445,625,720,345]]){
  line(ctx,x+2,y+2,xx+2,yy+2,'#03080b',5);
  line(ctx,x,y,xx,yy,'#b6f0dfcb',1.7);
  const dx=xx-x,dy=yy-y,length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;
  for(let i=0;i<7;i++){const p=.12+i*.105,px=x+dx*p,py=y+dy*p;line(ctx,px+nx*4,py+ny*4,px+nx*(i%3?7:10),py+ny*(i%3?7:10),'#b7d6cc6b',.55);}
 }
 return canvas;
}
function equipmentArtwork(){
 const canvas=document.createElement('canvas');canvas.width=650;canvas.height=530;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#101b21';ctx.fillRect(0,0,650,530);frame(ctx,12,14,624,500);
 ctx.fillStyle='#6b858c80';ctx.fillRect(22,25,178,20);text(ctx,'战术设计 / STRUCTURE',28,40,13);
 frame(ctx,43,68,526,305);drawWireDevice(ctx,4.4,{x:317,y:222,scale:1.05,roll:.15,yaw:-.14,annotations:false});
 text(ctx,'MODULE / 084',52,92,8);frame(ctx,46,390,239,107);text(ctx,'线框诊断',57,408,12);text(ctx,'AXIS X / Y / Z',57,430,10);text(ctx,'STATUS / LOCAL',57,446,8);
 frame(ctx,304,391,125,107);text(ctx,'1.6.2',324,451,32);text(ctx,'SYSTEM',319,480,8);frame(ctx,450,391,160,107);text(ctx,'0.0%',476,450,29);
 return canvas;
}

function curtainArtwork(){
 const canvas=document.createElement('canvas');canvas.width=1070;canvas.height=720;const ctx=canvas.getContext('2d');
 for(let y=2;y<720;y+=6)for(let x=2;x<1070;x+=6){
  const distance=Math.abs(x-445)+Math.abs(y-358);
  const band=clamp((distance-303)/22)*(1-clamp((distance-458)/100));
  if(band<=0)continue;
  const variation=.72+.28*Math.sin(x*.113+y*.073)**2;
  ctx.fillStyle=`rgba(226,239,237,${band*variation})`;ctx.fillRect(x,y,3.9,3.9);
 }
 const diamondPoint=(angle,radius)=>{const c=Math.cos(angle),s=Math.sin(angle),r=radius/(Math.abs(c)+Math.abs(s));return[445+c*r,358+s*r];};
 for(let i=0;i<16;i++){
  const a=i/16*Math.PI*2+.065*Math.sin(i*2.3),p=diamondPoint(a,302),q=diamondPoint(a+.11*Math.cos(i),407),r=diamondPoint(a-.09*Math.sin(i),565);
  ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.lineTo(...r);ctx.strokeStyle='#010407';ctx.lineWidth=i%3===0?12:7;ctx.stroke();
  if(i%2===0)line(ctx,q[0]+3,q[1],r[0]+3,r[1],'#aec9c864',.65);
 }
 return canvas;
}

/** Creates the two independent panel-fold phases; the caller owns the timeline. */
export function createFoldSequence(stage){
 const layer=document.createElement('div');layer.className='fold-sequence';layer.setAttribute('aria-hidden','true');layer.inert=true;
 layer.style.cssText='position:absolute;left:195px;top:0;width:1070px;height:720px;z-index:12;pointer-events:none;overflow:hidden;isolation:isolate;display:none';
 // Each clipped face keeps its own perspective; shared depth sorting occludes the last full-size clip plane in Chromium.
 const space=document.createElement('div');space.className='fold-space';space.style.cssText='position:absolute;left:-195px;top:0;width:1280px;height:720px;perspective:1800px;perspective-origin:640px 358px;transform-style:flat';layer.append(space);
 const style=document.createElement('style');style.textContent=`
 .fold-sequence .fold-face{position:absolute;left:195px;top:25px;width:1070px;height:680px;transform-style:preserve-3d;backface-visibility:visible;will-change:transform,opacity;filter:drop-shadow(0 7px 5px #0008)}
 .fold-sequence .fold-face canvas{position:absolute;inset:0;width:1070px;height:680px}
 .fold-sequence .fold-face:after{content:'';position:absolute;inset:0;background:linear-gradient(120deg,#d9f6ed0a,transparent 38%,#0003);pointer-events:none}
 .fold-sequence .fold-core{position:absolute;left:440px;top:218px;width:340px;height:300px;transform-style:preserve-3d;color:#dce9e4;font-family:Consolas,Arial,sans-serif}
 .fold-sequence .fold-core-grid{position:relative}.fold-sequence .fold-core-grid>.fold-data{position:absolute}.fold-sequence .fold-core-grid>.fold-data:nth-child(1){left:49px;top:12px;width:142px;height:120px}.fold-sequence .fold-core-grid>.fold-data:nth-child(2){left:206px;top:8px;width:126px;height:131px}.fold-sequence .fold-core-grid>.fold-data:nth-child(3){left:0;top:158px;width:191px;height:72px}.fold-sequence .fold-core-grid>.fold-data:nth-child(4){left:207px;top:158px;width:126px;height:124px}
 .fold-sequence .fold-data{position:relative;border:1px solid #7e9798;background:linear-gradient(115deg,#172024,#080c10);box-shadow:4px 5px 0 #000b,inset 0 0 15px #0007;padding:7px;min-height:115px}
 .fold-sequence .fold-data:before,.fold-sequence .fold-data:after{content:'';position:absolute;pointer-events:none;width:10px;height:6px;border-color:#d1ddd7;border-style:solid}.fold-sequence .fold-data:before{left:-4px;top:-4px;border-width:1px 0 0 1px}.fold-sequence .fold-data:after{right:-4px;bottom:-4px;border-width:0 1px 1px 0}
 .fold-sequence .fold-data header{background:#e0e8e4;color:#172023;font:9px Arial,sans-serif;margin:-7px -7px 9px;padding:3px 5px}.fold-sequence .fold-data small{font-size:7px;color:#8aa3a2;letter-spacing:1px}.fold-sequence .fold-number{font-size:34px;line-height:1.2;letter-spacing:1px}.fold-sequence .fold-number.version{font-size:31px;letter-spacing:0}.fold-sequence .fold-labels{display:flex;gap:4px;margin-top:8px}.fold-sequence .fold-labels i{width:9px;height:7px;background:#7d979b55}
 .fold-sequence .fold-gauge{width:60px;height:60px;margin:4px 6px 8px;border:3px solid #b4cdc9;border-left-color:#3a5257;border-radius:50%;box-shadow:0 0 0 3px #6a848770,inset 0 0 0 3px #5b767567;display:grid;place-content:center;font-size:15px}.fold-sequence .fold-gauge-side{position:absolute;right:9px;top:14px;font-size:6px;line-height:2;color:#a9beb9}.fold-sequence .fold-bottom-data{display:flex;justify-content:space-between;font-size:6px;color:#8da8a3;line-height:1.8}.fold-sequence .fold-dle{min-height:72px;display:flex;align-items:center;gap:8px}.fold-sequence .fold-dle .fold-number{font-size:22px}.fold-sequence .fold-dle .fold-gauge{width:40px;height:40px;margin:0 0 0 auto;font-size:10px;border-width:2px}.fold-sequence .fold-progress{position:absolute;left:10px;top:268px;width:170px;border-bottom:1px solid #a1b8b1;padding-bottom:6px;color:#92aaa2;font-size:7px}.fold-sequence .fold-progress:after{content:'25%';position:absolute;right:-5px;top:18px;color:#e2e9df;font-size:10px}
 .fold-sequence .fold-backdrop{position:absolute;left:200px;top:25px;width:1070px;height:680px;background:#010305;clip-path:polygon(41% 5%,68% 50%,41% 94%,13% 50%)}
 .fold-sequence canvas.fold-curtain{position:absolute;left:195px;top:0;width:1070px;height:720px;right:auto;bottom:auto;filter:drop-shadow(0 0 1px #d8efea3b)}
 .fold-sequence .fold-mote{position:absolute;left:0;top:0;width:13px;height:15px;background:radial-gradient(circle,#e8f3ef 0 1px,transparent 1.2px) 0 0/3px 3px,#9eb9bc22;clip-path:polygon(3% 0,100% 72%,18% 100%);backface-visibility:visible;transform-style:preserve-3d;will-change:transform,opacity}
 .fold-sequence .fold-fragment{position:absolute;transform-style:preserve-3d;will-change:transform,opacity;backface-visibility:visible;box-shadow:0 2px 6px #000;filter:brightness(.82)}
 `;
 const artwork=panelArtwork(),oldArtwork=equipmentArtwork();
 const backdrop=document.createElement('div');backdrop.className='fold-backdrop';space.append(backdrop);
 const curtain=curtainArtwork();curtain.className='fold-curtain';space.append(curtain);
 const core=document.createElement('div');core.className='fold-core';core.innerHTML=`<div class="fold-core-grid"><div class="fold-data"><header>观测终端</header><small>结构编号</small><div class="fold-number">084</div><div class="fold-labels"><i></i><i></i><i></i><i></i></div></div><div class="fold-data"><div class="fold-gauge">61</div><div class="fold-gauge-side">系统<br>轴向<br>◉ 00</div><div class="fold-bottom-data"><span>结构 / 03<br>51.0</span><span>连接 / 64<br>08.1</span></div></div><div class="fold-data fold-dle"><div><small>DLE</small><div class="fold-number">0.31</div></div><small>档案状态<br>连接成功</small><div class="fold-gauge">66</div></div><div class="fold-data"><header>结构层级</header><div class="fold-number version">1.6.2</div><small>THEATER / NATIVE</small></div></div><div class="fold-progress">链路诊断 ───────── 2863590</div>`;space.append(core);
 const preview=document.createElement('i');preview.className='core-preview';core.querySelector('.fold-data').append(preview);
 const register=document.createElement('div');register.className='core-register';register.innerHTML='<span>观测节点 <b>038.64</b></span><span>帧段索引 <b>000.084</b></span>';core.querySelector('.fold-data:last-child').append(register);
 const clips=['polygon(0 0,40.2% 2%,40.2% 6.6%,13.6% 48.5%,0 48.5%)','polygon(41.6% 2%,100% 0,100% 48.5%,67.3% 48.5%,41.6% 6.6%)','polygon(0 50.7%,13.6% 50.7%,40.2% 91.9%,40.2% 100%,0 100%)','polygon(41.6% 91.9%,67.3% 50.7%,100% 50.7%,100% 100%,41.6% 100%)'];
 const faces=clips.map((clip,index)=>{const face=document.createElement('div');face.className='fold-face';face.style.clipPath=clip;face.style.transformOrigin=['26.9% 27.55%','54.45% 27.55%','26.9% 71.3%','54.45% 71.3%'][index];const canvas=document.createElement('canvas');canvas.width=1070;canvas.height=680;canvas.getContext('2d').drawImage(artwork,0,0);face.append(canvas);space.append(face);return face;});
 // The bright outer curtain passes in front of the arriving graphite panels.
 space.append(curtain);curtain.style.transformOrigin='445px 358px';
 const fragments=[];
 for(let row=0;row<4;row++)for(let col=0;col<5;col++){
  const piece=document.createElement('canvas');piece.width=130;piece.height=133;piece.className='fold-fragment';piece.style.left=`${347+col*130}px`;piece.style.top=`${75+row*133}px`;piece.style.width='130px';piece.style.height='133px';piece.style.transformOrigin=`${col<2?0:100}% ${row<2?0:100}%`;piece.style.clipPath=(row+col)%3===0?'polygon(0 0,100% 0,100% 100%,17% 94%)':(row+col)%3===1?'polygon(0 4%,94% 0,100% 100%,0 100%)':'polygon(0 0,100% 9%,95% 100%,0 100%)';piece.getContext('2d').drawImage(oldArtwork,col*130,row*133,130,133,0,0,130,133);space.append(piece);fragments.push({piece,row,col});
 }
 const motes=Array.from({length:34},(_,index)=>{const mote=document.createElement('i');mote.className='fold-mote';const size=6+(index%6)*2;mote.style.width=`${size}px`;mote.style.height=`${size*1.3}px`;space.append(mote);return mote;});
 stage.append(style,layer);
 return function render(time,sequence){
  const active=sequence==='b'&&time>=4.56&&time<=6.66;layer.style.display=active?'block':'none';if(!active)return;
  const assemble=range(time,4.86,5.37),opening=range(time,6.07,6.51);
  const departure=range(time,6.13,6.49);
  const foldAlpha=1-range(time,6.37,6.59);
  const coreOpacity=fade(time,4.79,4.96,6.015,6.2);
  core.style.opacity=coreOpacity;core.style.transform=`translateZ(${-38+assemble*17-opening*150}px) scale(${.83+assemble*.17-opening*.18})`;
  backdrop.style.opacity=coreOpacity;backdrop.style.transform=`translateZ(${-40-opening*100}px)`;
  curtain.style.opacity=fade(time,4.72,4.96,5.34,5.64);curtain.style.transform=`translateZ(${12+Math.sin(range(time,4.7,5.6)*Math.PI)*23}px) rotateY(${-3+assemble*3}deg) scale(${1+.45*range(time,5,5.42)})`;
  faces.forEach((face,index)=>{
   const sx=index%2?1:-1,sy=index<2?-1:1;
   const arrive=1-assemble;
   const axisY=index===0||index===3?-1:1;
   const angle=sy*(arrive*8+range(time,6.04,6.30)*65);
   face.style.opacity=assemble*foldAlpha;
   face.firstElementChild.style.opacity=range(time,5.13,5.58);
   face.style.background='linear-gradient(120deg,#141e23,#0b151b 64%,#142329)';
   face.style.transform=`translate3d(${sx*(arrive*24+opening*26+opening*opening*35+departure*360)}px,${sy*(arrive*15+opening*19+opening*opening*25+departure*260)}px,${arrive*35+opening*45*(1-departure)}px) rotate3d(1,${axisY},0,${angle}deg)`;
   face.style.filter=`brightness(${.98+Math.sin(opening*Math.PI)*.24}) drop-shadow(0 ${7+opening*12}px ${5+opening*7}px #0009)`;
  });
  fragments.forEach(({piece,row,col},index)=>{
   const p=range(time,4.58+(index%4)*.022,5.03+(index%3)*.024),dx=(col-2),dy=(row-1.5);
   piece.style.opacity=fade(time,4.56,4.64,4.94,5.17);
   piece.style.transform=`translate3d(${dx*p*105}px,${dy*p*90}px,${p*(65+(index%5)*29)}px) rotateX(${dy*p*36}deg) rotateY(${-dx*p*39}deg) rotateZ(${(index%2?1:-1)*p*13}deg)`;
  });
  motes.forEach((mote,index)=>{
   const p=range(time,4.68,5.56),a=index/34*Math.PI*2+.09*Math.sin(index*2.3),radius=365+(index%5)*31+p*70;
   const divisor=Math.abs(Math.cos(a))+Math.abs(Math.sin(a));
   const x=640+Math.cos(a)*radius/divisor,y=358+Math.sin(a)*radius/divisor;
   mote.style.opacity=fade(time,4.7,4.94,5.38,5.64)*(.55+Math.sin(index+time*5)**2*.4);
   mote.style.transform=`translate3d(${x}px,${y}px,${22+(index%5)*15+p*35}px) rotateX(${index*19+p*78}deg) rotateY(${index*27-p*61}deg) rotateZ(${index*41+p*92}deg)`;
  });
 };
}
