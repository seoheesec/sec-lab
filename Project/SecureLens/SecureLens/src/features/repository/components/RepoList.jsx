import AnalysisDetailPage from "../../../pages/AnalysisDetailPage";
import DashboardPage from "../../../pages/DashboardPage";
import RepoPage from "../../../pages/RepoPage";
import RepoSelectPage from "../../../pages/RepoSelectPage";

export default function RepoList({ currentTab = "repo", onNavigate }) {
  if (currentTab === "dashboard") return <DashboardPage onNavigate={onNavigate} />;
  if (currentTab === "detail") return <AnalysisDetailPage onNavigate={onNavigate} />;
  if (currentTab === "report") return <RepoPage />;
  return <RepoSelectPage onNavigate={onNavigate} />;
}
