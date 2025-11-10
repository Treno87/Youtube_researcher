/*
 * YouTube Dashboard - main.js
 * Ken 버전 (2025)
 */

const app = document.getElementById("app");

// ==============================
// 🧩 1. 초기 HTML 템플릿 구성
// ==============================
app.innerHTML = `
  <header class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
    <div>
      <h1 class="text-2xl font-bold">YouTube 검색 대시보드</h1>
      <p class="text-textSub text-sm mt-1">
        갤러리↔테이블, CSV 다운로드, 숏폼/롱폼·기간·성능(조회/구독) 멀티필터, 정렬 ▲▼
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <button id="toggleViewBtn" class="px-4 py-2 rounded-lg bg-primary hover:bg-primaryHover transition font-semibold">
        테이블 보기로 전환
      </button>
      <button id="downloadCsvBtn" class="px-4 py-2 rounded-lg bg-card border border-border hover:border-textSub transition font-semibold">
        CSV 다운로드
      </button>
      <button id="openSettingsBtn" class="px-4 py-2 rounded-lg bg-card border border-border hover:border-textSub transition font-semibold">
        ⚙️ 설정
      </button>
    </div>
  </header>

  <section id="filtersContainer" class="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-soft mb-6"></section>

  <div id="statusBox" class="hidden mb-6">
    <div class="animate-pulse text-textSub text-sm">검색 중… 잠시만요.</div>
  </div>
  <div id="errorBox" class="hidden mb-6"><div class="text-danger text-sm"></div></div>

  <section id="gallerySection" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"></section>
  <section id="tableSection" class="hidden overflow-x-auto border border-border rounded-2xl"></section>

  <footer class="mt-10 text-center text-xs text-textSub">
    © 2025 – YouTube Data API v3 (로컬 실행 가능)
  </footer>

  <div id="settingsModal" class="hidden fixed inset-0 bg-black/60 z-50 items-center justify-center p-4"></div>
`;

// ==============================
// 🧭 2. 주요 함수 (이전 HTML 동일)
// ==============================

// 💡 여기에는 기존 HTML의 JavaScript 전체 로직을 그대로 옮기세요.
//   예: applyFilters(), renderTable(), youtubeSearchAndEnrich(), handleSort(), doSearch(), ...
//   기존 코드의 <script> 부분을 복사해서 여기에 붙이면 완전 동일하게 동작합니다.

// 구조는 그대로 두되, 상단에서 const로 element 선택을 document.getElementById()로 다시 바꿔주세요.
// 나머지 함수, 이벤트리스너, fetch 등은 전부 동일하게 작동합니다.
