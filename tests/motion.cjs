const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const source = fs.readFileSync('public/archive-v10.js', 'utf8');
function setup({reduced=false, fine=true, width=1440, dpr=3}={}) {
  const frames = new Map(), events = {}, observers = [], mutations = []; let next=0;
  const context = new Proxy({}, {get(target,key){return target[key] || (key==='createRadialGradient'?()=>({addColorStop(){}}):()=>{});},set(target,key,value){target[key]=value;return true;}});
  const node = () => ({style:{setProperty(){}},classList:{add(){}},hidden:true,addEventListener(name,fn){this[name]=fn;},setAttribute(){},getBoundingClientRect(){return {left:0,top:0,width,height:700};},getContext(){return context;},querySelector(){return null;},querySelectorAll(){return[];}});
  const hero=node(), canvas=node(), intro=node(), opening=node(), sculpture=node(), image=node();image.complete=false;image.src='relic.webp';
  hero.prepend=()=>{};intro.hidden=true;
  const nodes={'#intro':intro,'#intro-canvas':opening,'.hero':hero,'#hero-field':canvas,'.hero-sculpture':sculpture,'.hero-relic':image};
  const body={dataset:{effects:reduced?'off':'on',motion:'system'},classList:{add(){}}};
  const document={body,hidden:false,querySelector:q=>nodes[q]||null,querySelectorAll:()=>[],createElement:node,addEventListener(name,fn){events[name]=fn;}};
  const win={};
  class IntersectionObserver{constructor(fn){this.fn=fn;observers.push(this);}observe(n){this.target=n;}}
  class MutationObserver{constructor(fn){mutations.push(fn);}observe(){}}
  const sandbox={document,window:win,matchMedia:q=>({matches:q.includes('reduced')?reduced:fine,addEventListener(){}}),IntersectionObserver,MutationObserver,Image:function(){return image;},innerWidth:width,innerHeight:700,devicePixelRatio:dpr,performance:{now:()=>0},requestAnimationFrame:fn=>{frames.set(++next,fn);return next;},cancelAnimationFrame:id=>frames.delete(id),addEventListener:(name,fn)=>events[name]=fn,URL,Math};
  win.IntersectionObserver=IntersectionObserver;
  vm.runInNewContext(source,sandbox);
  return {frames,events,observers,mutations,body,document,win,sandbox,intro,hero,tick(time){const work=[...frames.values()];frames.clear();work.forEach(fn=>fn(time));}};
}
{
 const t=setup();assert.equal(t.frames.size,1);t.tick(34);assert.equal(t.win.TheaterV10.getState().heroDpr,2);
 const before=t.win.TheaterV10.getState().heroDraws;t.tick(40);assert.equal(t.win.TheaterV10.getState().heroDraws,before);t.tick(68);assert.equal(t.win.TheaterV10.getState().heroDraws,before+1);
 t.body.dataset.effects='off';t.events['theater-effects-change']();assert.equal(t.frames.size,0);assert.equal(t.win.TheaterV10.getState().heroRunning,false);
 t.body.dataset.effects='on';t.events['theater-effects-change']();assert.equal(t.frames.size,1);
 t.document.hidden=true;t.events.visibilitychange();assert.equal(t.frames.size,0);
 t.document.hidden=false;t.events.visibilitychange();assert.equal(t.frames.size,1);
 t.events.pagehide();assert.equal(t.frames.size,0);t.events.pageshow();assert.equal(t.frames.size,1);
 const observer=t.observers.find(x=>x.target===t.hero);observer.fn([{isIntersecting:false}]);assert.equal(t.frames.size,0);
 observer.fn([{isIntersecting:true}]);assert.equal(t.frames.size,1);
 t.sandbox.innerWidth=390;t.sandbox.devicePixelRatio=4;t.events.resize();assert.equal(t.win.TheaterV10.getState().heroDpr,1.5);
 t.intro.hidden=false;t.mutations[0]();assert.equal(t.win.TheaterV10.getState().introOpen,true);assert.equal(t.win.TheaterV10.getState().heroRunning,false);
 t.intro.hidden=true;t.mutations[0]();assert.equal(t.win.TheaterV10.getState().introRunning,false);assert.equal(t.frames.size,1);
}
{
 const t=setup({reduced:true,width:390,fine:false});assert.equal(t.frames.size,0);assert.equal(t.win.TheaterV10.getState().motion,false);
 t.body.dataset.motion='full';t.body.dataset.effects='on';t.events['theater-effects-change']();assert.equal(t.frames.size,1);
 t.body.dataset.effects='off';t.events['theater-effects-change']();assert.equal(t.frames.size,0);
}
console.log('PASS: mocked canvas scheduling, 30fps cap, DPR desktop/mobile bounds, offscreen/hidden/pagehide suspension, resize, reduced override, intro interruption. Rendering quality is not tested.');
