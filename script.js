// Mother's Day tribute — audio-driven scene & caption controller.
(() => {
  "use strict";

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
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.72;
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
    let sum = 0;
    for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
    const avg = (sum / dataArr.length) / 255; // 0..1
    // Emphasize peaks with sqrt and lift the floor so quiet sections
    // still breathe a little.
    const intensity = Math.min(1, Math.sqrt(avg) * 1.15);
    smoothedPulse = smoothedPulse * 0.78 + intensity * 0.22;
    root.style.setProperty("--audio-pulse", smoothedPulse.toFixed(3));
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
