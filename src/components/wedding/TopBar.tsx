import { useEffect, useState } from "react";
import { Menu, Music, Pause, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "./i18n";
import { music } from "./music";
import hhLogo from "@/assets/hh-logo.png";

/** Sticky header that appears once the guest scrolls past the opening. */
export function TopBar() {
  const { t, lang, toggle } = useLang();
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => music.subscribe(setPlaying), []);
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 0.85);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const links: [string, string][] = [
    ["invitation", t.navInvitation],
    ["lineage", t.navDetails],
    ["celebrations", t.navEvents],
    ["gallery", t.navGallery],
    ["countdown", t.navCountdown],
    ["closing", t.navLove],
  ];
  return (
    <header
      className={cn(
        "topbar invite-type fixed inset-x-0 top-0 z-50 transition-all duration-700",
        show ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0",
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-8">
        <a href="#invitation" aria-label="Hrithik and Himaja — back to the invitation">
          <img src={hhLogo} alt="" width={1024} height={1033} className="h-10 w-auto sm:h-12" />
        </a>
        <nav className="hidden items-center gap-5 lg:flex xl:gap-7">
          {links.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="i18n font-sans text-sm text-gold-soft/85 transition-colors hover:text-gold">{label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className={cn("h-10 min-w-10 rounded-full border border-gold/50 px-3 text-sm text-gold", lang === "en" ? "font-deva" : "font-display")} aria-label={t.langSwitchLabel}>
            {t.langSwitch}
          </button>
          <button onClick={() => music.toggle()} aria-label={playing ? t.musicPause : t.musicPlay} className="grid h-10 w-10 place-items-center rounded-full border border-gold/60 text-gold">
            {playing ? <Pause className="h-4 w-4" /> : <Music className="h-4 w-4" />}
          </button>
          <button onClick={() => setOpen((o) => !o)} aria-label="Menu" className="grid h-10 w-10 place-items-center rounded-full text-gold lg:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col border-t border-gold/30 px-6 py-3 lg:hidden">
          {links.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={() => setOpen(false)} className="i18n py-2.5 font-sans text-gold-soft/90">{label}</a>
          ))}
        </nav>
      )}
    </header>
  );
}

/** Soft petals and gold specks drifting down over the invitation. */
export function Petals() {
  const [items, setItems] = useState<{ l: number; s: number; d: number; dl: number; x: number; gold: boolean }[]>([]);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 0.6);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    const n = window.innerWidth < 640 ? 14 : 26;
    setItems(
      Array.from({ length: n }, () => ({
        l: Math.random() * 100,
        s: 6 + Math.random() * 10,
        d: 11 + Math.random() * 12,
        dl: -Math.random() * 20,
        x: (Math.random() - 0.5) * 160,
        gold: Math.random() < 0.4,
      })),
    );
  }, []);
  return (
    <div className={cn("pointer-events-none fixed inset-0 z-30 overflow-hidden transition-opacity duration-1000", show ? "opacity-100" : "opacity-0")} aria-hidden>
      <div className="h-full w-full">
        {items.map((p, i) => (
          <span
            key={i}
            className={cn("falling", p.gold ? "speck" : "rose")}
            style={{ left: `${p.l}%`, width: p.s, height: p.gold ? p.s * 0.7 : p.s, animationDuration: `${p.d}s`, animationDelay: `${p.dl}s`, ["--dx" as string]: `${p.x}px` }}
          />
        ))}
      </div>
    </div>
  );
}
