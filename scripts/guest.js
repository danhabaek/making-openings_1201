// scripts/guest.js
(function () {
  const db = client;
  const params = new URLSearchParams(location.search);
  const projectId = Number(params.get("p"));

  if (!projectId || projectId < 1 || projectId > 16) {
    document.body.innerHTML =
      "<main><h1>잘못된 접근</h1><p>링크가 올바르지 않습니다. (?p=1~16)</p></main>";
    throw new Error("Invalid project id");
  }

  // 🔹 프로젝트별 제목 + 배경 정보
  // bg는 나중에 파일 추출되면 경로만 맞춰 넣으면 됨!
  const PROJECT_INFO = {
    1: { title: "carrihome", bg: "../assets/svg/bg1.svg" },
    2: { title: "Coolix", bg: "../assets/svg/bg2.svg" },
    3: { title: "Left Axis", bg: "../assets/svg/bg3.svg" },
    4: { title: "AEGIS", bg: "../assets/svg/bg4.svg" },
    5: { title: "TOC", bg: "../assets/svg/bg5.svg" },
    6: { title: "Fror", bg: "../assets/svg/bg6.svg" },
    7: { title: "SYNC", bg: "../assets/svg/bg7.svg" },
    8: { title: "WhozThatGYAL", bg: "../assets/svg/bg8.svg" },
    9: { title: "The Odyssey of Bo", bg: "../assets/svg/bg9.svg" },
    10: { title: "PAWTH", bg: "../assets/svg/bg10.svg" },
    11: { title: "NeoNegative", bg: "../assets/svg/bg11.svg" },
    12: { title: "chere", bg: "../assets/svg/bg12.svg" },
    13: { title: "idealMe", bg: "../assets/svg/bg13.svg" },
    14: { title: "lowkey", bg: "../assets/svg/bg14.svg" },
    15: { title: "CORNCEPT", bg: "../assets/svg/bg15.svg" },
    16: { title: "Matcha Wave", bg: "../assets/svg/bg16.svg" },
  };

  const info = PROJECT_INFO[projectId];

  // 🔹 To. 옆 프로젝트 제목 + 배경 적용
  if (info) {
    const titleSpan = document.querySelector(".project-title");
    if (titleSpan) {
      titleSpan.textContent = info.title;
    }

    // bg 파일 아직 안 뽑았으면 아래 if 블록만 잠깐 주석 처리해도 됨
    if (info.bg) {
      document.body.style.backgroundImage = `url(${info.bg})`;
      document.body.style.backgroundRepeat = "no-repeat";
      document.body.style.backgroundPosition = "center -100px";
      document.body.style.backgroundSize = "cover"; // 필요하면 cover로 변경
      // 필요하면 배경색도 여기서 지정 가능
      document.body.style.backgroundColor = "#ff43b7";
    }
  }

  const contentEl = document.querySelector(".content");
  const fromEl = document.querySelector(".from");
  const sendBtn = document.querySelector(".btn-send");
  const errEl = document.querySelector(".err");

  async function handleSend(e) {
    e.preventDefault();

    errEl.textContent = "";
    const content = (contentEl.value || "").trim();
    const from = (fromEl.value || "").trim();

    if (!content) {
      errEl.textContent = "내용을 입력해주세요.";
      return;
    }
    if (!from) {
      errEl.textContent = "닉네임을 입력해주세요.";
      return;
    }
    if (content.length > 80) {
      errEl.textContent = "내용은 80자 이하여야 합니다.";
      return;
    }
    if (from.length > 10) {
      errEl.textContent = "닉네임은 10자 이하여야 합니다.";
      return;
    }

    sendBtn.disabled = true;

    try {
      const { error } = await db.from("guestbook").insert({
        content,
        from_name: from,
        project_id: projectId,
      });

      if (error) throw error;

      // 성공 시 해당 프로젝트 방명록으로 이동
      location.href = `../guestbook/guestbook.html?p=${projectId}`;
    } catch (e) {
      console.error(e);
      errEl.textContent =
        "저장 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
      sendBtn.disabled = false;
    }
  }

  sendBtn.addEventListener("click", handleSend);
})();
