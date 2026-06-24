import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Button,
  Divider,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import GitHubIcon from "@mui/icons-material/GitHub";
import BugReportIcon from "@mui/icons-material/BugReport";
import DescriptionIcon from "@mui/icons-material/Description";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import LogoutIcon from "@mui/icons-material/Logout";
import ShieldIcon from "@mui/icons-material/Shield";

import { Link, useLocation } from "react-router-dom";
import { clearSession, getSession } from "../services/storageService";

const drawerWidth = 260;

export default function AppLayout({ children }) {
  const location = useLocation();
  const session = getSession();

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
    },
    {
      text: "Github",
      icon: <GitHubIcon />,
      path: "/github",
    },
    {
      text: "Static Analysis",
      icon: <AnalyticsIcon />,
      path: "/static-analysis",
    },
    {
      text: "AI Analysis",
      icon: <AutoFixHighIcon />,
      path: "/ai-analysis",
    },
    {
      text: "False Positive",
      icon: <BugReportIcon />,
      path: "/false-positive",
    },
    {
      text: "Report",
      icon: <DescriptionIcon />,
      path: "/report",
    },
  ];

  const handleLogout = () => {
    clearSession();
    window.location.href = "/login";
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,

          "& .MuiDrawer-paper": {
            width: drawerWidth,
            background:
              "linear-gradient(180deg, rgba(15,23,42,.98), rgba(2,6,23,.98))",
            borderRight: "1px solid rgba(96,165,250,.16)",
            boxShadow: "18px 0 50px rgba(0,0,0,.28)",
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: 42,
                height: 42,
                borderRadius: 2,
                color: "#BFDBFE",
                background:
                  "linear-gradient(135deg, rgba(37,99,235,.95), rgba(14,165,233,.85))",
                boxShadow: "0 16px 34px rgba(37,99,235,.3)",
              }}
            >
              <ShieldIcon />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={900} color="#EFF6FF">
                SecureLens
              </Typography>
              <Typography color="text.secondary" fontSize={12}>
                AI Security Scanner
              </Typography>
            </Box>
          </Box>
        </Box>

        {session && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Typography color="text.secondary" fontSize={13}>
              Logged in as
            </Typography>
            <Typography fontWeight="bold" color="#F8FAFC">
              {session.user.id}
            </Typography>
            <Button
              size="small"
              startIcon={<LogoutIcon />}
              sx={{ mt: 1, color: "#93C5FD" }}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        )}

        <Divider sx={{ borderColor: "rgba(148,163,184,.14)", mx: 2, mb: 1 }} />

        <List>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                mx: 1.5,
                my: 0.5,
                borderRadius: 2,
                color: "#CBD5E1",
                transition: "all .18s ease",

                "&.Mui-selected": {
                  color: "#EFF6FF",
                  background:
                    "linear-gradient(90deg, rgba(37,99,235,.24), rgba(14,165,233,.08))",
                  boxShadow: "inset 3px 0 0 #60A5FA",
                },

                "&.Mui-selected:hover": {
                  background:
                    "linear-gradient(90deg, rgba(37,99,235,.32), rgba(14,165,233,.12))",
                },

                "&:hover": {
                  background: "rgba(59,130,246,.1)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? "#93C5FD" : "#64748B",
                  minWidth: 42,
                }}
              >
                {item.icon}
              </ListItemIcon>

              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
        sx={{
          flexGrow: 1,
          p: { xs: 2.5, md: 4 },
          minHeight: "100vh",
          background:
            "radial-gradient(circle at 20% 0%, rgba(37,99,235,.24), transparent 32%), linear-gradient(135deg, #020617 0%, #0B1120 48%, #07111F 100%)",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
