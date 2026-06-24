import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#3B82F6",
      light: "#93C5FD",
      dark: "#1D4ED8",
    },
    secondary: {
      main: "#0EA5E9",
    },
    background: {
      default: "#020617",
      paper: "#0F172A",
    },
    text: {
      primary: "#F8FAFC",
      secondary: "#94A3B8",
    },
    divider: "rgba(148,163,184,.16)",
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily:
      "'Pretendard', 'Inter', 'Noto Sans KR', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    h4: {
      fontWeight: 850,
      letterSpacing: 0,
    },
    h5: {
      fontWeight: 800,
      letterSpacing: 0,
    },
    h6: {
      fontWeight: 750,
      letterSpacing: 0,
    },
    button: {
      fontWeight: 750,
      textTransform: "none",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "linear-gradient(135deg, #020617 0%, #0B1120 52%, #07111F 100%)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background:
            "linear-gradient(180deg, rgba(15,23,42,.94), rgba(15,23,42,.78))",
          border: "1px solid rgba(96,165,250,.14)",
          boxShadow: "0 18px 48px rgba(0,0,0,.22)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
        containedPrimary: {
          background:
            "linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%)",
          boxShadow: "0 14px 32px rgba(37,99,235,.28)",
        },
        outlinedPrimary: {
          borderColor: "rgba(147,197,253,.42)",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(2,6,23,.38)",
          "& fieldset": {
            borderColor: "rgba(148,163,184,.24)",
          },
          "&:hover fieldset": {
            borderColor: "rgba(147,197,253,.5)",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#60A5FA",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(37,99,235,.14)",
          border: "1px solid rgba(96,165,250,.18)",
          color: "#BFDBFE",
        },
      },
    },
  },
});

export default theme;
