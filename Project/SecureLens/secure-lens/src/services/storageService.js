const USERS_KEY = "secureLensUsers";
const SESSION_KEY = "secureLensSession";
const PROJECT_KEY = "secureLensProject";
const AI_RESULTS_KEY = "aiResults";
const STATIC_RESULTS_KEY = "secureLensStaticResults";
const REVIEW_RESULTS_KEY = "secureLensFalsePositiveResults";
const SCAN_HISTORY_KEY = "secureLensScanHistory";
const GITHUB_CONNECT_STATE_KEY = "secureLensGitHubConnectState";
const FALSE_POSITIVE_FEEDBACK_KEY = "secureLensFalsePositiveFeedback";
export const SECURE_LENS_STORAGE_EVENT = "secureLensStorageChanged";

// 분석 결과와 히스토리는 계정별로 분리해야 합니다.
// 예: secureLensScanHistory:admin, secureLensScanHistory:user1
// 반면 사용자 목록과 로그인 세션은 앱 전체에서 공통으로 사용합니다.
const USER_SCOPED_KEYS = new Set([
  PROJECT_KEY,
  AI_RESULTS_KEY,
  STATIC_RESULTS_KEY,
  REVIEW_RESULTS_KEY,
  SCAN_HISTORY_KEY,
  GITHUB_CONNECT_STATE_KEY,
  FALSE_POSITIVE_FEEDBACK_KEY,
]);

function getActiveUserId() {
  const session = readJson(SESSION_KEY, null);

  return session?.user?.id || "guest";
}

// LocalStorage에 실제로 저장할 key를 결정합니다.
// 분석 데이터라면 현재 로그인한 사용자 ID를 뒤에 붙여 계정별 저장소처럼 사용합니다.
function getStorageKey(key) {
  if (!USER_SCOPED_KEYS.has(key)) return key;

  return `${key}:${getActiveUserId()}`;
}

// JSON 데이터를 안전하게 읽습니다. 값이 없거나 깨져 있으면 fallback 값을 반환합니다.
function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(getStorageKey(key));
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

// JSON 데이터를 저장하고, 다른 화면이 즉시 새로고침될 수 있도록 커스텀 이벤트를 발생시킵니다.
function writeJson(key, value) {
  const storageKey = getStorageKey(key);

  localStorage.setItem(storageKey, JSON.stringify(value));
  window.dispatchEvent(
    new CustomEvent(SECURE_LENS_STORAGE_EVENT, {
      detail: { key, storageKey },
    }),
  );
}

export function getUsers() {
  return readJson(USERS_KEY, []);
}

export function saveUsers(users) {
  writeJson(USERS_KEY, users);
}

export function getSession() {
  return readJson(SESSION_KEY, null);
}

export function saveSession(session) {
  writeJson(SESSION_KEY, session);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  notifyStorageChanged(SESSION_KEY);
}

export function notifyStorageChanged(key) {
  window.dispatchEvent(
    new CustomEvent(SECURE_LENS_STORAGE_EVENT, {
      detail: { key },
    }),
  );
}

export function saveProject(project) {
  writeJson(PROJECT_KEY, project);
}

export function getProject() {
  return readJson(PROJECT_KEY, null);
}

export function saveStaticResults(results) {
  writeJson(STATIC_RESULTS_KEY, results);
}

export function getStaticResults() {
  return readJson(STATIC_RESULTS_KEY, []);
}

export function saveAiResults(results) {
  writeJson(AI_RESULTS_KEY, results);
}

export function getAiResults() {
  return readJson(AI_RESULTS_KEY, []);
}

export function saveFalsePositiveResults(results) {
  writeJson(REVIEW_RESULTS_KEY, results);
}

export function getFalsePositiveResults() {
  return readJson(REVIEW_RESULTS_KEY, []);
}

function buildFeedbackId(vulnerability) {
  return [
    vulnerability.id || "",
    vulnerability.type || "Unknown",
    vulnerability.filePath || vulnerability.fileName || "Unknown",
    vulnerability.line || "0",
    vulnerability.cwe || "",
    vulnerability.severity || "",
    vulnerability.code || "",
    vulnerability.attackPath || "",
    vulnerability.reason || "",
  ].join("|");
}

// 사용자가 특정 취약점을 오탐으로 신고했는지 구분하기 위한 고유 ID를 만듭니다.
// 파일, 줄 번호, 취약점 종류, 코드 일부를 함께 사용해 서로 다른 취약점이 섞이지 않게 합니다.
export function getFalsePositiveFeedbackId(vulnerability) {
  return buildFeedbackId(vulnerability);
}

export function getFalsePositiveFeedback() {
  return readJson(FALSE_POSITIVE_FEEDBACK_KEY, []);
}

export function hasFalsePositiveFeedback(vulnerability) {
  const feedbackId = buildFeedbackId(vulnerability);

  return getFalsePositiveFeedback().some((item) => item.feedbackId === feedbackId);
}

export function saveFalsePositiveFeedback(vulnerability) {
  const feedbackId = buildFeedbackId(vulnerability);
  const feedback = getFalsePositiveFeedback();

  if (feedback.some((item) => item.feedbackId === feedbackId)) {
    return feedback;
  }

  const nextFeedback = [
    ...feedback,
    {
      feedbackId,
      type: vulnerability.type,
      filePath: vulnerability.filePath || vulnerability.fileName,
      line: vulnerability.line,
      severity: vulnerability.severity,
      code: vulnerability.code,
      reportedAt: new Date().toISOString(),
      reason: "사용자가 오탐으로 신고했습니다.",
    },
  ];

  writeJson(FALSE_POSITIVE_FEEDBACK_KEY, nextFeedback);

  return nextFeedback;
}

// GitHub Connect 화면 상태를 저장해 두면 다른 화면에 갔다가 돌아와도 입력값과 결과가 유지됩니다.
export function saveGithubConnectState(state) {
  writeJson(GITHUB_CONNECT_STATE_KEY, state);
}

export function getGithubConnectState() {
  return readJson(GITHUB_CONNECT_STATE_KEY, null);
}

export function clearGithubConnectState() {
  localStorage.removeItem(getStorageKey(GITHUB_CONNECT_STATE_KEY));
  notifyStorageChanged(GITHUB_CONNECT_STATE_KEY);
}

export function getScanHistoryRecords() {
  return readJson(SCAN_HISTORY_KEY, []);
}

export function saveScanHistoryRecords(history) {
  writeJson(SCAN_HISTORY_KEY, history);
}

export function clearScanHistoryRecords() {
  localStorage.removeItem(getStorageKey(SCAN_HISTORY_KEY));
  notifyStorageChanged(SCAN_HISTORY_KEY);
}

// 현재 로그인 계정의 분석 관련 데이터만 삭제합니다.
// 이전 버전에서 전역 key로 저장된 데이터가 남아 있을 수 있어 전역 key도 함께 정리합니다.
export function clearAnalysisData() {
  [
    PROJECT_KEY,
    AI_RESULTS_KEY,
    STATIC_RESULTS_KEY,
    REVIEW_RESULTS_KEY,
    SCAN_HISTORY_KEY,
    GITHUB_CONNECT_STATE_KEY,
    FALSE_POSITIVE_FEEDBACK_KEY,
  ].forEach((key) => {
    localStorage.removeItem(getStorageKey(key));
    localStorage.removeItem(key);
  });

  notifyStorageChanged("analysisData");
}
