import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as loginApi } from "../authApi";
import { useAuthStore } from "../../../store/authStore";

export default function LoginForm() {
  const navigate = useNavigate();
  const {
    login,
    loginAttempts,
    isLocked,
    incrementLoginAttempts,
    resetLoginAttempts,
  } = useAuthStore();

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaNumber, setCaptchaNumber] = useState(() =>
    Math.floor(1000 + Math.random() * 9000).toString(),
  );
  const [captchaInput, setCaptchaInput] = useState("");
  const isCaptchaVisible = isLocked || loginAttempts >= 4;

  const generateNewCaptcha = () => {
    setCaptchaNumber(Math.floor(1000 + Math.random() * 9000).toString());
    setCaptchaInput("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanId = id.trim();
    const cleanPassword = password.trim();

    if (!cleanId || !cleanPassword) {
      setIsSuccess(false);
      setMessage("아이디와 비밀번호를 모두 입력해 주세요.");
      return;
    }

    if (isLocked) {
      setIsSuccess(false);
      setMessage("비밀번호 5회 오류로 계정이 잠겼습니다. 잠금 해제 후 다시 시도해 주세요.");
      return;
    }

    if (isCaptchaVisible && captchaInput !== captchaNumber) {
      setIsSuccess(false);
      setMessage("CAPTCHA 번호가 올바르지 않습니다.");
      generateNewCaptcha();
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginApi({ id: cleanId, password: cleanPassword });
      login(result.user, result.accessToken);
      resetLoginAttempts();
      setIsSuccess(true);
      setMessage("로그인 성공. 대시보드로 이동합니다.");
      setTimeout(() => navigate("/dashboard"), 700);
    } catch (error) {
      incrementLoginAttempts();
      const nextCount = loginAttempts + 1;
      setIsSuccess(false);
      setMessage(`${error.message} 오류 횟수: ${nextCount}/5`);
      if (nextCount >= 4) generateNewCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoSection}>
          <span style={styles.logoIcon}>SL</span>
          <h1 style={styles.brandName}>SecureLens</h1>
          <p style={styles.brandSubtitle}>AI 기반 소스코드 보안 분석 플랫폼</p>
        </div>

        {message && (
          <div
            style={{
              ...styles.alert,
              backgroundColor: isSuccess
                ? "rgba(16,185,129,0.14)"
                : "rgba(239,68,68,0.14)",
              color: isSuccess ? "#34d399" : "#f87171",
              borderColor: isSuccess
                ? "rgba(16,185,129,0.35)"
                : "rgba(239,68,68,0.35)",
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.inputGroup}>
            <span style={styles.label}>사용자 ID</span>
            <input
              type="text"
              placeholder="admin"
              value={id}
              onChange={(event) => setId(event.target.value)}
              style={styles.input}
              disabled={isSuccess || isSubmitting}
            />
          </label>

          <label style={styles.inputGroup}>
            <span style={styles.label}>비밀번호</span>
            <input
              type="password"
              placeholder="admin123!"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={styles.input}
              disabled={isSuccess || isSubmitting}
            />
          </label>

          {isCaptchaVisible && (
            <div style={styles.captchaWrapper}>
              <span style={styles.label}>자동 로그인 방지</span>
              <div style={styles.captchaBox}>
                <strong style={styles.captchaCode}>{captchaNumber}</strong>
                <button
                  type="button"
                  onClick={generateNewCaptcha}
                  style={styles.ghostButton}
                >
                  새로고침
                </button>
              </div>
              <input
                type="text"
                maxLength="4"
                placeholder="4자리 숫자 입력"
                value={captchaInput}
                onChange={(event) =>
                  setCaptchaInput(event.target.value.replace(/[^0-9]/g, ""))
                }
                style={styles.input}
              />
              {isLocked && (
                <button
                  type="button"
                  onClick={() => {
                    resetLoginAttempts();
                    setMessage("계정 잠금을 해제했습니다. 다시 로그인해 주세요.");
                  }}
                  style={styles.unlockButton}
                >
                  테스트용 계정 잠금 해제
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            style={styles.submitButton}
            disabled={isSuccess || isSubmitting}
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p style={styles.footerText}>
          계정이 없나요?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            style={styles.linkButton}
          >
            회원가입
          </button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0b0f19",
    padding: "20px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "440px",
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "12px",
    padding: "36px",
    boxSizing: "border-box",
    boxShadow: "0 20px 35px rgba(0,0,0,0.35)",
  },
  logoSection: { textAlign: "center", marginBottom: "24px" },
  logoIcon: {
    display: "inline-flex",
    width: "46px",
    height: "46px",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: "900",
  },
  brandName: { margin: "14px 0 6px", color: "#fff", fontSize: "28px" },
  brandSubtitle: { margin: 0, color: "#9ca3af", fontSize: "13px" },
  alert: {
    padding: "12px",
    border: "1px solid",
    borderRadius: "8px",
    marginBottom: "18px",
    fontSize: "13px",
    textAlign: "center",
    fontWeight: "700",
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "7px" },
  label: { color: "#d1d5db", fontSize: "13px", fontWeight: "700" },
  input: {
    padding: "12px 14px",
    backgroundColor: "#111827",
    border: "1px solid #4b5563",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
  },
  captchaWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "14px",
    backgroundColor: "#111827",
    border: "1px dashed #4b5563",
    borderRadius: "10px",
  },
  captchaBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },
  captchaCode: {
    color: "#facc15",
    fontSize: "20px",
    letterSpacing: "5px",
  },
  ghostButton: {
    backgroundColor: "transparent",
    border: "1px solid #4b5563",
    color: "#cbd5e1",
    borderRadius: "6px",
    padding: "7px 10px",
    cursor: "pointer",
  },
  unlockButton: {
    border: "1px solid rgba(234,179,8,0.35)",
    color: "#facc15",
    backgroundColor: "rgba(234,179,8,0.1)",
    borderRadius: "6px",
    padding: "8px",
    cursor: "pointer",
  },
  submitButton: {
    marginTop: "4px",
    padding: "14px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "800",
    cursor: "pointer",
  },
  footerText: { color: "#9ca3af", textAlign: "center", fontSize: "13px" },
  linkButton: {
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#60a5fa",
    fontWeight: "800",
    cursor: "pointer",
  },
};
