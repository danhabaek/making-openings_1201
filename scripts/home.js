// scripts/home.js
(function () {
  const TOTAL_BACKGROUNDS = 17;
  const BG_BASE = "assets/image";
  const BG_EXT = "webp";

  const VISITED_KEY = "mo.visited";
  const BG_KEY = "mo.homebg";
  const SPLASH_KEY = "mo.splashShown"; // 🔹 스플래시 1회만 재생용 키

  function loadVisited() {
    try {
      return JSON.parse(localStorage.getItem(VISITED_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveVisited(arr) {
    localStorage.setItem(VISITED_KEY, JSON.stringify(arr));
  }

  function loadHomeBG() {
    try {
      return localStorage.getItem(BG_KEY);
    } catch {
      return null;
    }
  }

  function saveHomeBG(name) {
    localStorage.setItem(BG_KEY, name);
  }

  const stage = document.getElementById("home");
  const splashEl = document.getElementById("splash");
  const splashLottie = document.getElementById("splash-lottie");

  // ----- 0) 스플래시 처리 -----
  (function setupSplash() {
    if (!stage || !splashEl) return;

    const hasSeenSplash = localStorage.getItem(SPLASH_KEY) === "1";

    // 이미 스플래시 본 적 있으면 바로 홈 보여주기
    if (hasSeenSplash || !window.lottie || !splashLottie) {
      splashEl.style.display = "none";
      stage.style.visibility = "visible";
      return;
    }

    // 첫 방문: 스플래시 활성화
    stage.style.visibility = "hidden"; // 홈 가리기
    splashEl.classList.add("is-active"); // 풀스크린 스플래시 표시
    splashEl.style.backgroundColor = "#ff319c"; // 처음 2초는 핑크

    const anim = lottie.loadAnimation({
      container: splashLottie,
      renderer: "svg",
      loop: false,
      autoplay: true,
      path: "splash.json", // 🔹 스플래시 json 경로
    });

    // 2초 후: 배경을 투명으로 → 아래 회색 배경이 보이게
    // 2.31초 후: 배경을 "회색 레이어"로 변경
    setTimeout(() => {
      // CSS 변수에서 --bg(회색) 가져오기
      const rootStyles = getComputedStyle(document.documentElement);
      const gray = rootStyles.getPropertyValue("--bg") || "#e6e7e8";

      splashEl.style.backgroundColor = gray.trim(); // 투명 X, 회색으로
    }, 2310);

    function finishSplash() {
      if (!splashEl.classList.contains("is-active")) return;

      splashEl.classList.remove("is-active");
      splashEl.style.display = "none"; // 🔹 회색 레이어도 같이 사라짐
      stage.style.visibility = "visible";
      localStorage.setItem(SPLASH_KEY, "1");
    }

    // 애니메이션 끝나면 스플래시 종료
    anim.addEventListener("complete", finishSplash);

    // 혹시 애니가 에러나거나 너무 길어져도 최대 6초 후 강제 종료
    setTimeout(finishSplash, 6000);
  })();

  // ----- 1) 배경 이미지 1개 고정 선택 -----
  let bgFile = loadHomeBG();
  if (!bgFile) {
    const idx = 1 + Math.floor(Math.random() * TOTAL_BACKGROUNDS);
    bgFile = `bg${idx}.${BG_EXT}`;
    saveHomeBG(bgFile);
  }
  const bgUrl = `${BG_BASE}/${bgFile}`;

  const visitedSet = new Set(loadVisited());

  // ----- 2) 아이콘에 동작 연결 -----
  const icons = document.querySelectorAll(".icon[data-id]");

  icons.forEach((icon) => {
    const id = Number(icon.dataset.id);
    if (!id) return;

    const fill = icon.querySelector(".fill");

    // 이미 방문한 아이콘이면 바로 적용
    if (visitedSet.has(id)) {
      applyPhotoMask(icon, id, fill, bgUrl, stage);
    }

    icon.addEventListener("click", () => {
      if (!visitedSet.has(id)) {
        visitedSet.add(id);
        saveVisited([...visitedSet]);
      }

      applyPhotoMask(icon, id, fill, bgUrl, stage);

      // 해당 프로젝트 페이지로 이동
      location.href = `project/project${id}.html`;
    });
  });

  // ----- 사진 + 마스크 적용 -----
  function applyPhotoMask(icon, id, fillEl, bgUrl, stageEl) {
    if (!fillEl || !stageEl) return;

    // stage 기준으로 아이콘의 위치 계산
    const stageRect = stageEl.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();

    const offsetX = iconRect.left - stageRect.left;
    const offsetY = iconRect.top - stageRect.top;

    // 한 장짜리 배경처럼 보이도록: stage 전체 크기에 맞추고, 아이콘 위치만큼 이동
    fillEl.style.backgroundImage = `url('${bgUrl}')`;
    fillEl.style.backgroundSize = `${stageRect.width}px ${stageRect.height}px`;
    fillEl.style.backgroundPosition = `${-offsetX}px ${-offsetY}px`;

    const maskUrl = `assets/svg/icon${id}-fill.svg`;
    fillEl.style.webkitMaskImage = `url('${maskUrl}')`;
    fillEl.style.maskImage = `url('${maskUrl}')`;

    icon.classList.add("visited");
  }

  // 디버그용
  window.MO = {
    reset() {
      localStorage.removeItem(VISITED_KEY);
      localStorage.removeItem(BG_KEY);
      localStorage.removeItem(SPLASH_KEY);
      console.log("Making Openings: localStorage reset");
    },
  };
})();
