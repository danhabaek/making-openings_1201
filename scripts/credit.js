// scripts/credit.js
(() => {
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
   * ✅ A/B/C 모두 0초에서 동시에 시작
   * ✅ 이후에는 영상 자체 loop로 반복 (추가 제어 없음)
   */
  const startVideosSync = async () => {
    // 전부 잠깐 멈추고 0초로 정렬
    videos.forEach((v) => {
      try {
        v.pause();
      } catch (e) {}
    });

    await Promise.all(videos.map((v) => safeSetTime(v, 0)));
    await Promise.allSettled(videos.map((v) => v.play()));
  };

  // ✅ loop 속성이 HTML에 없을 수도 있으니 JS에서 강제
  videos.forEach((v) => {
    v.loop = true;
    v.muted = true; // autoplay 안정성
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
  });

  // 초기 동시 시작
  startVideosSync();

  /**
   * ✅ iOS autoplay unlock
   * - 시간/seek 건드리지 않고 play만 재시도
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
