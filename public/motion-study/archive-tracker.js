const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

// Source F132/139/146/153/160/168: arrow tip, frame centre, half extents and roll.
const keys = [
  [132 / 24, 657, 401, 655, 404, 52, 52, 0, 42],
  [139 / 24, 656, 399, 655, 400, 52, 52, -.035, 42],
  [146 / 24, 769, 379, 750, 393, 47, 46, -.065, 22],
  [153 / 24, 918, 360, 897, 351, 48, 63, .025, 36],
  [160 / 24, 945, 348, 932, 350, 51, 65, .075, 34],
  [168 / 24, 974, 346, 953, 349, 49, 62, .015, 34]
];

function position(time) {
  let index = keys.findIndex(key => key[0] >= time);
  if (index <= 0) return (index === 0 ? keys[0] : keys.at(-1)).slice(1);
  const a = keys[index - 1], b = keys[index];
  const before = keys[Math.max(0, index - 2)], after = keys[Math.min(keys.length - 1, index + 1)];
  const span = b[0] - a[0], p = clamp((time - a[0]) / span), p2 = p * p, p3 = p2 * p;
  return a.slice(1).map((value, column) => {
    const j = column + 1;
    const m0 = (b[j] - before[j]) / (b[0] - before[0]);
    const m1 = (after[j] - a[j]) / (after[0] - a[0]);
    const valueAtTime = (2 * p3 - 3 * p2 + 1) * value + (p3 - 2 * p2 + p) * span * m0
      + (-2 * p3 + 3 * p2) * b[j] + (p3 - p2) * span * m1;
    return Math.max(Math.min(value, b[j]), Math.min(Math.max(value, b[j]), valueAtTime));
  });
}

function trackingFrame(ctx, x, y, halfWidth, halfHeight, angle, opacity) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  ctx.translate(x, y); ctx.rotate(angle);
  const points = [[0, -halfHeight], [halfWidth, 0], [0, halfHeight], [-halfWidth, 0]];
  ctx.beginPath();
  for (let index = 0; index < 4; index++) {
    const a = points[index], b = points[(index + 1) % 4];
    const at = amount => [a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount];
    const start = at(.035), end = at(.77), corner = at(.9);
    ctx.moveTo(...start); ctx.lineTo(...end); ctx.moveTo(...corner); ctx.lineTo(...b);
  }
  ctx.strokeStyle = '#e4f7ee'; ctx.lineWidth = 1.25; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-halfWidth * .55, -halfHeight * .05); ctx.lineTo(-halfWidth * .24, -halfHeight * .39);
  ctx.moveTo(halfWidth * .1, halfHeight * .62); ctx.lineTo(halfWidth * .39, halfHeight * .32);
  ctx.strokeStyle = '#b6d7d1'; ctx.lineWidth = .8; ctx.stroke();
  ctx.restore();
}

/** Fixed source-space overlay; the caller owns the canvas, time and animation loop. */
export function drawArchiveTracker(ctx, time) {
  if (!Number.isFinite(time) || time < 5.48 || time > 7.05) return;
  const alpha = ease((time - 5.48) / .02) * (1 - ease((time - 6.98) / .07));
  if (!alpha) return;
  const [tipX, tipY, x, y, w, h, angle, labelOffset] = position(time);
  const trail = position(time - .055);
  ctx.save();
  ctx.globalAlpha *= alpha; ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';

  trackingFrame(ctx, trail[2] - 3, trail[3] + 2, trail[4] * .96, trail[5] * .96, trail[6] - .055, .2);
  trackingFrame(ctx, x, y, w, h, angle, .95);
  trackingFrame(ctx, x - 2, y + 1, w * .8, h * .84, angle - .085, .48);

  ctx.save(); ctx.translate(tipX, tipY);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(43, 20); ctx.lineTo(23, 27); ctx.lineTo(14, 49); ctx.closePath();
  ctx.fillStyle = '#0923285c'; ctx.fill();
  ctx.strokeStyle = '#edfff5'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1, 2); ctx.lineTo(23, 27); ctx.strokeStyle = '#e2fff1bf'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();

  const labelX = tipX + labelOffset, labelY = tipY + 39;
  const readout = time < 5.95 ? '0.3981.886' : time < 6.25 ? '0.4781.039' : '0.3981.019';
  ctx.font = '10px Oswald, Arial, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#071217b8'; ctx.fillRect(labelX - 3, labelY - 10, ctx.measureText(readout).width + 8, 14);
  ctx.fillStyle = '#e3f6ef'; ctx.fillText(readout, labelX, labelY);
  ctx.font = '7px Oswald, Arial, sans-serif';
  ctx.fillStyle = '#d2e9e4b8'; ctx.fillText(time < 6.25 ? '203' : '103', x - 58, y - h + 9);
  ctx.font = '9px Oswald, Arial, sans-serif';
  ctx.fillStyle = '#ccdedad1'; ctx.fillText('001.833', x - 76, y + h + 15);
  ctx.font = '4.5px Consolas, monospace'; ctx.fillStyle = '#bedbd5a8';
  ctx.fillText('POSITION', labelX + 1, labelY + 10);
  ctx.fillText(`${Math.round(tipX)} / ${Math.round(tipY)}`, labelX + 1, labelY + 16);
  ctx.fillText('03 / FOLLOW', labelX + 1, labelY + 22);
  ctx.fillStyle = '#d6fff0ba'; ctx.fillRect(tipX + 67, tipY - 1, 3, 3);
  ctx.restore();
}
