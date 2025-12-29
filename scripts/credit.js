(() => {
  const LOOP = 6; // 0~6초
  const RESYNC_EPS = 0.08; // 80ms 이상 어긋나면 보정
  const TICK_MS = 200; // 200ms마다 동기 체크(너무 촘촘하면 부담)

  const track = document.querySelector(".video-track");
  if (!track) return;

  const videos = Array.from(track.querySelectorAll("video.teaser-video"));
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
    } catch (_) {
      // iOS/인앱에서 막힐 수 있음 (unlock에서 다시 시도)
    }
  };

  const safeSetTime = async (v, t) => {
    await waitMeta(v);
    try {
      const dur = Number.isFinite(v.duration) ? v.duration : null;
      const clamped = dur
        ? Math.min(Math.max(t, 0), Math.max(dur - 0.05, 0))
        : Math.max(t, 0);
      v.currentTime = clamped;
    } catch (_) {}
  };

  // ✅ 공통 기준 시계
  let t0 = 0;
  let running = false;
  let timer = null;

  const start = async () => {
    running = true;
    t0 = performance.now();

    // 동시에 시작 시도: 0초로 맞추고 플레이
    await Promise.all(videos.map((v) => safeSetTime(v, 0)));
    await Promise.allSettled(videos.map((v) => safePlay(v)));

    // 주기적으로 드리프트 보정 + 6초 루프 강제
    clearInterval(timer);
    timer = setInterval(async () => {
      if (!running) return;

      const t = ((performance.now() - t0) / 1000) % LOOP;

      // 어떤 비디오가 멈췄으면 재생 재시도
      videos.forEach((v) => {
        if (v.paused && !v.ended) safePlay(v);
      });

      // 드리프트가 큰 것만 보정 (너무 자주 건드리면 끊겨 보여서 임계값 사용)
      await Promise.all(
        videos.map(async (v) => {
          if (!Number.isFinite(v.currentTime)) return;
          const diff = Math.abs(v.currentTime - t);
          if (diff > RESYNC_EPS) {
            await safeSetTime(v, t);
          }
        })
      );
    }, TICK_MS);
  };

  const stop = () => {
    running = false;
    clearInterval(timer);
    timer = null;
  };

  // ✅ iOS autoplay unlock: 사용자 터치 후 재시작/재시도
  let unlocked = false;
  const unlock = async () => {
    if (unlocked) return;
    unlocked = true;
    await start();
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("pointerdown", unlock);
  };

  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("pointerdown", unlock, { passive: true });

  // 최초 시도(안 되면 unlock에서 다시 잡힘)
  start();

  // 탭 복귀 시 재동기화
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") start();
    else stop();
  });

  // iOS 전체화면 방지
  videos.forEach((v) => {
    v.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
})();
