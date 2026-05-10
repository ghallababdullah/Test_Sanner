import type { PropsWithChildren } from "react";
import { Box, Container, Paper, Typography } from "@mui/material";
import { PublicHeader } from "../../home/components/PublicHeader";
import { SiteFooter } from "../../site/components/SiteFooter";

export function AuthShell({ children }: PropsWithChildren) {
  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #f7f4ee 0%, #eef5f6 100%)", display: "flex", flexDirection: "column" }}>
      <PublicHeader />
      <Box sx={{ minHeight: "calc(100vh - 76px)", display: "flex", alignItems: "center", py: { xs: 4, md: 6 }, flex: 1 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 6 }}>
            <Typography variant="h4" gutterBottom color="primary.main">
              СканПроверка
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Система сканирования, проверки и аналитики бумажных тестов
            </Typography>
            {children}
          </Paper>
        </Container>
      </Box>
      <SiteFooter />
    </Box>
  );
}
