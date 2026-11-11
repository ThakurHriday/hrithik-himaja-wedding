import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import unlitImg from "@/assets/temple-ghat-unlit.jpg";
import litImg from "@/assets/temple-ghat-lit.jpg";
import foregroundImg from "@/assets/temple-foreground.webp";
import diyaImg from "@/assets/diya-clay-centre.webp";
import { Starfield } from "./Starfield";
import { GhatLight } from "./GhatLight";
import { FireworksReflection, FireworksSky, useFireworksEngine } from "./Fireworks";
import { GrandNameReveal } from "./GrandNameReveal";
import { DIYA_ASPECT, SHORE_LINE, computeDiyas, computeScene, diyaBoost, type DiyaSpec, type Frame } from "./layout";
import type { ReactNode } from "react";
import { ghatOutline } from "./ghat";

type Phase = "idle" | "lighting" | "finale";

const { diyas: DIYAS, hero: HERO, endMs: DIYAS_END, tierTimings: TIER_TIMINGS } = computeDiyas();
/** The temple lights once the wave of diyas has climbed the ghat towards it. */
export const TEMPLE_START = DIYAS_END + 300;
const TEMPLE_MS = 4200;
/** Fireworks rise while the last of the temple's glow is still settling, so there is
 *  no pause between the temple lighting up and the sky opening. */
export const FINALE_START = TEMPLE_START + TEMPLE_MS - 1400;

function useViewport() {
  const [vp, setVp] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const read = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    read();
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    return () => {
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
    };
  }, []);
  return vp;
}

function Diya({ d, stageH, lit, offsetMs, left, top, boost = 1 }: { d: DiyaSpec; stageH: number; lit: boolean; offsetMs: number; left: string; top: string; boost?: number }) {
  const delay = Math.max(0, d.delay - offsetMs);
  const w = d.w * stageH * boost;
  return (
    <div
      className={`diya ${lit ? "lit" : ""} ${d.float ? "floating" : ""}`}
      style={{
        left,
        top,
        width: w,
        height: w * DIYA_ASPECT,
        ["--d" as string]: `${delay}ms`,
        ["--fd" as string]: `${d.flick}s`,
        ["--fdl" as string]: `${d.flickDelay}s`,
        ["--ry" as string]: d.refl ? `${d.refl * stageH}px` : undefined,
      }}
    >
      {!d.float && <span className="pool" />}
      {!d.float && <span className="contact" />}
      <span className="glow" />
      <img src={diyaImg} alt="" className="bowl" draggable={false} />
      <span className="wick" />
      <span className="flame" />
      {(d.float || d.refl) && <span className={d.float ? "refl" : "refl river"} />}
    </div>
  );
}

/** A clipped window onto the photo; children are laid out on the full photo box. */
/** Feathered mask of the ghat stone (photo px), plus everything below row `below`. */
function ghatMask(below: number) {
  const pts = ghatOutline().slice(0, -2);
  // close well outside the frame so the feathering never softens the screen edges
  const d = [...pts, [2200, 1600], [2200, pts[0]![1]]].map((p, i) => `${i ? "L" : "M"}${p[0]!.toFixed(0)} ${p[1]!.toFixed(0)}`).join(" ") + " Z";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1280' preserveAspectRatio='none'><filter id='f' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='9'/></filter><g filter='url(#f)' fill='white'><path d='${d}'/><rect x='-300' y='${below.toFixed(0)}' width='2600' height='2000'/></g></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

function FrameBox({ frame, className = "", children }: { frame: Frame; className?: string; children: ReactNode }) {
  const { clip, stage, fadeTop, fadeBottom, ghatOnlyAbove } = frame;
  const inner = useMemo(() => (ghatOnlyAbove === undefined ? undefined : ghatMask(ghatOnlyAbove)), [ghatOnlyAbove]);
  const mask =
    fadeTop || fadeBottom
      ? `linear-gradient(180deg, transparent 0, #000 ${fadeTop}px, #000 calc(100% - ${fadeBottom}px), transparent 100%)`
      : undefined;
  return (
    <div
      className={`absolute overflow-hidden ${className}`}
      style={{ left: clip.left, top: clip.top, width: clip.width, height: clip.height, WebkitMaskImage: mask, maskImage: mask }}
    >
      <div
        className="absolute"
        style={{
          left: stage.left - clip.left,
          top: stage.top - clip.top,
          width: stage.width,
          height: stage.height,
          WebkitMaskImage: inner,
          maskImage: inner,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Unlit photo + lit temple reveal; reused, mirrored, to continue the river on wide screens. */
function ScenePhoto({ phase, templeDur, templeDelay, alt }: { phase: Phase; templeDur: number; templeDelay: number; alt?: string }) {
  return (
    <>
      <img
        src={unlitImg}
        alt={alt ?? ""}
        aria-hidden={alt ? undefined : true}
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full select-none transition-[filter] duration-[6000ms] ease-out"
        style={{ filter: phase === "idle" ? "brightness(.4) saturate(.9) hue-rotate(4deg)" : "brightness(.72) saturate(1.15) hue-rotate(4deg)" }}
      />
      {/* Lit temple revealed from the shoreline outward: up the temple, down its reflection */}
      <img
        src={litImg}
        alt=""
        aria-hidden
        className={`temple-lit absolute inset-0 h-full w-full select-none ${phase === "idle" ? "opacity-0" : "on"}`}
        style={{ transitionDuration: `${templeDur}ms`, transitionDelay: `${templeDelay}ms` }}
      />
    </>
  );
}

export function DeepotsavOpening() {
  const vp = useViewport();
  const [phase, setPhase] = useState<Phase>("idle");
  const startRef = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const nameRef = useRef<HTMLDivElement>(null);
  const scene = useMemo(() => (vp ? computeScene(vp.w, vp.h) : null), [vp]);
  const stage = scene?.stage ?? null;
  const engine = useFireworksEngine();

  const finish = useCallback(() => {
    window.clearTimeout(timer.current);
    setPhase("finale");
  }, []);
  const start = () => {
    startRef.current = performance.now();
    setPhase("lighting");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(finish, FINALE_START);
  };
  const replay = () => {
    setPhase("idle");
    window.setTimeout(start, 900);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // fireworks run only in the finale, and follow resizes/rotations
  useEffect(() => {
    if (phase !== "finale") return;
    engine.start();
    return () => engine.stop();
  }, [phase, engine]);
  useEffect(() => {
    if (!stage || !vp) return;
    const update = () => {
      engine.geo = { stage, vw: vp.w, vh: vp.h, avoid: nameRef.current?.getBoundingClientRect() ?? null };
    };
    update();
    const id = window.setInterval(update, 400);
    return () => window.clearInterval(id);
  }, [engine, stage, vp]);

  // Resize mid-animation keeps progress instead of restarting.
  const offsetMs = phase === "finale" ? Infinity : phase === "lighting" ? performance.now() - startRef.current : 0;
  const lit = phase !== "idle";
  const templeDelay = phase === "lighting" ? Math.max(0, TEMPLE_START - offsetMs) : 0;
  const templeDur = phase === "lighting" ? TEMPLE_MS : phase === "finale" ? 900 : 700;

  // Wide screens: the river and trees continue to the left by mirror-tiling the
  // photo's left strip (seamless at every join), darkening towards the far edge.
  const gap = stage && scene && !scene.ghat ? Math.max(0, stage.left) : 0;
  const strip = stage ? Math.round(stage.width * 0.2) : 0;
  const strips = gap > 1 && strip > 0 ? Math.ceil(gap / strip) : 0;
  const boost = stage ? diyaBoost(scene?.ghat ? scene.ghat.stage.height : stage.height) : 1;
  // lamps, flames and their reflections are never masked to the stone
  const diyaFrame = scene ? (scene.ghat ? { ...scene.ghat, ghatOnlyAbove: undefined } : scene.temple) : null;

  return (
    <section className="relative h-dvh min-h-[320px] w-full overflow-hidden bg-navy" aria-label="Deepotsav opening">
      {/* 1 · night sky */}
      <div className="absolute inset-0 deep-sky" />
      {/* water continues beside the photo on wide screens */}
      {stage && <div className="absolute inset-x-0 bottom-0 deep-water" style={{ top: stage.top + stage.height * SHORE_LINE }} />}
      <Starfield className="absolute inset-x-0 top-0 h-[55%] w-full" />

      {/* 2 · scene photo (sky, temple, river, ghat), flush with the bottom-right corner */}
      {stage &&
        Array.from({ length: strips }, (_, k) => (
          <div
            key={k}
            aria-hidden
            className="absolute overflow-hidden"
            /* 1px overlap with the neighbour on the right hides sub-pixel seams */
            style={{ left: stage.left - (k + 1) * strip, top: stage.top, width: strip + 1, height: stage.height }}
          >
            <div
              className={`absolute ${k % 2 === 0 ? "-scale-x-100" : ""}`}
              style={{ left: k % 2 === 0 ? strip - stage.width + 1 : 0, top: 0, width: stage.width, height: stage.height }}
            >
              <ScenePhoto phase={phase} templeDur={templeDur} templeDelay={templeDelay} />
            </div>
          </div>
        ))}
      {stage && strips > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0"
          style={{ width: stage.left, background: "linear-gradient(270deg, transparent 30%, color-mix(in oklab, var(--navy) 55%, transparent))" }}
        />
      )}
      {scene && (
        <FrameBox frame={scene.temple}>
          <ScenePhoto phase={phase} templeDur={templeDur} templeDelay={templeDelay} alt="A sandstone temple beside a still river with curved ghat steps" />
          {/* Sunrise from behind the temple: masked out wherever the temple cut-out is solid */}
          <div
            aria-hidden
            className={`sunrise pointer-events-none absolute inset-0 ${phase === "idle" ? "" : "up"}`}
            style={{
              WebkitMaskImage: `linear-gradient(#000,#000), url(${foregroundImg})`,
              maskImage: `linear-gradient(#000,#000), url(${foregroundImg})`,
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
            }}
          >
            <div className="sun" />
          </div>
        </FrameBox>
      )}

      {/* 3 · fireworks in the sky, behind the temple */}
      <FireworksSky engine={engine} />

      {/* 4 · temple cut-out in front of the fireworks, then ghat light, reflections and diyas */}
      {scene && (
        <FrameBox frame={scene.temple} className="pointer-events-none">
          <img
            src={foregroundImg}
            alt=""
            aria-hidden
            width={1920}
            height={1280}
            className="absolute inset-0 h-full w-full select-none transition-opacity duration-700"
            style={{ opacity: phase === "finale" ? 1 : 0 }}
          />
          <FireworksReflection engine={engine} />
        </FrameBox>
      )}
      {/* phones: a closer window onto the ghat, blended into the river below the temple */}
      {scene?.ghat && (
        <FrameBox frame={scene.ghat} className="pointer-events-none">
          <ScenePhoto phase={phase} templeDur={templeDur} templeDelay={templeDelay} />
        </FrameBox>
      )}
      {diyaFrame && (
        <FrameBox frame={diyaFrame} className="pointer-events-none">
          <GhatLight lit={lit} offsetMs={offsetMs} timings={TIER_TIMINGS} />
          {DIYAS.map((d) => (
            <Diya key={d.id} d={d} stageH={diyaFrame.stage.height} boost={boost} lit={lit} offsetMs={offsetMs} left={`${d.x * 100}%`} top={`${d.y * 100}%`} />
          ))}
        </FrameBox>
      )}

      {/* The floating diya lives in viewport space so it is always visible */}
      {stage && vp && (
        <div className="pointer-events-none absolute inset-0">
          <Diya
            d={HERO}
            stageH={Math.min(stage.height, vp.h * 1.1)}
            boost={boost}
            lit={lit}
            offsetMs={offsetMs}
            left={`${(stage.mode === "portrait" ? 0.14 : Math.max(0.12, (stage.left + stage.width * 0.3) / vp.w)) * 100}%`}
            top="94%"
          />
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-navy/70 to-transparent" />

      {/* opening title, before the lamps are lit */}
      {stage && vp && (
        <div
          className={`pointer-events-none absolute top-0 z-10 flex flex-col items-center px-4 pt-[max(1rem,env(safe-area-inset-top))] text-center transition-opacity duration-700 ${phase === "idle" ? "opacity-100" : "opacity-0"}`}
          style={
            stage.mode === "portrait"
              ? { left: 0, right: 0, height: Math.max(110, stage.top), justifyContent: "center" }
              : {
                  // Sky to the right of the spire, so the title never covers the temple
                  left: Math.max(stage.left + stage.width * 0.6, vp.w * 0.5),
                  right: 0,
                  height: Math.max(120, stage.top + stage.height * 0.3),
                  justifyContent: "center",
                }
          }
          aria-hidden={phase !== "idle"}
        >
          <p className="anim-fade-up font-display tracking-[0.35em] text-gold/90" style={{ fontSize: "clamp(0.55rem, min(1.5vw, 2.2vh), 0.95rem)" }}>
            AN INVITATION TO CELEBRATE LOVE
          </p>
          <p
            className="anim-fade-up text-gold-gradient mt-1 font-display font-semibold leading-tight [text-shadow:0_0_30px_oklch(0.8_0.15_70/0.35)]"
            style={{ fontSize: "clamp(1.5rem, min(5vw, 7vh), 4.8rem)", animationDelay: ".3s" }}
          >
            HRITHIK <span className="font-serif italic text-diya">&amp;</span> HIMAJA
          </p>
        </div>
      )}

      {/* grand reveal with the fireworks */}
      <GrandNameReveal ref={nameRef} active={phase === "finale"} stage={stage} vp={vp} />

      <div className="absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-20 flex justify-center">
        <button
          onClick={start}
          aria-label="Start the celebration"
          className={`min-h-11 rounded-full border border-gold/70 bg-navy/60 px-10 py-3 font-display tracking-[0.4em] text-gold shadow-[0_0_30px_oklch(0.8_0.12_82/0.35)] backdrop-blur transition-all duration-700 hover:bg-gold hover:text-navy ${
            phase === "idle" ? "opacity-100" : "pointer-events-none scale-90 opacity-0"
          }`}
          style={{ fontSize: "clamp(0.75rem, min(1.6vw, 2.6vh), 1rem)" }}
        >
          START
        </button>
      </div>

      <div className="absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex gap-2">
        {phase === "lighting" && (
          <button onClick={finish} className="min-h-11 rounded-full border border-gold/40 bg-navy/50 px-4 font-display text-xs tracking-[0.25em] text-gold/90 backdrop-blur">
            SKIP
          </button>
        )}
        {phase === "finale" && (
          <button onClick={replay} className="anim-fade-up min-h-11 rounded-full border border-gold/40 bg-navy/50 px-4 font-display text-xs tracking-[0.25em] text-gold/90 backdrop-blur">
            ↻ REPLAY
          </button>
        )}
      </div>
    </section>
  );
}
