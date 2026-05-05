import type { PropsWithChildren } from "react";
import { Box, Container, Paper, Typography } from "@mui/material";

export function AuthShell({ children }: PropsWithChildren) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", background: "linear-gradient(135deg, #f7f4ee 0%, #eef5f6 100%)" }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 5, borderRadius: 6 }}>
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
  );
}
