import { Box, Container, Stack, Typography } from "@mui/material";
import { siteConfig } from "../siteConfig";

export function SiteFooter() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 6,
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "rgba(251,248,241,0.92)"
      }}
      >
      <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 3 } }}>
        <Stack spacing={0.75} alignItems="center" textAlign="center">
          <Typography variant="body2" color="text.secondary">
            {siteConfig.productName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Разработка и поддержка: {siteConfig.companyName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {siteConfig.phone}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            © 2026
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
