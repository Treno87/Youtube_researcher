// -------- DOM --------
const queryInput = document.getElementById("queryInput");
const searchBtn = document.getElementById("searchBtn");
const orderSelect = document.getElementById("orderSelect");
const lengthFilter = document.getElementById("lengthFilter");
const dateFilter = document.getElementById("dateFilter");
const perfFilter = document.getElementById("perfFilter");

const toggleViewBtn = document.getElementById("toggleViewBtn");
const downloadCsvBtn = document.getElementById("downloadCsvBtn");
const gallerySection = document.getElementById("gallerySection");
const tableSection = document.getElementById("tableSection");
const tableBody = document.getElementById("tableBody");
const statusBox = document.getElementById("statusBox");
const errorBox = document.getElementById("errorBox");

const openSettingsBtn = document.getElementById("openSettingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const apiKeyInput = document.getElementById("apiKeyInput");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const clearSettingsBtn = document.getElementById("clearSettingsBtn");

const sortableHeaders = [
  { id: "th-publishedAt", field: "publishedAt" },
  { id: "th-durationSec", field: "durationSec" },
  { id: "th-viewCount", field: "viewCount" },
  { id: "th-likeCount", field: "likeCount" },
  { id: "th-performanceRatio", field: "performanceRatio" },
];

// -------- State --------
let allResults = []; // 전체 결과
let filtered = []; // 필터 적용 결과
let viewMode = "gallery";
// 기본 정렬: 성능 내림차순
let currentSort = { field: "performanceRatio", direction: "desc" };

// -------- Utils --------
const ytWatchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;

function showStatus(show, msg = "검색 중… 잠시만요.") {
  statusBox.classList.toggle("hidden", !show);
  if (show) statusBox.textContent = msg;
}

function showError(msg) {
  errorBox.classList.remove("hidden");
  errorBox.querySelector("div").textContent =
    msg || "알 수 없는 오류가 발생했습니다.";
}

function clearError() {
  errorBox.classList.add("hidden");
  errorBox.querySelector("div").textContent = "";
}

function numberFmt(n) {
  if (n == null || isNaN(n)) return "-";
  return new Intl.NumberFormat().format(n);
}

function secondsToHMS(secs) {
  secs = Math.max(0, Math.floor(secs || 0));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseISODurationToSeconds(iso) {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const h = parseInt(m[1] || "0", 10);
  const mi = parseInt(m[2] || "0", 10);
  const s = parseInt(m[3] || "0", 10);
  return h * 3600 + mi * 60 + s;
}

function monthsAgoISO(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

function perfLevel(ratio) {
  if (ratio == null || !isFinite(ratio)) return null;
  if (ratio < 0.3) return 1;
  if (ratio < 0.9) return 2;
  if (ratio < 1.5) return 3;
  if (ratio < 5) return 4;
  return 5;
}

function escapeCsvField(value) {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// 정렬 유틸 (null은 항상 뒤로)
function sortByField(arr, field, direction = "asc") {
  const mul = direction === "asc" ? 1 : -1;
  return arr.slice().sort((a, b) => {
    let va = a[field],
      vb = b[field];

    // 날짜 문자열 비교
    if (field === "publishedAt") {
      va = va ? new Date(va).getTime() : null;
      vb = vb ? new Date(vb).getTime() : null;
    }

    // null 처리
    const aNull = va === null || va === undefined || Number.isNaN(va);
    const bNull = vb === null || vb === undefined || Number.isNaN(vb);
    if (aNull && bNull) return 0;
    if (aNull) return 1; // null은 뒤로
    if (bNull) return -1;

    if (va < vb) return -1 * mul;
    if (va > vb) return 1 * mul;
    return 0;
  });
}

// CSV 다운로드
function downloadCSV(rows, filename = "youtube_results.csv") {
  const header = [
    "videoId",
    "title",
    "description",
    "tags",
    "channelTitle",
    "subscriberCount",
    "publishedAt",
    "duration",
    "durationSec",
    "viewCount",
    "likeCount",
    "performanceRatio",
    "performanceLevel",
    "url",
    "thumbnail",
  ];
  const lines = [header.map(escapeCsvField).join(",")];

  for (const r of rows) {
    const tagsJoined = r.tags && r.tags.length ? r.tags.join("|") : "";
    const line = [
      r.videoId,
      r.title,
      r.description || "",
      tagsJoined,
      r.channelTitle,
      r.subscriberCount ?? "",
      r.publishedAt,
      r.durationHMS || "",
      r.durationSec ?? "",
      r.viewCount ?? "",
      r.likeCount ?? "",
      r.performanceRatio ?? "",
      r.performanceLevel ?? "",
      ytWatchUrl(r.videoId),
      r.thumbnail || "",
    ]
      .map(escapeCsvField)
      .join(",");
    lines.push(line);
  }

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// -------- Rendering --------
function setView(mode) {
  viewMode = mode;
  if (mode === "gallery") {
    gallerySection.classList.remove("hidden");
    tableSection.classList.add("hidden");
    toggleViewBtn.textContent = "테이블 보기로 전환";
  } else {
    gallerySection.classList.add("hidden");
    tableSection.classList.remove("hidden");
    toggleViewBtn.textContent = "갤러리 보기로 전환";
  }
}

function renderGallery(items) {
  // 갤러리도 현재 정렬을 반영
  const itemsSorted = sortByField(
    items,
    currentSort.field,
    currentSort.direction
  );
  gallerySection.innerHTML = "";
  if (!itemsSorted.length) {
    gallerySection.innerHTML = `<div class="text-textSub">검색 결과가 없습니다.</div>`;
    return;
  }
  const frag = document.createDocumentFragment();
  for (const v of itemsSorted) {
    const card = document.createElement("article");
    card.className =
      "bg-card border border-border rounded-2xl overflow-hidden hover:border-textSub transition";
    const perf =
      v.performanceRatio != null
        ? `${v.performanceRatio.toFixed(2)} (${v.performanceLevel}단계)`
        : "N/A";
    card.innerHTML = `
      <a href="${ytWatchUrl(
        v.videoId
      )}" target="_blank" rel="noopener" class="block">
        <img src="${v.thumbnail}" alt="${
      v.title
    }" class="w-full aspect-video object-cover" />
      </a>
      <div class="p-4">
        <a class="font-semibold hover:underline" href="${ytWatchUrl(
          v.videoId
        )}" target="_blank" rel="noopener">
          ${v.title}
        </a>
        <div class="mt-1 text-xs text-textSub">
          ${v.channelTitle} (구독 ${numberFmt(v.subscriberCount)}) ·
          ${new Date(v.publishedAt).toLocaleDateString()}
        </div>
        <p class="mt-2 text-sm text-textSub line-clamp-3">${
          v.description ?? ""
        }</p>
        <div class="mt-3 text-xs text-textSub">
          길이 ${v.durationHMS} · 조회수 ${numberFmt(
      v.viewCount
    )} · 좋아요 ${numberFmt(v.likeCount)}
        </div>
        <div class="mt-2 text-xs">성능:
          <span class="px-2 py-1 rounded bg-surface border border-border">${perf}</span>
        </div>
        <div class="mt-3 flex flex-wrap gap-2 text-xs">
          ${(v.tags || [])
            .slice(0, 6)
            .map(
              (t) =>
                `<span class="px-2 py-1 rounded-full bg-surface border border-border">${t}</span>`
            )
            .join("")}
        </div>
      </div>
    `;
    frag.appendChild(card);
  }
  gallerySection.appendChild(frag);
}

function updateSortHeaderUI() {
  // 모든 헤더 초기화
  sortableHeaders.forEach(({ id, field }) => {
    const th = document.getElementById(id);
    th.classList.remove("active");
    th.querySelector(".icon").textContent = "";
  });
  // 활성 헤더 표시
  const active = sortableHeaders.find((h) => h.field === currentSort.field);
  if (active) {
    const th = document.getElementById(active.id);
    th.classList.add("active");
    th.querySelector(".icon").textContent =
      currentSort.direction === "asc" ? "▲" : "▼";
  }
}

function renderTable(items) {
  const itemsSorted = sortByField(
    items,
    currentSort.field,
    currentSort.direction
  );
  tableBody.innerHTML = "";
  if (!itemsSorted.length) {
    tableBody.innerHTML = `<tr><td class="px-4 py-3 text-textSub" colspan="9">검색 결과가 없습니다.</td></tr>`;
    updateSortHeaderUI();
    return;
  }
  const frag = document.createDocumentFragment();
  for (const v of itemsSorted) {
    const tr = document.createElement("tr");
    tr.className = "border-t border-border hover:bg-card/50";
    const perf =
      v.performanceRatio != null
        ? `${v.performanceRatio.toFixed(2)} (${v.performanceLevel}단계)`
        : "N/A";
    tr.innerHTML = `
      <td class="px-4 py-3">
        <a href="${ytWatchUrl(v.videoId)}" target="_blank" rel="noopener">
          <img src="${
            v.thumbnail
          }" alt="thumb" class="w-28 aspect-video object-cover rounded-md border border-border" />
        </a>
      </td>
      <td class="px-4 py-3">
        <a class="font-semibold hover:underline" href="${ytWatchUrl(
          v.videoId
        )}" target="_blank" rel="noopener">${v.title}</a>
        <div class="text-xs text-textSub mt-1 break-words max-w-[30rem] line-clamp-2">${
          v.description ?? ""
        }</div>
      </td>
      <td class="px-4 py-3">${
        v.channelTitle
      } <span class="text-textSub text-xs">(${numberFmt(
      v.subscriberCount
    )})</span></td>
      <td class="px-4 py-3">${new Date(v.publishedAt).toLocaleString()}</td>
      <td class="px-4 py-3">${v.durationHMS}</td>
      <td class="px-4 py-3">${numberFmt(v.viewCount)}</td>
      <td class="px-4 py-3">${numberFmt(v.likeCount)}</td>
      <td class="px-4 py-3">
        ${(v.tags || [])
          .slice(0, 6)
          .map(
            (t) =>
              `<span class="inline-block px-2 py-0.5 mr-1 mb-1 rounded bg-surface border border-border">${t}</span>`
          )
          .join("")}
      </td>
      <td class="px-4 py-3">${perf}</td>
    `;
    frag.appendChild(tr);
  }
  tableBody.appendChild(frag);
  updateSortHeaderUI();
}

function applyFilters() {
  const lenMode = lengthFilter.value; // all | shorts | long
  const dateMode = dateFilter.value; // all | 1m | 2m | 6m | 12m

  // 복수 선택된 성능 단계
  const perfSelected = Array.from(perfFilter.selectedOptions).map(
    (opt) => opt.value
  );
  const hasPerfFilter = perfSelected.length > 0;

  let afterISO = null;
  if (dateMode === "1m") afterISO = monthsAgoISO(1);
  else if (dateMode === "2m") afterISO = monthsAgoISO(2);
  else if (dateMode === "6m") afterISO = monthsAgoISO(6);
  else if (dateMode === "12m") afterISO = monthsAgoISO(12);

  filtered = allResults.filter((v) => {
    if (
      lenMode === "shorts" &&
      !(v.durationSec != null && v.durationSec < 60)
    )
      return false;
    if (
      lenMode === "long" &&
      !(v.durationSec != null && v.durationSec >= 60)
    )
      return false;

    if (afterISO) {
      const p = new Date(v.publishedAt);
      if (!(p >= new Date(afterISO))) return false;
    }

    if (hasPerfFilter) {
      if (v.performanceLevel == null) return false;
      if (!perfSelected.includes(String(v.performanceLevel))) return false;
    }
    return true;
  });
}

function renderAll() {
  applyFilters();
  if (viewMode === "gallery") renderGallery(filtered);
  else renderTable(filtered);
}

// -------- Sorting header handlers --------
function handleSort(field) {
  if (currentSort.field === field) {
    currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
  } else {
    currentSort.field = field;
    currentSort.direction = "asc"; // 새 필드 클릭 시 오름차순부터
  }
  renderAll();
}

// -------- API --------
async function youtubeSearchAndEnrich(apiKey, q, order, publishedAfter) {
  // 1) search.list
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  const params = {
    key: apiKey,
    part: "snippet",
    type: "video",
    maxResults: "25",
    q,
    order,
  };
  if (publishedAfter) params.publishedAfter = publishedAfter;
  searchUrl.search = new URLSearchParams(params).toString();

  const r1 = await fetch(searchUrl.toString());
  if (!r1.ok) {
    const errorData = await r1.json().catch(() => ({}));
    const errorMsg = errorData.error?.message || `HTTP ${r1.status}`;
    throw new Error(`search.list 실패 (${r1.status}): ${errorMsg}`);
  }
  const j1 = await r1.json();

  const items = j1.items || [];
  const videoIds = items.map((i) => i.id?.videoId).filter(Boolean);
  const channelIds = Array.from(
    new Set(items.map((i) => i.snippet?.channelId).filter(Boolean))
  );
  if (!videoIds.length) return [];

  // 2) videos.list
  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.search = new URLSearchParams({
    key: apiKey,
    part: "snippet,statistics,contentDetails",
    id: videoIds.join(","),
  }).toString();

  const r2 = await fetch(videosUrl.toString());
  if (!r2.ok) {
    const errorData = await r2.json().catch(() => ({}));
    const errorMsg = errorData.error?.message || `HTTP ${r2.status}`;
    throw new Error(`videos.list 실패 (${r2.status}): ${errorMsg}`);
  }
  const j2 = await r2.json();
  const vById = new Map();
  for (const v of j2.items || []) vById.set(v.id, v);

  // 3) channels.list (구독자수)
  let subsByChannel = new Map();
  if (channelIds.length) {
    const channelsUrl = new URL(
      "https://www.googleapis.com/youtube/v3/channels"
    );
    channelsUrl.search = new URLSearchParams({
      key: apiKey,
      part: "statistics",
      id: channelIds.join(","),
    }).toString();

    const r3 = await fetch(channelsUrl.toString());
    if (!r3.ok) {
      const errorData = await r3.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || `HTTP ${r3.status}`;
      throw new Error(`channels.list 실패 (${r3.status}): ${errorMsg}`);
    }
    const j3 = await r3.json();
    subsByChannel = new Map(
      (j3.items || []).map((c) => {
        const sc = c.statistics?.subscriberCount
          ? Number(c.statistics.subscriberCount)
          : null;
        return [c.id, sc];
      })
    );
  }

  // 4) 정규화
  const normalized = videoIds.map((id) => {
    const v = vById.get(id);
    const sn = v?.snippet ?? {};
    const st = v?.statistics ?? {};
    const cd = v?.contentDetails ?? {};
    const thumbs = sn?.thumbnails ?? {};
    const durationSec = parseISODurationToSeconds(cd.duration);
    const durationHMS = secondsToHMS(durationSec || 0);
    const thumb =
      thumbs.maxres?.url ||
      thumbs.standard?.url ||
      thumbs.high?.url ||
      thumbs.medium?.url ||
      thumbs.default?.url ||
      "";

    const channelId = sn.channelId;
    const subscriberCount = channelId
      ? subsByChannel.get(channelId) ?? null
      : null;

    const viewCount = st.viewCount ? Number(st.viewCount) : null;
    const likeCount = st.likeCount ? Number(st.likeCount) : null;

    const ratio =
      subscriberCount && subscriberCount > 0 && viewCount != null
        ? viewCount / subscriberCount
        : null;

    return {
      videoId: id,
      title: sn.title || "",
      description: sn.description || "",
      tags: sn.tags || [],
      channelId,
      channelTitle: sn.channelTitle || "",
      subscriberCount,
      publishedAt: sn.publishedAt || "",
      durationSec,
      durationHMS,
      viewCount,
      likeCount,
      performanceRatio: ratio,
      performanceLevel: perfLevel(ratio),
      thumbnail: thumb,
    };
  });

  return normalized;
}

// -------- Events --------
toggleViewBtn.addEventListener("click", () => {
  setView(viewMode === "gallery" ? "table" : "gallery");
  renderAll();
});

downloadCsvBtn.addEventListener("click", () => {
  if (!filtered.length) {
    showError("다운로드할 결과가 없습니다. 먼저 검색하고 필터를 확인하세요.");
    return;
  }
  clearError();
  // 현재 정렬 반영해서 저장
  const sorted = sortByField(filtered, currentSort.field, currentSort.direction);
  downloadCSV(sorted, "youtube_results.csv");
});

[lengthFilter, dateFilter, perfFilter].forEach((el) => {
  el.addEventListener("change", renderAll);
});

// 테이블 헤더 정렬 이벤트
sortableHeaders.forEach(({ id, field }) => {
  const th = document.getElementById(id);
  th.addEventListener("click", () => handleSort(field));
});

searchBtn.addEventListener("click", doSearch);
queryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch();
});

async function doSearch() {
  clearError();
  const key = localStorage.getItem("ytApiKey");
  if (!key) {
    showError("먼저 ⚙️ 설정에서 API Key를 저장하세요.");
    return;
  }
  const q = queryInput.value.trim();
  if (!q) {
    showError("검색어를 입력하세요.");
    return;
  }

  // publishedAfter (서버측 1차 필터)
  const dateMode = dateFilter.value;
  let publishedAfter = null;
  if (dateMode === "1m") publishedAfter = monthsAgoISO(1);
  else if (dateMode === "2m") publishedAfter = monthsAgoISO(2);
  else if (dateMode === "6m") publishedAfter = monthsAgoISO(6);
  else if (dateMode === "12m") publishedAfter = monthsAgoISO(12);

  const order = orderSelect.value;

  try {
    showStatus(true);
    gallerySection.innerHTML = "";
    tableBody.innerHTML = "";
    allResults = await youtubeSearchAndEnrich(key, q, order, publishedAfter);

    // ✅ 기본 정렬: 성능 내림차순
    currentSort = { field: "performanceRatio", direction: "desc" };

    setView("gallery");
    renderAll();
    if (!allResults.length) showError("검색 결과가 없습니다.");
  } catch (err) {
    console.error(err);
    showError(
      err.message.includes("403")
        ? "오류: 권한/쿼터 문제일 수 있습니다. API Key와 할당량을 확인하세요."
        : `오류: ${err.message}`
    );
  } finally {
    showStatus(false);
  }
}

// -------- Settings --------
function openSettings() {
  settingsModal.classList.remove("hidden");
  settingsModal.classList.add("flex");
  apiKeyInput.value = localStorage.getItem("ytApiKey") || "";
}

function closeSettings() {
  settingsModal.classList.add("hidden");
  settingsModal.classList.remove("flex");
}

openSettingsBtn.addEventListener("click", openSettings);
closeSettingsBtn.addEventListener("click", closeSettings);
settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) closeSettings();
});

saveSettingsBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    showError("API Key를 입력하세요.");
    return;
  }
  localStorage.setItem("ytApiKey", key);
  closeSettings();
});

clearSettingsBtn.addEventListener("click", () => {
  localStorage.removeItem("ytApiKey");
  apiKeyInput.value = "";
});

// 초기 상태
setView("gallery");
updateSortHeaderUI();
