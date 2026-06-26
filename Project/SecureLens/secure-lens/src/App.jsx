import { Navigate, Routes, Route } from "react-router-dom";

import FalsePositive from "./pages/FalsePositive";
import Report from "./pages/Report";

import AppLayout from "./components/AppLayout";

import AIAnalysis from "./pages/AIAnalysis";
import Dashboard from "./pages/Dashboard";
import GithubConnect from "./pages/GithubConnect";
import Login from "./pages/Login";
import MyPage from "./pages/MyPage";
import Signup from "./pages/Signup";
import StaticAnalysis from "./pages/StaticAnalysis";
import { getSession } from "./services/storageService";

function ProtectedApp({ children }) {
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

function PublicPage({ children }) {
  const session = getSession();

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/login"
        element={
          <PublicPage>
            <Login />
          </PublicPage>
        }
      />

      <Route
        path="/signup"
        element={
          <PublicPage>
            <Signup />
          </PublicPage>
        }
      />

      <Route
        path="/*"
        element={
          <ProtectedApp>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="/github" element={<GithubConnect />} />

              <Route path="/static-analysis" element={<StaticAnalysis />} />

              <Route path="/ai-analysis" element={<AIAnalysis />} />

              <Route path="/false-positive" element={<FalsePositive />} />

              <Route path="/report" element={<Report />} />

              <Route path="/my-page" element={<MyPage />} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ProtectedApp>
        }
      />
    </Routes>
  );
}

export default App;
