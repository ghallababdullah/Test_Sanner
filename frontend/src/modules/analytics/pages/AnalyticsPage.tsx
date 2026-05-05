import { useQuery } from "@tanstack/react-query";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useNavigate, useParams } from "react-router-dom";
import { fetchQuestionBreakdown, fetchTestSummary } from "../api";
import { MetricCard } from "../../../shared/components/MetricCard";
import { SectionCard } from "../../../shared/components/SectionCard";

const chartColors = ["#1f4e5f", "#c86b3c", "#2e7d32", "#c58b00", "#c0392b"];

export function AnalyticsPage() {
  const { testId = "" } = useParams();
  const navigate = useNavigate();
  const summaryQuery = useQuery({ queryKey: ["test-summary", testId], queryFn: () => fetchTestSummary(testId), enabled: !!testId });
  const questionsQuery = useQuery({ queryKey: ["questions", testId], queryFn: () => fetchQuestionBreakdown(testId), enabled: !!testId });

  const summary = summaryQuery.data;
  const breakdown = questionsQuery.data;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Аналитика теста</Typography>
        <Typography color="text.secondary">{summary?.title ?? "Загрузка аналитики..."}</Typography>
      </Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}><MetricCard label="Отсканировано" value={summary?.totalScannedBlanks ?? 0} /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><MetricCard label="Проверено" value={summary?.scoredBlanks ?? 0} /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><MetricCard label="Средний балл" value={summary?.averageScore ?? 0} /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><MetricCard label="Средний процент" value={`${summary?.averagePercentage ?? 0}%`} /></Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <SectionCard title="Распределение оценок">
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={summary?.gradeDistribution ?? []} dataKey="count" nameKey="grade" outerRadius={110}>
                    {(summary?.gradeDistribution ?? []).map((item, index) => (
                      <Cell key={item.grade} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <SectionCard title="Точность по вопросам">
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown?.questions ?? []}>
                  <XAxis dataKey="questionNumber" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="accuracyPercentage" fill="#1f4e5f" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </Grid>
      </Grid>

      <SectionCard title="Самые сложные вопросы">
        <Stack spacing={1}>
          {summary?.topMostIncorrectQuestions.map((item) => (
            <Box key={item.questionNumber} sx={{ display: "flex", justifyContent: "space-between", p: 1.5, borderRadius: 3, bgcolor: "background.default" }}>
              <Typography>Вопрос {item.questionNumber}</Typography>
              <Typography color="text.secondary">Точность: {item.accuracyPercentage}%</Typography>
            </Box>
          )) ?? <Typography>Нет данных</Typography>}
        </Stack>
      </SectionCard>

      <SectionCard title="Лучшие результаты теста" subtitle="Самые высокие результаты по проценту и набранным баллам.">
        <Stack spacing={1.5}>
          {summary?.topPerformers?.length ? (
            summary.topPerformers.map((item) => (
              <Box
                key={item.blankId}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: { xs: "flex-start", md: "center" },
                  flexDirection: { xs: "column", md: "row" },
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: "background.default"
                }}
              >
                <Box>
                  <Typography fontWeight={700}>{item.studentName || "Без имени"}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Класс: {item.studentClass || "—"} • Баллы: {item.rawScore}/{item.maxScore} • Процент: {item.percentage}%
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography color="text.secondary">Оценка: {item.grade || "—"}</Typography>
                  {item.blankId ? (
                    <Typography
                      component="button"
                      onClick={() => navigate(`/scan/blanks/${item.blankId}`)}
                      sx={{
                        border: 0,
                        bgcolor: "transparent",
                        color: "primary.main",
                        cursor: "pointer",
                        font: "inherit"
                      }}
                    >
                      Открыть бланк
                    </Typography>
                  ) : null}
                </Stack>
              </Box>
            ))
          ) : (
            <Typography>Пока нет данных о лучших результатах.</Typography>
          )}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
