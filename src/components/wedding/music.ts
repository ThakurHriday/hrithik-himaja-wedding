/**
 * Background music: "Jashn-E-Bahaaraa" (instrumental) from Jodhaa Akbar.
 * One shared looping <audio> element with soft fade-in / fade-out; every
 * play button on the page talks to this single player.
 */
import track from "@/assets/jashn-e-bahaaraa-instrumental.mp3";

type Listener = (playing: boolean) => void;

export const MUSIC_SRC: string = track;
const VOLUME = 0.6;
const FADE_IN_MS = 2500;
const FADE_OUT_MS = 900;

class SongPlayer {
  private audio: HTMLAudioElement | null = null;
  private fade: number | undefined;
  private listeners = new Set<Listener>();
  playing = false;

  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  }
  private emit() {
    for (const l of this.listeners) l(this.playing);
  }

  private el() {
    if (this.audio || typeof Audio === "undefined") return this.audio;
    const a = new Audio(MUSIC_SRC);
    a.loop = true;
    a.preload = "auto";
    a.volume = 0;
    this.audio = a;
    return a;
  }

  private rampTo(target: number, ms: number, done?: () => void) {
    const a = this.audio;
    if (!a) return;
    window.clearInterval(this.fade);
    const from = a.volume;
    const start = performance.now();
    this.fade = window.setInterval(() => {
      const k = Math.min(1, (performance.now() - start) / ms);
      a.volume = Math.max(0, Math.min(1, from + (target - from) * k));
      if (k >= 1) {
        window.clearInterval(this.fade);
        done?.();
      }
    }, 50);
  }

  async play() {
    if (this.playing) return;
    const a = this.el();
    if (!a) return;
    this.playing = true;
    this.emit();
    try {
      await a.play();
      this.rampTo(VOLUME, FADE_IN_MS);
    } catch {
      // the browser blocked playback (no tap yet) — leave the button ready to try again
      this.playing = false;
      this.emit();
    }
  }

  pause() {
    if (!this.playing || !this.audio) return;
    this.playing = false;
    this.emit();
    const a = this.audio;
    this.rampTo(0, FADE_OUT_MS, () => {
      if (!this.playing) a.pause();
    });
  }

  toggle() {
    if (this.playing) this.pause();
    else void this.play();
  }
}

export const music = new SongPlayer();
