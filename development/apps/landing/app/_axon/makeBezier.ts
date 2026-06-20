/** Node-graph edge path — vendored from the Axon product's Canvas. */
const r = (n: number) => Math.round(n * 100) / 100;

export function makeBezier(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.max(40, Math.abs(x2 - x1) * 0.45);
  return `M ${r(x1)} ${r(y1)} C ${r(x1 + dx)} ${r(y1)} ${r(x2 - dx)} ${r(y2)} ${r(x2)} ${r(y2)}`;
}
