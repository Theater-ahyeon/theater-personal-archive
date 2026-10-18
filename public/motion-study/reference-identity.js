import {referenceMarks} from './reference-marks.js';

export function mountReferenceIdentity(stage){
  const wordmark=stage.querySelector('.wordmark');
  if(!wordmark)return;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox',referenceMarks.sidebar.viewBox);
  svg.setAttribute('role','img');svg.setAttribute('aria-label','原片中的图形字标');
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d',referenceMarks.sidebar.path);path.setAttribute('fill','#edf3ec');path.setAttribute('fill-rule','evenodd');svg.append(path);
  svg.style.cssText='width:210px;height:78px;margin-left:-1px;margin-top:-5px;display:block';
  wordmark.replaceChildren(svg);
}
