import { Outlet } from "react-router-dom";
import { Box, Container } from "@mui/material";
import { PublicHeader } from "../../modules/home/components/PublicHeader";

export function AppLayout() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <PublicHeader />
      <Container
        maxWidth="xl"
        sx={{
          py: { xs: 2.5, md: 4 },
          px: { xs: 2, sm: 3, md: 4 }
        }}
      >
        <Outlet />
      </Container>
    </Box>
  );
}
