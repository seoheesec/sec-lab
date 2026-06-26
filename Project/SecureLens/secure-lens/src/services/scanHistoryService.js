import {
  clearScanHistoryRecords,
  getProject,
  getScanHistoryRecords,
  saveScanHistoryRecords,
} from "./storageService";

function readScanHistory() {
  return getScanHistoryRecords();
}

function writeScanHistory(history) {
  saveScanHistoryRecords(history);
}

function normalizeSeverity(severity) {
  const normalized = String(severity || "").toLowerCase();

  if (normalized === "high" || normalized === "high risk") return "High";
  if (normalized === "medium" || normalized === "medium risk") return "Medium";
  if (normalized === "low" || normalized === "low risk") return "Low";

  return severity || "Unknown";
}

function normalizeVulnerability(vulnerability, index) {
  const id =
    vulnerability.id ||
    `${vulnerability.type || "VULN"}-${vulnerability.filePath || "file"}-${vulnerability.line || index + 1}`;

  return {
    ...vulnerability,
    id,
    type: vulnerability.type || "Unknown",
    severity: normalizeSeverity(vulnerability.severity),
  };
}

function buildSeverityCounts(vulnerabilities = []) {
  return vulnerabilities.reduce(
    (counts, vulnerability) => {
      const severity = normalizeSeverity(vulnerability.severity);
      counts[severity] = (counts[severity] || 0) + 1;
      return counts;
    },
    { High: 0, Medium: 0, Low: 0 },
  );
}

function calculateSecurityScore(vulnerabilities = []) {
  const counts = buildSeverityCounts(vulnerabilities);

  return Math.max(
    0,
    100 - (counts.High || 0) * 20 - (counts.Medium || 0) * 10 - (counts.Low || 0) * 5,
  );
}

// 화면에 보여줄 검사일을 YYYY-MM-DD HH:mm 형식으로 맞춥니다.
export function formatScanDate(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function getScanHistory() {
  return readScanHistory();
}

export function clearScanHistory() {
  clearScanHistoryRecords();
}

// 하나의 검사 결과를 마이페이지 히스토리에 저장하기 좋은 형태로 정리합니다.
// 취약점 목록뿐 아니라 위험도 통계, 보안 점수, 당시 프로젝트 정보도 함께 담습니다.
export function createScanRecord({ scanId, fileName, scanDate, vulnerabilities }) {
  const normalizedVulnerabilities = (vulnerabilities || []).map(normalizeVulnerability);

  return {
    scanId: scanId || crypto.randomUUID(),
    fileName: fileName || "Unknown File",
    scanDate: scanDate || formatScanDate(),
    vulnerabilities: normalizedVulnerabilities,
    severityCounts: buildSeverityCounts(normalizedVulnerabilities),
    securityScore: calculateSecurityScore(normalizedVulnerabilities),
    falsePositiveCount: 0,
    projectSnapshot: getProject(),
  };
}

// 새 검사 결과를 저장하면서, 직전 검사와 비교해 고친 취약점을 계산합니다.
export function compareAndSaveScan(newScanData) {
  const history = readScanHistory();
  const currentScan = createScanRecord(newScanData);

  // 같은 파일명으로 수행된 검사 중 가장 최근 기록을 찾습니다.
  const previousScan = [...history]
    .reverse()
    .find((scan) => scan.fileName === currentScan.fileName);

  const currentIds = new Set(
    currentScan.vulnerabilities.map((vulnerability) => vulnerability.id),
  );

  // 이전 검사에는 있었지만 이번 검사에는 없는 항목을 고친 취약점으로 봅니다.
  const fixedVulnerabilities = previousScan
    ? previousScan.vulnerabilities.filter(
        (vulnerability) => !currentIds.has(vulnerability.id),
      )
    : [];

  const scanWithRemediation = {
    ...currentScan,
    fixedCount: fixedVulnerabilities.length,
    fixedVulnerabilities,
  };

  const nextHistory = [...history, scanWithRemediation];
  writeScanHistory(nextHistory);

  return {
    currentScan: scanWithRemediation,
    previousScan,
    fixedCount: fixedVulnerabilities.length,
    fixedVulnerabilities,
    history: nextHistory,
  };
}

// 마이페이지 상단 통계 카드에 들어갈 누적 값을 계산합니다.
export function buildScanStats(history = readScanHistory()) {
  return history.reduce(
    (stats, scan) => {
      stats.totalScans += 1;
      stats.totalVulnerabilities += scan.vulnerabilities.length;
      stats.totalFixed += scan.fixedCount || 0;
      stats.totalFalsePositives += scan.falsePositiveCount || 0;

      scan.vulnerabilities.forEach((vulnerability) => {
        const severity = normalizeSeverity(vulnerability.severity);
        stats.severityCounts[severity] = (stats.severityCounts[severity] || 0) + 1;
      });

      return stats;
    },
    {
      totalScans: 0,
      totalVulnerabilities: 0,
      totalFixed: 0,
      totalFalsePositives: 0,
      severityCounts: {
        High: 0,
        Medium: 0,
        Low: 0,
      },
    },
  );
}

// 정적 분석 또는 GitHub 분석 결과를 히스토리에 새 기록으로 저장합니다.
export function saveScanFromFindings({ fileName, vulnerabilities }) {
  return compareAndSaveScan({
    fileName,
    vulnerabilities: (vulnerabilities || []).map((vulnerability, index) => ({
      ...vulnerability,
      id:
        vulnerability.id ||
        `${vulnerability.type || "VULN"}-${vulnerability.filePath || fileName}-${vulnerability.line || index + 1}`,
    })),
  });
}

// 오탐 검토가 끝난 뒤, 방금 저장한 최신 검사 기록을 최종 결과 기준으로 업데이트합니다.
// 그래서 Dashboard와 My Page의 취약점 수가 서로 다르게 보이지 않게 됩니다.
export function updateLatestScanFromFindings({
  fileName,
  vulnerabilities,
  falsePositiveCount = 0,
}) {
  const history = readScanHistory();
  const targetFileName = fileName || getProject()?.name || "Unknown File";
  const latestIndex = history
    .map((scan, index) => ({ scan, index }))
    .reverse()
    .find(({ scan }) => scan.fileName === targetFileName)?.index;

  if (latestIndex === undefined) {
    return saveScanFromFindings({
      fileName: targetFileName,
      vulnerabilities,
    });
  }

  const normalizedVulnerabilities = (vulnerabilities || []).map(normalizeVulnerability);
  const updatedScan = {
    ...history[latestIndex],
    vulnerabilities: normalizedVulnerabilities,
    severityCounts: buildSeverityCounts(normalizedVulnerabilities),
    securityScore: calculateSecurityScore(normalizedVulnerabilities),
    falsePositiveCount,
    projectSnapshot: getProject(),
  };
  const nextHistory = history.map((scan, index) =>
    index === latestIndex ? updatedScan : scan,
  );

  writeScanHistory(nextHistory);

  return {
    currentScan: updatedScan,
    history: nextHistory,
  };
}
