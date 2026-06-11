import { useState } from "react";
import RepoList from "../../repository/components/RepoList";
import { useAuthStore } from "../../../store/authStore";
import MyPage from "./MyPage";

export default function DashboardLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [activeView, setActiveView] = useState("repo");

  const titleMap = {
    repo: "소스코드 보안 취약점 정적 진단",
    dashboard: "분석 결과 통계 대시보드",
    detail: "취약점 상세 추적 및 조치 가이드",
    report: "AI 상세 분석 리포트",
    mypage: "마이페이지",
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.logo}>SL</span>
          <strong>SecureLens SaaS Platform</strong>
        </div>

        <nav style={styles.nav}>
          {[
            ["repo", "저장소 분석"],
            ["dashboard", "결과 대시보드"],
            ["detail", "상세 가이드"],
            ["report", "리포트"],
            ["mypage", "마이페이지"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveView(value)}
              style={{
                ...styles.navButton,
                color: activeView === value ? "#fff" : "#9ca3af",
                borderBottomColor: activeView === value ? "#3b82f6" : "transparent",
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        <div style={styles.userArea}>
          <span style={styles.userBadge}>{user?.id || "Admin"}</span>
          <button type="button" onClick={logout} style={styles.logoutButton}>
            로그아웃
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.hero}>
          <h1 style={styles.title}>{titleMap[activeView]}</h1>
          <p style={styles.subtitle}>
            GitHub 저장소를 선택하고 AI 기반 정적 분석 결과를 확인합니다.
          </p>
        </section>

        {activeView === "mypage" ? (
          <MyPage />
        ) : (
          <RepoList currentTab={activeView} onNavigate={setActiveView} />
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0b0f19",
    color: "#fff",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    height: "66px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    padding: "0 32px",
    backgroundColor: "#111827",
    borderBottom: "1px solid #263244",
  },
  brand: { display: "flex", alignItems: "center", gap: "10px", minWidth: "230px" },
  logo: {
    width: "34px",
    height: "34px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "7px",
    backgroundColor: "#2563eb",
    fontWeight: "900",
  },
  nav: { display: "flex", alignItems: "center", height: "100%", gap: "10px" },
  navButton: {
    height: "100%",
    padding: "0 10px",
    background: "transparent",
    border: "none",
    borderBottom: "3px solid transparent",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },
  userArea: { display: "flex", alignItems: "center", gap: "10px" },
  userBadge: {
    color: "#cbd5e1",
    backgroundColor: "#0b0f19",
    border: "1px solid #263244",
    borderRadius: "7px",
    padding: "7px 10px",
    fontSize: "13px",
  },
  logoutButton: {
    backgroundColor: "rgba(239,68,68,0.14)",
    color: "#f87171",
    border: "1px solid rgba(239,68,68,0.32)",
    borderRadius: "7px",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: "800",
  },
  main: { padding: "28px 32px 44px" },
  hero: { marginBottom: "22px" },
  title: { margin: "0 0 6px", fontSize: "24px" },
  subtitle: { margin: 0, color: "#94a3b8", fontSize: "14px" },
};
