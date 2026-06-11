import { getAnalysisDetail } from "../analysis/analysisApi";
import { isMockApi, request } from "../../services/apiClient";

export async function getReport(scanId, options = {}) {
  if (!isMockApi()) return request(`/reports/${scanId}`);

  const detail = await getAnalysisDetail(scanId, options);
  return {
    scanId,
    aiSummary:
      detail.summary.openCount === 0
        ? "재분석 결과 주요 위험 경로가 해소되어 배포 가능한 수준으로 평가됩니다."
        : "오탐 후보는 제거되었지만 SQL Injection 위험 경로 1건은 우선 조치가 필요합니다.",
    vulnerabilities: detail.vulnerabilities,
    summary: detail.summary,
  };
}

export async function downloadReportPdf(scanId) {
  if (!isMockApi()) return request(`/reports/${scanId}/download`);

  return {
    fileName: `${scanId}_SecureLens_Report.pdf`,
    message: "PDF 다운로드가 준비되었습니다.",
  };
}
