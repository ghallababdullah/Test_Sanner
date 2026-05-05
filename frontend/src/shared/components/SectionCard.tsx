import type { PropsWithChildren } from "react";
import { Card, CardContent, Typography } from "@mui/material";

interface SectionCardProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
}

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {subtitle}
          </Typography>
        ) : null}
        {children}
      </CardContent>
    </Card>
  );
}
