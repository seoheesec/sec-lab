import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useAnalysisStore } from "../store/analysisStore";

const mockRepositories = [
  {
    id: 1,
    name: "enterprise-spring-backend",
    description: "금융권 표준 아키텍처 기반 Java Spring Boot 백엔드",
    defaultLang: "JAVA",
    visibility: "Private",
  },
  {
    id: 2,
    name: "secure-lens-frontend",
    description: "React와 Zustand 기반 보안 분석 플랫폼 프론트엔드",
    defaultLang: "JS",
    visibility: "Public",
  },
  {
    id: 3,
    name: "ai-code-scanner-core",
    description: "LLM 기반 정적 분석과 Source-to-Sink 추적 엔진",
    defaultLang: "PYTHON",
    visibility: "Private",
  },
  {
    id: 4,
    name: "high-perf-go-crawler",
    description: "대규모 저장소 수집을 위한 Go 기반 크롤러",
    defaultLang: "GO",
    visibility: "Public",
  },
];

const languageOptions = [
  ["JAVA", "Java / Spring"],
  ["JS", "JavaScript / TypeScript"],
  ["PYTHON", "Python / FastAPI"],
  ["GO", "Go / Gin"],
  ["CPP", "C / C++"],
  ["RUST", "Rust"],
  ["PHP", "PHP / Laravel"],
  ["RUBY", "Ruby / Rails"],
  ["KOTLIN", "Kotlin / Mobile"],
];

export default function RepoSelectPage({ onNavigate }) {
  const isGithubConnected = useAuthStore((state) => state.isGithubConnected);
  const setGithubConnection = useAuthStore((state) => state.setGithubConnection);
  const addAnalyzedProject = useAuthStore((state) => state.addAnalyzedProject);
  const store = useAnalysisStore();

  const [tokenInput, setTokenInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRepos = mockRepositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleConnect = (event) => {
    event.preventDefault();
    if (!tokenInput.trim()) {
      setAuthError("GitHub Access Token을 입력해 주세요.");
      return;
    }
    if (!tokenInput.startsWith("ghp_")) {
      setAuthError("토큰은 ghp_로 시작해야 합니다.");
      return;
    }

    setAuthError("");
    setGithubConnection(true, {
      name: "secure-admin",
      email: "secure-admin@github.local",
      token: tokenInput,
    });
  };

  const handleRunPipeline = () => {
    store.startAnalysisPipeline(false, addAnalyzedProject, () => {
      if (onNavigate) onNavigate("dashboard");
    });
  };

  if (!isGithubConnected) {
    return (
      <section style={styles.centerPanel}>
        <div style={styles.connectCard}>
          <h2 style={styles.cardTitle}>GitHub 저장소 연결</h2>
          <p style={styles.mutedText}>
            분석할 원격 저장소를 가져오기 위해 Personal Access Token을 입력합니다.
          </p>
          <form onSubmit={handleConnect} style={styles.connectForm}>
            <input
              type="password"
              placeholder="GitHub Personal Access Token (ghp_...)"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              style={styles.input}
            />
            {authError && <p style={styles.errorText}>{authError}</p>}
            <button type="submit" style={styles.primaryButton}>
              저장소 연결
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.workspace}>
      <aside style={styles.sidebar}>
        <div style={styles.githubBox}>
          <div>
            <strong>secure-admin</strong>
            <p style={styles.connectedText}>GitHub connected</p>
          </div>
          <button type="button" onClick={() => setGithubConnection(false, null)} style={styles.dangerButton}>
            해제
          </button>
        </div>

        <input
          type="text"
          placeholder="저장소 검색"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          style={styles.input}
        />

        <div style={styles.repoList}>
          {filteredRepos.map((repo) => {
            const selected = store.selectedRepo?.id === repo.id;
            return (
              <button
                type="button"
                key={repo.id}
                onClick={() => store.setSelectedRepo(repo)}
                style={{
                  ...styles.repoCard,
                  borderColor: selected ? "#3b82f6" : "#263244",
                  backgroundColor: selected ? "rgba(59,130,246,0.14)" : "#111827",
                }}
              >
                <span style={styles.repoName}>{repo.name}</span>
                <span style={styles.repoDesc}>{repo.description}</span>
                <span style={styles.repoMeta}>
                  {repo.visibility} · {repo.defaultLang}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <div style={styles.mainPanel}>
        {!store.selectedRepo ? (
          <div style={styles.emptyState}>왼쪽 저장소 목록에서 분석 대상을 선택해 주세요.</div>
        ) : (
          <>
            <div style={styles.configCard}>
              <h2 style={styles.cardTitle}>분석 설정</h2>
              <div style={styles.grid}>
                <label style={styles.field}>
                  <span>프로젝트 이름</span>
                  <input
                    type="text"
                    value={store.projectName}
                    onChange={(event) => store.setProjectName(event.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.field}>
                  <span>분석 언어</span>
                  <select
                    value={store.targetLanguage}
                    onChange={(event) => store.setLanguage(event.target.value)}
                    style={styles.input}
                  >
                    {languageOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={styles.field}>
                  <span>프레임워크</span>
                  <input
                    type="text"
                    value={store.targetFramework}
                    onChange={(event) => store.setTargetFramework(event.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.field}>
                  <span>브랜치</span>
                  <select
                    value={store.targetBranch}
                    onChange={(event) => store.setTargetBranch(event.target.value)}
                    style={styles.input}
                  >
                    <option value="main">main</option>
                    <option value="develop">develop</option>
                    <option value="feature/security">feature/security</option>
                  </select>
                </label>
                <label style={styles.field}>
                  <span>진단 프로필</span>
                  <select
                    value={store.ruleProfile}
                    onChange={(event) => store.setRuleProfile(event.target.value)}
                    style={styles.input}
                  >
                    <option value="Full-Scope">Full-Scope</option>
                    <option value="OWASP-Top10">OWASP Top 10</option>
                    <option value="CWE-Essential">CWE Essential</option>
                  </select>
                </label>
              </div>

              <button
                type="button"
                onClick={handleRunPipeline}
                disabled={store.isScanning}
                style={styles.primaryButton}
              >
                {store.isScanning ? "분석 중..." : "분석 파이프라인 시작"}
              </button>
            </div>

            {(store.isScanning || store.scanLogs.length > 0) && (
              <div style={styles.logPanel}>
                <div style={styles.progressHeader}>
                  <strong>분석 진행률</strong>
                  <span>{store.scanProgress}%</span>
                </div>
                <div style={styles.progressTrack}>
                  <div style={{ ...styles.progressBar, width: `${store.scanProgress}%` }} />
                </div>
                <div style={styles.logList}>
                  {store.scanLogs.map((log, index) => (
                    <div key={`${log}-${index}`}>{log}</div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

const styles = {
  centerPanel: {
    minHeight: "66vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  connectCard: {
    width: "100%",
    maxWidth: "460px",
    backgroundColor: "#111827",
    border: "1px solid #263244",
    borderRadius: "12px",
    padding: "34px",
    textAlign: "center",
  },
  cardTitle: { margin: "0 0 8px", color: "#f8fafc", fontSize: "20px" },
  mutedText: { color: "#94a3b8", fontSize: "14px", lineHeight: 1.5 },
  connectForm: { display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #334155",
    backgroundColor: "#0b0f19",
    color: "#fff",
    outline: "none",
  },
  errorText: { margin: 0, color: "#f87171", fontSize: "13px", fontWeight: "700" },
  primaryButton: {
    padding: "13px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: "900",
    cursor: "pointer",
  },
  workspace: { display: "flex", gap: "24px", alignItems: "flex-start" },
  sidebar: {
    width: "340px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    backgroundColor: "#111827",
    border: "1px solid #263244",
    borderRadius: "12px",
    padding: "18px",
    boxSizing: "border-box",
  },
  githubBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px",
    backgroundColor: "#172033",
    borderRadius: "8px",
  },
  connectedText: { margin: "4px 0 0", color: "#34d399", fontSize: "12px" },
  dangerButton: {
    backgroundColor: "rgba(239,68,68,0.14)",
    color: "#f87171",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "7px",
    padding: "7px 10px",
    cursor: "pointer",
  },
  repoList: { display: "flex", flexDirection: "column", gap: "10px" },
  repoCard: {
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    border: "1px solid",
    borderRadius: "10px",
    padding: "14px",
    color: "#fff",
    cursor: "pointer",
  },
  repoName: { fontWeight: "900", color: "#f8fafc" },
  repoDesc: { color: "#94a3b8", fontSize: "12px", lineHeight: 1.45 },
  repoMeta: { color: "#60a5fa", fontSize: "12px", fontWeight: "800" },
  mainPanel: {
    flex: 1,
    backgroundColor: "#111827",
    border: "1px solid #263244",
    borderRadius: "12px",
    padding: "22px",
    minHeight: "520px",
    boxSizing: "border-box",
  },
  emptyState: {
    minHeight: "470px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    border: "1px dashed #334155",
    borderRadius: "10px",
  },
  configCard: { display: "flex", flexDirection: "column", gap: "18px" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    color: "#cbd5e1",
    fontSize: "13px",
    fontWeight: "800",
  },
  logPanel: {
    marginTop: "20px",
    padding: "16px",
    backgroundColor: "#0b0f19",
    border: "1px solid #263244",
    borderRadius: "10px",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    color: "#cbd5e1",
    fontSize: "13px",
    marginBottom: "9px",
  },
  progressTrack: {
    height: "7px",
    backgroundColor: "#1f2937",
    borderRadius: "999px",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#3b82f6",
    transition: "width 0.2s ease",
  },
  logList: {
    marginTop: "12px",
    color: "#a7f3d0",
    fontFamily: "Consolas, monospace",
    fontSize: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
};
