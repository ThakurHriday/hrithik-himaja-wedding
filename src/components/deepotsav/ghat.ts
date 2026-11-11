// Perspective-aware model of the curved river ghat in the scene photo.
//
// Every number below was measured on the 1920×1280 photo (edge detection on the
// step lips + manual checks). Each tier is described by its stone lip — the edge
// where the flat tread meets the riser below it — traced from the far end (the
// part curving away towards the temple), round the tip, to the front end at the
// frame edge. Riser heights are measured vertical faces and act as the local
// perspective scale: an object resting on the stone appears exactly as much
// larger as the riser beside it does.
//
// Diyas are never placed by hand. Each row is the lip curve pushed inwards across
// the tread by a fixed fraction of the measured tread depth, and lamps are spaced
// by equal *real* distance (perspective scale × ground foreshortening), so every
// lamp's base lands on the stone surface of its own tread.

export type Pt = [number, number];

export const IMG_W = 1920;
export const IMG_H = 1280;

export interface TierDef {
  /** far lip, from the far end towards the tip */
  far: Pt[];
  tip: Pt;
  /** front lip, from the tip to the frame edge */
  front: Pt[];
  /** riser height (px) at the tip and at x = 1920 */
  riser: [number, number];
}

/** Index 0 = waterfront plinth, 4 = top terrace. */
export const TIERS: TierDef[] = [
  {
    far: [[1452, 831], [1402, 844], [1359, 859], [1334, 875], [1318, 900]],
    tip: [1314, 922],
    front: [[1320, 945], [1358, 979], [1398, 1016], [1438, 1058], [1478, 1092], [1518, 1121], [1558, 1148], [1598, 1175], [1638, 1203], [1680, 1240], [1716, 1272]],
    riser: [47, 92],
  },
  {
    far: [[1566, 794], [1515, 806], [1478, 819], [1462, 830]],
    tip: [1456, 842],
    front: [[1470, 858], [1500, 884], [1540, 903], [1580, 920], [1620, 935], [1660, 950], [1700, 966], [1740, 990], [1780, 1012], [1820, 1030], [1860, 1046], [1900, 1060], [1922, 1067]],
    riser: [57, 70],
  },
  {
    far: [[1682, 738], [1651, 742], [1612, 752], [1585, 764]],
    tip: [1571, 785],
    front: [[1580, 802], [1614, 815], [1654, 829], [1694, 844], [1734, 857], [1774, 868], [1814, 879], [1854, 890], [1894, 899], [1922, 905]],
    riser: [62, 82],
  },
  {
    far: [[1780, 713], [1762, 714], [1723, 718], [1695, 726]],
    tip: [1684, 740],
    front: [[1695, 749], [1726, 757], [1766, 768], [1806, 776], [1846, 784], [1886, 795], [1922, 802]],
    riser: [52, 66],
  },
  {
    far: [[1922, 678], [1896, 679], [1840, 683], [1800, 689]],
    tip: [1784, 700],
    front: [[1795, 706], [1826, 709], [1866, 712], [1906, 716], [1922, 717]],
    riser: [46, 56],
  },
];

/** Ground-plane foreshortening of image-vertical distances (ellipse ry/rx of the steps). */
export const FORESHORTEN = 0.42;

export function riserAt(tier: number, x: number) {
  const t = TIERS[Math.max(0, Math.min(TIERS.length - 1, tier))]!;
  const u = Math.max(0, Math.min(1, (x - t.tip[0]) / (IMG_W - t.tip[0])));
  return t.riser[0] + (t.riser[1] - t.riser[0]) * u;
}

/** Uniform Catmull-Rom through the control points, sampled densely. */
export function spline(ctrl: Pt[], perSeg = 10): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)]!;
    const p1 = ctrl[i]!;
    const p2 = ctrl[i + 1]!;
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)]!;
    for (let k = 0; k < perSeg; k++) {
      const t = k / perSeg;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(ctrl[ctrl.length - 1]!);
  return out;
}

/** Full lip polyline of a tier: far end → tip → front end. */
export function lipPath(tier: number): Pt[] {
  const t = TIERS[tier]!;
  return spline([...t.far, t.tip, ...t.front]);
}

/** Index in lipPath() of the tip. */
function tipIndex(path: Pt[], tier: number) {
  const tip = TIERS[tier]!.tip;
  let best = 0;
  let bd = Infinity;
  path.forEach((p, i) => {
    const d = Math.hypot(p[0] - tip[0], p[1] - tip[1]);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}

/** Base of a tier's riser (where it meets the tread below), tip → front end. */
export function riserBase(tier: number): Pt[] {
  const t = TIERS[tier]!;
  return spline([t.tip, ...t.front]).map(([x, y]) => [x, y + riserAt(tier, x)] as Pt);
}

/** The visible back edge of tread `tier`: the next riser's left face and base. */
function backSegments(tier: number): Pt[] {
  if (tier >= TIERS.length - 1) return lipPath(tier);
  const nxt = TIERS[tier + 1]!;
  return [nxt.tip, ...riserBase(tier + 1)];
}

function raySegment(p: Pt, n: Pt, a: Pt, b: Pt): number {
  // Solve p + n*t = a + (b-a)*s
  const ex = b[0] - a[0];
  const ey = b[1] - a[1];
  const den = n[0] * ey - n[1] * ex;
  if (Math.abs(den) < 1e-9) return Infinity;
  const ax = a[0] - p[0];
  const ay = a[1] - p[1];
  const t = (ax * ey - ay * ex) / den;
  const s = (ax * n[1] - ay * n[0]) / den;
  return s >= 0 && s <= 1 && t > 4 ? t : Infinity;
}

interface Sample {
  p: Pt;
  n: Pt;
  depth: number;
}

/** Lip samples with inward normals (into the tread) and measured tread depth. */
export function treadSamples(tier: number): Sample[] {
  const path = lipPath(tier);
  const back = backSegments(tier);
  const raw: Sample[] = path.map((p, i) => {
    const a = path[Math.max(0, i - 1)]!;
    const b = path[Math.min(path.length - 1, i + 1)]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    // traversal far → tip → front keeps the tread on this side
    const n: Pt = [dy / l, -dx / l];
    let depth = Infinity;
    for (let k = 0; k < back.length - 1; k++) depth = Math.min(depth, raySegment(p, n, back[k]!, back[k + 1]!));
    return { p, n, depth: depth > 320 ? NaN : depth };
  });
  // fill gaps (rays that leave the frame) from neighbours, then smooth
  const fallback = (x: number) => riserAt(tier + 1, x) * 1.6;
  const filled = raw.map((s, i) => {
    if (!Number.isNaN(s.depth)) return s.depth;
    for (let r = 1; r < raw.length; r++) {
      const l = raw[i - r];
      const h = raw[i + r];
      if (l && !Number.isNaN(l.depth)) return l.depth;
      if (h && !Number.isNaN(h.depth)) return h.depth;
    }
    return fallback(s.p[0]);
  });
  const W = 6;
  return raw.map((s, i) => {
    let sum = 0;
    let c = 0;
    for (let k = -W; k <= W; k++) {
      const v = filled[i + k];
      if (v !== undefined) {
        sum += v;
        c++;
      }
    }
    return { ...s, depth: sum / c };
  });
}

export interface RowPoint {
  x: number;
  y: number;
  /** local perspective scale: riser height (px) at this point */
  scale: number;
  /** true while still on the far branch (curving away towards the temple) */
  far: boolean;
}

/** A row of lamp positions across tread `tier`, at `frac` of the tread depth. */
export function rowPath(tier: number, frac: number): RowPoint[] {
  const samples = treadSamples(tier);
  const ti = tipIndex(
    samples.map((s) => s.p),
    tier,
  );
  return samples.map((s, i) => {
    const d = s.depth * frac;
    const x = s.p[0] + s.n[0] * d;
    const y = s.p[1] + s.n[1] * d;
    const scale = riserAt(tier, x) * (1 - frac) + riserAt(tier + 1, x) * (tier >= TIERS.length - 1 ? 0.85 * frac : frac);
    return { x, y, scale, far: i < ti };
  });
}

/** Where the waterfront plinth meets the river (for reflections). */
export function waterlineAt(x: number): number {
  const base = riserBase(0);
  for (let i = 0; i < base.length - 1; i++) {
    const [ax, ay] = base[i]!;
    const [bx, by] = base[i + 1]!;
    if (x >= ax && x <= bx) return ay + ((x - ax) / (bx - ax || 1)) * (by - ay);
  }
  return base[base.length - 1]![1];
}

/** Outline of the whole ghat against the water (image px), closed along the frame. */
export function ghatOutline(): Pt[] {
  const pts: Pt[] = [];
  for (let t = TIERS.length - 1; t >= 0; t--) {
    const T = TIERS[t]!;
    pts.push(...spline([...T.far, T.tip]));
  }
  pts.push(...riserBase(0));
  pts.push([IMG_W, IMG_H], [IMG_W, TIERS[TIERS.length - 1]!.far[0]![1]]);
  return pts;
}

/** Open river surface in front of the far shore, excluding the ghat (image px). */
export function waterPolygon(shoreY: number): Pt[] {
  const outline = ghatOutline().slice(0, -2);
  return [[0, shoreY], [IMG_W, shoreY], ...outline, [outline[outline.length - 1]![0], IMG_H], [0, IMG_H]];
}

/** Closed tread polygon (lit surface) of a tier. */
export function treadPolygon(tier: number): Pt[] {
  const lip = lipPath(tier);
  if (tier >= TIERS.length - 1) return lip;
  const back = [TIERS[tier + 1]!.tip, ...riserBase(tier + 1)].reverse();
  const end = lip[lip.length - 1]!;
  const corner: Pt[] = end[1] >= IMG_H - 10 ? [[IMG_W, IMG_H]] : [];
  return [...lip, ...corner, ...back];
}

/** Closed polygon of a riser's front face. */
export function riserPolygon(tier: number): Pt[] {
  const T = TIERS[tier]!;
  const top = spline([T.tip, ...T.front]);
  return [...top, ...riserBase(tier).reverse()];
}

export function insidePolygon([x, y]: Pt, poly: Pt[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

export function distanceToPath([x, y]: Pt, path: Pt[]) {
  let best = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = path[i]!;
    const [bx, by] = path[i + 1]!;
    const l2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / l2));
    best = Math.min(best, Math.hypot(x - (ax + t * (bx - ax)), y - (ay + t * (by - ay))));
  }
  return best;
}
