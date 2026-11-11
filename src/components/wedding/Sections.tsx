import { useEffect, useState } from "react";
import { CalendarPlus, MapPin, Play, Plane, TrainFront, TramFront, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLang } from "./i18n";
import { HeartScratch } from "./HeartScratch";
import { Ornament, Reveal, Section, SectionTitle } from "./ui";
import { EVENTS, RESIDENCE_MAP_URL, BAARAT_MAP_URL, VENUE, WEDDING_AT, googleCalendarUrl, mapsEmbedUrl, mapsSearchUrl, splitCountdown, type EventKey } from "./details";
import hhLogo from "@/assets/hh-logo.png";
import gopuram from "@/assets/gopuram-outline.webp";
import imgRatjagah from "@/assets/ceremony-ratjagah.webp";
import imgMandwa from "@/assets/ceremony-mandwa.webp";
import imgWedding from "@/assets/ceremony-wedding.webp";
import imgBaarat from "@/assets/ceremony-baarat.png";
import imgKatha from "@/assets/ceremony-katha.webp";
import photoRed from "@/assets/couple-red-lehenga.jpg";
import photoPurple from "@/assets/couple-purple-saree.jpg";
import photoOrange from "@/assets/couple-orange-kurta.jpg";

const EVENT_ART: Record<EventKey, string> = { ratjagah: imgRatjagah, mandwa: imgMandwa, baarat: imgBaarat, wedding: imgWedding, katha: imgKatha };
const EVENT_TONE: Record<EventKey, string> = {
  ratjagah: "text-ev-ratjagah",
  mandwa: "text-ev-mandwa",
  baarat: "text-ev-wedding",
  wedding: "text-ev-wedding",
  katha: "text-ev-katha",
};
const DRESS_SWATCH: Record<EventKey, string[]> = {
  ratjagah: ["--dress-maroon", "--dress-red", "--dress-rani"],
  mandwa: ["--dress-haldi", "--dress-marigold", "--dress-leaf"],
  baarat: ["--dress-gold", "--dress-ivory", "--dress-maroon"],
  wedding: ["--dress-gold", "--dress-ivory", "--dress-maroon"],
  katha: ["--dress-pink", "--dress-mint", "--dress-lilac"],
};

/* ------------------------------------------------------------------ */

function Invitation() {
  const { t, lang } = useLang();
  return (
    <Section id="invitation" className="pt-24 sm:pt-32">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <p className="i18n font-sans text-[0.68rem] font-medium uppercase tracking-[0.4em] text-gold-soft/80 sm:text-xs">{t.inviteKicker}</p>
          <p className="i18n mt-4 font-serif text-[clamp(1.05rem,2.2vw,1.35rem)] italic text-ivory/85">{t.inviteLine}</p>
        </Reveal>
        <Reveal delay={150} className="my-8 sm:my-10">
          <h2 className={cn("text-gold-gradient leading-tight", lang === "hi" ? "font-deva text-[clamp(2.4rem,9vw,4rem)]" : "font-serif font-normal tracking-[-0.035em] text-[clamp(3rem,10vw,6.5rem)]")}>
            {t.groom}
          </h2>
          <p className={cn("my-1 text-gold", lang === "hi" ? "font-deva text-2xl" : "font-script text-[clamp(2.4rem,7vw,3.5rem)] leading-none")}>{t.and}</p>
          <h2 className={cn("text-gold-gradient leading-tight", lang === "hi" ? "font-deva text-[clamp(2.4rem,9vw,4rem)]" : "font-serif font-normal tracking-[-0.035em] text-[clamp(3rem,10vw,6.5rem)]")}>
            {t.bride}
          </h2>
        </Reveal>
        <Ornament className="mb-12" />
        <Reveal delay={250}>
          <HeartScratch />
        </Reveal>
      </div>
    </Section>
  );
}

function Lineage() {
  const { t, lang } = useLang();
  const hi = lang === "hi";
  const name = cn("leading-tight text-ivory", hi ? "font-deva text-[clamp(2rem,6vw,3.5rem)]" : "font-serif font-medium text-[clamp(2.3rem,6vw,4.25rem)]");
  const parents = "i18n mx-auto mt-2 max-w-[38rem] font-sans text-[clamp(0.9rem,2vw,1.2rem)] leading-snug text-ivory/85";
  const facts: [string, string][] = [
    [t.dateLabel, t.dateValue],
    [t.timeLabel, t.timeValue],
    [t.venueLabel, t.venueName],
    [t.addressLabel, t.venueAddress],
  ];
  return (
    <Section id="lineage" className="px-[clamp(0.75rem,2.5vw,3rem)] sm:px-[clamp(0.75rem,2.5vw,3rem)]">
      <Reveal>
        <p className="i18n mx-auto mb-10 max-w-3xl text-center font-serif text-[clamp(1.1rem,2.4vw,1.5rem)] italic tracking-[0.02em] text-gold sm:mb-14">{t.lineageInvoke}</p>
      </Reveal>
      <Reveal>
        {/* the arch spans the screen (small margin that grows with the screen); its content stays a readable column */}
        <div className="temple-arch relative mx-auto w-full px-[clamp(1rem,5vw,3.5rem)] pb-[clamp(2.5rem,6vw,6rem)] pt-[clamp(2rem,6vw,6rem)] text-center">
          <div className="mx-auto max-w-[clamp(20rem,62vw,60rem)]">
            <img src={gopuram} alt="" loading="lazy" width={768} height={1024} className="mx-auto h-auto w-[clamp(11rem,24vw,32rem)] max-w-[62vw] drop-shadow-[var(--shadow-glow)]" />

            <SectionTitle kicker={t.detailsKicker} className="mb-0 mt-12 sm:mb-0 sm:mt-16">{t.detailsTitle}</SectionTitle>

            {/* the couple */}
            <div className="mx-auto mt-10 max-w-3xl border-y border-gold/30 bg-ivory/[0.035] px-4 py-[clamp(2rem,5vw,3.5rem)] sm:mt-14 sm:px-10">
              <h3 className={name}>{t.groom}</h3>
              <p className={parents}>{t.groomParentsLine}</p>
              <div className="my-4 flex items-center justify-center gap-4 sm:my-5">
                <span aria-hidden className="h-px w-[min(8rem,18vw)] bg-gradient-to-r from-transparent to-gold/60" />
                <span className={cn("text-gold-gradient leading-none", hi ? "font-deva text-3xl" : "font-script text-[clamp(2.4rem,5vw,3.4rem)]")}>{t.weds}</span>
                <span aria-hidden className="h-px w-[min(8rem,18vw)] bg-gradient-to-l from-transparent to-gold/60" />
              </div>
              <h3 className={name}>{t.bride}</h3>
              <p className={parents}>{t.brideParentLine}</p>
            </div>

            {/* date, time, venue, address */}
            <dl className="mx-auto mt-12 max-w-2xl space-y-8 sm:mt-14 sm:space-y-10">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="i18n font-sans text-[0.7rem] font-medium uppercase tracking-[0.32em] text-gold/80 sm:text-xs">{label}</dt>
                  <dd className="i18n mt-2 font-serif text-[clamp(1.15rem,2.6vw,1.6rem)] leading-snug text-ivory">{value}</dd>
                </div>
              ))}
            </dl>

            {/* the venue map, right here with the details */}
            <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-gold/35 bg-paper-deep shadow-[var(--shadow-soft)] sm:mt-12">
              <iframe
                title={`${t.venueName} map`}
                src={mapsEmbedUrl}
                className="block aspect-[4/3] w-full border-0 sm:aspect-[16/9]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <Button asChild variant="gold" size="pill" className="i18n mt-8">
              <a href={mapsSearchUrl} target="_blank" rel="noreferrer">
                <MapPin aria-hidden />
                {t.openMaps}
              </a>
            </Button>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

function KalashToran() {
  const leaves = Array.from({ length: 13 }, (_, i) => i);
  return (
    <svg viewBox="0 0 600 170" className="mx-auto mt-12 w-full max-w-md text-gold" aria-hidden>
      <path d="M10 22 Q300 70 590 22" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {leaves.map((i) => {
        const x = 30 + i * 45;
        const y = 22 + 48 * (1 - ((x - 300) / 290) ** 2) * 0.5;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path d="M0 0 C-9 14 -6 30 0 40 C6 30 9 14 0 0Z" fill="currentColor" fillOpacity={i % 2 ? 0.55 : 0.85} />
            <circle cy="48" r="4" fill="var(--ev-wedding)" />
          </g>
        );
      })}
      <g transform="translate(300 80)">
        <path d="M-30 40 Q-34 72 0 82 Q34 72 30 40 Z" fill="currentColor" fillOpacity=".9" />
        <rect x="-18" y="30" width="36" height="10" rx="3" fill="currentColor" />
        <path d="M-22 30 Q-14 4 0 0 Q14 4 22 30" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cy="-6" r="9" fill="currentColor" />
        <path d="M-58 82 Q-40 60 -20 82 M58 82 Q40 60 20 82" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M-110 84 H110" stroke="currentColor" strokeOpacity=".5" />
      </g>
    </svg>
  );
}

function Gallery() {
  const { t } = useLang();
  // Each photo keeps its exact native proportions (never cropped) so both of us stay fully in view on every screen.
  const pics = [
    { src: photoRed, w: 1280, h: 1920, frame: "w-[min(70vw,16rem)]" },
    { src: photoPurple, w: 1280, h: 853, frame: "w-[min(86vw,24rem)]" },
    { src: photoOrange, w: 706, h: 1280, frame: "w-[min(60vw,13.5rem)]" },
  ];
  return (
    <Section id="gallery" className="px-0 sm:px-0">
      <SectionTitle className="px-5">{t.galleryTitle}</SectionTitle>
      <Reveal>
        <div className="flex snap-x snap-mandatory items-center justify-start gap-5 overflow-x-auto px-[max(1.25rem,calc(50vw-36rem))] pb-4 [scrollbar-width:none] sm:gap-7 lg:justify-center">
          {pics.map((p) => (
            <figure key={p.src} className={cn("shrink-0 snap-center rounded-t-[2.25rem] rounded-b-lg bg-gold/70 p-[3px]", p.frame)}>
              <div className="rounded-t-[2.1rem] rounded-b-md bg-paper-frame p-[6px]">
                <img src={p.src} alt="Hrithik and Himaja" loading="lazy" width={p.w} height={p.h} style={{ aspectRatio: `${p.w} / ${p.h}` }} className="block h-auto w-full rounded-t-[1.75rem] rounded-b-sm object-contain" />
              </div>
            </figure>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

function Celebrations() {
  const { t, lang } = useLang();
  return (
    <Section id="celebrations">
      <div className="mx-auto max-w-4xl">
        <SectionTitle>{t.eventsTitle}</SectionTitle>
        <div className="relative">
          <span aria-hidden className="absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-gold/0 via-gold/40 to-gold/0 md:block" />
          {EVENTS.map((ev, i) => {
            const c = t.events[ev.key];
            const flip = i % 2 === 1;
            const location = ev.place === "venue" ? `${VENUE.name}, ${VENUE.address}` : ev.place === "residence" ? t.events.katha.note : ev.place === "baarat" ? "KIA Car Service Automotive, Nagole, Hyderabad" : "Hyderabad";
            const cal = googleCalendarUrl(ev, `${c.name} · Hrithik & Himaja`, c.note, location);
            return (
              <Reveal key={ev.key} className="mb-16 last:mb-0 md:mb-20">
                <article className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-10">
                  <div className={cn("flex justify-center", flip ? "md:order-3" : "md:order-1")}>
                    <img src={EVENT_ART[ev.key]} alt="" loading="lazy" width={720} height={700} className="h-auto w-[min(17rem,70vw)] drop-shadow-[0_10px_30px_oklch(0.12_0.05_15/0.7)]" />
                  </div>
                  <span aria-hidden className="hidden h-3.5 w-3.5 rotate-45 border border-gold bg-paper md:order-2 md:block" />
                  <div className={cn("text-center", flip ? "md:order-1 md:text-right" : "md:order-3 md:text-left")}>
                    <p className="i18n font-display text-xs uppercase tracking-[0.3em] text-gold-soft/80">{c.day}</p>
                    <p className={cn("my-1 leading-none", EVENT_TONE[ev.key], lang === "hi" ? "i18n font-deva text-3xl" : "font-script text-5xl sm:text-6xl")}>{c.time}</p>
                    <h3 className="i18n mt-3 font-serif text-3xl font-semibold text-ivory sm:text-[2.1rem]">{c.name}</h3>
                    <p className={cn("text-gold/80", lang === "hi" ? "font-serif text-lg italic" : "font-deva text-lg")}>{c.alt}</p>
                    <p className="i18n mt-2 font-serif text-lg italic text-ivory/70">{c.note}</p>
                    <a
                      href={cal}
                      target="_blank"
                      rel="noreferrer"
                      className="i18n mt-4 inline-flex min-h-10 items-center gap-2 font-display text-xs uppercase tracking-[0.25em] text-gold underline decoration-gold/40 underline-offset-[6px] hover:decoration-gold"
                    >
                      <CalendarPlus className="h-4 w-4" aria-hidden />
                      {t.addToCalendar}
                    </a>
                    {(ev.place === "residence" || ev.place === "baarat") && (
                      <a
                        href={ev.place === "baarat" ? BAARAT_MAP_URL : RESIDENCE_MAP_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="i18n mt-2 inline-flex min-h-10 items-center gap-2 font-display text-xs uppercase tracking-[0.25em] text-gold underline decoration-gold/40 underline-offset-[6px] hover:decoration-gold"
                      >
                        <MapPin className="h-4 w-4" aria-hidden />
                        {ev.place === "baarat" ? "Starting point" : t.residenceLabel}
                      </a>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

function Countdown() {
  const { t } = useLang();
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(WEDDING_AT.getTime() - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  const parts = left === null ? null : splitCountdown(left);
  const values = parts ? [parts.days, parts.hours, parts.minutes, parts.seconds] : [null, null, null, null];
  const done = left !== null && left <= 0;
  return (
    <Section id="countdown">
      <div className="mx-auto max-w-3xl text-center">
        <SectionTitle>{done ? t.countdownDone : t.countdownTitle}</SectionTitle>
        <Reveal>
          <div className="flex items-start justify-center gap-2 sm:gap-6" aria-live="off">
            {values.map((v, i) => (
              <div key={i} className="flex items-start">
                <div className="flex w-[4.2rem] flex-col items-center sm:w-28">
                  <span className="text-gold-gradient font-serif font-medium text-[clamp(2.4rem,10vw,4.75rem)] tabular-nums leading-none">
                    {v === null ? "--" : String(v).padStart(2, "0")}
                  </span>
                  <span className="i18n mt-2 font-display text-[0.6rem] uppercase tracking-[0.25em] text-gold-soft/75 sm:text-xs">{t.units[i]}</span>
                </div>
                {i < 3 && <span className="font-serif text-[clamp(1.8rem,7vw,3.2rem)] leading-none text-gold/50">:</span>}
              </div>
            ))}
          </div>
          {!done && <p className="i18n mt-8 font-serif text-lg italic text-ivory/75 sm:text-xl">{t.countdownUntil}</p>}
        </Reveal>
        <Reveal delay={200}>
          <KalashToran />
        </Reveal>
      </div>
    </Section>
  );
}

function Travel() {
  const { t } = useLang();
  const icons = [Plane, TramFront, TrainFront];
  return (
    <Section id="travel">
      <div className="mx-auto max-w-3xl">
        <SectionTitle>{t.travelTitle}</SectionTitle>
        <div className="grid gap-5 sm:grid-cols-3">
          {t.travel.map((item, i) => {
            const Icon = icons[i] ?? Plane;
            return (
              <Reveal key={item.label} delay={i * 120}>
                <div className="h-full rounded-2xl border border-gold/20 bg-paper-deep/60 p-6 text-center">
                  <Icon className="mx-auto h-7 w-7 text-gold" aria-hidden />
                  <p className="i18n mt-3 font-display text-xs uppercase tracking-[0.3em] text-gold">{item.label}</p>
                  <p className="i18n mt-2 font-serif text-lg leading-snug text-ivory/80">{item.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
        <Reveal>
          <p className="i18n mt-10 text-center font-serif text-lg italic text-gold-soft/80">{t.travelHelp}</p>
        </Reveal>
      </div>
    </Section>
  );
}


function Families() {
  const { t } = useLang();
  return (
    <Section id="families">
      <div className="mx-auto max-w-2xl text-center">
        <SectionTitle>{t.familiesTitle}</SectionTitle>
        <Reveal>
          <p className="i18n font-display text-xs uppercase tracking-[0.35em] text-gold-soft/75">{t.blessings}</p>
        </Reveal>
        <div className="mt-8">
          <Reveal delay={100}>
            <p className="i18n font-serif text-base italic text-gold/80">{t.groomSide}</p>
            <p className="i18n mt-2 font-serif text-2xl leading-snug text-ivory">{t.groomParents}</p>
          </Reveal>
        </div>
        <Reveal delay={250}>
          <p className="i18n mt-14 font-serif text-xl italic text-ivory/75">{t.awaiting}</p>
          <p className="i18n mt-2 font-display text-sm uppercase tracking-[0.3em] text-gold">{t.familyNames}</p>
        </Reveal>
      </div>
    </Section>
  );
}

const FAVOURITE_SONG_URL = "https://open.spotify.com/track/0bYDMpQ94LnF38FiOlc8K9?si=ff880241a614449a";

function Song() {
  const { t } = useLang();
  return (
    <Section id="song">
      <div className="mx-auto max-w-xl text-center">
        <SectionTitle>{t.songTitle}</SectionTitle>
        <Reveal>
          <div className="mx-auto flex max-w-md flex-col items-center gap-6 rounded-3xl border border-gold/25 bg-paper-deep/70 p-8 shadow-[var(--shadow-soft)] sm:flex-row sm:text-left">
            <div className="disc spin relative grid h-28 w-28 shrink-0 place-items-center rounded-full ring-1 ring-gold/40">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/90 font-script text-sm text-navy">H&amp;H</span>
            </div>
            <div className="flex-1">
              <p className="i18n font-serif text-xl font-semibold text-ivory">{t.songTrack}</p>
              <p className="i18n font-serif italic text-gold-soft/75">{t.songArtist}</p>
              <Button asChild variant="gold" size="pill" className="i18n mt-4">
                <a href={FAVOURITE_SONG_URL} target="_blank" rel="noopener noreferrer">
                  <Play aria-hidden />
                  {t.songSpotify}
                </a>
              </Button>
            </div>
          </div>
          <p className="i18n mt-6 font-serif text-lg italic text-ivory/70">{t.songNote}</p>
        </Reveal>
      </div>
    </Section>
  );
}

function Monogram() {
  return <img src={hhLogo} alt="Hrithik and Himaja's monogram" width={1024} height={1033} className="mx-auto h-44 w-auto sm:h-56" />;
}

function Closing() {
  const { t, lang } = useLang();
  return (
    <Section id="closing" className="pb-36 sm:pb-40">
      <div className="mx-auto max-w-xl text-center">
        <Reveal>
          <Ornament className="mb-8" />
          <p className="i18n font-serif text-xl italic text-ivory/85 sm:text-2xl">{t.closingLove}</p>
        </Reveal>
        <Reveal delay={150} className="my-10">
          <Monogram />
        </Reveal>
        <Reveal delay={250}>
          <p className={cn("text-gold-gradient leading-tight", lang === "hi" ? "font-deva text-5xl" : "font-script text-[clamp(3rem,12vw,5rem)]")}>
            {lang === "hi" ? `${t.groom.split(" ")[0]} और ${t.bride}` : "Hrithik & Himaja"}
          </p>
          <p className="i18n mt-3 font-display text-xs uppercase tracking-[0.35em] text-gold-soft/70">{t.closingSee}</p>
          <Button variant="night" size="pill" className="i18n mt-12 font-display text-xs tracking-[0.2em]" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <ArrowUp aria-hidden />
            {t.backToTop}
          </Button>
        </Reveal>
      </div>
    </Section>
  );
}

export function WeddingSections() {
  const { lang } = useLang();
  return (
    <div className={cn("paper invite-type relative text-ivory", lang === "hi" && "lang-hi")} lang={lang}>
      <div aria-hidden className="paper-seam pointer-events-none absolute inset-x-0 top-0 h-40" />
      <Invitation />
      <Lineage />
      <Gallery />
      <Celebrations />
      <Countdown />
      <Travel />
      <Families />
      <Song />
      <Closing />
    </div>
  );
}
