import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import hhLogo from "@/assets/hh-logo.png";
import { useLang } from "./i18n";
import { isScrollLocked, useOpeningSignals } from "./opening-signals";

/** Page order the "Next Page" link walks through (the opening first, then each invitation section). */
export const PAGE_IDS = ["invitation", "lineage", "gallery", "celebrations", "countdown", "travel", "families", "song", "closing"] as const;

/** 0…1 share of the page scrolled so far. */
export function scrollProgress(scrollY: number, scrollHeight: number, viewport: number) {
  const max = scrollHeight - viewport;
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, scrollY / max));
}

/** The first page that starts below the current scroll position, or null on the last page. */
export function nextPageId(scrollY: number, tops: { id: string; top: number }[], slack = 12) {
  return tops.find((p) => p.top > scrollY + slack)?.id ?? null;
}

/** The same address without any "#section" jump, so a reopened link lands on the opening. */
export function urlWithoutHash(href: string) {
  const i = href.indexOf("#");
  return i === -1 ? href : href.slice(0, i);
}

/** Every visit (fresh open, refresh, or a saved "#section" link) starts at the top, on the opening animation. */
export function useStartAtOpening() {
  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    if (window.location.hash) window.history.replaceState(window.history.state, "", urlWithoutHash(window.location.href));
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
}

function useRaf(fn: () => void) {
  const frame = useRef(0);
  return useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(fn);
  }, [fn]);
}

/** A thin gold rail on the right edge with a lit diya that travels down as the guest scrolls. */
export function DiyaScrollbar() {
  const railRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const [dragging, setDragging] = useState(false);

  const measure = useCallback(() => {
    const d = document.documentElement;
    setP(scrollProgress(window.scrollY, d.scrollHeight, window.innerHeight));
  }, []);
  const schedule = useRaf(measure);

  useEffect(() => {
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
    };
  }, [measure, schedule]);

  const seek = (clientY: number) => {
    const rail = railRef.current;
    if (!rail || isScrollLocked()) return;
    const r = rail.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: k * max, behavior: "instant" });
  };

  return (
    <div
      ref={railRef}
      role="scrollbar"
      aria-label="Page scroll"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 100)}
      className={cn(
        "diya-rail fixed bottom-6 right-[max(0.25rem,env(safe-area-inset-right))] top-20 z-40 w-9 cursor-pointer touch-none select-none sm:w-11",
        dragging && "is-dragging",
      )}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        seek(e.clientY);
      }}
      onPointerMove={(e) => dragging && seek(e.clientY)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      {/* the rail, and the glow it leaves behind the diya */}
      <span aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gold/30" />
      <span aria-hidden className="diya-rail-trail absolute left-1/2 top-0 w-[2px] -translate-x-1/2" style={{ height: `${p * 100}%` }} />
      <span aria-hidden className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gold/70" />
      <span aria-hidden className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rotate-45 bg-gold/70" />
      {/* the diya rides along the rail: its bowl centre sits on the progress point */}
      <span
        aria-hidden
        className="diya-thumb absolute left-1/2 w-full"
        style={{ top: `${p * 100}%` }}
      >
        <img src={hhLogo} alt="" draggable={false} className="logo-thumb block aspect-square w-full object-contain" />
      </span>
    </div>
  );
}

/** Floating "Next Page" link at the foot of the screen that jumps to the next section. */
export function NextPageLink() {
  const { t } = useLang();
  const { started, finale } = useOpeningSignals();
  const [next, setNext] = useState<string | null>(PAGE_IDS[0]);
  const [past, setPast] = useState(false);

  const measure = useCallback(() => {
    const y = window.scrollY;
    const tops = PAGE_IDS.flatMap((id) => {
      const el = document.getElementById(id);
      return el ? [{ id, top: el.getBoundingClientRect().top + y }] : [];
    });
    setNext(nextPageId(y, tops));
    setPast(y > window.innerHeight * 0.15);
  }, []);
  const schedule = useRaf(measure);

  useEffect(() => {
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [measure, schedule]);

  // on the opening, the scene's own "Scroll" cue takes this spot once the names are shown
  const show = !!next && !isScrollLocked() && (past || (started && !finale));

  return (
    <a
      href={next ? `#${next}` : "#"}
      onClick={(e) => {
        const el = next && document.getElementById(next);
        e.preventDefault();
        if (!el || isScrollLocked()) return;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
      }}
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      className={cn(
        "next-page i18n invite-type fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-gold/55 bg-paper-deep/85 px-5 py-2.5 font-display text-[0.7rem] font-medium uppercase tracking-[0.3em] text-gold shadow-[var(--shadow-glow)] backdrop-blur-sm transition-all duration-700 hover:border-gold hover:text-gold-soft sm:text-xs",
        show ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      {t.nextPage}
      <ChevronDown className="scroll-cue h-4 w-4" aria-hidden />
    </a>
  );
}
