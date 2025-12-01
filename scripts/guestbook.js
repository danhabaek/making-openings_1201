// 🚨 사용자 요청에 따라 이전 Supabase 코드를 그대로 유지합니다.
// 이 코드는 전역적으로 'client' 변수가 Supabase 인스턴스로 정의되어 있어야 정상 작동합니다.

(function () {
  const db = client; // client 변수가 Supabase 인스턴스라고 가정합니다.
  const params = new URLSearchParams(location.search);
  const projectId = Number(params.get("p"));

  if (!projectId || projectId < 1 || projectId > 16) {
    document.body.innerHTML =
      "<main><h1>잘못된 접근</h1><p>링크가 올바르지 않습니다. (?p=1~16)</p></main>";
    throw new Error("Invalid project id");
  }

  const PROJECT_INFO = {
    1: "carrihome",
    2: "Coolix",
    3: "Left Axis",
    4: "AEGIS",
    5: "TOC",
    6: "Fror",
    7: "SYNC",
    8: "WhozThatGYAL",
    9: "The Odyssey of Bo",
    10: "PAWTH",
    11: "NeoNegative",
    12: "chere",
    13: "idealMe",
    14: "lowkey",
    15: "CORNCEPT",
    16: "Matcha Wave",
  };

  // 🔹 To. 옆 프로젝트 이름 넣기
  const titleSpan = document.querySelector(".project-title");
  if (titleSpan) {
    titleSpan.textContent = PROJECT_INFO[projectId] || "";
  }

  // 🔹 헤더 닫기 버튼 → 프로젝트 페이지로 이동
  const toProjectBtn = document.getElementById("toProject");
  if (toProjectBtn) {
    toProjectBtn.addEventListener("click", () => {
      location.href = `../project/project${projectId}.html`;
    });
  }

  const listEl = document.getElementById("list");
  const emptyEl = document.getElementById("empty");

  // 🔹 날짜 포맷 변경: YYYY.MM.DD
  function fmt(ts) {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`; // 💡 년.월.일 형식으로 변경
  }

  // XSS 방지
  function escapeHtml(s = "") {
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  async function load() {
    const { data, error } = await db
      .from("guestbook")
      .select("content, from_name, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }) // 오래된 순
      .limit(200);

    if (error) {
      console.error(error);
      listEl.innerHTML = "<li>불러오는 중 오류가 발생했습니다.</li>";
      return;
    }

    if (!data || data.length === 0) {
      if (emptyEl) {
        emptyEl.style.display = "block";
      }
      listEl.innerHTML = ""; // 데이터 없을 때 리스트 비우기
      return;
    }

    const frag = document.createDocumentFragment();
    data.forEach((row) => {
      const li = document.createElement("li");

      // 🔹 HTML 구조 변경: content와 meta-bottom 분리
      li.innerHTML = `
      <div class="guestbook-wrap">
        <div class="content-text">${escapeHtml(row.content)}</div>
        <div class="meta-bottom">
            <span class="meta-date">${fmt(row.created_at)}</span>
            <span class="meta-from">From. ${escapeHtml(row.from_name)}</span>
        </div>
      <div>  
      `;

      frag.appendChild(li);
    });
    listEl.innerHTML = "";
    listEl.appendChild(frag);

    // 로딩 성공 시 empty 메시지 숨기기
    if (emptyEl) {
      emptyEl.style.display = "none";
    }
  }

  load();
})();
