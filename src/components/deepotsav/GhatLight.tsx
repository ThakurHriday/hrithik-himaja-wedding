import { useMemo } from "react";
import { TIERS, ghatOutline, riserBase, riserPolygon, spline, treadPolygon, type Pt } from "./ghat";
import type { TierTiming } from "./layout";

const toD = (pts: Pt[], close = true) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + (close ? " Z" : "");

/**
 * Warm diya light on the photographed ghat stone, built from the same measured
 * tier geometry as the lamps: each tread warms as its row ignites, and the riser
 * face behind it catches the glow of the flames standing in front of it.
 */
export function GhatLight({ lit, offsetMs, timings }: { lit: boolean; offsetMs: number; timings: TierTiming[] }) {
  const shapes = useMemo(() => {
    const treads = TIERS.map((_, i) => toD(treadPolygon(i)));
    const risers = TIERS.map((_, i) => (i === 0 ? "" : toD(riserPolygon(i))));
    const t0 = TIERS[0]!;
    const water = toD([...spline([...t0.far, t0.tip]).map(([x, y]) => [x, y + 8] as Pt), ...riserBase(0)], false);
    return { treads, risers, water, outline: toD(ghatOutline()) };
  }, []);

  const timing = (start: number, end: number) => {
    const delay = Math.max(0, start - offsetMs);
    const dur = Math.max(900, end - start + 900);
    return lit ? `opacity ${Number.isFinite(offsetMs) ? dur : 900}ms ease ${Number.isFinite(offsetMs) ? delay : 0}ms` : "opacity 600ms ease";
  };

  return (
    <svg
      viewBox="0 0 1920 1280"
      preserveAspectRatio="none"
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen"
    >
      <defs>
        <filter id="ghat-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        {/* light stays on the stone: nothing spills past the ghat's edge */}
        <clipPath id="ghat-clip">
          <path d={shapes.outline} />
        </clipPath>
        <filter id="ghat-water" x="-10%" y="-20%" width="120%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <linearGradient id="ghat-tread" x1="1" y1="1" x2="0" y2="0">
          <stop offset="0" style={{ stopColor: "var(--diya)", stopOpacity: 0.55 }} />
          <stop offset="1" style={{ stopColor: "var(--gold)", stopOpacity: 0.35 }} />
        </linearGradient>
        <linearGradient id="ghat-riser" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" style={{ stopColor: "var(--diya)", stopOpacity: 0.1 }} />
          <stop offset="1" style={{ stopColor: "var(--diya)", stopOpacity: 0.5 }} />
        </linearGradient>
      </defs>
      <g clipPath="url(#ghat-clip)">
      {shapes.treads.map((d, i) => (
        <path
          key={`t${i}`}
          d={d}
          fill="url(#ghat-tread)"
          filter="url(#ghat-soft)"
          style={{ opacity: lit ? 0.3 : 0, transition: timing(timings[i]!.start, timings[i]!.end) }}
        />
      ))}
      {shapes.risers.map((d, i) =>
        d ? (
          <path
            key={`r${i}`}
            d={d}
            fill="url(#ghat-riser)"
            filter="url(#ghat-soft)"
            style={{ opacity: lit ? 0.3 : 0, transition: timing(timings[i - 1]!.start, timings[i - 1]!.end) }}
          />
        ) : null,
      )}
      </g>
      {/* golden light spilling onto the river along the waterfront */}
      <g className={lit ? "ghat-water-shimmer" : undefined}>
        <path
          d={shapes.water}
          fill="none"
          strokeWidth={22}
          strokeLinecap="round"
          filter="url(#ghat-water)"
          style={{ stroke: "var(--diya)", opacity: lit ? 0.55 : 0, transition: timing(timings[0]!.start, timings[0]!.end) }}
        />
      </g>
    </svg>
  );
}
