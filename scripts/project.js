// scripts/project.js
(function () {
  // ---- 설정: guest.html, guestbook.html의 위치를 정의하세요 ----
  const BASE_GUEST = '../guest/guest.html';
  const BASE_GUESTBOOK = '../guestbook/guestbook.html';

  // 닫기 버튼: 클래스 기반
  const closeBtn = document.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      history.back();
    });
  }

  // 파일명에서 project 번호 추출: /project/project12.html -> 12
  const m = location.pathname.match(/project\/project(\d+)\.html$/);
  const projectId = m ? Number(m[1]) : null;

  if (!projectId || projectId < 1 || projectId > 16) {
    console.warn('project.js: 프로젝트 번호를 찾을 수 없습니다.');
    return;
  }

  // class 기반으로 버튼 찾기
  const btnWrite = document.querySelector('.btn-write');
  const btnView  = document.querySelector('.btn-guestbook');

  // 최종 URL
  const writeUrl = `${BASE_GUEST}?p=${projectId}`;
  const viewUrl  = `${BASE_GUESTBOOK}?p=${projectId}`;

  // 공통 처리 함수: a면 href, button이면 click 이벤트
  function wireButton(el, url) {
    if (!el) return;

    const tag = el.tagName.toLowerCase();

    if (tag === 'a') {
      el.href = url;
    } else {
      // button, div 등 클릭 가능한 요소
      el.addEventListener('click', function () {
        window.location.href = url;
      });
      el.style.cursor = 'pointer';
    }
  }

  wireButton(btnWrite, writeUrl);
  wireButton(btnView, viewUrl);
})();
