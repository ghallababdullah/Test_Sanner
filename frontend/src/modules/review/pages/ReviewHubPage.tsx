import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { SectionCard } from "../../../shared/components/SectionCard";
import { fetchOverview } from "../../analytics/api";

export function ReviewHubPage() {
  const navigate = useNavigate();
  const overviewQuery = useQuery({ queryKey: ["analytics-overview"], queryFn: fetchOverview });

  const sortedTests = useMemo(() => {
    return [...(overviewQuery.data?.tests ?? [])].sort((a, b) => b.needsReviewCount - a.needsReviewCount);
  }, [overviewQuery.data?.tests]);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Проверка работ</Typography>
        <Typography color="text.secondary">
          Здесь собраны тесты, в которых уже есть загруженные бланки. Сначала открывайте те, где система советует ручную проверку.
        </Typography>
      </Box>

      {overviewQuery.isError ? <Alert severity="error">Не удалось загрузить список работ для проверки.</Alert> : null}

      <SectionCard
        title="Тесты, где есть бланки"
        subtitle="Список отсортирован так, чтобы сверху были тесты, где больше всего работ требуют внимания."
      >
        <Stack spacing={2}>
          {overviewQuery.isLoading ? (
            <Typography color="text.secondary">Загружаем список работ...</Typography>
          ) : sortedTests.length ? (
            sortedTests.map((test) => (
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
                    {test.subject} • {test.classLevel} • Загружено: {test.totalScannedBlanks} • Проверено: {test.scoredBlanks}
                  </Typography>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                  <Chip
                    color={test.needsReviewCount > 0 ? "warning" : "success"}
                    label={
                      test.needsReviewCount > 0
                        ? `Требуют внимания: ${test.needsReviewCount}`
                        : "Все работы обработаны"
                    }
                  />
                  <Button onClick={() => navigate(`/scan/sessions/${test.testId}`)}>Сканирование</Button>
                  <Button variant="contained" onClick={() => navigate(`/tests/${test.testId}/review`)}>
                    Открыть работы
                  </Button>
                </Stack>
              </Box>
            ))
          ) : (
            <Alert severity="info">Пока нет тестов с загруженными бланками. Сначала загрузите хотя бы одну работу.</Alert>
          )}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
