const vertices=[],faces=[],edgeMap=new Map();
const vertex=point=>{vertices.push(point);return vertices.length-1};
const edge=(a,b,weight=1)=>{const key=Math.min(a,b)+':'+Math.max(a,b);if(!edgeMap.has(key)||edgeMap.get(key).weight<weight)edgeMap.set(key,{a,b,weight})};
function face(indices,material=0){faces.push({indices,material})}
const profile=[[-163,41],[-158,46],[-148,49],[-136,49],[-125,46],[-116,37],[-103,35],[-95,37],[-91,47],[-86,49],[-74,49],[-69,44],[-52,44],[-34,44],[-16,44],[2,44],[20,44],[38,44],[50,45],[54,48],[64,48],[69,41],[84,40],[100,39],[111,33],[135,32],[150,31],[155,29]];
const rings=profile.map(([x,r])=>Array.from({length:24},(_,i)=>vertex([x,Math.cos(i*Math.PI/12)*r,Math.sin(i*Math.PI/12)*r])));
for(let j=0;j<rings.length;j++)for(let i=0;i<24;i++){
  const next=(i+1)%24;
  edge(rings[j][i],rings[j][next],j<5||[8,9,10,19,20,26,27].includes(j)?1.15:.55);
  if(j===rings.length-1)continue;
  const a=rings[j][i],b=rings[j][next],c=rings[j+1][next],d=rings[j+1][i];
  edge(a,d,.82);face([a,b,c,d]);
  if(j<6||j>22||[7,8,9].includes(j))edge(i%2?a:b,i%2?c:d,.7);
}
function cap(x,r,sign){
  const outer=[],inner=[];
  for(let i=0;i<16;i++){
    const a=i*Math.PI/8;
    outer.push(vertex([x,Math.cos(a)*r,Math.sin(a)*r]));
    inner.push(vertex([x-sign*10,Math.cos(a+Math.PI/16)*r*.76,Math.sin(a+Math.PI/16)*r*.76]));
  }
  const center=vertex([x-sign*14,2,-1]);
  for(let i=0;i<16;i++){
    const n=(i+1)%16;edge(outer[i],outer[n],1.3);edge(inner[i],inner[n],.8);
    edge(outer[i],inner[i],.85);edge(outer[n],inner[i],.65);edge(inner[i],center,.55);
    face([outer[i],outer[n],inner[i]],1);face([outer[n],inner[n],inner[i]],1);face([inner[i],inner[n],center],0);
  }
}
cap(-164,42,-1);cap(156,30,1);
function block(x0,x1,angle,r,width,height){
  const ids=[];
  for(const x of [x0,x1])for(const radial of [r,r+height])for(const tangent of [-width/2,width/2])ids.push(vertex([x,Math.cos(angle)*radial-Math.sin(angle)*tangent,Math.sin(angle)*radial+Math.cos(angle)*tangent]));
  for(const indices of [[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]]){
    const f=indices.map(i=>ids[i]);face(f,2);for(let i=0;i<4;i++)edge(f[i],f[(i+1)%4],1.35);
  }
}
block(-54,38,.44,44,11,7);
block(-44,-8,3.59,44,17,7);
block(19,58,3.59,44,15,8);
block(-92,-75,-1.1,47,16,9);
block(48,65,1.92,46,12,7);
const edges=[...edgeMap.values()];
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const p=clamp(x);return p*p*(3-2*p)};

/** Native stepped housing: recessed cap faces, attached rails and region-specific wire topology. */
export function drawWireDevice(ctx,time,{x,y,scale=1,roll,yaw,alpha=1,annotations=true}={}){
  const phase=smooth((time-3.65)/.75);
  const centerX=x??(685.5-3.5*phase),centerY=y??(310.5-7*phase),sizeScale=scale*(1+.018*phase);
  let offsetX=0,offsetY=0;
  const angle=roll??(.64-.35*phase),viewYaw=yaw??(-.69+.59*phase),spin=time*.72;
  const project=([px,py,pz],rotateBody=true)=>{
    const yy=rotateBody?py*Math.cos(spin)-pz*Math.sin(spin):py;
    const zz=rotateBody?py*Math.sin(spin)+pz*Math.cos(spin):pz;
    const xx=px*Math.cos(viewYaw)+zz*Math.sin(viewYaw),depth=-px*Math.sin(viewYaw)+zz*Math.cos(viewYaw);
    const sx=xx*Math.cos(angle)-yy*Math.sin(angle),sy=xx*Math.sin(angle)+yy*Math.cos(angle);
    const p=820/(820+depth);
    return [centerX+sx*p*sizeScale+offsetX,centerY+sy*p*sizeScale+offsetY,depth,sx,sy];
  };
  const points=vertices.map(p=>project(p));
  // The source camera keeps the visible housing centered while its yaw changes.
  offsetX=centerX-(Math.min(...points.map(p=>p[0]))+Math.max(...points.map(p=>p[0])))/2;
  offsetY=centerY-(Math.min(...points.map(p=>p[1]))+Math.max(...points.map(p=>p[1])))/2;
  for(const p of points){p[0]+=offsetX;p[1]+=offsetY}
  let minDepth=Infinity,maxDepth=-Infinity;
  for(const p of points){minDepth=Math.min(minDepth,p[2]);maxDepth=Math.max(maxDepth,p[2])}
  const depthRange=Math.max(1,maxDepth-minDepth);
  const ordered=faces.map(f=>({...f,depth:f.indices.reduce((n,i)=>n+points[i][2],0)/f.indices.length})).sort((a,b)=>b.depth-a.depth);
  ctx.save();ctx.globalAlpha*=alpha;ctx.lineJoin='round';ctx.shadowBlur=0;
  for(const f of ordered){
    const light=1-(f.depth-minDepth)/depthRange;
    ctx.beginPath();f.indices.forEach((i,j)=>j?ctx.lineTo(points[i][0],points[i][1]):ctx.moveTo(points[i][0],points[i][1]));ctx.closePath();
    ctx.fillStyle='rgba(184,223,219,'+(.018+light*.024+f.material*.022)+')';ctx.fill();
  }
  for(const e of edges){
    const p=points[e.a],q=points[e.b],near=1-((p[2]+q[2])/2-minDepth)/depthRange;
    ctx.strokeStyle='rgba(209,242,235,'+Math.min(.95,(.23+near*.45)*e.weight)+')';ctx.lineWidth=e.weight>1?1.05:.55;
    ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();
  }
  if(annotations){
    const routes=[[[-150,-90,0],[72,-90,0],[72,-70,0]],[[-112,78,0],[-112,94,0],[112,94,0]]];
    ctx.strokeStyle='#d0e9dfbb';ctx.lineWidth=.9;
    for(const route of routes){const p=route.map(v=>project(v,false));ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(v[0],v[1]):ctx.moveTo(v[0],v[1]));ctx.stroke();}
  }
  ctx.restore();
  return {left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))};
}
