import { useQuery } from "@tanstack/react-query";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { SectionCard } from "../../../shared/components/SectionCard";
import { fetchTestDetails } from "../api";

export function TestDetailsPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const detailsQuery = useQuery({
    queryKey: ["test-details", testId],
    queryFn: () => fetchTestDetails(testId!),
    enabled: !!testId
  });
  const test = detailsQuery.data;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Карточка теста</Typography>
        <Typography color="text.secondary">
          {test ? `${test.title} • ${test.subject} • ${test.classLevel}` : `Тест ID: ${testId}`}
        </Typography>
      </Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title="Основные данные">
            <Stack spacing={1}>
              <Typography>Вопросов: {test?.totalQuestions ?? "—"}</Typography>
              <Typography>Макс. балл: {test?.maxScore ?? "—"}</Typography>
              <Typography>Ответов: {test?.answerKeys?.length ?? 0}</Typography>
              <Typography>Порогов: {test?.gradeThresholds?.length ?? 0}</Typography>
            </Stack>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <SectionCard title="Описание">
            <Typography color="text.secondary">{test?.description || "Описание пока не добавлено."}</Typography>
          </SectionCard>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Подготовка теста" subtitle="Ключевые действия перед сканированием.">
            <Stack spacing={2}>
              <Button variant="contained" onClick={() => navigate(`/tests/${testId}/answer-keys`)}>Редактировать ответы</Button>
              <Button variant="contained" color="secondary" onClick={() => navigate(`/tests/${testId}/grade-thresholds`)}>Редактировать критерии оценки</Button>
              <Button variant="outlined" onClick={() => navigate(`/tests/${testId}/edit`)}>Редактировать тест</Button>
              <Button variant="outlined" onClick={() => navigate(`/tests/${testId}/analytics`)}>Открыть аналитику</Button>
            </Stack>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Сканирование и проверка" subtitle="Рабочий поток учителя.">
            <Stack spacing={2}>
              <Button variant="contained" onClick={() => navigate(`/scan/sessions/${testId}`)}>Начать сессию сканирования</Button>
              <Button variant="outlined" onClick={() => navigate(`/tests/${testId}/review`)}>Открыть очередь проверки</Button>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
