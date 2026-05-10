import { Outlet } from "react-router-dom";
import { Box, Container } from "@mui/material";
import { PublicHeader } from "../../modules/home/components/PublicHeader";
import { SiteFooter } from "../../modules/site/components/SiteFooter";

export function AppLayout() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      <PublicHeader />
      <Container
        maxWidth="xl"
        sx={{
          py: { xs: 2.5, md: 4 },
          px: { xs: 2, sm: 3, md: 4 },
          flex: 1
        }}
      >
        <Outlet />
      </Container>
      <SiteFooter />
    </Box>
  );
}
