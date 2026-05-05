import { useQuery } from "@tanstack/react-query";
import { Grid, Stack, Typography } from "@mui/material";
import { SectionCard } from "../../../shared/components/SectionCard";
import { MetricCard } from "../../../shared/components/MetricCard";
import { useAuth } from "../../auth/AuthContext";
import { fetchOverview } from "../../analytics/api";

export function ProfilePage() {
  const { user } = useAuth();
  const overviewQuery = useQuery({
    queryKey: ["profile-overview"],
    queryFn: fetchOverview
  });

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Профиль</Typography>
      <SectionCard title="Пользователь">
        <Typography>Имя: {user?.fullName}</Typography>
        <Typography>Email: {user?.email}</Typography>
      </SectionCard>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label="Создано тестов" value={overviewQuery.data?.totalTests ?? 0} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label="Отсканировано бланков" value={overviewQuery.data?.totalScannedBlanks ?? 0} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label="Проверено бланков" value={overviewQuery.data?.totalScoredBlanks ?? 0} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label="Нуждаются в проверке" value={overviewQuery.data?.totalNeedsReview ?? 0} />
        </Grid>
      </Grid>

      <SectionCard title="Общая статистика">
        <Typography>Средний балл: {overviewQuery.data?.averageScore ?? 0}</Typography>
        <Typography>Средний процент: {overviewQuery.data?.averagePercentage ?? 0}%</Typography>
      </SectionCard>
    </Stack>
  );
}
