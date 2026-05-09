// Mother's Day tribute — audio-driven scene & caption controller.
(() => {
  "use strict";

  const audio    = document.getElementById("tribute");
  const beginBtn = document.getElementById("begin");
  const muteBtn  = document.getElementById("mute");
  const replayBtn= document.getElementById("replay");
  const hero     = document.getElementById("hero");
  const stage    = document.getElementById("stage");
  const closing  = document.getElementById("closing");
  const capEnEl  = document.querySelector(".caption-en");
  const capTlEl  = document.querySelector(".caption-tl");
  const scenes   = Array.from(document.querySelectorAll(".scene"));
  const cues     = (window.CUES || []).slice().sort((a, b) => a.time - b.time);

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

  // ----- Begin / replay -------------------------------------------------
  function startTribute() {
    hero.classList.add("hidden");
    stage.setAttribute("aria-hidden", "false");
    muteBtn.hidden = false;
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
    if (e.key === " " || e.code === "Space") {
      // Only intercept Space if the tribute has begun
      if (!hero.classList.contains("hidden")) return;
      e.preventDefault();
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    } else if (e.key.toLowerCase() === "m") {
      muteBtn.click();
    }
  });
})();
