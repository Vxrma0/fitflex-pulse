export type Joint = { x: number; y: number; z: number; visibility: number };

type OneEuroState = {
  lastTs: number | null;
  lastValue: number | null;
  lastFiltered: number | null;
  lastDeriv: number | null;
};

function alpha(cutoff: number, dt: number) {
  const tau = 1.0 / (2 * Math.PI * cutoff);
  return 1.0 / (1.0 + tau / dt);
}

class OneEuro {
  freq: number;
  minCutoff: number;
  beta: number;
  dCutoff: number;
  state: OneEuroState;

  constructor(freq = 60, minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.freq = freq;
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.state = { lastTs: null, lastValue: null, lastFiltered: null, lastDeriv: null };
  }

  filter(value: number, ts: number) {
    if (this.state.lastTs == null) {
      this.state.lastTs = ts;
      this.state.lastValue = value;
      this.state.lastFiltered = value;
      this.state.lastDeriv = 0;
      return value;
    }
    const dt = Math.max(1e-3, (ts - this.state.lastTs) / 1000);
    const deriv = (value - (this.state.lastValue ?? value)) / dt;
    const ed = alpha(this.dCutoff, dt);
    const derivFiltered = ed * deriv + (1 - ed) * (this.state.lastDeriv ?? deriv);
    const cutoff = this.minCutoff + this.beta * Math.abs(derivFiltered);
    const a = alpha(cutoff, dt);
    const filtered = a * value + (1 - a) * (this.state.lastFiltered ?? value);

    this.state.lastTs = ts;
    this.state.lastValue = value;
    this.state.lastFiltered = filtered;
    this.state.lastDeriv = derivFiltered;
    return filtered;
  }
}

const filters: Record<string, OneEuro> = {};

export function smoothPose(joints: Joint[], ts = Date.now()): Joint[] {
  return joints.map((j, idx) => {
    const kx = `j${idx}_x`;
    const ky = `j${idx}_y`;
    if (!filters[kx]) filters[kx] = new OneEuro(60, 1.0, 0.01, 1.0);
    if (!filters[ky]) filters[ky] = new OneEuro(60, 1.0, 0.01, 1.0);
    const sx = filters[kx].filter(j.x, ts);
    const sy = filters[ky].filter(j.y, ts);
    const zKey = `j${idx}_z`;
    if (!filters[zKey]) filters[zKey] = new OneEuro(60, 1.0, 0.01, 1.0);
    const sz = filters[zKey].filter(j.z, ts);
    return { x: sx, y: sy, z: sz, visibility: j.visibility };
  });
}
