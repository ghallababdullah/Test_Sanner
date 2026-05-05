import { Card, CardContent, Typography } from "@mui/material";

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" sx={{ my: 1 }}>
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
