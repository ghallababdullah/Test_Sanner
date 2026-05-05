import { useQuery } from "@tanstack/react-query";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { fetchOverview } from "../../analytics/api";
import { fetchTests } from "../api";
import { MetricCard } from "../../../shared/components/MetricCard";
import { SectionCard } from "../../../shared/components/SectionCard";

export function TestsPage() {
  const navigate = useNavigate();
  const testsQuery = useQuery({ queryKey: ["tests"], queryFn: fetchTests });
  const overviewQuery = useQuery({ queryKey: ["analytics-overview"], queryFn: fetchOverview });

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4">Тесты</Typography>
          <Typography color="text.secondary">Создавайте тесты, запускайте сканирование и переходите к аналитике.</Typography>
        </Box>
        <Button variant="contained" size="large" onClick={() => navigate("/tests/create")}>
          Создать тест
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}><MetricCard label="Всего тестов" value={overviewQuery.data?.totalTests ?? 0} /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><MetricCard label="Отсканировано бланков" value={overviewQuery.data?.totalScannedBlanks ?? 0} /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><MetricCard label="Требуют проверки" value={overviewQuery.data?.totalNeedsReview ?? 0} /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><MetricCard label="Средний процент" value={`${overviewQuery.data?.averagePercentage ?? 0}%`} /></Grid>
      </Grid>

      <SectionCard title="Список тестов" subtitle="Быстрый переход к аналитике, сканированию и проверке.">
        <Stack spacing={2}>
          {testsQuery.data?.map((test) => (
            <Box
              key={test.id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                borderRadius: 3,
                bgcolor: "background.default"
              }}
            >
              <Box>
                <Typography variant="h6">{test.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {test.subject} • {test.classLevel} • {test.totalQuestions} вопросов
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button onClick={() => navigate(`/tests/${test.id}`)}>Карточка</Button>
                <Button onClick={() => navigate(`/tests/${test.id}/analytics`)}>Аналитика</Button>
                <Button onClick={() => navigate(`/tests/${test.id}/review`)}>Проверка</Button>
              </Stack>
            </Box>
          )) ?? <Typography>Загрузка...</Typography>}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
