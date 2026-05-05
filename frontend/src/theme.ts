import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1f4e5f"
    },
    secondary: {
      main: "#c86b3c"
    },
    background: {
      default: "#f7f4ee",
      paper: "#fffdf9"
    },
    success: {
      main: "#2e7d32"
    },
    warning: {
      main: "#c58b00"
    },
    error: {
      main: "#c0392b"
    }
  },
  shape: {
    borderRadius: 18
  },
  typography: {
    fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
    h4: {
      fontWeight: 700
    },
    h5: {
      fontWeight: 700
    },
    h6: {
      fontWeight: 700
    },
    button: {
      textTransform: "none",
      fontWeight: 600
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 16px 40px rgba(31, 78, 95, 0.08)"
        }
      }
    }
  }
});
