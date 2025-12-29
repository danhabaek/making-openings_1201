(() => {
  const LOOP = 6;
  const RATE_EPS = 0.04; // playbackRate 조정 폭 (±4% 이내)
  const SOFT_SYNC_EPS = 0.12; // 120ms 이상 어긋나면 속도로 보정
  const HARD_SYNC_EPS = 0.35; // 350ms 이상이면 루프 때 강제 재동기
  const TICK_MS = 250;

  const videos = Array.from(document.querySelectorAll("video.teaser-video"));
  if (!videos.length) return;

  const waitMeta = (v) =>
    new Promise((resolve) => {
      if (v.readyState >= 1) return resolve();
      v.addEventListener("loadedmetadata", resolve, { once: true });
    });

  const safePlay = async (v) => {
    try {
      const p = v.play();
      if (p && typeof p.then === "function") await p;
    } catch (_) {}
  };

  const safeSetTime = async (v, t) => {
    await waitMeta(v);
    try {
      v.currentTime = Math.max(0, t);
    } catch (_) {}
  };

  // ✅ 기준 비디오(첫 번째)를 “마스터”로 삼음 (가장 간단/안정)
  const master = videos[0];

  const startAll = async () => {
    // 한번만 0초로 맞추고 시작 (여기서는 끊겨도 상관 없음 — 최초 1회)
    await Promise.all(videos.map((v) => safeSetTime(v, 0)));
    await Promise.allSettled(videos.map((v) => safePlay(v)));
  };

  const hardResyncAtLoop = async () => {
    // 루프에서만 “다 같이” 리셋 (재생 중간엔 currentTime 건드리지 않기)
    videos.forEach((v) => {
      try {
        v.pause();
      } catch (_) {}
    });
    await Promise.all(videos.map((v) => safeSetTime(v, 0)));
    await Promise.allSettled(videos.map((v) => safePlay(v)));
  };

  // ✅ 루프 감지: master 기준으로 0~6 반복
  let lastT = 0;

  const tick = async () => {
    if (!Number.isFinite(master.currentTime)) return;

    const t = master.currentTime % LOOP;

    // 6초 넘어가는 루프 순간 감지 (t가 갑자기 작아짐)
    const looped = lastT > LOOP - 0.25 && t < 0.25;
    lastT = t;

    // 멈춘 애 있으면 play 재시도
    videos.forEach((v) => {
      if (v.paused && !v.ended) safePlay(v);
    });

    // 루프 구간: “강제 동기화”는 여기서만
    if (looped) {
      // 루프 직전에 drift가 심했던 경우에만 하드 리셋
      let worst = 0;
      for (const v of videos) {
        if (!Number.isFinite(v.currentTime)) continue;
        const diff = Math.abs((v.currentTime % LOOP) - t);
        worst = Math.max(worst, diff);
      }
      if (worst > HARD_SYNC_EPS) {
        await hardResyncAtLoop();
        return;
      }
    }

    // ✅ 평소엔 seek 금지! playbackRate만 살짝 조정
    for (const v of videos) {
      if (v === master) continue;
      if (!Number.isFinite(v.currentTime)) continue;

      const vt = v.currentTime % LOOP;
      let diff = vt - t;
      // -3~+3 범위로 접히는 형태(루프 경계 고려)
      if (diff > LOOP / 2) diff -= LOOP;
      if (diff < -LOOP / 2) diff += LOOP;

      if (Math.abs(diff) < SOFT_SYNC_EPS) {
        v.playbackRate = 1.0;
      } else {
        // diff가 +면 v가 “앞서감” → 조금 느리게
        // diff가 -면 v가 “늦음” → 조금 빠르게
        const rate = 1.0 - Math.max(-RATE_EPS, Math.min(RATE_EPS, diff * 0.08));
        v.playbackRate = rate;
      }
    }
  };

  startAll();

  const timer = setInterval(tick, TICK_MS);

  // iOS unlock
  let unlocked = false;
  const unlock = async () => {
    if (unlocked) return;
    unlocked = true;
    await Promise.allSettled(videos.map((v) => safePlay(v)));
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("pointerdown", unlock);
  };
  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("pointerdown", unlock, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      Promise.allSettled(videos.map((v) => safePlay(v)));
    }
  });

  videos.forEach((v) => {
    v.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
})();
