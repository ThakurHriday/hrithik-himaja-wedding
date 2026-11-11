// Fireworks finale. One simulation drives two canvases:
//  • the sky canvas sits between the scene photo and the transparent temple
//    cut-out, so rockets rise from behind the roofline and bursts never cover
//    the architecture;
//  • the reflection canvas sits on the river, clipped to open water, and draws
//    the same bursts mirrored about the shoreline.

import { useEffect, useMemo, useRef } from "react";
import { IMG_H, IMG_W, waterPolygon } from "./ghat";
import { SHORE_LINE, type Stage } from "./layout";

type Kind = "peony" | "willow" | "ring" | "glitter";

interface Rocket {
  x0: number;
  y0: number;
  tx: number;
  ty: number;
  t: number;
  dur: number;
  r: number;
  kind: Kind;
  color: number;
  trail: [number, number][];
}

interface Spark {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: number;
  size: number;
  drag: number;
  grav: number;
  tw: number;
  glitter: boolean;
}

interface Flash {
  x: number;
  y: number;
  r: number;
  life: number;
  color: number;
}

export interface FireworksGeometry {
  stage: Stage;
  vw: number;
  vh: number;
  /** viewport rect the bursts must keep clear of (the couple's names) */
  avoid: DOMRect | null;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export class FireworksEngine {
  sky: HTMLCanvasElement | null = null;
  refl: HTMLCanvasElement | null = null;
  geo: FireworksGeometry | null = null;
  private colors = ["#ffd98a", "#fff3dc", "#ffb066", "#ffe7a8"];
  private rockets: Rocket[] = [];
  private sparks: Spark[] = [];
  private flashes: Flash[] = [];
  private raf = 0;
  private last = 0;
  private next = 0;
  private launched = 0;
  private running = false;

  start() {
    if (this.running) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cs = getComputedStyle(document.documentElement);
    const read = (v: string, f: string) => cs.getPropertyValue(v).trim() || f;
    this.colors = [
      read("--fw-gold", this.colors[0]!),
      read("--fw-white", this.colors[1]!),
      read("--fw-orange", this.colors[2]!),
      read("--fw-champagne", this.colors[3]!),
    ];
    this.running = true;
    this.launched = 0;
    this.last = performance.now();
    this.next = this.last + 120;
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.rockets = [];
    this.sparks = [];
    this.flashes = [];
    for (const c of [this.sky, this.refl]) c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  }

  private fit(c: HTMLCanvasElement) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(c.clientWidth * dpr);
    const h = Math.round(c.clientHeight * dpr);
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    return dpr;
  }

  /** Burst centre and radius in the sky, clear of the names. */
  private pickBurst(g: FireworksGeometry) {
    const { stage: s, vw, vh, avoid } = g;
    const roof = s.top + s.height * 0.27;
    const topY = Math.max(vh * 0.05, avoid && avoid.top < vh * 0.15 && s.mode === "portrait" ? avoid.bottom + 24 : 0);
    const botY = Math.max(topY + 30, Math.min(roof, vh * 0.55));
    const templeL = s.left + s.width * 0.2;
    const templeR = s.left + s.width * 0.8;
    const base = Math.min(vw, vh) * (s.mode === "portrait" ? 0.2 : 0.17);
    for (let i = 0; i < 14; i++) {
      const x = rnd(Math.max(vw * 0.04, templeL - s.width * 0.12), Math.min(vw * 0.96, templeR + s.width * 0.12));
      let r = base * rnd(0.75, 1.3);
      // the whole burst stays inside the sky, never cut by the top of the screen
      const y = Math.max(rnd(topY, botY), r * 0.95 + 8);
      if (avoid) {
        const pad = 18;
        const dx = Math.max(avoid.left - pad - x, 0, x - avoid.right - pad);
        const dy = Math.max(avoid.top - pad - y, 0, y - avoid.bottom - pad);
        const dist = Math.hypot(dx, dy);
        if (dist === 0) continue;
        r = Math.min(r, dist / 1.25);
      }
      if (r >= Math.max(34, base * 0.45)) return { x, y, r };
    }
    return null;
  }

  private launch(g: FireworksGeometry) {
    const b = this.pickBurst(g);
    if (!b) return;
    const s = g.stage;
    const templeL = s.left + s.width * 0.26;
    const templeR = s.left + s.width * 0.74;
    // rockets leave from behind the temple body, below the roofline
    const x0 = Math.min(templeR, Math.max(templeL, b.x + rnd(-0.06, 0.06) * s.width));
    const y0 = s.top + s.height * 0.4;
    const kinds: Kind[] = ["peony", "willow", "ring", "glitter", "peony", "willow"];
    this.rockets.push({
      x0,
      y0,
      tx: b.x,
      ty: b.y,
      t: 0,
      dur: rnd(1.05, 1.45),
      r: b.r,
      kind: kinds[Math.floor(Math.random() * kinds.length)]!,
      color: Math.floor(Math.random() * this.colors.length),
      trail: [],
    });
    this.launched++;
  }

  private burst(r: Rocket) {
    const n = Math.round(r.kind === "ring" ? 70 : r.kind === "willow" ? 90 : 120);
    const drag = r.kind === "willow" ? 1.6 : 2.4;
    const v0 = r.r * drag * (r.kind === "willow" ? 0.85 : 1);
    const tilt = rnd(0.35, 0.6);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd(-0.04, 0.04);
      let sp = v0 * (r.kind === "ring" ? rnd(0.96, 1.02) : Math.sqrt(rnd(0.15, 1)));
      if (r.kind === "peony") sp = v0 * rnd(0.82, 1.02);
      const vy = Math.sin(a) * sp * (r.kind === "ring" ? tilt : 1);
      const max = r.kind === "willow" ? rnd(2.6, 3.4) : rnd(1.5, 2.2);
      this.sparks.push({
        x: r.tx,
        y: r.ty,
        px: r.tx,
        py: r.ty,
        vx: Math.cos(a) * sp,
        vy,
        life: max,
        max,
        color: r.kind === "willow" ? 0 : (r.color + (i % 7 === 0 ? 1 : 0)) % this.colors.length,
        size: r.kind === "willow" ? 1.5 : rnd(1.3, 2.1),
        drag,
        grav: r.kind === "willow" ? 70 : 42,
        tw: rnd(0, Math.PI * 2),
        glitter: r.kind === "glitter" || (r.kind === "willow" && i % 3 === 0),
      });
    }
    this.flashes.push({ x: r.tx, y: r.ty, r: r.r * 1.5, life: 0.45, color: r.color });
  }

  private frame = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const g = this.geo;
    if (g && now >= this.next) {
      this.launch(g);
      if (this.launched > 2 && Math.random() < 0.3) this.launch(g);
      // opening salvo, then an unhurried celebration that keeps going
      this.next = now + (this.launched < 9 ? rnd(520, 950) : rnd(1500, 2900));
    }

    for (const r of this.rockets) {
      r.t += dt;
      const u = Math.min(1, r.t / r.dur);
      const e = 1 - Math.pow(1 - u, 2.4);
      const x = r.x0 + (r.tx - r.x0) * e;
      const y = r.y0 + (r.ty - r.y0) * e;
      r.trail.push([x, y]);
      if (r.trail.length > 14) r.trail.shift();
      if (u >= 1) this.burst(r);
    }
    this.rockets = this.rockets.filter((r) => r.t < r.dur);

    for (const p of this.sparks) {
      p.px = p.x;
      p.py = p.y;
      const k = Math.exp(-p.drag * dt);
      p.vx *= k;
      p.vy = p.vy * k + p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.tw += dt * 22;
    }
    this.sparks = this.sparks.filter((p) => p.life > 0);
    for (const f of this.flashes) f.life -= dt;
    this.flashes = this.flashes.filter((f) => f.life > 0);

    if (g) {
      this.drawSky(g);
      this.drawRefl(g);
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private paint(ctx: CanvasRenderingContext2D, mirror: ((y: number) => number) | null, alpha: number) {
    const Y = mirror ?? ((y: number) => y);
    const stretch = mirror ? 2.4 : 1;
    ctx.globalCompositeOperation = "lighter";
    for (const f of this.flashes) {
      const a = (f.life / 0.45) * 0.22 * alpha;
      const grd = ctx.createRadialGradient(f.x, Y(f.y), 0, f.x, Y(f.y), f.r);
      grd.addColorStop(0, this.colors[f.color]!);
      grd.addColorStop(1, "transparent");
      ctx.globalAlpha = a;
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(f.x, Y(f.y), f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const r of this.rockets) {
      ctx.lineCap = "round";
      for (let i = 1; i < r.trail.length; i++) {
        ctx.globalAlpha = (i / r.trail.length) * 0.75 * alpha;
        ctx.strokeStyle = this.colors[0]!;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(r.trail[i - 1]![0], Y(r.trail[i - 1]![1]));
        ctx.lineTo(r.trail[i]![0], Y(r.trail[i]![1]));
        ctx.stroke();
      }
      const h = r.trail[r.trail.length - 1]!;
      if (h) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.colors[1]!;
        ctx.beginPath();
        ctx.arc(h[0], Y(h[1]), 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (const p of this.sparks) {
      const fade = Math.pow(p.life / p.max, 1.3);
      const tw = p.glitter && p.life < p.max * 0.6 ? 0.35 + 0.65 * Math.max(0, Math.sin(p.tw)) : 1;
      ctx.globalAlpha = fade * tw * alpha;
      ctx.strokeStyle = this.colors[p.color]!;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.px, Y(p.py));
      const tx = p.x + (p.x - p.px) * 0.5;
      const ty = p.y + (p.y - p.py) * 0.5 * stretch;
      ctx.lineTo(tx, Y(ty));
      ctx.stroke();
      // bright spark head
      ctx.fillStyle = this.colors[p.color]!;
      ctx.beginPath();
      ctx.arc(p.x, Y(p.y), p.size * (mirror ? 0.8 : 0.95), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  private drawSky(g: FireworksGeometry) {
    const c = this.sky;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = this.fit(c);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.paint(ctx, null, 1);
    void g;
  }

  private drawRefl(g: FireworksGeometry) {
    const c = this.refl;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = this.fit(c);
    const s = g.stage;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    // stage-local coordinates: viewport minus stage offset
    ctx.setTransform(dpr, 0, 0, dpr, -s.left * dpr, -s.top * dpr);
    const kx = s.width / IMG_W;
    const ky = s.height / IMG_H;
    const shore = s.top + SHORE_LINE * s.height;
    ctx.save();
    ctx.beginPath();
    waterPolygon(SHORE_LINE * IMG_H + 4).forEach(([x, y], i) => {
      const X = s.left + x * kx;
      const Y = s.top + y * ky;
      if (i) ctx.lineTo(X, Y);
      else ctx.moveTo(X, Y);
    });
    ctx.closePath();
    ctx.clip();
    this.paint(ctx, (y) => 2 * shore - y, 0.32);
    ctx.restore();
  }
}

/** Sky layer (behind the temple cut-out). */
export function FireworksSky({ engine }: { engine: FireworksEngine }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    engine.sky = ref.current;
    return () => {
      engine.sky = null;
    };
  }, [engine]);
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}

/** River reflection layer (inside the stage, above the photo). */
export function FireworksReflection({ engine }: { engine: FireworksEngine }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    engine.refl = ref.current;
    return () => {
      engine.refl = null;
    };
  }, [engine]);
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen" />;
}

export function useFireworksEngine() {
  return useMemo(() => new FireworksEngine(), []);
}
