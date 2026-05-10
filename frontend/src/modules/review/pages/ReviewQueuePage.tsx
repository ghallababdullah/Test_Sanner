import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { useNavigate, useParams } from "react-router-dom";
import { deleteBlank, fetchTestBlanks } from "../api";
import { SectionCard } from "../../../shared/components/SectionCard";
import { explainScanError } from "../scanErrorMessages";
import { formatProcessingStatus, formatReviewStatus } from "../statusLabels";

function formatDateTime(value?: string) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

export function ReviewQueuePage() {
  const { testId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const blanksQuery = useQuery({
    queryKey: ["blanks", testId],
    queryFn: () => fetchTestBlanks(testId),
    enabled: !!testId
  });

  const deleteMutation = useMutation({
    mutationFn: (blankId: string) => deleteBlank(blankId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blanks", testId] });
    }
  });

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Очередь проверки</Typography>
        <Typography color="text.secondary">
          Здесь хранятся все результаты, включая сканы каждого бланка. Можно открыть бланк для проверки или удалить его полностью.
        </Typography>
      </Box>

      {deleteMutation.isError ? (
        <Alert severity="error">Не удалось удалить бланк. Попробуйте ещё раз.</Alert>
      ) : null}

      <SectionCard title="Все бланки теста" subtitle="Дата и время показывают, когда конкретный бланк был отсканирован.">
        {blanksQuery.isLoading ? (
          <Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
            <CircularProgress />
            <Typography color="text.secondary">Загрузка бланков...</Typography>
          </Stack>
        ) : (
          <Stack spacing={2}>
            {blanksQuery.data?.map((blank) => {
              const scanError = explainScanError(blank.processingError);
              return (
              <Box
                key={blank.id}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "background.default",
                  border: "1px solid rgba(31, 78, 95, 0.08)"
                }}
              >
                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems={{ sm: "flex-start" }}
                  >
                    <Box>
                      <Typography variant="h6">{blank.studentName || "Без имени"}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Класс: {blank.studentClass || "—"} • Сканирован: {formatDateTime(blank.scannedAt)}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {blank.needsReview ? (
                        <Chip label="Нужна проверка" color="warning" />
                      ) : (
                        <Chip label="Автопроверка" color="success" />
                      )}
                      <Chip label={formatProcessingStatus(blank.processingStatus)} variant="outlined" />
                    </Stack>
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    Проверка: {formatReviewStatus(blank.reviewStatus)} • Оценка: {blank.grade ?? "—"} • Процент: {blank.percentage ?? "—"}%
                  </Typography>

                  {scanError ? (
                    <Alert severity="error">
                      <strong>{scanError.title}</strong>
                      <br />
                      {scanError.details}
                    </Alert>
                  ) : null}

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <Button
                      startIcon={<OpenInNewRoundedIcon />}
                      onClick={() => navigate(`/scan/blanks/${blank.id}`)}
                    >
                      Открыть
                    </Button>
                    <Button
                      color="error"
                      startIcon={<DeleteOutlineRoundedIcon />}
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(blank.id)}
                    >
                      Удалить
                    </Button>
                  </Stack>
                </Stack>
              </Box>
              );
            }) ?? <Typography>Нет данных</Typography>}
          </Stack>
        )}
      </SectionCard>
    </Stack>
  );
}
