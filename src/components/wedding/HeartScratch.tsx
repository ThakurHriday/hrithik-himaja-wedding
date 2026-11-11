import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useLang } from "./i18n";

/** Heart in a 100 × 90 box. */
export const HEART_D =
  "M50 87 C 23 68 3 52 3 30 C 3 14 14 4 28 4 C 38 4 46 10 50 19 C 54 10 62 4 72 4 C 86 4 97 14 97 30 C 97 52 77 68 50 87 Z";
const VB_W = 100;
const VB_H = 90;
/** share of foil that must be scratched away before the date reveals itself */
export const REVEAL_AT = 0.55;

const PETALS = Array.from({ length: 22 }, (_, i) => {
  const a = (i / 22) * Math.PI * 2;
  const r = 140 + (i % 4) * 30;
  return { px: `${Math.cos(a) * r}px`, py: `${Math.sin(a) * r - 40}px`, pr: `${(i * 67) % 360}deg`, pd: `${(i % 5) * 0.06}s` };
});

export function HeartScratch() {
  const { t, lang } = useLang();
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const total = useRef(0);
  const moves = useRef(0);

  const paint = useCallback(() => {
    const c = canvas.current;
    const w = wrap.current;
    if (!c || !w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = w.clientWidth;
    const H = w.clientHeight;
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const css = getComputedStyle(document.documentElement);
    const v = (n: string) => css.getPropertyValue(n).trim();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.scale(c.width / VB_W, c.height / VB_H);
    const heart = new Path2D(HEART_D);
    const g = ctx.createLinearGradient(0, 0, VB_W, VB_H);
    g.addColorStop(0, v("--foil-1"));
    g.addColorStop(0.3, v("--foil-2"));
    g.addColorStop(0.55, v("--foil-3"));
    g.addColorStop(0.78, v("--foil-4"));
    g.addColorStop(1, v("--foil-1"));
    ctx.fillStyle = g;
    ctx.fill(heart);
    ctx.clip(heart);
    // brushed sparkle
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = i % 3 ? v("--foil-4") : v("--foil-1");
      ctx.fillRect(Math.random() * VB_W, Math.random() * VB_H, 0.35, 0.35);
    }
    // an inner engraved heart
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = v("--foil-ink");
    ctx.lineWidth = 0.35;
    ctx.setLineDash([1.2, 1.1]);
    ctx.save();
    ctx.translate(50, 46);
    ctx.scale(0.86, 0.86);
    ctx.translate(-50, -46);
    ctx.stroke(heart);
    ctx.restore();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = v("--foil-ink");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 5.2px ${lang === "hi" ? '"Tiro Devanagari Sanskrit"' : '"Cormorant Garamond"'}, serif`;
    ctx.fillText(lang === "hi" ? t.scratchFoil : t.scratchFoil.toUpperCase(), 50, 40);
    ctx.font = `7px "Great Vibes", serif`;
    ctx.fillText("H & H", 50, 52);
    ctx.restore();
    // count opaque pixels once, for progress
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < data.length; i += 32) if ((data[i] ?? 0) > 0) n++;
    total.current = n;
  }, [lang, t.scratchFoil]);

  useEffect(() => {
    if (revealed) return;
    let alive = true;
    const run = () => alive && paint();
    run();
    document.fonts?.ready.then(run);
    const ro = new ResizeObserver(run);
    if (wrap.current) ro.observe(wrap.current);
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [paint, revealed]);

  const progress = () => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || !total.current) return 0;
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < data.length; i += 32) if ((data[i] ?? 0) > 0) n++;
    return 1 - n / total.current;
  };

  const scratchAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * c.width;
    const y = ((e.clientY - r.top) / r.height) * c.height;
    const brush = Math.max(14, c.width * 0.06);
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brush * 2;
    ctx.beginPath();
    const p = last.current ?? { x, y };
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    last.current = { x, y };
    if (++moves.current % 6 === 0 && progress() > REVEAL_AT) setRevealed(true);
  };

  return (
    <div className="flex flex-col items-center">
      <p className="i18n mb-6 text-center font-serif text-lg italic text-gold-soft/90 sm:text-xl">{t.scratchHint}</p>

      <div className="heart-glow relative w-[min(25rem,84vw)]">
        <div ref={wrap} className="relative w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
          {/* the date, under the foil */}
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <defs>
              <radialGradient id="heart-fill" cx="50%" cy="38%" r="70%">
                <stop offset="0%" style={{ stopColor: "var(--paper-frame)" }} />
                <stop offset="100%" style={{ stopColor: "var(--paper-deep)" }} />
              </radialGradient>
            </defs>
            <path d={HEART_D} fill="url(#heart-fill)" />
            <path d={HEART_D} fill="none" style={{ stroke: "var(--gold)" }} strokeWidth="0.6" />
            <g transform="translate(50 46) scale(1.07) translate(-50 -46)">
              <path d={HEART_D} fill="none" style={{ stroke: "var(--gold)" }} strokeOpacity="0.55" strokeWidth="0.3" />
            </g>
            {/* a string of gold beads around the heart */}
            <g transform="translate(50 46) scale(1.14) translate(-50 -46)">
              <path d={HEART_D} fill="none" style={{ stroke: "var(--gold)" }} strokeWidth="1.1" strokeLinecap="round" strokeDasharray="0.01 3.2" />
            </g>
          </svg>

          <div
            className={cn(
              "heart-date absolute inset-x-[18%] top-[16%] flex h-[62%] flex-col items-center justify-center text-center",
              revealed ? "" : "[&>*]:translate-y-1 [&>*]:opacity-90",
            )}
          >
            <p className="i18n font-display text-[clamp(0.6rem,2.4vw,0.8rem)] uppercase tracking-[0.35em] text-gold-soft">{t.saveDate}</p>
            <p className="i18n mt-1 font-serif text-[clamp(0.95rem,3.8vw,1.3rem)] italic text-ivory/90">{t.weekday}</p>
            <p className="text-gold-gradient font-serif font-medium text-[clamp(3rem,15vw,5.2rem)] leading-none">{t.dayNum}</p>
            <p className="i18n font-serif text-[clamp(0.95rem,3.8vw,1.35rem)] tracking-[0.12em] text-ivory">{t.monthYear}</p>
            <p className="i18n mt-1.5 font-serif text-[clamp(0.85rem,3.2vw,1.05rem)] text-gold-soft">{t.muhurtham}</p>
          </div>

          <canvas
            ref={canvas}
            className={cn("heart-foil absolute inset-0 h-full w-full", revealed && "gone")}
            aria-label={t.scratchHint}
            role="img"
            onPointerDown={(e) => {
              drawing.current = true;
              last.current = null;
              e.currentTarget.setPointerCapture(e.pointerId);
              scratchAt(e);
            }}
            onPointerMove={(e) => drawing.current && scratchAt(e)}
            onPointerUp={() => {
              drawing.current = false;
              last.current = null;
              if (progress() > REVEAL_AT) setRevealed(true);
            }}
            onPointerCancel={() => (drawing.current = false)}
          />

          {revealed &&
            PETALS.map((p, i) => (
              <span
                key={i}
                className="petal"
                style={{ "--px": p.px, "--py": p.py, "--pr": p.pr, "--pd": p.pd } as React.CSSProperties}
              />
            ))}
        </div>
      </div>

      <div className="mt-6 h-10">
        {revealed ? (
          <p className="i18n anim-fade-up font-serif text-lg text-ivory/85">{t.revealedVenue}</p>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="i18n min-h-10 px-3 font-serif text-sm italic text-gold-soft/70 underline decoration-gold/30 underline-offset-4 hover:text-gold"
          >
            {t.revealButton}
          </button>
        )}
      </div>
    </div>
  );
}
