const clamp=x=>Math.max(0,Math.min(1,x));
const phase=(t,a,b)=>{const p=clamp((t-a)/(b-a));return p*p*(3-2*p)};
const reveal=[[5.01,5.29],[5.12,5.35],[5.36,5.66],[5.42,5.70],[5.51,5.79],[5.59,5.85]];
const scans=[[5.53,5.69,5.93,6.06],[5.91,6.08,6.37,6.55],[6.24,6.4,6.78,6.98],[5.64,5.82,6.06,6.25],null,null];

export function createArchiveCards(stage){
  const cards=[...stage.querySelectorAll('.study-card')];
  const style=document.createElement('style');
  style.textContent=`
    .study-card .card-scan{position:absolute;inset:0;z-index:3;pointer-events:none;mix-blend-mode:screen;background:linear-gradient(135deg,#5edcd1ee,#38adadcc 60%,#aa63b5d9);opacity:0;transform:translateZ(5px)}
    .study-card .card-body{position:relative;z-index:4}
    .study-card.highlight{background:#1b2025;border-color:#b0d6d1;box-shadow:0 0 13px #81e0d329}
    .study-card.highlight .card-body::after{display:none}
    .study-card.highlight .card-corners i{border-width:1px 0 0 1px;width:13px;height:12px}
    .study-card:nth-child(4) .card-image img{filter:grayscale(1)}
    .study-card .card-image::after{display:none}
  `;
  stage.append(style);
  const overlays=cards.map(card=>{
    const overlay=document.createElement('span');overlay.className='card-scan';overlay.setAttribute('aria-hidden','true');card.append(overlay);return overlay;
  });
  return(time,sequence)=>{
    if(sequence!=='a')return;
    cards.forEach((card,i)=>{
      const amount=phase(time,...reveal[i]),scan=scans[i];
      const light=scan?phase(time,scan[0],scan[1])*(1-phase(time,scan[2],scan[3])):0;
      card.style.opacity=amount;
      card.style.transform=`translate3d(0,${(1-amount)*35}px,${(1-amount)*-155+light*3}px) rotateY(${(1-amount)*-22-light*.8}deg) scale(${.9+amount*.1})`;
      card.classList.toggle('highlight',light>.12);
      const edge=170+600*(time-5.48)-(i%3)*261-Math.floor(i/3)*273*.6;
      const bottom=edge-(i<3?247:240)*.6;
      overlays[i].style.clipPath=`polygon(0 0,${edge}px 0,${bottom}px 100%,0 100%)`;
      overlays[i].style.opacity=light*.79;
      overlays[i].style.background=i===1&&time>6.24?'linear-gradient(135deg,#8b5bacb3,#605096ba 57%,#46c4cbd9 59%)':'linear-gradient(135deg,#62dfd5ee,#42b9bccc 64%,#c371b2cc)';
      if(i===2&&time>6.52)overlays[i].style.background='linear-gradient(45deg,#c34bb4dd,#656fbec7 38%,#53dddac9 66%,#42b0b3b8)';
      if(i===3&&time>5.96)overlays[i].style.background='linear-gradient(135deg,#966eb798,#8c89beac 30%,#5edfd5ee 62%)';
    });
  };
}
