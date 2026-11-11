import { forwardRef, useEffect, useState } from "react";
import type { Stage } from "./layout";

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Placement extends Box {
  stacked: boolean;
  font: number;
  heading: number;
}

/**
 * Pick the open patch of night sky that lets the names be largest without
 * touching the temple: the band above the photo on portrait screens, otherwise
 * the sky left of the shikhara or the sky right of the domes.
 */
export function placeNames(stage: Stage, vw: number, vh: number): Placement {
  const pad = Math.max(12, vw * 0.015);
  const W = stage.width;
  const H = stage.height;
  const boxes: Box[] = [];
  if (stage.mode === "portrait" || stage.top > vh * 0.2) {
    // below the SKIP / REPLAY control in the top corner
    const y = pad + 50;
    boxes.push({ x: pad, y, w: vw - 2 * pad, h: stage.top + H * 0.02 - y });
  }
  if (stage.mode !== "portrait") {
    const top = Math.max(pad, stage.top + H * 0.03);
    // sky left of the spire, above the trees
    const lx = stage.mode === "ultrawide" ? pad : Math.max(pad, stage.left + W * 0.015);
    boxes.push({ x: lx, y: top, w: stage.left + W * 0.225 - lx, h: stage.top + H * 0.315 - top });
    // sky right of the domes
    const rx = stage.left + W * 0.63;
    const rr = stage.mode === "ultrawide" ? vw - pad : Math.min(vw, stage.left + W) - pad;
    boxes.push({ x: rx, y: top, w: rr - rx, h: stage.top + H * 0.195 - top });
  }
  const cap = Math.min(110, vh * 0.12);
  let best: Placement | null = null;
  for (const b of boxes) {
    if (b.w <= 40 || b.h <= 40) continue;
    const single = Math.min(b.w / 11.4, b.h / 2.35, cap);
    const stacked = Math.min(b.w / 5.5, b.h / 4.5, cap);
    const isStacked = stacked > single * 1.12;
    const font = isStacked ? stacked : single;
    if (!best || font > best.font) {
      const heading = Math.max(9, Math.min(font * 0.25, isStacked ? b.w / 18 : b.w / 34, 19));
      best = { ...b, stacked: isStacked, font, heading };
    }
  }
  return (
    best ?? {
      x: pad,
      y: pad,
      w: vw - 2 * pad,
      h: vh * 0.25,
      stacked: true,
      font: Math.min(vw / 5.5, vh * 0.06),
      heading: 10,
    }
  );
}

interface Props {
  active: boolean;
  stage: Stage | null;
  vp: { w: number; h: number } | null;
}

/** When each line of the reveal appears, in ms from the start of the finale.
 *  The first burst opens ~1.3s in, so the names come in right behind it. */
export const NAME_TIMES = [700, 1300, 1800, 2300, 3200];

/** Cinematic reveal of the couple's names once the fireworks have begun. */
export const GrandNameReveal = forwardRef<HTMLDivElement, Props>(function GrandNameReveal({ active, stage, vp }, ref) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const ids = NAME_TIMES.map((t, i) => window.setTimeout(() => setStep(i + 1), t));
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [active]);

  if (!stage || !vp) return null;
  const p = placeNames(stage, vp.w, vp.h);
  const nameStyle = (on: boolean): React.CSSProperties => ({
    fontSize: p.font,
    opacity: on ? 1 : 0,
    transform: on ? "none" : "translateY(0.25em) scale(0.94)",
    filter: on ? "blur(0)" : "blur(10px)",
  });

  return (
    <div
      className="pointer-events-none absolute z-20 flex select-none flex-col items-center justify-center text-center"
      style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
      aria-live="polite"
    >
      {/* soft night-sky backing keeps the gold legible over distant bursts */}
      <div
        ref={ref}
        className={`name-reveal relative flex flex-col items-center px-[0.4em] py-[0.25em] ${step >= 1 ? "on" : ""}`}
        style={{ fontSize: p.font }}
      >
        <div className={`reveal-fade flex items-center gap-[0.25em] ${step >= 1 ? "on" : ""}`} aria-hidden>
          <span className="h-px w-[1.6em] bg-gradient-to-r from-transparent to-gold/70" />
          <span className="text-gold/80" style={{ fontSize: Math.max(8, p.heading * 0.8) }}>
            ✦
          </span>
          <span className="h-px w-[1.6em] bg-gradient-to-l from-transparent to-gold/70" />
        </div>
        <p
          className={`reveal-heading font-display text-gold/90 ${step >= 1 ? "on" : ""}`}
          style={{ fontSize: p.heading, lineHeight: 1.5 }}
        >
          {p.stacked ? (
            <>
              AN INVITATION TO
              <br />
              CELEBRATE LOVE
            </>
          ) : (
            "AN INVITATION TO CELEBRATE LOVE"
          )}
        </p>
        <h1
          className={`mt-[0.12em] flex font-display font-semibold leading-[1.08] ${p.stacked ? "flex-col items-center" : "flex-row items-baseline gap-[0.28em]"}`}
          style={{ fontSize: p.font }}
          aria-label="Hrithik and Himaja"
        >
          <span className={`reveal-name text-gold-gradient tracking-wide ${step >= 5 ? "settled" : ""}`} style={nameStyle(step >= 2)}>
            HRITHIK
          </span>
          <span
            className="reveal-name font-serif font-normal italic text-diya"
            style={{ ...nameStyle(step >= 3), fontSize: p.font * (p.stacked ? 0.62 : 0.8) }}
          >
            &amp;
          </span>
          <span className={`reveal-name text-gold-gradient tracking-wide ${step >= 5 ? "settled" : ""}`} style={nameStyle(step >= 4)}>
            HIMAJA
          </span>
        </h1>
        <div className={`reveal-fade mt-[0.18em] flex items-center ${step >= 5 ? "on" : ""}`} aria-hidden>
          <span className="h-px w-[3.2em] bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
        </div>
      </div>
    </div>
  );
});
