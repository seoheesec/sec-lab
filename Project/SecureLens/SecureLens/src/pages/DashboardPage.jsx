import { useAnalysisStore } from "../store/analysisStore";

export default function DashboardPage({ onNavigate }) {
  const store = useAnalysisStore();

  if (!store.isComplete) {
    return (
      <section style={styles.empty}>
        완료된 분석 결과가 없습니다. 저장소 분석 탭에서 먼저 진단을 실행해 주세요.
      </section>
    );
  }

  const openCount = store.isVulnerabilityFixed ? 0 : 1;

  return (
    <section style={styles.page}>
      <div style={styles.statsGrid}>
        <StatCard label="최초 탐지" value="2" color="#f87171" />
        <StatCard label="AI 오탐 제거" value="1" color="#60a5fa" />
        <StatCard label="조치 대기" value={openCount} color={openCount ? "#f59e0b" : "#34d399"} />
        <StatCard label="보안 점수" value={store.isVulnerabilityFixed ? "96" : "74"} color="#34d399" />
      </div>

      <div style={styles.panel}>
        <h2 style={styles.panelTitle}>분석 완료 프로젝트</h2>
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span>프로젝트</span>
            <span>언어</span>
            <span>브랜치</span>
            <span>상태</span>
            <span />
          </div>
          <div style={styles.tableRow}>
            <span style={styles.projectName}>{store.projectName}</span>
            <span>{store.targetLanguage}</span>
            <span>{store.targetBranch}</span>
            <span style={{ color: store.isVulnerabilityFixed ? "#34d399" : "#f59e0b" }}>
              {store.isVulnerabilityFixed ? "조치 완료" : "조치 필요"}
            </span>
            <button type="button" onClick={() => onNavigate("detail")} style={styles.actionButton}>
              상세 보기
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <strong style={{ ...styles.statValue, color }}>{value}</strong>
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", gap: "22px" },
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
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "16px",
  },
  statCard: {
    backgroundColor: "#111827",
    border: "1px solid #263244",
    borderRadius: "12px",
    padding: "18px",
  },
  statLabel: { color: "#94a3b8", fontSize: "13px", fontWeight: "800" },
  statValue: { display: "block", marginTop: "8px", fontSize: "30px" },
  panel: {
    backgroundColor: "#111827",
    border: "1px solid #263244",
    borderRadius: "12px",
    padding: "20px",
  },
  panelTitle: { margin: "0 0 16px", fontSize: "18px", color: "#f8fafc" },
  table: { border: "1px solid #263244", borderRadius: "9px", overflow: "hidden" },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 110px",
    gap: "12px",
    padding: "12px 14px",
    backgroundColor: "#172033",
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: "900",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 110px",
    gap: "12px",
    alignItems: "center",
    padding: "14px",
    color: "#cbd5e1",
  },
  projectName: { color: "#60a5fa", fontWeight: "900" },
  actionButton: {
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    borderRadius: "7px",
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: "800",
  },
};
