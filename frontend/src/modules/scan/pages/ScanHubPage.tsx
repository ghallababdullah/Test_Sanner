import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { SectionCard } from "../../../shared/components/SectionCard";
import { fetchTests } from "../../tests/api";

export function ScanHubPage() {
  const navigate = useNavigate();
  const testsQuery = useQuery({ queryKey: ["tests"], queryFn: fetchTests });

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Сканирование</Typography>
        <Typography color="text.secondary">
          Чтобы загрузить бланки, сначала выберите тест. Тогда ответы сразу попадут в нужную работу и в нужную статистику.
        </Typography>
      </Box>

      {testsQuery.isError ? (
        <Alert severity="error">Не удалось загрузить список тестов для сканирования.</Alert>
      ) : null}

      <SectionCard
        title="Выберите тест"
        subtitle="После выбора откроется экран загрузки бланков и съёмки с камеры именно для этого теста."
      >
        <Stack spacing={2}>
          {testsQuery.isLoading ? (
            <Typography color="text.secondary">Загружаем тесты...</Typography>
          ) : testsQuery.data?.length ? (
            testsQuery.data.map((test) => (
              <Box
                key={test.id}
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
                    {test.subject} • {test.classLevel} • {test.totalQuestions} вопросов
                  </Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button variant="outlined" onClick={() => navigate(`/tests/${test.id}`)}>
                    Карточка теста
                  </Button>
                  <Button variant="contained" onClick={() => navigate(`/scan/sessions/${test.id}`)}>
                    Открыть сканирование
                  </Button>
                </Stack>
              </Box>
            ))
          ) : (
            <Alert severity="info">
              Пока нет ни одного теста. Сначала создайте тест, и после этого можно будет загружать бланки.
            </Alert>
          )}
        </Stack>
      </SectionCard>

      <Box>
        <Button variant="contained" onClick={() => navigate("/tests/create")}>
          Создать тест
        </Button>
      </Box>
    </Stack>
  );
}
