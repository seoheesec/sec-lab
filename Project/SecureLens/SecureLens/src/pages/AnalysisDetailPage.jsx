import { useState } from "react";
import { useAnalysisStore } from "../store/analysisStore";
import { useAuthStore } from "../store/authStore";

export default function AnalysisDetailPage({ onNavigate }) {
  const store = useAnalysisStore();
  const addAnalyzedProject = useAuthStore((state) => state.addAnalyzedProject);
  const [activeTab, setActiveTab] = useState("flow");

  if (!store.selectedRepo) {
    return <section style={styles.empty}>선택된 분석 대상이 없습니다.</section>;
  }

  return (
    <section style={styles.page}>
      <div style={styles.header}>
        <div>
          <span style={styles.eyebrow}>PROJECT SECURITY TRACKING</span>
          <h2 style={styles.title}>{store.projectName} 상세 분석 콘솔</h2>
        </div>
        <div style={styles.actions}>
          <button
            type="button"
            onClick={() => store.startAnalysisPipeline(true, addAnalyzedProject)}
            disabled={store.isScanning}
            style={styles.warningButton}
          >
            {store.isScanning ? "재분석 중..." : "수정 반영 후 재분석"}
          </button>
          <button type="button" onClick={() => onNavigate("report")} style={styles.secondaryButton}>
            리포트 보기
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.panel}>
          <div style={styles.vulnHeader}>
            <strong style={styles.dangerText}>CWE-89 SQL Injection</strong>
            <span style={{
              ...styles.badge,
              color: store.isVulnerabilityFixed ? "#34d399" : "#f59e0b",
              backgroundColor: store.isVulnerabilityFixed ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
            }}>
              {store.isVulnerabilityFixed ? "RESOLVED" : "PATCH REQUIRED"}
            </span>
          </div>

          <p style={styles.description}>
            사용자 입력값이 검증 없이 SQL 쿼리 문자열에 결합되어 데이터베이스 명령으로 전달되는 경로가 탐지되었습니다.
            Prepared Statement 또는 ORM 파라미터 바인딩으로 쿼리 구조와 입력값을 분리해야 합니다.
          </p>

          <div style={styles.tabs}>
            <button
              type="button"
              onClick={() => setActiveTab("flow")}
              style={activeTab === "flow" ? styles.activeTab : styles.tab}
            >
              Source-to-Sink 추적
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("guide")}
              style={activeTab === "guide" ? styles.activeTab : styles.tab}
            >
              조치 가이드
            </button>
          </div>

          {activeTab === "flow" ? (
            <div style={styles.codeBox}>
              {store.isVulnerabilityFixed ? (
                <p style={styles.successText}>파라미터 바인딩 적용 후 위험 경로가 해소되었습니다.</p>
              ) : (
                <>
                  <p>[1] controller/apiGateway.handler: 사용자 입력 수집</p>
                  <p>[2] service/queryBuilder.internal: 문자열 쿼리 조립</p>
                  <p>[3] database/connector.executeRaw: 위험 Sink 호출</p>
                </>
              )}
            </div>
          ) : (
            <ol style={styles.guideList}>
              <li>문자열 결합 방식으로 SQL Query를 만들지 않습니다.</li>
              <li>Prepared Statement 또는 ORM의 파라미터 바인딩을 사용합니다.</li>
              <li>입력값 검증과 권한별 데이터 접근 제한을 함께 적용합니다.</li>
            </ol>
          )}
        </div>

        <aside style={styles.panel}>
          <h3 style={styles.sideTitle}>AI 오탐 검토</h3>
          <p style={styles.description}>
            CWE-79 XSS 후보는 프레임워크의 HTML escape 체인과 보안 미들웨어가 활성화되어 있어 오탐으로 분류되었습니다.
          </p>
          <div style={styles.metricBox}>
            <span>탐지 취약점</span>
            <strong>2</strong>
          </div>
          <div style={styles.metricBox}>
            <span>오탐 제거</span>
            <strong>1</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", gap: "20px" },
  empty: {
    minHeight: "420px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    backgroundColor: "#111827",
    border: "1px dashed #334155",
    borderRadius: "12px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    borderBottom: "1px solid #263244",
    paddingBottom: "16px",
  },
  eyebrow: { color: "#60a5fa", fontSize: "12px", fontWeight: "900" },
  title: { margin: "5px 0 0", color: "#f8fafc", fontSize: "21px" },
  actions: { display: "flex", gap: "10px" },
  warningButton: {
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#d97706",
    color: "#fff",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: "900",
  },
  secondaryButton: {
    border: "1px solid #334155",
    borderRadius: "8px",
    backgroundColor: "#172033",
    color: "#fff",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: "800",
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" },
  panel: {
    backgroundColor: "#111827",
    border: "1px solid #263244",
    borderRadius: "12px",
    padding: "20px",
  },
  vulnHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #263244",
    paddingBottom: "12px",
    marginBottom: "14px",
  },
  dangerText: { color: "#f87171" },
  badge: { padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "900" },
  description: { color: "#94a3b8", fontSize: "13px", lineHeight: 1.65 },
  tabs: { display: "flex", gap: "8px", margin: "18px 0 12px" },
  tab: {
    border: "1px solid #334155",
    backgroundColor: "#0b0f19",
    color: "#94a3b8",
    borderRadius: "7px",
    padding: "8px 12px",
    cursor: "pointer",
  },
  activeTab: {
    border: "1px solid #3b82f6",
    backgroundColor: "rgba(59,130,246,0.14)",
    color: "#93c5fd",
    borderRadius: "7px",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: "900",
  },
  codeBox: {
    backgroundColor: "#0b0f19",
    border: "1px solid #263244",
    borderRadius: "9px",
    padding: "15px",
    color: "#fca5a5",
    fontFamily: "Consolas, monospace",
    fontSize: "13px",
  },
  successText: { color: "#34d399", margin: 0, fontWeight: "900" },
  guideList: { color: "#cbd5e1", lineHeight: 1.75 },
  sideTitle: { margin: "0 0 10px", color: "#60a5fa", fontSize: "16px" },
  metricBox: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "12px",
    padding: "12px",
    backgroundColor: "#0b0f19",
    borderRadius: "8px",
    color: "#cbd5e1",
  },
};
