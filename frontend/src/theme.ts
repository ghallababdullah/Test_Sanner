import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#14607a"
    },
    secondary: {
      main: "#1f8f6b"
    },
    background: {
      default: "#f4f7f8",
      paper: "#ffffff"
    },
    text: {
      primary: "#10212b",
      secondary: "#5b6b75"
    },
    success: {
      main: "#1f8f6b"
    },
    warning: {
      main: "#c0841a"
    },
    error: {
      main: "#c43d32"
    },
    divider: "rgba(16, 33, 43, 0.08)"
  },
  shape: {
    borderRadius: 16
  },
  typography: {
    fontFamily: '"Segoe UI", "IBM Plex Sans", Arial, sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontWeight: 800, letterSpacing: "-0.02em" },
    h3: { fontWeight: 800, letterSpacing: "-0.02em" },
    h4: { fontWeight: 700, letterSpacing: "-0.01em" },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    body1: { lineHeight: 1.65 },
    body2: { lineHeight: 1.55 },
    button: {
      textTransform: "none",
      fontWeight: 600
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            "radial-gradient(circle at top left, rgba(20,96,122,0.04), transparent 28%), radial-gradient(circle at top right, rgba(31,143,107,0.04), transparent 24%)"
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(16, 33, 43, 0.08)"
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(16, 33, 43, 0.08)",
          boxShadow: "0 10px 30px rgba(16, 33, 43, 0.05)"
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 18
        },
        containedPrimary: {
          boxShadow: "0 10px 24px rgba(20, 96, 122, 0.18)"
        }
      }
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 20,
          paddingRight: 20
        }
      }
    }
  }
});
