import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import ornament from "@/assets/ornament-divider.webp";
import { useLang } from "./i18n";

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("reveal", on && "is-in", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function Ornament({ className }: { className?: string }) {
  return (
    <img
      src={ornament}
      alt=""
      aria-hidden
      loading="lazy"
      width={1100}
      height={254}
      className={cn("mx-auto h-auto w-[min(17rem,70vw)] select-none opacity-90", className)}
    />
  );
}

/** Thin gold line with a four-point star in the middle (line · ✦ · line). */
export function StarDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center justify-center gap-4 text-gold", className)}>
      <span className="h-px w-[min(12rem,26vw)] bg-gradient-to-r from-transparent to-gold/70" />
      <span className="text-lg leading-none sm:text-xl">✦</span>
      <span className="h-px w-[min(12rem,26vw)] bg-gradient-to-l from-transparent to-gold/70" />
    </div>
  );
}

/** Spaced capital serif heading in gold with the star divider beneath. */
export function SectionTitle({ children, kicker, className }: { children: ReactNode; kicker?: ReactNode; className?: string }) {
  const { lang } = useLang();
  return (
    <Reveal className={cn("mb-10 text-center sm:mb-14", className)}>
      {kicker && <p className="i18n mb-3 font-sans text-[0.66rem] font-medium uppercase tracking-[0.32em] text-gold-soft/70 sm:text-[0.72rem]">{kicker}</p>}
      <h2
        className={cn(
          "text-gold-gradient leading-[1.15]",
          lang === "hi"
            ? "font-deva text-[clamp(2.1rem,7vw,3.4rem)]"
            : "font-serif font-light italic tracking-[-0.01em] text-[clamp(2.4rem,6.5vw,4rem)]",
        )}
      >
        {children}
      </h2>
      <StarDivider className="mt-4 sm:mt-6" />
    </Reveal>
  );
}

export function Section({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn("relative px-5 py-20 sm:px-8 sm:py-28", className)}>
      {children}
    </section>
  );
}
