import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  sanitizeInput,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from "../../../utils/validators";

export default function RegisterForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [globalMessage, setGlobalMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("password") ? value : sanitizeInput(value),
    }));
  };

  const errors = useMemo(() => {
    const nextErrors = {};

    if (formData.email && !validateEmail(formData.email)) {
      nextErrors.email = "올바른 이메일 형식이 아닙니다.";
    }

    if (formData.password && !validatePassword(formData.password)) {
      nextErrors.password = "비밀번호는 특수문자를 포함해 8자 이상이어야 합니다.";
    }

    if (
      formData.password &&
      formData.confirmPassword &&
      !validatePasswordMatch(formData.password, formData.confirmPassword)
    ) {
      nextErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }

    return nextErrors;
  }, [formData]);

  const isSubmittable =
    formData.id.trim() &&
    formData.email.trim() &&
    formData.password.trim() &&
    formData.confirmPassword.trim() &&
    validateEmail(formData.email) &&
    validatePassword(formData.password) &&
    validatePasswordMatch(formData.password, formData.confirmPassword);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isSubmittable) return;

    if (["admin@securelens.com", "test@test.com"].includes(formData.email.trim())) {
      setGlobalMessage("이미 사용 중인 이메일입니다.");
      return;
    }

    setGlobalMessage("회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.");
    setTimeout(() => navigate("/login"), 900);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.logoIcon}>SL</span>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>SecureLens 보안 분석 계정 생성</p>
        </div>

        {globalMessage && (
          <div
            style={{
              ...styles.alert,
              color: globalMessage.includes("완료") ? "#34d399" : "#f87171",
              borderColor: globalMessage.includes("완료")
                ? "rgba(16,185,129,0.35)"
                : "rgba(239,68,68,0.35)",
            }}
          >
            {globalMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <Field
            label="사용자 ID"
            name="id"
            value={formData.id}
            placeholder="사용할 아이디"
            onChange={handleChange}
          />
          <Field
            label="이메일"
            name="email"
            value={formData.email}
            placeholder="example@domain.com"
            error={errors.email}
            onChange={handleChange}
          />
          <Field
            label="비밀번호"
            name="password"
            type="password"
            value={formData.password}
            placeholder="특수문자 포함 8자 이상"
            error={errors.password}
            onChange={handleChange}
          />
          <Field
            label="비밀번호 확인"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            placeholder="비밀번호 재입력"
            error={errors.confirmPassword}
            onChange={handleChange}
          />

          <button
            type="submit"
            disabled={!isSubmittable}
            style={{
              ...styles.submitButton,
              opacity: isSubmittable ? 1 : 0.55,
              cursor: isSubmittable ? "pointer" : "not-allowed",
            }}
          >
            회원가입
          </button>
        </form>

        <p style={styles.footerText}>
          이미 계정이 있나요?{" "}
          <button type="button" onClick={() => navigate("/login")} style={styles.linkButton}>
            로그인
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({ label, error, type = "text", ...inputProps }) {
  return (
    <label style={styles.inputGroup}>
      <span style={styles.label}>{label}</span>
      <input
        type={type}
        style={{
          ...styles.input,
          borderColor: error ? "#ef4444" : "#4b5563",
        }}
        {...inputProps}
      />
      {error && <span style={styles.errorText}>{error}</span>}
    </label>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b0f19",
    padding: "20px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "12px",
    padding: "36px",
    boxSizing: "border-box",
  },
  header: { textAlign: "center", marginBottom: "24px" },
  logoIcon: {
    display: "inline-flex",
    width: "42px",
    height: "42px",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: "900",
  },
  title: { margin: "14px 0 6px", color: "#fff", fontSize: "26px" },
  subtitle: { margin: 0, color: "#9ca3af", fontSize: "13px" },
  alert: {
    padding: "12px",
    border: "1px solid",
    borderRadius: "8px",
    marginBottom: "18px",
    fontSize: "13px",
    fontWeight: "700",
    textAlign: "center",
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "7px" },
  label: { color: "#d1d5db", fontSize: "13px", fontWeight: "700" },
  input: {
    padding: "12px 14px",
    backgroundColor: "#111827",
    border: "1px solid",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
  },
  errorText: { color: "#f87171", fontSize: "12px", fontWeight: "700" },
  submitButton: {
    marginTop: "4px",
    padding: "14px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "800",
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
