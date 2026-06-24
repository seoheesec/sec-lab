import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";

import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ShieldIcon from "@mui/icons-material/Shield";

import { signUp, validateEmail, validatePassword } from "../services/authService";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    id: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const emailError = form.email.length > 0 && !validateEmail(form.email);
  const passwordError =
    form.password.length > 0 && !validatePassword(form.password);
  const passwordMismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  const canSubmit = useMemo(
    () =>
      form.id.trim().length > 0 &&
      validateEmail(form.email) &&
      validatePassword(form.password) &&
      form.password === form.confirmPassword,
    [form],
  );

  const updateField = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) return;

    try {
      setLoading(true);
      await signUp(form);
      setMessage("Account created. Redirecting to login.");
      setTimeout(() => navigate("/login"), 700);
    } catch (error) {
      setMessage(error.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        background:
          "radial-gradient(circle at 25% 8%, rgba(37,99,235,.32), transparent 34%), radial-gradient(circle at 76% 86%, rgba(14,165,233,.18), transparent 28%), linear-gradient(135deg, #020617 0%, #0B1120 52%, #07111F 100%)",
      }}
    >
      <Card
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: 520,
          border: "1px solid rgba(96,165,250,.22)",
          background: "rgba(15,23,42,.82)",
          backdropFilter: "blur(18px)",
          boxShadow: "0 28px 80px rgba(0,0,0,.42)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: 48,
                height: 48,
                borderRadius: 2,
                color: "#DBEAFE",
                background:
                  "linear-gradient(135deg, rgba(37,99,235,.95), rgba(14,165,233,.85))",
              }}
            >
              <ShieldIcon />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={900}>
                Create Account
              </Typography>
              <Typography color="text.secondary">
                Create an account to use SecureLens.
              </Typography>
            </Box>
          </Box>

          {message && (
            <Alert severity={message.includes("created") ? "success" : "error"} sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          <TextField
            label="ID"
            fullWidth
            margin="normal"
            value={form.id}
            onChange={updateField("id")}
          />

          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={form.email}
            onChange={updateField("email")}
            error={emailError}
            helperText={emailError ? "Enter a valid email address." : " "}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={form.password}
            onChange={updateField("password")}
            error={passwordError}
            helperText={
              passwordError
                ? "Use at least 8 characters and one special character."
                : " "
            }
          />

          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            margin="normal"
            value={form.confirmPassword}
            onChange={updateField("confirmPassword")}
            error={passwordMismatch}
            helperText={passwordMismatch ? "Passwords do not match." : " "}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            startIcon={<PersonAddIcon />}
            disabled={!canSubmit || loading}
            sx={{ mt: 3 }}
          >
            {loading ? "Creating..." : "Create Account"}
          </Button>

          <Button
            variant="text"
            fullWidth
            sx={{ mt: 1.5, color: "#93C5FD" }}
            onClick={() => navigate("/login")}
          >
            Already have an account
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
