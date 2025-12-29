// scripts/credit.js
(() => {
  const PLAY_WINDOW_END = 6; // ✅ 0~6초만 재생

  const slider = document.querySelector(".video-carousel");
  if (!slider) return;

  const track = slider.querySelector(".video-track");
  if (!track) return;

  const videos = Array.from(track.querySelectorAll("video.teaser-video"));
  if (!videos.length) return;

  const waitMeta = (v) =>
    new Promise((resolve) => {
      if (v.readyState >= 1) return resolve(); // HAVE_METADATA
      v.addEventListener("loadedmetadata", () => resolve(), { once: true });
    });

  const safeSetTime = async (v, t) => {
    await waitMeta(v);
    try {
      const dur = Number.isFinite(v.duration) ? v.duration : null;
      const clamped = dur
        ? Math.min(Math.max(t, 0), Math.max(dur - 0.05, 0))
        : Math.max(t, 0);
      v.currentTime = clamped;
    } catch (e) {}
  };

  /**
   * ✅ 항상 A/B/C 모두 0초에서 동시에 시작
   */
  const startVideosSync = async () => {
    videos.forEach((v) => v.pause());

    // 전부 0초로 맞춘 뒤 동시에 재생
    await Promise.all(videos.map((v) => safeSetTime(v, 0)));
    await Promise.allSettled(videos.map((v) => v.play()));
  };

  /**
   * ✅ 0~6초 구간만 재생하는 수동 루프
   * - 각 비디오가 6초에 도달하면 0초로 돌아가 재생
   */
  const enableTrimLoop = () => {
    const resetting = new WeakMap();

    videos.forEach((v) => {
      v.addEventListener("timeupdate", async () => {
        if (!Number.isFinite(v.currentTime)) return;
        if (resetting.get(v)) return;

        if (v.currentTime >= PLAY_WINDOW_END) {
          resetting.set(v, true);

          try {
            v.pause();
          } catch (e) {}

          await safeSetTime(v, 0);
          v.play().catch(() => {});

          setTimeout(() => resetting.set(v, false), 80);
        }
      });
    });
  };

  enableTrimLoop();

  // ✅ 초기 시작(동시 시작)
  startVideosSync();

  /**
   * ✅ iOS autoplay unlock
   * - 시간 건드리지 않고 play만 재시도
   */
  let unlocked = false;
  const unlock = async () => {
    if (unlocked) return;
    unlocked = true;

    await Promise.allSettled(videos.map((v) => v.play()));

    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("pointerdown", unlock);
  };

  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("pointerdown", unlock, { passive: true });

  /**
   * ✅ 탭 복귀 시 재생 복구
   */
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      Promise.allSettled(videos.map((v) => v.play()));
    }
  });

  // iOS 전체화면 방지
  videos.forEach((v) => {
    v.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
})();
