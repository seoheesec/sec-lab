import { getAnalysisDetail } from "../analysis/analysisApi";
import { isMockApi, request } from "../../services/apiClient";

export async function getDashboardSummary(scanId, options = {}) {
  if (!isMockApi()) return request(`/dashboard/${scanId}`);

  const detail = await getAnalysisDetail(scanId, options);
  const { vulnerabilities } = detail;
  const openItems = vulnerabilities.filter((item) => item.status === "open");
  const score = Math.max(100 - openItems.length * 26, 0);

  return {
    scanId,
    score,
    severityCounts: vulnerabilities.reduce((acc, item) => {
      acc[item.severity] = (acc[item.severity] || 0) + 1;
      return acc;
    }, {}),
    summary: detail.summary,
    vulnerabilities,
  };
}
