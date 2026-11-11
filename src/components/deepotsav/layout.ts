// Layout math for the Deepotsav opening scene.
// The scene photo (unlit + lit versions, pixel-aligned) is placed in a "stage"
// that always keeps the image's native ratio. Diyas are positioned in image
// fractions on the ghat treads (see ./ghat.ts), so they stay locked to the stone
// at every screen size and never distort.

import { FORESHORTEN, IMG_H, IMG_W, TIERS, distanceToPath, insidePolygon, lipPath, rowPath, treadPolygon, waterlineAt } from "./ghat";

export { IMG_W, IMG_H };
export const IMG_RATIO = IMG_W / IMG_H;
/** Fraction of image height where the river meets the far shore. */
export const SHORE_LINE = 0.485;

export type Mode = "portrait" | "landscape" | "ultrawide";

export interface Stage {
  mode: Mode;
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Largest share of the photo's top (plain sky above the spire tip at ≈7.4%) that may be cropped. */
export const MAX_TOP_CROP = 0.035;
/** Largest share of the photo's left (water and trees before the shikhara at ≈23.5%) that may be cropped. */
export const MAX_LEFT_CROP = 0.21;

/**
 * The photo is always anchored to the bottom-right corner of the screen, so the
 * ghat steps run exactly into the screen's bottom and right edges on every
 * device. It is scaled as large as possible while the whole temple (spire tip to
 * chhatri) stays in frame:
 * - tall screens show the full temple + ghat with open night sky above (portrait),
 * - wide screens continue the river and trees to the left (ultrawide),
 * - everything in between simply covers the screen (landscape).
 */
export function computeStage(vw: number, vh: number): Stage {
  const cover = Math.max(vw / IMG_W, vh / IMG_H);
  const s = Math.min(cover, vh / (1 - MAX_TOP_CROP) / IMG_H, vw / (1 - MAX_LEFT_CROP) / IMG_W);
  const width = IMG_W * s;
  const height = IMG_H * s;
  // whole pixels, so the photo's edges and the mirrored river meet without a seam
  const left = Math.round(vw - width);
  const top = Math.round(vh - height);
  const mode: Mode = top > vh * 0.15 ? "portrait" : left > 1 ? "ultrawide" : "landscape";
  return { mode, left, top, width, height };
}

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** A window onto the photo: `clip` is the visible screen rect, `stage` the full photo box behind it. */
export interface Frame {
  clip: Box;
  stage: Stage;
  /** px of soft fade at the clip's top / bottom edge (0 = crisp edge) */
  fadeTop: number;
  fadeBottom: number;
  /**
   * Ghat window only: show just the stone of the ghat (feathered outline) plus
   * everything below this photo-pixel row; the rest lets the temple's river through.
   */
  ghatOnlyAbove?: number | undefined;
}

export interface Scene {
  /** photo box the temple, fireworks and names are laid out on */
  stage: Stage;
  /** temple + river window */
  temple: Frame;
  /** separate, larger window onto the ghat on phones; null when the temple frame shows the ghat */
  ghat: Frame | null;
}

/** Image-fraction crops used for the two-window phone composition. */
const PHONE_TEMPLE_X: [number, number] = [0.205, 0.795];
const PHONE_GHAT_X0 = 0.655;
/** Top of the ghat's upper terrace (its far end at the frame edge), fraction of photo height. */
const GHAT_TOP_Y = 678 / IMG_H;

/**
 * Whole scene for a screen. On tall phones a single photo would be too small for
 * the diyas to read, so the photo is shown through two windows: the temple and
 * its reflection fill the width, and a closer view of just the ghat stone runs
 * into the bottom-right corner, standing in the same river.
 */
export function computeScene(vw: number, vh: number): Scene {
  const single = computeStage(vw, vh);
  const fullFrame = (st: Stage): Frame => ({
    clip: { left: st.left, top: st.top, width: st.width, height: st.height },
    stage: st,
    fadeTop: st.top > 0.5 ? st.height * 0.07 : 0,
    fadeBottom: 0,
  });
  if (single.mode !== "portrait" || single.height >= 500) return { stage: single, temple: fullFrame(single), ghat: null };

  // ghat window: fills the width, flush with bottom and right; the ghat takes at most 46% of the screen
  let gW = vw / (1 - PHONE_GHAT_X0);
  if ((1 - GHAT_TOP_Y) * (gW / IMG_RATIO) > vh * 0.46) gW = ((vh * 0.46) / (1 - GHAT_TOP_Y)) * IMG_RATIO;
  const gH = gW / IMG_RATIO;
  const ghatStage: Stage = { mode: "portrait", left: vw - gW, top: vh - gH, width: gW, height: gH };
  const terraceY = ghatStage.top + GHAT_TOP_Y * gH;

  // temple window: whole temple across the width, its shore a little above the ghat's top terrace
  const tW = vw / (PHONE_TEMPLE_X[1] - PHONE_TEMPLE_X[0]);
  const tH = tW / IMG_RATIO;
  const tTop = terraceY - vh * 0.05 - SHORE_LINE * tH;
  const templeStage: Stage = { mode: "portrait", left: -PHONE_TEMPLE_X[0] * tW, top: tTop, width: tW, height: tH };
  const tBottom = Math.min(vh, tTop + tH);
  const blend = Math.round(vh * 0.05);

  return {
    stage: templeStage,
    temple: {
      clip: { left: 0, top: tTop, width: vw, height: tBottom - tTop },
      stage: templeStage,
      fadeTop: tH * 0.07,
      fadeBottom: tBottom < vh ? blend : 0,
    },
    ghat: {
      clip: { left: 0, top: Math.max(0, ghatStage.top), width: vw, height: vh - Math.max(0, ghatStage.top) },
      stage: ghatStage,
      fadeTop: 0,
      fadeBottom: 0,
      // below the temple window the ghat window's own river takes over
      ghatOnlyAbove: ((tBottom - blend - ghatStage.top) / gH) * IMG_H,
    },
  };
}

/**
 * Extra size for diyas on small scenes (phones) so every lamp stays readable;
 * the measured spacing (1.75 lamp widths) leaves room for this.
 */
export function diyaBoost(stageH: number) {
  return Math.min(1.35, Math.max(1, Math.sqrt(720 / stageH)));
}

export interface DiyaSpec {
  id: number;
  /** base (contact point) as fractions of the stage image */
  x: number;
  y: number;
  /** sprite width as a fraction of stage height */
  w: number;
  delay: number;
  flick: number;
  flickDelay: number;
  tier: number;
  row: number;
  /** distance from the base down to the flame's mirror image in the river, fraction of stage height */
  refl?: number;
  float?: boolean;
}

/** Diya sprite (diya-clay-centre.webp) proportions. */
export const DIYA_ASPECT = 156 / 320;
/** Sprite width relative to the local riser height. */
const DIYA_PER_RISER = 0.66;
/** Gap between neighbouring lamps, in lamp widths, measured on the stone. */
const SPACING = 1.75;
/** Rows across each tread: fraction of the tread depth from the front lip. */
const ROWS: number[][] = [[0.3, 0.68], [0.32, 0.7], [0.36], [0.4], [0.45]];

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export const IGNITE_START = 900;
/** ms for the flame to travel one lamp along a row */
const STEP_MS = 105;

export interface TierTiming {
  start: number;
  end: number;
}

/**
 * Lamps along every tread, lit from the waterfront upward. On each tier the
 * flame travels from the near end of the curve, round the tip and along the far
 * branch that curves away towards the temple.
 */
export function computeDiyas(): { diyas: DiyaSpec[]; hero: DiyaSpec; endMs: number; tierTimings: TierTiming[] } {
  const diyas: DiyaSpec[] = [];
  const tierTimings: TierTiming[] = [];
  let id = 0;
  let t = IGNITE_START;

  TIERS.forEach((_, tier) => {
    const tierStart = t;
    let tierEnd = t;
    const nextTip = TIERS[tier + 1]?.tip[0] ?? Infinity;
    let tierDur = 0;
    const taken: { x: number; y: number; w: number }[] = [];
    const tread = treadPolygon(tier);
    const lip = lipPath(tier);

    ROWS[tier]!.forEach((frac, row) => {
      // walk the row from the near (front) end towards the temple
      const path = rowPath(tier, frac).reverse();
      const placed: { x: number; y: number; w: number; far: boolean }[] = [];
      let carry = Infinity;
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1]!;
        const b = path[i]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const seg = Math.hypot(dx, dy);
        if (seg === 0) continue;
        const w = a.scale * DIYA_PER_RISER;
        // image length per unit of real ground distance along this direction
        const ground = Math.hypot(dx / seg, dy / seg / FORESHORTEN);
        // equal spacing on the stone, but never closer than a lamp width on screen
        const step = Math.max((SPACING * w) / ground, 1.05 * w);
        carry += seg;
        if (carry < step) continue;
        const half = w / 2;
        // back rows only where the tread is wide: they stop before the tip narrows
        if (row > 0 && a.far) break;
        // fully inside the photo, and never peeking out from behind the next tier
        if (a.x + half > IMG_W || a.x - half < 0 || a.y > IMG_H - 2) continue;
        if (a.far && a.x + half > nextTip - 2) continue;
        // the base must stand on this tread's stone, set back from the step edge
        const h = w * DIYA_ASPECT;
        if (!insidePolygon([a.x, a.y], tread) || distanceToPath([a.x, a.y], lip) < Math.max(3, h * 0.3)) continue;
        // keep clear of lamps already standing on this tread (other rows)
        if (taken.some((q) => Math.abs(q.x - a.x) < 0.9 * (q.w + w) * 0.5 && Math.abs(q.y - a.y) < 1.1 * h)) continue;
        carry = 0;
        placed.push({ x: a.x, y: a.y, w, far: a.far });
        taken.push({ x: a.x, y: a.y, w });
      }
      if (row === 0) tierDur = placed.length * STEP_MS;
      placed.forEach((p, k) => {
        const u = placed.length > 1 ? k / (placed.length - 1) : 0;
        const delay = Math.round(tierStart + u * tierDur + row * 260);
        tierEnd = Math.max(tierEnd, delay);
        const h = p.w * DIYA_ASPECT;
        let refl: number | undefined;
        if (tier === 0 && row === 0) {
          const wl = waterlineAt(p.x);
          const flameY = p.y - h * 1.15;
          const mirror = 2 * wl - flameY;
          if (mirror < IMG_H) refl = (mirror - p.y) / IMG_H;
        }
        diyas.push({
          id: id++,
          x: p.x / IMG_W,
          y: p.y / IMG_H,
          w: p.w / IMG_H,
          delay,
          flick: 0.6 + rand(id * 13) * 0.7,
          flickDelay: -rand(id * 17) * 2,
          tier,
          row,
          ...(refl !== undefined ? { refl } : {}),
        });
      });
    });

    tierTimings.push({ start: tierStart, end: tierEnd });
    // Next tier starts before this one finishes, so the light climbs like a wave.
    t = tierStart + (tierEnd - tierStart) * 0.5;
  });

  const hero: DiyaSpec = {
    id: -1,
    x: 0.3,
    y: 0.93,
    w: 69 / IMG_H,
    delay: 250,
    flick: 1.2,
    flickDelay: 0,
    tier: -1,
    row: 0,
    float: true,
  };
  const endMs = Math.max(...diyas.map((d) => d.delay)) + 500;
  return { diyas, hero, endMs, tierTimings };
}
