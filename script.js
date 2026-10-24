// Click-to-open invitation, scroll-based scene motion, scratch-off heart and falling petals.
if (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) document.documentElement.classList.add("is-ios");
const intro = document.getElementById("door-intro");
const skipButton = document.getElementById("skip-intro");
const weddingMusic = document.getElementById("wedding-music");
const musicToggle = document.getElementById("music-toggle");
const musicLabel = musicToggle.querySelector(".music-label");
let entered = false;

function updateMusicControl(isPlaying) {
  musicToggle.classList.toggle("is-playing", isPlaying);
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
  musicToggle.setAttribute("aria-label", isPlaying ? "Turn background music off" : "Turn background music on");
  musicLabel.textContent = isPlaying ? "Music on" : "Music off";
}
async function startWeddingMusic() {
  try {
    weddingMusic.volume = 0.55;
    await weddingMusic.play();
    updateMusicControl(true);
  } catch (error) {
    updateMusicControl(false);
  }
}
weddingMusic.addEventListener("play", () => updateMusicControl(true));
weddingMusic.addEventListener("pause", () => updateMusicControl(false));
musicToggle.addEventListener("click", async () => {
  if (weddingMusic.paused) {
    await startWeddingMusic();
  } else {
    weddingMusic.pause();
  }
});

// V22: click opens the flap; scrolling then draws the card out and unfolds it into the page.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);
function enterInvitation() {
  if (entered) return;
  entered = true;
  // A direct click is a user gesture, so browsers can allow audio playback here.
  startWeddingMusic();
  intro.classList.add("opening");
  window.setTimeout(() => {
    document.body.classList.remove("is-loading");
    intro.classList.add("scroll-ready");
    updateEnvelopeScroll();
  }, reducedMotion ? 60 : 700);
}
window.addEventListener("load", () => {
  intro.classList.add("ready");
});
const envCard = intro.querySelector(".invitation-card");
const envScene = intro.querySelector(".envelope-scene");
const clamp01 = v => Math.max(0, Math.min(1, v));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function updateEnvelopeScroll() {
  if (!envCard || !envScene) return;
  const vw = window.innerWidth, vh = window.innerHeight;
  const rect = intro.getBoundingClientRect();
  const travel = Math.max(1, intro.offsetHeight - vh);
  const p = entered ? clamp01(-rect.top / travel) : 0;
  const a = ease(clamp01(p / 0.3));          // card rises out of the pocket
  const b = ease(clamp01((p - 0.3) / 0.33)); // card unfolds into a full page
  const w = envCard.offsetWidth, h = envCard.offsetHeight;
  const sRect = envScene.getBoundingClientRect();
  const cx = sRect.left + envCard.offsetLeft + w / 2;
  const cy = sRect.top + envCard.offsetTop + h / 2;
  const peek = entered ? -0.18 : 0.17;
  const riseY = (peek + (-0.5 - peek) * a) * h;
  const coverScale = Math.max(vw / w, vh / h) * 1.06;
  const tx = (vw / 2 - cx) * b;
  const ty = riseY + (vh / 2 - (cy + riseY)) * b;
  const sc = 1 + (coverScale - 1) * b;
  intro.style.setProperty("--card-x", `${tx.toFixed(1)}px`);
  intro.style.setProperty("--card-y", `${ty.toFixed(1)}px`);
  intro.style.setProperty("--card-s", sc.toFixed(4));
  intro.style.setProperty("--card-text", (1 - clamp01(b / 0.45)).toFixed(3));
  intro.style.setProperty("--card-page", clamp01((b - 0.2) / 0.6).toFixed(3));
  intro.style.setProperty("--env-y", `${(b * vh * 0.6).toFixed(1)}px`);
  intro.style.setProperty("--env-o", (1 - clamp01(b * 1.6)).toFixed(3));
  intro.style.setProperty("--cue-o", entered ? (1 - clamp01(p / 0.12)).toFixed(3) : "1");
  intro.classList.toggle("card-lifted", p > 0.28);
  const done = p > 0.97 || rect.bottom <= vh;
  document.body.classList.toggle("site-entered", entered && done);
}
window.addEventListener("scroll", () => window.requestAnimationFrame(updateEnvelopeScroll), { passive: true });
window.addEventListener("resize", updateEnvelopeScroll);
skipButton.addEventListener("click", enterInvitation);

// Scroll reveal: sections and cards animate into view.
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

// Progress bar, gentle hero parallax and scroll-controlled story scale.
const progressBar = document.getElementById("progress-bar");
const heroBackdrop = document.querySelector(".hero-backdrop");
const storySection = document.querySelector(".story-section");
const storyBackdrop = document.querySelector(".story-backdrop");
const storyContent = document.querySelector(".story-content");
let ticking = false;

function updateScrollScenes() {
  const scrollY = window.scrollY || 0;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  progressBar.style.width = `${Math.min(100, scrollY / maxScroll * 100)}%`;

  if (heroBackdrop) heroBackdrop.style.transform = `translate3d(0, ${Math.min(scrollY * 0.12, 100)}px, 0) scale(1.08)`;

  if (storySection && storyContent) {
    const rect = storySection.getBoundingClientRect();
    const travel = Math.max(1, storySection.offsetHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(1, -rect.top / travel));
    const scale = 0.86 + Math.sin(progress * Math.PI) * 0.14;
    const shift = (0.5 - progress) * 60;
    storyContent.style.setProperty("--story-scale", scale.toFixed(3));
    storyContent.style.setProperty("--story-shift", `${shift.toFixed(1)}px`);
    storyBackdrop.style.transform = `scale(${0.72 + progress * 0.48}) rotate(${progress * 9}deg)`;
    storyBackdrop.style.opacity = String(0.2 + Math.sin(progress * Math.PI) * 0.35);
  }
  ticking = false;
}
window.addEventListener("scroll", () => {
  if (!ticking) {
    window.requestAnimationFrame(updateScrollScenes);
    ticking = true;
  }
}, { passive: true });
window.addEventListener("resize", updateScrollScenes);
updateScrollScenes();
updateEnvelopeScroll();

// Wedding ceremony time: 10:51 AM IST.
const weddingDate = new Date("2026-12-03T10:51:00+05:30");
const countdownEls = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
  note: document.getElementById("countdown-note")
};
function updateCountdown() {
  const difference = weddingDate.getTime() - Date.now();
  if (difference <= 0) {
    ["days", "hours", "minutes", "seconds"].forEach(key => countdownEls[key].textContent = "00");
    countdownEls.note.textContent = "Today marks the beginning of forever";
    return;
  }
  const total = Math.floor(difference / 1000);
  countdownEls.days.textContent = String(Math.floor(total / 86400)).padStart(2, "0");
  countdownEls.hours.textContent = String(Math.floor((total % 86400) / 3600)).padStart(2, "0");
  countdownEls.minutes.textContent = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  countdownEls.seconds.textContent = String(total % 60).padStart(2, "0");
}
updateCountdown();
setInterval(updateCountdown, 1000);

// Scratch canvas clipped to a heart. Pointer events support touch and mouse.
const scratchCanvas = document.getElementById("scratch-canvas");
const scratchCtx = scratchCanvas.getContext("2d", { willReadFrequently: true });
const revealButton = document.getElementById("reveal-date-button");
let isScratching = false;
let revealed = false;

function heartPath(ctx, width, height) {
  ctx.beginPath();
  ctx.moveTo(width * .5, height * .91);
  ctx.bezierCurveTo(width * .43, height * .82, width * .08, height * .58, width * .08, height * .31);
  ctx.bezierCurveTo(width * .08, height * .06, width * .36, height * .02, width * .5, height * .23);
  ctx.bezierCurveTo(width * .64, height * .02, width * .92, height * .06, width * .92, height * .31);
  ctx.bezierCurveTo(width * .92, height * .58, width * .57, height * .82, width * .5, height * .91);
  ctx.closePath();
}
function paintScratchCover() {
  const w = scratchCanvas.width, h = scratchCanvas.height;
  scratchCtx.globalCompositeOperation = "source-over";
  const grad = scratchCtx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#f0d9a2");
  grad.addColorStop(.45, "#b9873d");
  grad.addColorStop(.75, "#e4c27a");
  grad.addColorStop(1, "#9d6d2e");
  scratchCtx.fillStyle = grad;
  scratchCtx.fillRect(0, 0, w, h);
  scratchCtx.save();
  heartPath(scratchCtx, w, h);
  scratchCtx.clip();
  scratchCtx.fillStyle = "rgba(75, 20, 33, .10)";
  for (let i = 0; i < 130; i++) {
    scratchCtx.beginPath();
    scratchCtx.arc(Math.random() * w, Math.random() * h, Math.random() * 2 + .5, 0, Math.PI * 2);
    scratchCtx.fill();
  }
  scratchCtx.fillStyle = "#6b1a2e";
  scratchCtx.font = "600 22px Manrope, Arial";
  scratchCtx.textAlign = "center";
  scratchCtx.fillText("SCRATCH TO REVEAL", w / 2, h * .48);
  scratchCtx.font = "36px Georgia";
  scratchCtx.fillText("✧", w / 2, h * .58);
  scratchCtx.restore();
  scratchCtx.globalCompositeOperation = "destination-out";
}
function scratchAt(event) {
  const rect = scratchCanvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (scratchCanvas.width / rect.width);
  const y = (event.clientY - rect.top) * (scratchCanvas.height / rect.height);
  scratchCtx.beginPath();
  scratchCtx.arc(x, y, 34, 0, Math.PI * 2);
  scratchCtx.fill();
  checkScratchProgress();
}
function checkScratchProgress() {
  if (revealed) return;
  const pixels = scratchCtx.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height).data;
  let transparent = 0, samples = 0;
  for (let i = 3; i < pixels.length; i += 4 * 20) {
    samples++;
    if (pixels[i] < 80) transparent++;
  }
  if (transparent / samples > .42) revealScratch();
}
function revealScratch() {
  revealed = true;
  scratchCtx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
  scratchCanvas.style.opacity = "0";
  scratchCanvas.style.transition = "opacity .6s ease";
  revealButton.textContent = "Date revealed ♥";
}
scratchCanvas.addEventListener("pointerdown", event => {
  if (revealed) return;
  // Prevent iOS Safari from treating the scratch gesture as page scrolling.
  if (event.cancelable) event.preventDefault();
  isScratching = true;
  scratchCanvas.setPointerCapture(event.pointerId);
  scratchAt(event);
});
scratchCanvas.addEventListener("pointermove", event => {
  if (isScratching && !revealed) {
    if (event.cancelable) event.preventDefault();
    scratchAt(event);
  }
});
["pointerup", "pointercancel", "lostpointercapture"].forEach(name => {
  scratchCanvas.addEventListener(name, () => { isScratching = false; });
});
// Explicit non-passive touch fallback for Safari on iPhone.
scratchCanvas.addEventListener("touchstart", event => {
  if (!revealed && event.cancelable) event.preventDefault();
}, { passive: false });
scratchCanvas.addEventListener("touchmove", event => {
  if (!revealed && event.cancelable) event.preventDefault();
}, { passive: false });
revealButton.addEventListener("click", revealScratch);
paintScratchCover();

// Falling petals canvas; restrained density, pauses when tab is hidden.
const petalCanvas = document.getElementById("petals");
const petalCtx = petalCanvas.getContext("2d");
let petals = [];
let petalWidth = 0, petalHeight = 0, petalFrame = 0;
const petalColors = ["rgba(217,181,109,.62)", "rgba(177,58,79,.58)", "rgba(240,217,162,.54)", "rgba(123,25,50,.5)"];
function resizePetals() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
  petalWidth = window.innerWidth;
  petalHeight = window.innerHeight;
  petalCanvas.width = Math.floor(petalWidth * dpr);
  petalCanvas.height = Math.floor(petalHeight * dpr);
  petalCanvas.style.width = `${petalWidth}px`;
  petalCanvas.style.height = `${petalHeight}px`;
  petalCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = Math.min(32, Math.max(14, Math.floor(petalWidth / 30)));
  petals = Array.from({ length: count }, () => newPetal(true));
}
function newPetal(randomY = false) {
  return { x: Math.random() * petalWidth, y: randomY ? Math.random() * petalHeight : -20,
    size: 3 + Math.random() * 6, speed: .5 + Math.random() * 1.25,
    sway: Math.random() * 1.4 + .3, phase: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI, spin: (Math.random() - .5) * .035,
    color: petalColors[Math.floor(Math.random() * petalColors.length)] };
}
function drawPetals() {
  petalCtx.clearRect(0, 0, petalWidth, petalHeight);
  if (!document.hidden) {
    for (const p of petals) {
      p.y += p.speed;
      p.phase += .018;
      p.x += Math.sin(p.phase) * p.sway * .45;
      p.rotation += p.spin;
      petalCtx.save();
      petalCtx.translate(p.x, p.y);
      petalCtx.rotate(p.rotation);
      petalCtx.fillStyle = p.color;
      petalCtx.beginPath();
      petalCtx.moveTo(0, -p.size);
      petalCtx.bezierCurveTo(p.size * 1.4, -p.size * .7, p.size * 1.4, p.size * .7, 0, p.size);
      petalCtx.bezierCurveTo(-p.size * 1.4, p.size * .7, -p.size * 1.4, -p.size * .7, 0, -p.size);
      petalCtx.fill();
      petalCtx.restore();
      if (p.y > petalHeight + 20) Object.assign(p, newPetal(false));
    }
  }
  petalFrame = window.requestAnimationFrame(drawPetals);
}
window.addEventListener("resize", resizePetals);
resizePetals();
drawPetals();



/* Cinematic scroll controller: gentle depth/opacity transitions tied to scroll position. */
(() => {
  const scenes = Array.from(document.querySelectorAll('[data-cinematic-scene="true"]'));
  const progress = document.querySelector('#cinematic-progress span');
  if (!scenes.length) return;

  let ticking = false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function updateCinematicScenes() {
    ticking = false;
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (progress) progress.style.transform = `scaleX(${Math.min(1, Math.max(0, scrollTop / maxScroll))})`;

    if (reduced) return;
    const viewportHeight = window.innerHeight || 1;
    scenes.forEach((scene) => {
      const rect = scene.getBoundingClientRect();
      const centerDistance = Math.abs((rect.top + rect.height / 2) - viewportHeight / 2);
      const normalized = Math.min(1, centerDistance / (viewportHeight * 0.9));
      const visible = rect.bottom > 0 && rect.top < viewportHeight;
      scene.classList.toggle('cinematic-scene-active', visible && normalized < 0.65);
      // Subtle transitions only; avoid fading content to unreadable levels.
      const opacity = visible ? 1 - normalized * 0.12 : 1;
      const translateY = normalized * 10;
      const scale = 1 - normalized * 0.008;
      scene.style.opacity = String(opacity);
      scene.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
      scene.style.filter = `saturate(${1 - normalized * 0.08})`;
    });
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateCinematicScenes);
    }
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  window.addEventListener('load', requestUpdate);
  updateCinematicScenes();
})();
