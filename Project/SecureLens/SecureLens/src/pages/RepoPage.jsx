import { useState } from "react";
import { useAnalysisStore } from "../store/analysisStore";

export default function RepoPage() {
  const store = useAnalysisStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePdfDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      alert(`${store.projectName || "SecureLens"}_보안진단_리포트.pdf 다운로드가 준비되었습니다.`);
    }, 900);
  };

  return (
    <section style={styles.page}>
      <div style={styles.toolbar}>
        <span style={styles.toolbarText}>AI 상세 분석 리포트 미리보기</span>
        <button type="button" onClick={handlePdfDownload} disabled={isDownloading} style={styles.downloadButton}>
          {isDownloading ? "PDF 생성 중..." : "PDF 다운로드"}
        </button>
      </div>

      <article style={styles.report}>
        <header style={styles.reportHeader}>
          <h1 style={styles.reportTitle}>SecureLens 보안 취약점 AI 분석 리포트</h1>
          <p style={styles.reportMeta}>Report ID: {store.generatedReportId || "SCAN-PENDING"}</p>
        </header>

        <section style={styles.section}>
          <h2>1. 프로젝트 개요</h2>
          <table style={styles.table}>
            <tbody>
              <tr>
                <th>저장소</th>
                <td>{store.projectName || "-"}</td>
              </tr>
              <tr>
                <th>언어 / 프레임워크</th>
                <td>
                  {store.targetLanguage} / {store.targetFramework}
                </td>
              </tr>
              <tr>
                <th>분석 브랜치</th>
                <td>{store.targetBranch}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section style={styles.section}>
          <h2>2. AI 종합 평가</h2>
          <p>
            최초 탐지된 취약점 2건 중 1건은 프레임워크 보안 설정을 근거로 오탐 처리되었습니다.
            남은 CWE-89 SQL Injection 항목은 파라미터 바인딩 적용이 필요합니다.
          </p>
          <p>
            {store.isVulnerabilityFixed
              ? "재분석 결과 남은 위험 경로가 해소되어 배포 가능한 상태로 평가됩니다."
              : "조치 후 재분석을 실행하면 최종 보안 상태가 갱신됩니다."}
          </p>
        </section>
      </article>
    </section>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", gap: "18px" },
  toolbar: {
    maxWidth: "860px",
    width: "100%",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toolbarText: { color: "#94a3b8", fontSize: "13px", fontWeight: "800" },
  downloadButton: {
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#10b981",
    color: "#fff",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: "900",
  },
  report: {
    maxWidth: "860px",
    width: "100%",
    margin: "0 auto",
    backgroundColor: "#fff",
    color: "#1e293b",
    borderRadius: "10px",
    padding: "46px",
    boxSizing: "border-box",
  },
  reportHeader: {
    borderBottom: "2px solid #1e293b",
    paddingBottom: "18px",
    marginBottom: "26px",
    textAlign: "center",
  },
  reportTitle: { margin: 0, fontSize: "25px" },
  reportMeta: { margin: "8px 0 0", color: "#64748b", fontSize: "12px" },
  section: { marginBottom: "24px", lineHeight: 1.65 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
};
