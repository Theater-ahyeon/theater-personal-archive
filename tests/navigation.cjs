const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
function setup(saved=null,reduced=false,blocked=false){
 const events={},documentEvents={},media={matches:reduced,addEventListener:(n,fn)=>events.media=fn};
 const document={documentElement:{dataset:{}},body:null,addEventListener:(n,fn)=>documentEvents[n]=fn};
 const localStorage={getItem(){if(blocked)throw Error('storage denied');return saved;}};
 vm.runInNewContext(fs.readFileSync('public/navigation.js','utf8'),{document,matchMedia:()=>media,localStorage,addEventListener:(n,fn)=>events[n]=fn});
 return{events,documentEvents,document,media,transition(){let skipped=0;const value={skipTransition(){skipped++},ready:Promise.resolve(),finished:new Promise(()=>{})};return{value,get skipped(){return skipped;}};}};
}
for(const [saved,reduced,enabled]of[[null,false,true],[null,true,false],['off',false,false],['off',true,false],['full',true,true]]){
 const t=setup(saved,reduced);assert.equal(t.document.documentElement.dataset.navigationMotion,enabled?'on':'off');
 for(const name of ['pageswap','pagereveal']){const v=t.transition();t.events[name]({viewTransition:v.value});assert.equal(v.skipped,enabled?0:1);}
 t.events.pagereveal({});
}
{
 const t=setup(null,false,true);const v=t.transition();t.events.pagereveal({viewTransition:v.value});
 t.document.body={dataset:{effects:'off',motion:'system'}};t.documentEvents['theater-effects-change']();assert.equal(v.skipped,1);assert.equal(t.document.documentElement.dataset.navigationMotion,'off');
 t.document.body.dataset={effects:'on',motion:'full'};t.media.matches=true;t.events.media();assert.equal(t.document.documentElement.dataset.navigationMotion,'on');
 t.document.body.dataset={effects:'on',motion:'system'};t.events.pageshow();assert.equal(t.document.documentElement.dataset.navigationMotion,'off');
}
console.log('PASS: native transition guards for saved/off/system/full motion, missing API, blocked storage, mid-transition disable and BFCache pageshow. Navigation and history are not intercepted.');
