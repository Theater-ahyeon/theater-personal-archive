const clamp=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const p=clamp(value);return p*p*(3-2*p);};
const progress=(time,start,end)=>ease((time-start)/(end-start));
const ns='http://www.w3.org/2000/svg';
const element=(name,attributes={})=>{const node=document.createElementNS(ns,name);for(const[key,value]of Object.entries(attributes))node.setAttribute(key,value);return node;};

/** Keeps the emblem assembly on the caller's existing deterministic timeline. */
export function createEmblemAssembly(stage){
 const panel=stage.querySelector('.emblem-panel');
 const svg=panel?.querySelector('svg');
 if(!svg)return()=>{};
 const original=[...svg.querySelectorAll('path[stroke="#eefdf9"]')];
 const mesh=element('g',{'class':'emblem-assembly-mesh'});
 const meshFaces=Array.from({length:8},()=>{const face=element('polygon',{stroke:'#93b0b32b','stroke-width':'.55'});mesh.append(face);return face;});
 svg.append(mesh);
 const mark=element('g',{'class':'emblem-assembly','transform':'translate(-13 5) translate(121.5 94.5) scale(.655 .75) translate(-121.5 -94.5)'});
 const finalMark=element('g',{'class':'emblem-assembled',fill:'none'});
 for(const path of original){const copy=path.cloneNode(true);copy.style.visibility='visible';finalMark.append(copy);path.style.visibility='hidden';}
 const definitions=[
  {a:[52,42],b:[191,42],width:9,start:6.63,offset:[7,20],turn:-.72},
  {a:[191,42],b:[121,147],width:9,start:6.68,offset:[-20,-3],turn:.64},
  {a:[121,147],b:[52,42],width:9,start:6.73,offset:[17,-18],turn:1.03},
  {a:[83,62],b:[161,62],width:7,start:6.84,offset:[-13,16],turn:.82},
  {a:[161,62],b:[121,117],width:7,start:6.9,offset:[11,-15],turn:-.83},
  {a:[121,117],b:[83,62],width:7,start:6.96,offset:[-18,-9],turn:.55}
 ];
 const pieces=definitions.map(definition=>{const node=element('path',{fill:'none',stroke:'#edf8f1','stroke-width':definition.width,'stroke-linecap':'square'});mark.append(node);return{...definition,node};});
 mark.append(finalMark);svg.append(mark);
 const vertices=[[0,-62,0],[0,62,0],[-62,0,0],[62,0,0],[0,0,-41],[0,0,41]];
 const faces=[[0,2,4],[0,4,3],[0,3,5],[0,5,2],[1,4,2],[1,3,4],[1,5,3],[1,2,5]];
 return function render(time,sequence){
  const active=sequence==='b'&&time>=6.08;
  mark.style.display=active?'':'none';mesh.style.display=active?'':'none';
  if(!active){panel.dataset.emblemPhase='dormant';return;}
  const assembled=progress(time,6.76,7.28);
  const complete=progress(time,7.25,7.3);
  finalMark.style.opacity=String(complete);
  panel.dataset.emblemPhase=time<6.63?'mesh':time<6.92?'fragments':time<7.3?'assembling':'complete';
  for(const piece of pieces){
   const settle=progress(time,piece.start,7.28);
   const reveal=progress(time,piece.start,piece.start+.065);
   const length=.13+.87*assembled;
   const center=[(piece.a[0]+piece.b[0])/2,(piece.a[1]+piece.b[1])/2];
   const angle=piece.turn*(1-settle),cos=Math.cos(angle),sin=Math.sin(angle);
   const depth=1+(1-settle)*.12;
   const point=([x,y])=>{
    const dx=(x-center[0])*length,dy=(y-center[1])*length;
    return[(center[0]+dx*cos-dy*sin+piece.offset[0]*(1-settle)-121.5)*depth+121.5,(center[1]+dx*sin+dy*cos+piece.offset[1]*(1-settle)-94.5)*depth+94.5];
   };
   const a=point(piece.a),b=point(piece.b);
   piece.node.setAttribute('d',`M${a[0].toFixed(3)} ${a[1].toFixed(3)}L${b[0].toFixed(3)} ${b[1].toFixed(3)}`);
   piece.node.style.opacity=String(reveal*(1-complete));
  }
  const turn=(time-6.3)*.74,tilt=.42;
  const points=vertices.map(([x,y,z])=>{
   const xx=x*Math.cos(turn)+z*Math.sin(turn),zz=-x*Math.sin(turn)+z*Math.cos(turn);
   const yy=y*Math.cos(tilt)-zz*Math.sin(tilt),depth=y*Math.sin(tilt)+zz*Math.cos(tilt),k=420/(420+depth);
   return[111+xx*k,96+yy*k,depth];
  });
  const ordered=faces.map((face,index)=>({face,index,depth:face.reduce((sum,vertex)=>sum+points[vertex][2],0)/3})).sort((a,b)=>b.depth-a.depth);
  ordered.forEach(({face,index,depth},order)=>{
   const node=meshFaces[order];node.setAttribute('points',face.map(vertex=>`${points[vertex][0].toFixed(2)},${points[vertex][1].toFixed(2)}`).join(' '));
   const alpha=(.11+(index%3)*.023)*(1-assembled*.56);
   node.setAttribute('fill',`rgba(${depth<0?'141,158,166':'86,109,121'},${alpha.toFixed(3)})`);
  });
 };
}
