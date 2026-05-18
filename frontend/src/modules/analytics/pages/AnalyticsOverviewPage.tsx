import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Button, Grid, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { fetchOverview } from "../api";
import { MetricCard } from "../../../shared/components/MetricCard";
import { SectionCard } from "../../../shared/components/SectionCard";

const chartColors = ["#1f4e5f", "#c86b3c", "#2e7d32", "#c58b00", "#c0392b"];

function formatOverviewTooltipLabel(value: unknown) {
  return `Категория: ${value ?? "—"}`;
}

function formatOverviewTooltipValue(value: unknown, name: unknown) {
  const safeName = typeof name === "string" ? name : String(name ?? "");
  const safeValue = typeof value === "number" || typeof value === "string" ? value : "—";

  switch (safeName) {
    case "count":
      return [`${safeValue}`, "Количество"];
    case "averagePercentage":
      return [`${safeValue}%`, "Средний процент"];
    case "needsReviewCount":
      return [`${safeValue}`, "Требуют ручной проверки"];
    case "totalScannedBlanks":
      return [`${safeValue}`, "Загружено бланков"];
    case "scoredBlanks":
      return [`${safeValue}`, "Оценено работ"];
    case "grade":
      return [`${safeValue}`, "Оценка"];
    default:
      return [`${safeValue}`, safeName || "Значение"];
  }
}

export function AnalyticsOverviewPage() {
  const navigate = useNavigate();
  const overviewQuery = useQuery({ queryKey: ["analytics-overview"], queryFn: fetchOverview });
  const overview = overviewQuery.data;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Аналитика</Typography>
        <Typography color="text.secondary">
          Здесь собрана общая статистика по всем тестам: сколько работ проверено, где нужна ручная проверка и какие результаты показывают классы.
        </Typography>
      </Box>

      {overviewQuery.isError ? <Alert severity="error">Не удалось загрузить общую статистику.</Alert> : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label="Всего тестов" value={overview?.totalTests ?? 0} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label="Загружено бланков" value={overview?.totalScannedBlanks ?? 0} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label="Требуют внимания" value={overview?.totalNeedsReview ?? 0} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label="Средний результат" value={`${overview?.averagePercentage ?? 0}%`} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard title="Распределение оценок">
            <Box sx={{ height: 320 }}>
              {overview?.overallGradeDistribution?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={overview.overallGradeDistribution} dataKey="count" nameKey="grade" outerRadius={110}>
                      {overview.overallGradeDistribution.map((item, index) => (
                        <Cell key={item.grade} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={formatOverviewTooltipValue} labelFormatter={(label) => formatOverviewTooltipLabel(label)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography color="text.secondary">Пока нет данных по оценкам.</Typography>
                </Box>
              )}
            </Box>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard title="Средний процент по тестам">
            <Box sx={{ height: 320 }}>
              {overview?.tests?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.tests}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" hide />
                    <YAxis />
                    <Tooltip formatter={formatOverviewTooltipValue} labelFormatter={(label) => `Тест: ${label ?? "—"}`} />
                    <Bar dataKey="averagePercentage" fill="#1f4e5f" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography color="text.secondary">Пока нет данных по тестам.</Typography>
                </Box>
              )}
            </Box>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard title="Работы, где нужна ручная проверка">
            <Box sx={{ height: 320 }}>
              {overview?.tests?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.tests}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" hide />
                    <YAxis />
                    <Tooltip formatter={formatOverviewTooltipValue} labelFormatter={(label) => `Тест: ${label ?? "—"}`} />
                    <Bar dataKey="needsReviewCount" fill="#c86b3c" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography color="text.secondary">Пока нет данных по проверке.</Typography>
                </Box>
              )}
            </Box>
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard title="Сколько бланков загружено по тестам">
            <Box sx={{ height: 320 }}>
              {overview?.tests?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.tests}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" hide />
                    <YAxis />
                    <Tooltip formatter={formatOverviewTooltipValue} labelFormatter={(label) => `Тест: ${label ?? "—"}`} />
                    <Bar dataKey="totalScannedBlanks" fill="#2e7d32" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography color="text.secondary">Пока нет загруженных бланков.</Typography>
                </Box>
              )}
            </Box>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard title="Сколько работ уже оценено">
            <Box sx={{ height: 320 }}>
              {overview?.tests?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.tests}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" hide />
                    <YAxis />
                    <Tooltip formatter={formatOverviewTooltipValue} labelFormatter={(label) => `Тест: ${label ?? "—"}`} />
                    <Bar dataKey="scoredBlanks" fill="#c58b00" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography color="text.secondary">Пока нет оценённых работ.</Typography>
                </Box>
              )}
            </Box>
          </SectionCard>
        </Grid>
      </Grid>

      <SectionCard
        title="Тесты и быстрые действия"
        subtitle="Отсюда можно сразу перейти к подробной статистике, загрузке бланков или ручной проверке работ."
      >
        <Stack spacing={2}>
          {overviewQuery.isLoading ? (
            <Typography color="text.secondary">Загружаем статистику...</Typography>
          ) : overview?.tests?.length ? (
            overview.tests.map((test) => (
              <Box
                key={test.testId}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: { xs: "flex-start", md: "center" },
                  flexDirection: { xs: "column", md: "row" },
                  gap: 1.5,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "background.default"
                }}
              >
                <Box>
                  <Typography variant="h6">{test.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {test.subject} • {test.classLevel} • Загружено: {test.totalScannedBlanks} • Средний результат:{" "}
                    {test.averagePercentage}% • Нужна проверка: {test.needsReviewCount}
                  </Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button onClick={() => navigate(`/scan/sessions/${test.testId}`)}>Сканирование</Button>
                  <Button onClick={() => navigate(`/tests/${test.testId}/review`)}>Проверка работ</Button>
                  <Button variant="contained" onClick={() => navigate(`/tests/${test.testId}/analytics`)}>
                    Подробная статистика
                  </Button>
                </Stack>
              </Box>
            ))
          ) : (
            <Alert severity="info">Пока нет данных для аналитики. Создайте тест и загрузите хотя бы один бланк.</Alert>
          )}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
