import {referenceMarks} from './reference-marks.js';
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => {const p=clamp(x);return p*p*(3-2*p)};
const random = seed => {const n=Math.sin(seed*127.1+311.7)*43758.5453;return n-Math.floor(n)};

export function createEndingScene() {
  const art=document.createElement('canvas');art.width=1280;art.height=720;
  const c=art.getContext('2d');
  c.fillStyle='#edf3ec';
  // Native contours retain the supplied clip's marks independently of the blog identity.
  for(const key of ['word','emblem','caption','registry'])c.fill(new Path2D(referenceMarks.ending[key]),'evenodd');
  c.save();c.globalAlpha=.55;c.fill(new Path2D(referenceMarks.ending.smallMark),'evenodd');c.restore();
  const pixels=c.getImageData(0,0,1280,720).data;
  const shards=[];
  for(let y=326;y<449;y+=6)for(let x=400;x<883;x+=6){
    if(pixels[(y*1280+x)*4+3]<150)continue;
    const seed=shards.length+13;
    shards.push({x,y,size:2+random(seed)*4.5,angle:random(seed+700)*Math.PI*2,spin:random(seed+300)*9-4.5,depth:random(seed+1900)*170-85,drift:random(seed+1300)});
  }
  const panels=[[28,47,184,93],[392,45,146,86],[814,55,153,96],[1075,79,165,170],[43,424,172,125],[185,552,216,83],[991,567,259,92],[1028,362,184,105],[461,601,128,42]];
  const sweep=[[9,350],[9.125,410],[9.25,470],[9.5,620],[9.75,765],[9.958333,850],[10.15,935]];
  function sweepAt(value,inputIndex){
    const outputIndex=1-inputIndex;
    for(let i=1;i<sweep.length;i++)if(value<=sweep[i][inputIndex]){
      const a=sweep[i-1],b=sweep[i],p=clamp((value-a[inputIndex])/(b[inputIndex]-a[inputIndex]));
      return a[outputIndex]+(b[outputIndex]-a[outputIndex])*p;
    }
    return sweep.at(-1)[outputIndex];
  }
  for(const shard of shards)shard.birth=sweepAt(shard.x,1);
  return function drawEnding(ctx,time){
    if(time>8.375&&time<8.885){
      const d=clamp((time-8.25)/.583333),scale=1+1.1*d*d+d*d*d;
      const velocity=(2.2*d+3*d*d)/.583333;
      ctx.save();ctx.globalAlpha=.24*d*(1-ease((time-8.79)/.095));
      const anchors=[[488,169],[814,169],[488,457],[814,457],[454,490],[834,614],[120,487],[390,610],[1085,165],[1190,268],[170,145],[330,260],[916,496],[1138,612]];
      for(const [x,y]of anchors){
        const nowX=640+(x-640)*scale,nowY=360+(y-360)*scale;
        const thenX=640+(x-640)*(scale-velocity*.045),thenY=360+(y-360)*(scale-velocity*.045);
        const light=ctx.createLinearGradient(thenX,thenY,nowX,nowY);light.addColorStop(0,'#c5e9df00');light.addColorStop(1,'#c5e9df');
        ctx.strokeStyle=light;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(thenX,thenY);ctx.lineTo(nowX,nowY);ctx.stroke();
      }
      ctx.restore();
    }
    if(time<8.78)return;
    const arrival=ease((time-8.78)/.1),glitch=(1-ease((time-9.04)/.25))*arrival;
    const scale=1+.135*(1-ease((time-9)/.35));
    ctx.save();ctx.globalAlpha=arrival;
    // Dormant panes and sparse registration marks preserve the source's technical space.
    for(let index=0;index<panels.length;index++){
      const [x,y,w,h]=panels[index];
      ctx.fillStyle='#60798206';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#789c9b14';ctx.lineWidth=.7;ctx.strokeRect(x,y,w,h);
      ctx.fillStyle='#a9c6bf20';ctx.fillRect(x+4,y+4,w*.2,2);
      for(let row=0;row<3;row++)ctx.fillRect(x+8,y+15+row*7,10+random(index*7+row)*w*.48,1);
      ctx.beginPath();ctx.moveTo(x-5,y+9);ctx.lineTo(x-5,y-5);ctx.lineTo(x+15,y-5);ctx.strokeStyle='#a5c8c154';ctx.stroke();
      if(index%2===0){ctx.font='6px Consolas,monospace';ctx.fillStyle='#abc2b66e';ctx.fillText('0'+index+' / '+String(9381+index*177),x+w-66,y+h+13)}
    }
    ctx.save();ctx.translate(640,360);ctx.scale(scale,scale);ctx.translate(-640,-360);
    if(time<9.0){
      const align=ease((time-8.78)/.22),frame=Math.floor(time*24);
      for(let row=0;row<31;row++){
        const y=203+row*11,offset=(random(row*13+frame*7)-.5)*260*(1-align);
        if(random(row+frame*31)>(.23+align*.77))continue;
        ctx.drawImage(art,360,y,560,10,360+offset,y,560,10);
      }
    }else{
      const front=sweepAt(time,0),halfWidth=64;
      ctx.save();
      ctx.beginPath();ctx.rect(0,0,1280,323);ctx.rect(0,449,1280,271);
      ctx.rect(0,323,Math.max(0,front-halfWidth),126);ctx.rect(front+halfWidth,323,Math.max(0,1280-front-halfWidth),126);ctx.clip();ctx.drawImage(art,0,0);ctx.restore();
      // The scan removes a local strip, scatters its geometry and restores the letters behind it.
      for(const shard of shards){
        const distance=shard.x-front;
        if(Math.abs(distance)<=halfWidth){
          const residue=clamp((Math.abs(distance)-22)/(halfWidth-22));
          if(random(shard.x+shard.y)<=residue*.7){ctx.globalAlpha=arrival*residue;ctx.drawImage(art,shard.x-3,shard.y-3,6,6,shard.x-3,shard.y-3,6,6);}
          const core=1-Math.abs(distance)/halfWidth,jitter=core*(5+shard.drift*8);
          if(shard.drift>.16){
            ctx.save();ctx.globalAlpha=arrival*(.18+.52*core);
            ctx.translate(shard.x+Math.sin(time*19+shard.angle)*jitter,shard.y+Math.cos(time*17+shard.angle)*jitter);
            ctx.rotate(Math.sin(time*9+shard.angle)*core);
            ctx.drawImage(art,shard.x-3,shard.y-3,6,6,-3,-3,6,6);ctx.restore();
          }
        }
      }
      for(const shard of shards){
        const age=time-shard.birth+.12;
        if(age<0||age>.65)continue;
        const life=Math.sin(Math.PI*age/.65),travel=28+age*190;
        const perspective=750/(750+shard.depth*Math.sin(age*3));
        const x=shard.x+(Math.cos(shard.angle)*travel+age*90)*perspective;
        const y=shard.y+Math.sin(shard.angle)*travel*1.22*perspective;
        const size=shard.size*(.5+life*.95)*perspective;
        ctx.save();ctx.globalAlpha=arrival*life*(.45+shard.drift*.55);ctx.translate(x,y);ctx.rotate(shard.angle+age*shard.spin);
        ctx.fillStyle=shard.depth<0?'#eff7f0':shard.drift>.4?'#c0d1cf':'#8b9e9e';
        ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(size*.85,size*.65);ctx.lineTo(-size*.65,size*.85);ctx.closePath();ctx.fill();
        if(shard.drift>.8){ctx.globalAlpha*=.45;ctx.fillRect(size*1.7,-size*.6,1.5,1.5)}
        ctx.restore();
      }
      ctx.globalAlpha=arrival;
    }
    ctx.restore();
    if(glitch>0){
      const palette=['#a3efd5','#f2f7ed','#c8db75','#cd4a91','#728891'];
      const frame=Math.floor(time*24);
      for(let i=0;i<25;i++){
        const y=130+(i*73)%447,x=(i*197+frame*29)%1260,w=16+random(i+frame*17)*165;
        ctx.globalAlpha=glitch*(.3+random(i+9)*.7);ctx.fillStyle=palette[i%palette.length];ctx.fillRect(x,y,w,i%3===0?7:2);
        if(i%4===0){ctx.fillStyle='#061016';ctx.fillRect(x+w*.3,y-1,w*.16,10)}
      }
    }
    ctx.restore();
  };
}
