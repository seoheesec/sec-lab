import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  TextField,
  Typography,
} from "@mui/material";

import LockIcon from "@mui/icons-material/Lock";
import ShieldIcon from "@mui/icons-material/Shield";

import {
  ensureDemoAdmin,
  getDemoAdminCredentials,
  login,
} from "../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const demoAdmin = getDemoAdminCredentials();
  const [form, setForm] = useState({
    id: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = form.id.trim().length > 0 && form.password.length > 0;

  useEffect(() => {
    ensureDemoAdmin();
  }, []);

  const updateField = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
    setMessage("");
  };

  const fillDemoAdmin = () => {
    setForm(demoAdmin);
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) return;

    try {
      setLoading(true);
      await login(form);
      navigate("/dashboard");
    } catch (error) {
      setMessage(error.message || "Login failed.");
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
          "radial-gradient(circle at 22% 10%, rgba(37,99,235,.34), transparent 34%), radial-gradient(circle at 78% 84%, rgba(14,165,233,.18), transparent 28%), linear-gradient(135deg, #020617 0%, #0B1120 52%, #07111F 100%)",
      }}
    >
      <Card
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: 460,
          border: "1px solid rgba(96,165,250,.22)",
          background: "rgba(15,23,42,.82)",
          backdropFilter: "blur(18px)",
          boxShadow: "0 28px 80px rgba(0,0,0,.42)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
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
                SecureLens
              </Typography>
              <Typography color="text.secondary">
                Sign in to start security analysis.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              border: "1px solid rgba(96,165,250,.18)",
              background: "rgba(37,99,235,.1)",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <Typography fontWeight={800}>Demo admin</Typography>
              <Chip size="small" label="Ready" />
            </Box>
            <Typography color="text.secondary" fontSize={14} sx={{ mt: 1 }}>
              ID: {demoAdmin.id} / Password: {demoAdmin.password}
            </Typography>
            <Button size="small" sx={{ mt: 1, color: "#93C5FD" }} onClick={fillDemoAdmin}>
              Use demo account
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {message && (
            <Alert severity="error" sx={{ mb: 2 }}>
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
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={form.password}
            onChange={updateField("password")}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            startIcon={<LockIcon />}
            disabled={!canSubmit || loading}
            sx={{ mt: 3 }}
          >
            {loading ? "Checking..." : "Login"}
          </Button>

          <Button
            variant="text"
            fullWidth
            sx={{ mt: 1.5, color: "#93C5FD" }}
            onClick={() => navigate("/signup")}
          >
            Create a new account
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
