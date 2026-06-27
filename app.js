const USERS = [
  { id: "admin", password: "2026", role: "admin", name: "관리자" },
  { id: "10101", password: "1234", role: "student", studentId: "10101" },
  { id: "10102", password: "1234", role: "student", studentId: "10102" },
  { id: "10103", password: "1234", role: "student", studentId: "10103" },
];

const STUDENTS = [
  {
    id: "10101",
    name: "김코딩",
    photo: "assets/10101_김코딩.jpg",
    grades: {
      "정보 수행평가": "A",
      "웹앱 프로젝트": "92점",
      "디지털 윤리 퀴즈": "88점",
      "수업 참여도": "상",
    },
    traits: [
      "문제 해결 과정을 차분히 설명합니다.",
      "새 도구를 시도할 때 기록을 꼼꼼히 남깁니다.",
      "제출 전 확인 습관을 더 연습하면 좋습니다.",
    ],
    teacherMemo: "프론트엔드 구조 이해가 빠르며, 팀원 질문에 답하는 태도가 좋습니다.",
  },
  {
    id: "10102",
    name: "박개발",
    photo: "assets/10102_박개발.jpg",
    grades: {
      "정보 수행평가": "B+",
      "웹앱 프로젝트": "86점",
      "디지털 윤리 퀴즈": "91점",
      "수업 참여도": "중상",
    },
    traits: [
      "협업 중 역할 분담을 잘 지킵니다.",
      "UI 수정 아이디어를 자주 제안합니다.",
      "프로젝트 범위를 작게 나누는 연습이 필요합니다.",
    ],
    teacherMemo: "기능 구현 의욕이 높고, 오류가 날 때 원인을 함께 추적하려는 태도가 좋습니다.",
  },
  {
    id: "10103",
    name: "이교사",
    photo: "assets/10103_이교사.jpg",
    grades: {
      "정보 수행평가": "A-",
      "웹앱 프로젝트": "89점",
      "디지털 윤리 퀴즈": "95점",
      "수업 참여도": "상",
    },
    traits: [
      "학습 내용을 자기 언어로 정리합니다.",
      "개선할 지점을 발견하면 근거를 함께 제시합니다.",
      "코드 주석을 더 구체적으로 쓰면 좋습니다.",
    ],
    teacherMemo: "질문의 초점이 좋고, 개선 방향을 토의하는 데 적극적입니다.",
  },
];

// 학생 익명 호칭: Gemini 전송 시 사용 (이름·학번 대신)
const STUDENT_ALIASES = STUDENTS.map((_, i) => "학생 " + String.fromCharCode(65 + i));

const loginForm = document.querySelector("#loginForm");
const userIdInput = document.querySelector("#userId");
const passwordInput = document.querySelector("#password");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const loginView = document.querySelector("#loginView");
const studentView = document.querySelector("#studentView");
const adminView = document.querySelector("#adminView");

let currentUser = null;
let selectedStudentForCounseling = null;
// 이벤트 리스너를 한 번만 등록하기 위한 플래그
let adminListenersAttached = false;

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const id = userIdInput.value.trim();
  const password = passwordInput.value;
  const user = USERS.find((item) => item.id === id && item.password === password);

  if (!user) {
    loginMessage.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  currentUser = user;
  loginMessage.textContent = "";
  loginForm.reset();

  if (user.role === "admin") {
    renderAdminDashboard();
  } else {
    const student = STUDENTS.find((item) => item.id === user.studentId);
    renderStudentPage(student);
  }
});

logoutButton.addEventListener("click", () => {
  currentUser = null;
  selectedStudentForCounseling = null;
  showOnly(loginView);
  logoutButton.classList.add("hidden");
  userIdInput.focus();
});

function showOnly(targetView) {
  [loginView, studentView, adminView].forEach((view) => view.classList.add("hidden"));
  targetView.classList.remove("hidden");
}

function renderStudentPage(student) {
  if (!student) {
    loginMessage.textContent = "학생 정보를 찾을 수 없습니다.";
    showOnly(loginView);
    return;
  }

  studentView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Student</p>
        <h2>${student.name} 학생 페이지</h2>
        <p>로그인한 학생의 학습 현황을 확인합니다.</p>
      </div>
    </div>

    <div class="student-layout">
      <article class="student-profile">
        <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
        <div class="profile-body">
          <h3>${student.name}</h3>
          <p class="student-number">학번 ${student.id}</p>
          <div class="tag-row" aria-label="학습 키워드">
            <span class="tag">정보</span>
            <span class="tag">프로젝트</span>
          </div>
        </div>
      </article>

      <div class="content-stack">
        ${renderGrades(student.grades, false, "gradesTitle-" + student.id)}
        ${renderTraits(student)}
      </div>
    </div>
  `;

  showOnly(studentView);
  logoutButton.classList.remove("hidden");
}

function renderAdminDashboard() {
  adminView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Admin</p>
        <h2>관리자 대시보드</h2>
        <p>학생 3명의 학습 현황을 한 화면에서 비교합니다.</p>
      </div>
    </div>

    <section class="admin-grid" aria-label="전체 학생 정보">
      ${STUDENTS.map(renderStudentCard).join("")}
    </section>

    <section class="counseling-panel" aria-labelledby="counselingPanelTitle">
      <div class="counseling-panel-header">
        <p class="eyebrow">AI Assistant</p>
        <h3 id="counselingPanelTitle">AI 학생 상담 전략 도우미</h3>
        <p class="counseling-panel-desc">학생 카드의 "상담 전략 요청" 버튼을 눌러 학생을 선택하세요.</p>
      </div>

      <div id="counselingEmpty" class="counseling-empty-msg">
        <p>학생 카드에서 "상담 전략 요청" 버튼을 클릭하면 여기에 상담 전략 도우미가 표시됩니다.</p>
      </div>

      <div id="counselingContent" class="counseling-content hidden">
        <div id="counselingStudentInfo" class="counseling-selected-info"></div>

        <div class="counseling-form-group">
          <label class="counseling-label" for="teacherConcern">교사 고민 입력</label>
          <textarea
            id="teacherConcern"
            class="counseling-textarea"
            rows="4"
            placeholder="수업 참여는 좋은데 평가 결과가 낮습니다. 어떻게 상담하면 좋을까요?"
          ></textarea>
        </div>

        <div class="counseling-form-group">
          <p class="counseling-preview-label">전송 데이터 미리보기 <span class="counseling-preview-note">(이름·학번·사진 경로 제외)</span></p>
          <pre id="counselingPreview" class="counseling-preview-box"></pre>
        </div>

        <button id="counselingSubmit" class="primary-button" type="button">AI 상담 전략 받기</button>

        <div id="counselingLoading" class="counseling-loading hidden">AI가 상담 전략을 생성하는 중입니다...</div>
        <div id="counselingError" class="counseling-error-box hidden"></div>
        <div id="counselingResult" class="counseling-result-box hidden"></div>
      </div>

      <p class="counseling-disclaimer">
        AI 상담 전략은 참고용입니다. 최종 판단과 실제 상담은 교사가 학생의 상황을 종합적으로 고려하여 진행해야 합니다.
      </p>
    </section>
  `;

  showOnly(adminView);
  logoutButton.classList.remove("hidden");
  attachAdminEventListeners();
}

// adminView에 이벤트를 위임(delegation)하여 한 번만 등록합니다.
function attachAdminEventListeners() {
  if (adminListenersAttached) return;
  adminListenersAttached = true;

  adminView.addEventListener("click", (e) => {
    const requestBtn = e.target.closest(".counseling-request-btn");
    if (requestBtn) {
      const index = parseInt(requestBtn.dataset.studentIndex, 10);
      selectStudentForCounseling(index);
      return;
    }

    if (e.target.id === "counselingSubmit") {
      requestCounselingStrategy();
    }
  });

  adminView.addEventListener("input", (e) => {
    if (e.target.id === "teacherConcern") {
      updateCounselingPreview();
    }
  });
}

function selectStudentForCounseling(index) {
  const student = STUDENTS[index];
  const alias = STUDENT_ALIASES[index];
  selectedStudentForCounseling = { student, alias };

  const emptyEl = adminView.querySelector("#counselingEmpty");
  const contentEl = adminView.querySelector("#counselingContent");
  const studentInfoEl = adminView.querySelector("#counselingStudentInfo");
  const resultEl = adminView.querySelector("#counselingResult");
  const errorEl = adminView.querySelector("#counselingError");
  const loadingEl = adminView.querySelector("#counselingLoading");
  const textareaEl = adminView.querySelector("#teacherConcern");

  if (emptyEl) emptyEl.classList.add("hidden");
  if (contentEl) contentEl.classList.remove("hidden");

  if (studentInfoEl) {
    studentInfoEl.innerHTML =
      "<p><strong>선택된 학생:</strong> " +
      student.name +
      " (학번 " +
      student.id +
      ")</p>" +
      "<p class=\"counseling-alias-note\">Gemini 전송 시 익명 호칭: <strong>" +
      alias +
      "</strong> &mdash; 이름·학번·사진 경로는 전송하지 않습니다.</p>";
  }

  if (resultEl) {
    resultEl.textContent = "";
    resultEl.classList.add("hidden");
  }
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }
  if (loadingEl) loadingEl.classList.add("hidden");
  if (textareaEl) textareaEl.value = "";

  updateCounselingPreview();

  const panel = adminView.querySelector(".counseling-panel");
  if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildGradeSummary(grades) {
  return Object.entries(grades)
    .map(function (entry) { return entry[0] + ": " + entry[1]; })
    .join(", ");
}

function buildLearningTraits(student) {
  return student.traits.concat([student.teacherMemo]).join(" / ");
}

function updateCounselingPreview() {
  if (!selectedStudentForCounseling) return;

  const textareaEl = adminView.querySelector("#teacherConcern");
  const previewEl = adminView.querySelector("#counselingPreview");
  if (!previewEl) return;

  const { student, alias } = selectedStudentForCounseling;
  const payload = {
    studentAlias: alias,
    gradeSummary: buildGradeSummary(student.grades),
    learningTraits: buildLearningTraits(student),
    teacherConcern: (textareaEl && textareaEl.value.trim()) || "(아직 입력되지 않음)",
  };

  previewEl.textContent = JSON.stringify(payload, null, 2);
}

async function requestCounselingStrategy() {
  if (!selectedStudentForCounseling) return;

  const textareaEl = adminView.querySelector("#teacherConcern");
  const submitBtn = adminView.querySelector("#counselingSubmit");
  const loadingEl = adminView.querySelector("#counselingLoading");
  const errorEl = adminView.querySelector("#counselingError");
  const resultEl = adminView.querySelector("#counselingResult");

  const teacherConcern = textareaEl ? textareaEl.value.trim() : "";

  if (!teacherConcern) {
    if (errorEl) {
      errorEl.textContent = "상담 고민을 먼저 입력해주세요.";
      errorEl.classList.remove("hidden");
    }
    return;
  }

  const { student, alias } = selectedStudentForCounseling;
  const payload = {
    studentAlias: alias,
    gradeSummary: buildGradeSummary(student.grades),
    learningTraits: buildLearningTraits(student),
    teacherConcern: teacherConcern,
  };

  if (loadingEl) loadingEl.classList.remove("hidden");
  if (errorEl) { errorEl.textContent = ""; errorEl.classList.add("hidden"); }
  if (resultEl) { resultEl.textContent = ""; resultEl.classList.add("hidden"); }
  if (submitBtn) submitBtn.disabled = true;

  try {
    // Gemini API 호출은 /api/gemini-counseling Vercel Serverless Function에서 처리합니다.
    // 프론트엔드 코드에는 API 키를 절대 넣지 않습니다.
    const response = await fetch("/api/gemini-counseling", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.success) {
      if (resultEl) {
        resultEl.textContent = data.result;
        resultEl.classList.remove("hidden");
      }
    } else {
      throw new Error(data.error || "알 수 없는 오류");
    }
  } catch (_err) {
    if (errorEl) {
      errorEl.textContent =
        "AI 상담 전략을 불러오지 못했습니다. API 키 또는 Vercel 환경 변수를 확인해주세요.";
      errorEl.classList.remove("hidden");
    }
  } finally {
    if (loadingEl) loadingEl.classList.add("hidden");
    if (submitBtn) submitBtn.disabled = false;
  }
}

function renderStudentCard(student, index) {
  return (
    '<article class="student-card">' +
    '<img class="student-photo" src="' + student.photo + '" alt="' + student.name + ' 학생 사진" />' +
    '<div class="student-card-body">' +
    "<h3>" + student.name + "</h3>" +
    '<p class="student-number">학번 ' + student.id + "</p>" +
    renderGrades(student.grades, true, "gradesTitle-" + student.id) +
    renderTraits(student) +
    '<button class="counseling-request-btn ghost-button" data-student-index="' + index + '" type="button">상담 전략 요청</button>' +
    "</div>" +
    "</article>"
  );
}

function renderGrades(grades, compact, headingId) {
  if (headingId === undefined) headingId = "gradesTitle";
  if (compact === undefined) compact = false;

  const rows = Object.entries(grades)
    .map(function (entry) {
      return "<tr><th scope=\"row\">" + entry[0] + "</th><td>" + entry[1] + "</td></tr>";
    })
    .join("");

  return (
    '<section aria-labelledby="' + headingId + '">' +
    '<div class="section-title">' +
    '<h3 id="' + headingId + '">성적 정보</h3>' +
    "</div>" +
    '<table class="grade-table' + (compact ? " compact-table" : "") + '">' +
    "<tbody>" + rows + "</tbody>" +
    "</table>" +
    "</section>"
  );
}

function renderTraits(student) {
  const items = student.traits.concat([student.teacherMemo])
    .map(function (text) { return "<li>" + text + "</li>"; })
    .join("");

  return (
    '<section aria-labelledby="traitsTitle-' + student.id + '">' +
    '<div class="section-title">' +
    '<h3 id="traitsTitle-' + student.id + '">학습 특성 및 교사 메모</h3>' +
    "</div>" +
    '<ul class="memo-list">' + items + "</ul>" +
    "</section>"
  );
}

showOnly(loginView);
