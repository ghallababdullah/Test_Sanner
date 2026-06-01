import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { appTheme } from "./theme";
import { AuthProvider } from "./modules/auth/AuthContext";
import { initYandexMetrica, trackYandexPageView } from "./shared/analytics/yandexMetrica";

const queryClient = new QueryClient();

if (typeof window !== "undefined") {
  initYandexMetrica();

  let lastTrackedUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  trackYandexPageView(window.location.href);

  router.subscribe((state) => {
    const nextUrl = `${state.location.pathname}${state.location.search}${state.location.hash}`;
    if (nextUrl === lastTrackedUrl) {
      return;
    }

    lastTrackedUrl = nextUrl;
    trackYandexPageView(`${window.location.origin}${nextUrl}`);
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
