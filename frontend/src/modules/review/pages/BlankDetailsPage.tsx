import { useQuery } from "@tanstack/react-query";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { fetchBlankDetails } from "../api";
import { SectionCard } from "../../../shared/components/SectionCard";

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

export function BlankDetailsPage() {
  const { blankId = "" } = useParams();
  const detailsQuery = useQuery({ queryKey: ["blank-details", blankId], queryFn: () => fetchBlankDetails(blankId), enabled: !!blankId });
  const data = detailsQuery.data;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Бланк</Typography>
        <Typography color="text.secondary">{data?.studentName ?? "Загрузка..."}</Typography>
      </Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title="Сводка">
            <Stack spacing={1}>
              <Typography>Класс: {data?.studentClass ?? "—"}</Typography>
              <Typography>Оценка: {data?.grade ?? "—"}</Typography>
              <Typography>Процент: {data?.percentage ?? "—"}%</Typography>
              <Typography>Нужна проверка: {data?.needsReview ? "Да" : "Нет"}</Typography>
              <Typography>Сканирован: {formatDateTime(data?.scannedAt)}</Typography>
            </Stack>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <SectionCard title="Ответы и исправления">
            <Stack spacing={1}>
              <Typography variant="body2">Raw answers: {Object.keys(data?.answers ?? {}).length}</Typography>
              <Typography variant="body2">Corrections: {Object.keys(data?.errorCorrections ?? {}).length}</Typography>
              <Typography variant="body2">Final answers: {Object.keys(data?.finalAnswers ?? {}).length}</Typography>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
