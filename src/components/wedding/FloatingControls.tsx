import { useEffect, useState } from "react";
import { Music, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLang } from "./i18n";
import { music } from "./music";
import { useOpeningSignals } from "./opening-signals";

function useScrolledPast(fraction: number) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const on = () => setPast(window.scrollY > window.innerHeight * fraction);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [fraction]);
  return past;
}

/** Music + language, bottom-right, once the guest has begun. */
export function FloatingControls() {
  const { t, lang, toggle } = useLang();
  const { started } = useOpeningSignals();
  const scrolled = useScrolledPast(0.4);
  const [playing, setPlaying] = useState(false);
  useEffect(() => music.subscribe(setPlaying), []);
  const header = useScrolledPast(0.85);
  const show = (started || scrolled) && !header;
  return (
    <div
      className={cn(
        "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[calc(max(0.25rem,env(safe-area-inset-right))+2.75rem)] sm:right-[calc(max(0.25rem,env(safe-area-inset-right))+3.5rem)] z-50 flex flex-col items-center gap-3 transition-all duration-700",
        show ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <Button
        variant="night"
        className={cn("h-11 min-w-11 px-3 text-sm", lang === "en" ? "font-deva" : "font-display tracking-[0.15em]")}
        onClick={toggle}
        aria-label={t.langSwitchLabel}
        title={t.langSwitchLabel}
      >
        {t.langSwitch}
      </Button>
      <Button variant="gold" size="orb" onClick={() => music.toggle()} aria-label={playing ? t.musicPause : t.musicPlay} aria-pressed={playing} className="[&_svg]:size-5">
        {playing ? <Pause /> : <Music />}
      </Button>
    </div>
  );
}

/** A soft cue at the foot of the opening once the names are shown. */
export function ScrollCue() {
  const { t } = useLang();
  const { finale } = useOpeningSignals();
  const scrolled = useScrolledPast(0.15);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!finale) {
      setReady(false);
      return;
    }
    const id = window.setTimeout(() => setReady(true), 5200);
    return () => window.clearTimeout(id);
  }, [finale]);
  const show = ready && !scrolled;
  return (
    <a
      href="#invitation"
      className={cn(
        "i18n absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-1 rounded-full px-4 py-2 font-display text-[0.65rem] uppercase tracking-[0.35em] text-gold transition-opacity duration-1000",
        show ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
    >
      {/* a hand with its index finger up, gliding up a dotted trail towards the arrow */}
      <svg viewBox="0 0 64 96" className="h-24 w-16 text-gold" aria-hidden fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 16 L32 7 L44 16" opacity="0.9" />
        <line className="swipe-trail" x1="32" y1="92" x2="32" y2="28" strokeWidth="2" strokeDasharray="1.5 8" opacity="0.4" />
        <g className="swipe-finger">
          <path d="M22 80 V62 c-8-3-12-8-12-15 a5 5 0 0 1 9-2 l3 4 V25 a5 5 0 0 1 10 0 V43 c1-4 8-4 9 0 1-4 8-4 9 0 1-3 7-3 8 1 V66 c0 8-6 14-14 14 Z" />
        </g>
      </svg>
      {t.scroll}
    </a>
  );
}
