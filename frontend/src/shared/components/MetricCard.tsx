import { Box, Card, CardContent, Typography } from "@mui/material";

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <Card sx={{ position: "relative", overflow: "hidden", height: "100%" }}>
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          bgcolor: "primary.main"
        }}
      />
      <CardContent sx={{ pl: 2.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.12em", fontWeight: 700 }}>
          {label}
        </Typography>
        <Typography variant="h4" sx={{ my: 1.25 }}>
          {value}
        </Typography>
        {hint ? (
          <Typography variant="body2" color="text.secondary">
            {hint}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}
