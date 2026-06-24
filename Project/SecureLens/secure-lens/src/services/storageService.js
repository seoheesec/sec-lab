const USERS_KEY = "secureLensUsers";
const SESSION_KEY = "secureLensSession";
const PROJECT_KEY = "secureLensProject";
const AI_RESULTS_KEY = "aiResults";
const STATIC_RESULTS_KEY = "secureLensStaticResults";
const REVIEW_RESULTS_KEY = "secureLensFalsePositiveResults";

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
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
