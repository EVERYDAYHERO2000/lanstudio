import { path } from 'd3';
/**
 * @param {{x:number,y:number,left:boolean,bottom?:number}} source
 * @param {{x:number,y:number,left:boolean,bottom?:number}} target
 */
export function connectionCurve(source, target) {
  const p = path();
  const dx = target.x - source.x;
  const sourceDirection = source.left ? -1 : 1;
  const targetDirection = target.left ? -1 : 1;
  const backwards = sourceDirection !== targetDirection && dx * sourceDirection <= 0;
  p.moveTo(source.x, source.y);
  if (backwards) {
    // A lower return lane keeps a visible loop even when both ports have equal Y.
    const reach = Math.min(180, 85 + Math.abs(dx) * 0.18);
    const laneY = Math.max(source.bottom ?? source.y + 65, target.bottom ?? target.y + 65) + 65;
    const sx = source.x + sourceDirection * reach;
    const tx = target.x + targetDirection * reach;
    const midX = (sx + tx) / 2;
    p.bezierCurveTo(sx, source.y, sx, laneY, midX, laneY);
    p.bezierCurveTo(tx, laneY, tx, target.y, target.x, target.y);
    return { path: p.toString(), labelX: midX, labelY: laneY };
  }
  const reach = Math.max(55, Math.min(200, Math.abs(dx) * 0.5));
  const c1x = source.x + sourceDirection * reach;
  const c2x = target.x + targetDirection * reach;
  p.bezierCurveTo(c1x, source.y, c2x, target.y, target.x, target.y);
  return { path:p.toString(), labelX:(source.x+3*c1x+3*c2x+target.x)/8, labelY:(source.y+target.y)/2 };
}
