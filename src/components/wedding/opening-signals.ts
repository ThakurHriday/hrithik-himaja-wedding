import { useEffect, useSyncExternalStore } from "react";
import { music } from "./music";

/**
 * Watches the finished opening scene from the outside (its START button and its
 * REPLAY control) so the rest of the invitation can react without touching it.
 */
type State = { started: boolean; finale: boolean };
let state: State = { started: false, finale: false };
const subs = new Set<() => void>();
const set = (s: Partial<State>) => {
  const next = { ...state, ...s };
  if (next.started === state.started && next.finale === state.finale) return;
  state = next;
  subs.forEach((f) => f());
};

/** True until the guest has pressed START and then watched or skipped the opening. */
let locked = true;
export const isScrollLocked = () => locked;

export function useOpeningSignals() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => state,
    () => state,
  );
}

/** Mount once next to the opening. */
export function useOpeningWatcher() {
  useEffect(() => {
    const section = document.querySelector('section[aria-label="Deepotsav opening"]');
    let firstStart = true;
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement | null)?.closest("button");
      if (btn?.getAttribute("aria-label") === "Start the celebration") {
        set({ started: true });
        if (firstStart) {
          firstStart = false;
          void music.play();
        }
      }
    };
    document.addEventListener("click", onClick, true);
    const check = () => {
      const replay = Array.from(section?.querySelectorAll("button") ?? []).some((b) => b.textContent?.includes("REPLAY"));
      set({ finale: replay });
    };
    // Scroll lock: guests must press START, then watch to the end or skip,
    // before they can move past the opening. Once unlocked it stays unlocked.
    let unlocked = !locked;
    const root = document.documentElement;
    const lock = () => {
      if (unlocked) return;
      root.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    };
    const unlock = () => {
      unlocked = true;
      locked = false;
      root.style.overflow = "";
      document.body.style.overflow = "";
    };
    const keepTop = () => {
      if (!unlocked && window.scrollY > 0) window.scrollTo({ top: 0, behavior: "instant" });
    };
    const block = (e: Event) => {
      if (!unlocked) e.preventDefault();
    };
    const blockKeys = (e: KeyboardEvent) => {
      if (!unlocked && ["ArrowDown", "PageDown", "End", " ", "Spacebar"].includes(e.key) && !(e.target as HTMLElement)?.closest("button")) e.preventDefault();
    };
    const blockLinks = (e: MouseEvent) => {
      if (!unlocked && (e.target as HTMLElement | null)?.closest('a[href^="#"]')) e.preventDefault();
    };
    lock();
    window.addEventListener("scroll", keepTop, { passive: true });
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", blockKeys);
    document.addEventListener("click", blockLinks, true);
    const check2 = () => {
      if (!unlocked && state.finale) unlock();
    };
    subs.add(check2);
    const mo = section ? new MutationObserver(check) : null;
    if (section && mo) mo.observe(section, { childList: true, subtree: true });
    return () => {
      document.removeEventListener("click", onClick, true);
      mo?.disconnect();
      subs.delete(check2);
      window.removeEventListener("scroll", keepTop);
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", blockKeys);
      document.removeEventListener("click", blockLinks, true);
      root.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);
}
