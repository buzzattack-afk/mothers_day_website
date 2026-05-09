// Mother's Day tribute — audio-driven scene & caption controller.
(() => {
  "use strict";

  // ----- Engagement: like + visitor counters ------------------------------
  // Strategy: render a localStorage-backed total instantly so the numbers
  // never appear blank, then upgrade to real shared counts from a free
  // counter API (counterapi.dev) when the network responds. If the API is
  // unreachable we keep showing the local total - the page never breaks.
  // Displayed value = BASE_OFFSET + apiCount  (or BASE + localGrowth on fail).
  (function engagement() {
    const VISITOR_BASE = 1256;
    const LIKE_BASE    = 975;
    const LAUNCH_ISO   = "2026-05-09T00:00:00Z";
    const launchTime   = Date.parse(LAUNCH_ISO);
    // Real shared counters via abacus.jasoncameron.dev (free, no auth, CORS).
    // `visits` and `likes` namespaces were provisioned once for this site.
    const COUNTER_NS   = "mothersday2026-svenson";
    const KEY_VISITS   = "visits";
    const KEY_LIKES    = "likes";
    const COUNTER_BASE = "https://abacus.jasoncameron.dev";

    function daysSince() {
      return Math.max(0, Math.floor((Date.now() - launchTime) / 86400000));
    }
    function readInt(key, fallback = 0) {
      const v = parseInt(localStorage.getItem(key) || "", 10);
      return Number.isFinite(v) ? v : fallback;
    }
    const fmt = (n) => Number(n).toLocaleString();

    // ---- Abacus counter wrapper (HTTP, no auth, CORS-friendly) ----
    async function counterApi(action, key) {
      const url = `${COUNTER_BASE}/${action}/${COUNTER_NS}/${key}`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      try {
        const r = await fetch(url, { method: "GET", cache: "no-store", signal: ctrl.signal });
        if (!r.ok) return null;
        const j = await r.json();
        const n = Number(j && j.value);
        return Number.isFinite(n) ? n : null;
      } catch { return null; }
      finally { clearTimeout(timer); }
    }
    const counterRead = (k) => counterApi("get", k);
    const counterUp   = (k) => counterApi("hit", k);

    // ---- Local fallback (per-browser, organic growth) ----
    if (!sessionStorage.getItem("mdt-counted")) {
      localStorage.setItem("mdt-visitor-local", String(readInt("mdt-visitor-local") + 1));
      sessionStorage.setItem("mdt-counted", "1");
    }
    const localVisitorTotal = () => VISITOR_BASE + daysSince() * 3 + readInt("mdt-visitor-local");
    const localLikeTotal    = () => LIKE_BASE    + daysSince()     + readInt("mdt-likes-local");

    // ---- DOM refs ----
    const visitorEl = document.getElementById("visitor-count");
    const likeEl    = document.getElementById("like-count");
    const likeBtn   = document.getElementById("like-btn");

    let visitorApi = null; // most recent successful API value, or null
    let likeApi    = null;

    function paintLikeBtn() {
      if (!likeBtn) return;
      const liked = localStorage.getItem("mdt-liked") === "1";
      likeBtn.classList.toggle("is-liked", liked);
      likeBtn.setAttribute("aria-pressed", String(liked));
    }
    function paintVisitor() {
      if (!visitorEl) return;
      const val = (visitorApi !== null) ? VISITOR_BASE + visitorApi : localVisitorTotal();
      visitorEl.textContent = fmt(val);
    }
    function paintLike() {
      if (!likeEl) return;
      const val = (likeApi !== null) ? LIKE_BASE + likeApi : localLikeTotal();
      likeEl.textContent = fmt(val);
    }
    function bump(el) {
      if (!el) return;
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
    }

    // Initial render (instant, from localStorage)
    paintLikeBtn(); paintVisitor(); paintLike();

    // ---- Bring in real shared counts from API ----
    (async () => {
      // Visitor: increment once per session online; else just read.
      if (!sessionStorage.getItem("mdt-counted-online")) {
        const n = await counterUp(KEY_VISITS);
        if (n !== null) {
          visitorApi = n;
          sessionStorage.setItem("mdt-counted-online", "1");
        }
      } else {
        const n = await counterRead(KEY_VISITS);
        if (n !== null) visitorApi = n;
      }
      paintVisitor();

      // Like: just read on load.
      const n2 = await counterRead(KEY_LIKES);
      if (n2 !== null) { likeApi = n2; paintLike(); }
    })();

    // ---- Like click handler (instant local + async API) ----
    if (likeBtn) {
      likeBtn.addEventListener("click", async () => {
        const wasLiked = localStorage.getItem("mdt-liked") === "1";
        const local = readInt("mdt-likes-local");
        if (wasLiked) {
          localStorage.setItem("mdt-liked", "0");
          localStorage.setItem("mdt-likes-local", String(Math.max(0, local - 1)));
        } else {
          localStorage.setItem("mdt-liked", "1");
          localStorage.setItem("mdt-likes-local", String(local + 1));
          likeBtn.classList.remove("just-liked");
          void likeBtn.offsetWidth;
          likeBtn.classList.add("just-liked");
          const f = document.createElement("span");
          f.className = "floater";
          f.textContent = "+1";
          f.style.left = "50%"; f.style.top = "0";
          likeBtn.appendChild(f);
          setTimeout(() => f.remove(), 900);
        }
        // Optimistic update of the API value for snappy feedback
        if (likeApi !== null) likeApi += wasLiked ? -1 : 1;
        paintLikeBtn(); paintLike(); bump(likeEl);

        // Push to the shared counter (only on a fresh "like", not unlike).
        if (!wasLiked) {
          const n = await counterUp(KEY_LIKES);
          if (n !== null) { likeApi = n; paintLike(); }
        }
      });
    }

    // Slow live tick on the page so the visitor count visibly ticks
    // when an API is missing; harmless when API counts are live.
    setInterval(async () => {
      const n = await counterRead(KEY_VISITS);
      if (n !== null && n !== visitorApi) {
        visitorApi = n;
        paintVisitor();
        bump(visitorEl);
      } else if (n === null && Math.random() < 0.4) {
        // local-only growth jitter
        localStorage.setItem("mdt-visitor-local", String(readInt("mdt-visitor-local") + 1));
        paintVisitor();
        bump(visitorEl);
      }
    }, 60_000);
  })();

  // ----- Twinkling stars on the hero --------------------------------------
  function spawnStars(layer, count) {
    if (!layer) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const star = document.createElement("span");
      star.className = "star";
      const size = (1 + Math.random() * 2.2).toFixed(2);
      star.style.setProperty("--size", size + "px");
      star.style.setProperty("--dur", (2.4 + Math.random() * 4.5).toFixed(2) + "s");
      star.style.setProperty("--delay", (Math.random() * 6).toFixed(2) + "s");
      star.style.left = (Math.random() * 100).toFixed(2) + "%";
      star.style.top  = (Math.random() * 100).toFixed(2) + "%";
      frag.appendChild(star);
    }
    layer.appendChild(frag);
  }
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced) {
    spawnStars(document.querySelector(".stars-layer"), 70);
  }

  const audio       = document.getElementById("tribute");
  const beginBtn    = document.getElementById("begin");
  const muteBtn     = document.getElementById("mute");
  const replayBtn   = document.getElementById("replay");
  const hero        = document.getElementById("hero");
  const stage       = document.getElementById("stage");
  const closing     = document.getElementById("closing");
  const tributeModal= document.getElementById("tribute-modal");
  const capEnEl     = document.querySelector(".caption-en");
  const capTlEl     = document.querySelector(".caption-tl");
  const scenes      = Array.from(document.querySelectorAll(".scene"));
  const cues        = (window.CUES || []).slice().sort((a, b) => a.time - b.time);

  let activeCueIdx = -1;
  let activeSceneNum = 0;
  let captionTimer = null;

  // ----- Scene control --------------------------------------------------
  function activateScene(num) {
    if (num === activeSceneNum) return;
    activeSceneNum = num;
    for (const fig of scenes) {
      const isActive = Number(fig.dataset.scene) === num;
      // Restart CSS animations cleanly when a scene becomes active again.
      if (isActive && !fig.classList.contains("active")) {
        fig.classList.remove("active");
        // Force reflow to restart animations.
        void fig.offsetWidth;
      }
      fig.classList.toggle("active", isActive);
    }
  }

  // ----- Caption control ------------------------------------------------
  function setCaption(en, tl) {
    capEnEl.classList.remove("show");
    capTlEl.classList.remove("show");
    clearTimeout(captionTimer);
    captionTimer = setTimeout(() => {
      capEnEl.textContent = en || "";
      capTlEl.textContent = tl || "";
      if (en) capEnEl.classList.add("show");
      if (tl) capTlEl.classList.add("show");
    }, 250);
  }

  // ----- Cue advancement ------------------------------------------------
  function findCueIndex(t) {
    let idx = -1;
    for (let i = 0; i < cues.length; i++) {
      if (cues[i].time <= t) idx = i;
      else break;
    }
    return idx;
  }

  function applyCueAt(t) {
    const idx = findCueIndex(t);
    if (idx === activeCueIdx) return;
    activeCueIdx = idx;
    if (idx < 0) return;
    const cue = cues[idx];
    activateScene(cue.scene);
    setCaption(cue.en, cue.tl);
  }

  // ----- Tribute modal --------------------------------------------------
  function openTributeModal() {
    if (!tributeModal) return;
    tributeModal.hidden = false;
    document.documentElement.style.overflow = "hidden";
    muteBtn.hidden = false;
    stage.setAttribute("aria-hidden", "false");
  }

  function closeTributeModal() {
    if (!tributeModal || tributeModal.hidden) return;
    audio.pause();
    tributeModal.hidden = true;
    document.documentElement.style.overflow = "";
    stage.setAttribute("aria-hidden", "true");
    closing.classList.remove("show");
    closing.setAttribute("aria-hidden", "true");
    // Reset scenes so next open starts clean
    scenes.forEach((s) => s.classList.remove("active"));
    activeSceneNum = 0;
    activeCueIdx = -1;
    capEnEl.classList.remove("show");
    capTlEl.classList.remove("show");
    if (beginBtn && typeof beginBtn.focus === "function") beginBtn.focus();
  }

  document.querySelectorAll("[data-close-tribute]").forEach((el) => {
    el.addEventListener("click", closeTributeModal);
  });

  // ----- Begin / replay -------------------------------------------------
  function startTribute() {
    openTributeModal();
    closing.classList.remove("show");
    closing.setAttribute("aria-hidden", "true");
    activeCueIdx = -1;
    activeSceneNum = 0;
    audio.currentTime = 0;
    applyCueAt(0); // ensure scene 1 is up before audio.play resolves
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((err) => {
        console.warn("Audio play was blocked or failed:", err);
      });
    }
  }

  beginBtn.addEventListener("click", startTribute);

  if (replayBtn) {
    replayBtn.addEventListener("click", () => {
      // Clear active scene so animations restart on re-entry
      scenes.forEach((s) => s.classList.remove("active"));
      activeSceneNum = 0;
      startTribute();
    });
  }

  // ----- Audio-reactive scene pulse (drives --audio-pulse CSS variable) -
  let audioCtx = null;
  let analyser = null;
  let dataArr = null;
  let pulseRaf = 0;
  let smoothedPulse = 0;
  const root = document.documentElement;

  function initAudioReactive() {
    if (audioCtx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = new Ctx();
      const src = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      // Larger FFT + heavier built-in smoothing => more stable readings,
      // fewer per-frame jumps that translate into visible jerk.
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.86;
      src.connect(analyser);
      analyser.connect(audioCtx.destination);
      dataArr = new Uint8Array(analyser.frequencyBinCount);
    } catch (err) {
      console.warn("AudioContext init failed; pulse disabled.", err);
      audioCtx = null;
      analyser = null;
    }
  }

  function pulseTick() {
    if (!analyser || audio.paused) return;
    analyser.getByteFrequencyData(dataArr);
    // Focus on the lower-mid band (voice + music body) and skip the
    // very top bins, which contain mostly hiss and add noise to the
    // amplitude estimate.
    const usable = Math.floor(dataArr.length * 0.6);
    let sum = 0;
    for (let i = 0; i < usable; i++) sum += dataArr[i];
    const avg = (sum / usable) / 255; // 0..1
    // Soft compression of peaks; gentle floor.
    const intensity = Math.min(1, Math.sqrt(avg) * 1.10);
    // Heavy exponential smoothing -- responds over ~10-15 frames so the
    // motion eases between audio peaks rather than tracking each syllable.
    const target = intensity;
    const alpha  = (target > smoothedPulse) ? 0.10 : 0.06; // attack faster than release
    smoothedPulse = smoothedPulse + (target - smoothedPulse) * alpha;
    // Clamp per-frame change so a sudden loud transient cannot snap.
    root.style.setProperty("--audio-pulse", smoothedPulse.toFixed(4));
    pulseRaf = requestAnimationFrame(pulseTick);
  }

  audio.addEventListener("play", () => {
    initAudioReactive();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    cancelAnimationFrame(pulseRaf);
    pulseRaf = requestAnimationFrame(pulseTick);
  });
  audio.addEventListener("pause", () => {
    cancelAnimationFrame(pulseRaf);
    // Decay smoothly back to 0 over ~600ms
    let p = smoothedPulse;
    const decay = () => {
      p *= 0.85;
      if (p < 0.005) {
        smoothedPulse = 0;
        root.style.setProperty("--audio-pulse", "0");
        return;
      }
      smoothedPulse = p;
      root.style.setProperty("--audio-pulse", p.toFixed(3));
      requestAnimationFrame(decay);
    };
    decay();
  });

  // ----- Atmospheric thunder, synced to the lightning visuals ----------
  // Each 17s lightning cycle has three flashes at ~2.55s, ~7.65s, ~14.01s.
  // Real thunder lags lightning by 1.5-2.5s (sound is slower than light),
  // so we fire claps a moment after each visual strike. Synthesised in
  // the browser via Web Audio (brown noise -> low-pass -> envelope) so
  // there's no asset to ship and no network call.
  const lightningStartTime = performance.now();
  const STRIKE_TIMINGS = [
    { delayMs: 4000,  volume: 0.30 }, // main strike at 2.55s + ~1.5s sound lag
    { delayMs: 9500,  volume: 0.18 }, // secondary at 7.65s + ~1.85s lag
    { delayMs: 16100, volume: 0.22 }, // distant strike at 14.01s + ~2s lag
  ];
  let thunderCtx = null;
  let thunderStarted = false;
  let thunderMuted  = localStorage.getItem("mdt-thunder-muted") === "1";

  const thunderMuteBtn = document.getElementById("thunder-mute");
  if (thunderMuteBtn) {
    const paintMute = () => {
      thunderMuteBtn.setAttribute("aria-pressed", String(thunderMuted));
      thunderMuteBtn.setAttribute("aria-label", thunderMuted ? "Unmute thunder" : "Mute thunder");
      thunderMuteBtn.title = thunderMuted ? "Thunder muted (click to unmute)" : "Mute thunder";
      thunderMuteBtn.classList.toggle("is-muted", thunderMuted);
    };
    paintMute();
    thunderMuteBtn.addEventListener("click", () => {
      thunderMuted = !thunderMuted;
      localStorage.setItem("mdt-thunder-muted", thunderMuted ? "1" : "0");
      paintMute();
    });
  }

  function ensureThunderCtx() {
    if (thunderCtx) {
      if (thunderCtx.state === "suspended") thunderCtx.resume().catch(() => {});
      return thunderCtx;
    }
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      thunderCtx = new C();
      return thunderCtx;
    } catch { return null; }
  }
  function canPlayThunder() {
    return !thunderMuted && audio.paused && (!tributeModal || tributeModal.hidden);
  }
  function thunderJitter() { return (Math.random() * 0.06) - 0.03; }

  function synthesizeThunder(volume) {
    const ctx = ensureThunderCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const duration = 3.5 + Math.random() * 2.0;

    // Brown noise via low-pass random walk -- mostly low-frequency energy.
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    // Low-pass that closes over the duration -> sounds like the rumble
    // is rolling away into the distance.
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(220 + Math.random() * 60, now);
    lp.frequency.exponentialRampToValueAtTime(45, now + duration);
    lp.Q.value = 0.7;

    // Soft attack, slow tail.
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume,        now + 0.55);
    gain.gain.linearRampToValueAtTime(volume * 0.55, now + duration * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001,   now + duration);

    src.connect(lp).connect(gain).connect(ctx.destination);
    src.start(now);
    src.stop(now + duration + 0.05);
  }

  function fireStrike(volBase) {
    if (canPlayThunder() && !reduced) {
      synthesizeThunder(volBase + thunderJitter());
    }
  }

  function scheduleCycleFromZero() {
    STRIKE_TIMINGS.forEach((s) => setTimeout(() => fireStrike(s.volume), s.delayMs));
  }

  function startThunderSyncOnce() {
    if (thunderStarted) return;
    thunderStarted = true;
    ensureThunderCtx();
    // Catch the remaining strikes in this current 17s lightning cycle.
    const intoCycle = (performance.now() - lightningStartTime) % 17000;
    STRIKE_TIMINGS.forEach((s) => {
      if (s.delayMs > intoCycle) {
        setTimeout(() => fireStrike(s.volume), s.delayMs - intoCycle);
      }
    });
    // Hand off to a steady cycle aligned to the lightning loop.
    setTimeout(() => {
      scheduleCycleFromZero();
      setInterval(scheduleCycleFromZero, 17000);
    }, 17000 - intoCycle);
  }

  if (!reduced) {
    ["pointerdown", "keydown", "touchstart"].forEach((evt) => {
      document.addEventListener(evt, startThunderSyncOnce, { once: true, passive: true });
    });
  }

  // ----- Time-driven cues ----------------------------------------------
  audio.addEventListener("timeupdate", () => {
    applyCueAt(audio.currentTime);
  });

  audio.addEventListener("ended", () => {
    // Hold final caption a moment, then reveal closing card.
    setTimeout(() => {
      closing.classList.add("show");
      closing.setAttribute("aria-hidden", "false");
      // Fade captions out gracefully.
      capEnEl.classList.remove("show");
      capTlEl.classList.remove("show");
    }, 1200);
  });

  // ----- Mute toggle ----------------------------------------------------
  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.setAttribute("aria-pressed", String(audio.muted));
    muteBtn.setAttribute("aria-label", audio.muted ? "Unmute audio" : "Mute audio");
  });

  // ----- Keyboard convenience ------------------------------------------
  document.addEventListener("keydown", (e) => {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (e.key === "Escape") {
      if (storyModal && !storyModal.hidden) { e.preventDefault(); closeStory(); return; }
      if (tributeModal && !tributeModal.hidden) { e.preventDefault(); closeTributeModal(); return; }
    }
    if (e.key === " " || e.code === "Space") {
      // Only intercept Space if the tribute is open
      if (!tributeModal || tributeModal.hidden) return;
      e.preventDefault();
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    } else if (e.key.toLowerCase() === "m") {
      if (!muteBtn.hidden) muteBtn.click();
    }
  });

  // ----- Story modal ----------------------------------------------------
  const storyModal = document.getElementById("story-modal");
  const storyCard  = storyModal && storyModal.querySelector(".story-card");
  const storyClose = document.getElementById("story-close");
  let lastFocus = null;
  let wasPlayingBeforeStory = false;

  function openStory() {
    if (!storyModal) return;
    lastFocus = document.activeElement;
    wasPlayingBeforeStory = !audio.paused;
    if (wasPlayingBeforeStory) audio.pause();
    storyModal.hidden = false;
    document.documentElement.style.overflow = "hidden";
    // Reset scroll to top each time
    requestAnimationFrame(() => {
      if (storyCard) storyCard.scrollTop = 0;
      if (storyClose) storyClose.focus();
    });
  }

  function closeStory() {
    if (!storyModal || storyModal.hidden) return;
    storyModal.hidden = true;
    document.documentElement.style.overflow = "";
    if (wasPlayingBeforeStory) {
      audio.play().catch(() => {});
      wasPlayingBeforeStory = false;
    }
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  document.querySelectorAll("[data-open-story]").forEach((el) => {
    el.addEventListener("click", openStory);
  });
  document.querySelectorAll("[data-close-story]").forEach((el) => {
    el.addEventListener("click", closeStory);
  });
})();
