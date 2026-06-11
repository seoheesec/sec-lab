import { useAnalysisStore } from "../../../store/analysisStore";
import { useAuthStore } from "../../../store/authStore";

export default function MyPage() {
  const user = useAuthStore((state) => state.user);
  const githubUser = useAuthStore((state) => state.githubUser);
  const isGithubConnected = useAuthStore((state) => state.isGithubConnected);
  const analyzedProjects = useAuthStore((state) => state.analyzedProjects);
  const analysis = useAnalysisStore();

  const projects = [...analyzedProjects];
  const hasCurrentProject =
    analysis.isComplete &&
    analysis.generatedReportId &&
    !projects.some((project) => project.id === analysis.generatedReportId);

  if (hasCurrentProject) {
    projects.unshift({
      id: analysis.generatedReportId,
      projectName: analysis.projectName,
      date: new Date().toISOString().split("T")[0],
      status: "검사 완료",
      targetLang: analysis.targetLanguage,
      totalDetected: 2,
      cleanedCount: analysis.isVulnerabilityFixed ? 2 : 1,
    });
  }

  const totalScans = projects.length;
  const totalDetected = projects.reduce(
    (sum, project) => sum + (project.totalDetected || 0),
    0,
  );
  const totalResolved = projects.reduce(
    (sum, project) => sum + (project.cleanedCount || 0),
    0,
  );
  const totalRemaining = Math.max(totalDetected - totalResolved, 0);
  const resolveRate = totalDetected
    ? Math.round((totalResolved / totalDetected) * 100)
    : 0;

  return (
    <section style={styles.page}>
      <div style={styles.profilePanel}>
        <div style={styles.avatar}>SL</div>
        <div>
          <h2 style={styles.title}>{user?.id || "Admin"}</h2>
          <p style={styles.subtitle}>SecureLens 보안 분석 계정</p>
        </div>
        <div style={styles.profileMeta}>
          <span>GitHub</span>
          <strong style={{ color: isGithubConnected ? "#34d399" : "#f87171" }}>
            {isGithubConnected ? githubUser?.name || "connected" : "not connected"}
          </strong>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <StatCard label="총 검사 수" value={totalScans} color="#60a5fa" />
        <StatCard label="발견 취약점" value={totalDetected} color="#f87171" />
        <StatCard label="해결 취약점" value={totalResolved} color="#34d399" />
        <StatCard label="남은 취약점" value={totalRemaining} color="#f59e0b" />
        <StatCard label="해결률" value={`${resolveRate}%`} color="#a78bfa" />
      </div>

      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <h3 style={styles.panelTitle}>최근 검사 이력</h3>
          <span style={styles.badge}>누적 {totalScans}건</span>
        </div>

        {projects.length === 0 ? (
          <div style={styles.emptyState}>아직 완료된 검사 이력이 없습니다.</div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>검사 ID</span>
              <span>프로젝트</span>
              <span>언어</span>
              <span>발견</span>
              <span>해결</span>
              <span>남음</span>
            </div>
            {projects.map((project) => {
              const detected = project.totalDetected || 0;
              const resolved = project.cleanedCount || 0;
              const remaining = Math.max(detected - resolved, 0);

              return (
                <div key={project.id} style={styles.tableRow}>
                  <span style={styles.mono}>{project.id}</span>
                  <span style={styles.projectName}>{project.projectName}</span>
                  <span>{project.targetLang}</span>
                  <span style={{ color: "#f87171" }}>{detected}</span>
                  <span style={{ color: "#34d399" }}>{resolved}</span>
                  <span style={{ color: remaining ? "#f59e0b" : "#34d399" }}>
                    {remaining}
                  </span>
                </div>
              );
            })}
          </div>
        )}
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
  page: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  profilePanel: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    backgroundColor: "#111827",
    border: "1px solid #263244",
    borderRadius: "12px",
    padding: "20px",
  },
  avatar: {
    width: "52px",
    height: "52px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: "900",
  },
  title: { margin: "0 0 4px", color: "#f8fafc", fontSize: "22px" },
  subtitle: { margin: 0, color: "#94a3b8", fontSize: "13px" },
  profileMeta: {
    marginLeft: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    color: "#94a3b8",
    fontSize: "13px",
    textAlign: "right",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: "14px",
  },
  statCard: {
    backgroundColor: "#111827",
    border: "1px solid #263244",
    borderRadius: "12px",
    padding: "18px",
  },
  statLabel: {
    display: "block",
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: "800",
  },
  statValue: {
    display: "block",
    marginTop: "8px",
    fontSize: "28px",
  },
  panel: {
    backgroundColor: "#111827",
    border: "1px solid #263244",
    borderRadius: "12px",
    padding: "20px",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  panelTitle: {
    margin: 0,
    color: "#f8fafc",
    fontSize: "17px",
  },
  badge: {
    color: "#93c5fd",
    backgroundColor: "rgba(59,130,246,0.14)",
    border: "1px solid rgba(59,130,246,0.3)",
    borderRadius: "7px",
    padding: "5px 9px",
    fontSize: "12px",
    fontWeight: "800",
  },
  emptyState: {
    minHeight: "150px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    border: "1px dashed #334155",
    borderRadius: "10px",
  },
  table: {
    border: "1px solid #263244",
    borderRadius: "10px",
    overflow: "hidden",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "120px 2fr 1fr 80px 80px 80px",
    gap: "12px",
    padding: "12px 14px",
    backgroundColor: "#172033",
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: "900",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "120px 2fr 1fr 80px 80px 80px",
    gap: "12px",
    padding: "13px 14px",
    borderTop: "1px solid #263244",
    color: "#cbd5e1",
    fontSize: "13px",
    alignItems: "center",
  },
  mono: {
    fontFamily: "Consolas, monospace",
    color: "#60a5fa",
  },
  projectName: {
    color: "#f8fafc",
    fontWeight: "800",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
