import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginForm from "../features/auth/components/LoginForm";
import RegisterForm from "../features/auth/components/RegisterForm";
import DashboardLayout from "../features/dashboard/components/DashboardLayout";
import { useAuthStore } from "../store/authStore";

function ProtectedRoute({ children }) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={<div style={styles.errorPage}>존재하지 않는 페이지입니다.</div>}
        />
      </Routes>
    </BrowserRouter>
  );
}

const styles = {
  errorPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b0f19",
    color: "#9ca3af",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
};
