import { describe, expect, it } from "vitest";
import { computeDiyas, computeScene, IMG_H, IMG_W, SHORE_LINE } from "@/components/deepotsav/layout";
import { distanceToPath, insidePolygon, lipPath, treadPolygon, waterPolygon, type Pt } from "@/components/deepotsav/ghat";
import { NAME_TIMES, placeNames } from "@/components/deepotsav/GrandNameReveal";
import { FINALE_START, TEMPLE_START } from "@/components/deepotsav/DeepotsavOpening";

const inside = insidePolygon;
const distToPath = distanceToPath;

const { diyas, endMs, tierTimings } = computeDiyas();
const px = (d: (typeof diyas)[number]): Pt => [d.x * IMG_W, d.y * IMG_H];

describe("ghat diyas", () => {
  it("lights every tier of the ghat", () => {
    for (let t = 0; t < 5; t++) expect(diyas.filter((d) => d.tier === t).length).toBeGreaterThan(0);
  });

  it("rests every diya base on the stone of its own tread (none floating)", () => {
    for (const d of diyas) expect(inside(px(d), treadPolygon(d.tier))).toBe(true);
  });

  it("never stands a diya in the river", () => {
    const water = waterPolygon(SHORE_LINE * IMG_H);
    for (const d of diyas) expect(inside(px(d), water)).toBe(false);
  });

  it("keeps every diya back from the step edge so it is not perched on the lip", () => {
    for (const d of diyas) {
      const h = d.w * IMG_H * (156 / 320);
      expect(distToPath(px(d), lipPath(d.tier))).toBeGreaterThanOrEqual(Math.max(3, h * 0.3));
    }
  });

  it("does not let two diyas on a tread overlap", () => {
    for (const a of diyas)
      for (const b of diyas) {
        if (a.id >= b.id || a.tier !== b.tier) continue;
        const w = ((a.w + b.w) / 2) * IMG_H;
        const overlap = Math.abs(a.x - b.x) * IMG_W < w * 0.8 && Math.abs(a.y - b.y) * IMG_H < w * 0.45;
        expect(overlap).toBe(false);
      }
  });

  it("ignites sequentially along each row and climbs tier by tier", () => {
    for (let t = 0; t < 5; t++)
      for (const row of [0, 1]) {
        const r = diyas.filter((d) => d.tier === t && d.row === row);
        for (let i = 1; i < r.length; i++) expect(r[i]!.delay).toBeGreaterThan(r[i - 1]!.delay);
      }
    for (let t = 1; t < 5; t++) expect(tierTimings[t]!.start).toBeGreaterThan(tierTimings[t - 1]!.start);
  });

  it("starts the fireworks only after every diya is lit and the temple has lit up", () => {
    const lastDiya = Math.max(...diyas.map((d) => d.delay));
    expect(TEMPLE_START).toBeGreaterThan(lastDiya);
    expect(FINALE_START).toBeGreaterThan(endMs);
    // the temple's 4.2s glow is nearly over when the rockets rise, and they wait no longer
    expect(FINALE_START).toBeGreaterThan(TEMPLE_START + 2400);
    expect(FINALE_START).toBeLessThan(TEMPLE_START + 3200);
  });

  it("brings the names up within a breath of the first burst", () => {
    // first rocket leaves ~0.1s into the finale and takes ~1.2s to open, so the
    // heading must already be appearing and the full names settled shortly after
    expect(NAME_TIMES[0]).toBeLessThan(1000);
    expect(NAME_TIMES[NAME_TIMES.length - 1]).toBeLessThan(3600);
    for (let i = 1; i < NAME_TIMES.length; i++) expect(NAME_TIMES[i]!).toBeGreaterThan(NAME_TIMES[i - 1]!);
  });
});

// Temple silhouette in image fractions [x0, x1, y0, y1].
const TEMPLE: [number, number, number, number][] = [
  [0.235, 0.395, 0.03, 0.46], // shikhara
  [0.395, 0.59, 0.17, 0.46], // central domes
  [0.59, 0.67, 0.205, 0.46], // right pavilion
  [0.69, 0.77, 0.28, 0.46], // chhatri
];

const SCREENS: [string, number, number][] = [
  ["small phone", 320, 568],
  ["tall iPhone", 390, 844],
  ["android", 412, 915],
  ["tablet portrait", 820, 1180],
  ["tablet landscape", 1180, 820],
  ["laptop", 1366, 768],
  ["desktop", 1920, 1080],
  ["ultrawide", 3440, 1440],
  ["phone landscape", 844, 390],
];

describe("name reveal placement", () => {
  it.each(SCREENS)("keeps the names on screen and off the temple on %s", (_n, vw, vh) => {
    const s = computeScene(vw, vh).stage;
    const p = placeNames(s, vw, vh);
    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.y).toBeGreaterThanOrEqual(0);
    expect(p.x + p.w).toBeLessThanOrEqual(vw);
    expect(p.font).toBeGreaterThanOrEqual(18);
    const fx0 = (p.x - s.left) / s.width;
    const fx1 = (p.x + p.w - s.left) / s.width;
    const fy0 = (p.y - s.top) / s.height;
    const fy1 = (p.y + p.h - s.top) / s.height;
    for (const [x0, x1, y0, y1] of TEMPLE) {
      const hit = fx0 < x1 && fx1 > x0 && fy0 < y1 && fy1 > y0;
      expect(hit).toBe(false);
    }
  });
});

describe("opening scene fits every screen", () => {
  it.each(SCREENS)("runs the ghat exactly into the bottom-right corner on %s", (_n, vw, vh) => {
    const { temple, ghat } = computeScene(vw, vh);
    const g = (ghat ?? temple).stage;
    expect(Math.abs(g.left + g.width - vw)).toBeLessThanOrEqual(1);
    expect(Math.abs(g.top + g.height - vh)).toBeLessThanOrEqual(1);
  });

  it.each(SCREENS)("keeps the whole temple on screen on %s", (_n, vw, vh) => {
    const { temple } = computeScene(vw, vh);
    const { clip, stage: s } = temple;
    const x0 = s.left + 0.235 * s.width; // shikhara's left edge
    const x1 = s.left + 0.77 * s.width; // chhatri's right edge
    const tip = s.top + 0.074 * s.height; // spire tip
    expect(x0).toBeGreaterThanOrEqual(0);
    expect(x1).toBeLessThanOrEqual(vw);
    expect(tip).toBeGreaterThanOrEqual(Math.max(0, clip.top));
    expect(s.top + 0.46 * s.height).toBeLessThanOrEqual(clip.top + clip.height);
  });

  it("gives phones a closer view of the ghat so the diyas stay readable", () => {
    const { ghat } = computeScene(390, 844);
    expect(ghat).not.toBeNull();
    // front-row lamp: ~46px in the photo; on a phone it must still be ≥ 20px wide
    expect((46 / IMG_H) * ghat!.stage.height).toBeGreaterThanOrEqual(20);
  });
});
