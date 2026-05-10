import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#17324d",
      contrastText: "#f6f1e8"
    },
    secondary: {
      main: "#8a4b2a",
      contrastText: "#f6f1e8"
    },
    background: {
      default: "#f2eee6",
      paper: "#fbf8f1"
    },
    text: {
      primary: "#161d27",
      secondary: "#5b5f66"
    },
    success: {
      main: "#2f6b4f"
    },
    warning: {
      main: "#ad6a2c"
    },
    error: {
      main: "#a63b32"
    },
    divider: "rgba(22, 29, 39, 0.14)"
  },
  shape: {
    borderRadius: 0
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", Arial, sans-serif',
    h1: { fontWeight: 700, letterSpacing: "-0.04em" },
    h2: { fontWeight: 700, letterSpacing: "-0.04em" },
    h3: { fontWeight: 700, letterSpacing: "-0.03em" },
    h4: { fontWeight: 700, letterSpacing: "-0.03em" },
    h5: { fontWeight: 700, letterSpacing: "-0.02em" },
    h6: { fontWeight: 700, letterSpacing: "-0.02em" },
    subtitle1: {
      fontWeight: 600,
      letterSpacing: "0.01em"
    },
    body1: {
      lineHeight: 1.7
    },
    body2: {
      lineHeight: 1.65
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
      letterSpacing: "0.01em"
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#f2eee6",
          backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0) 28%), repeating-linear-gradient(0deg, rgba(22,29,39,0.028) 0, rgba(22,29,39,0.028) 1px, transparent 1px, transparent 36px)"
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(22, 29, 39, 0.14)"
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(22, 29, 39, 0.14)",
          boxShadow: "8px 8px 0 rgba(22, 29, 39, 0.06)"
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontWeight: 700
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: "1px solid currentColor"
        },
        standardInfo: {
          backgroundColor: "rgba(23, 50, 77, 0.06)"
        },
        standardWarning: {
          backgroundColor: "rgba(173, 106, 44, 0.08)"
        },
        standardError: {
          backgroundColor: "rgba(166, 59, 50, 0.08)"
        },
        standardSuccess: {
          backgroundColor: "rgba(47, 107, 79, 0.08)"
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          borderRadius: 0,
          paddingInline: 18,
          minHeight: 44
        },
        containedPrimary: {
          boxShadow: "none"
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: "rgba(255,255,255,0.46)"
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          paddingInline: 10,
          fontWeight: 700
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
