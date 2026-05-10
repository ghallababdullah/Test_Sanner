import type { PropsWithChildren } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";

interface SectionCardProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
}

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <Card sx={{ position: "relative", overflow: "hidden" }}>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(135deg, rgba(23,50,77,0.035) 0, rgba(23,50,77,0.035) 64px, transparent 64px, transparent 100%)"
        }}
      />
      <CardContent sx={{ position: "relative", p: { xs: 2, md: 2.5 } }}>
        <Typography
          variant="overline"
          sx={{ display: "block", mb: 0.75, color: "text.secondary", letterSpacing: "0.12em", fontWeight: 700 }}
        >
          Раздел
        </Typography>
        <Typography variant="h6" sx={{ mb: subtitle ? 0.75 : 2 }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.25, maxWidth: 760 }}>
            {subtitle}
          </Typography>
        ) : null}
        {children}
      </CardContent>
    </Card>
  );
}
