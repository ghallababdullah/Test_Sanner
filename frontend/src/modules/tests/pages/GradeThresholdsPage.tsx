import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, Box, Button, CircularProgress, Grid, IconButton, Stack, TextField, Typography } from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useNavigate, useParams } from "react-router-dom";
import { createGradeThresholds, fetchGradeThresholds, fetchTestDetails } from "../api";
import { SectionCard } from "../../../shared/components/SectionCard";
import type { CreateGradeThresholdRequest } from "../../../shared/types/tests";

interface CriteriaRow {
  gradeName: string;
  gradeSymbol: string;
  maxErrors: number;
}

function buildDefaultRows(totalQuestions: number): CriteriaRow[] {
  return [
    { gradeName: "Отлично", gradeSymbol: "5", maxErrors: 0 },
    { gradeName: "Хорошо", gradeSymbol: "4", maxErrors: Math.min(1, totalQuestions) },
    { gradeName: "Удовлетворительно", gradeSymbol: "3", maxErrors: Math.min(2, totalQuestions) },
    { gradeName: "Неудовлетворительно", gradeSymbol: "2", maxErrors: totalQuestions }
  ];
}

function percentageFromErrors(totalQuestions: number, errors: number) {
  if (totalQuestions <= 0) return 0;
  return Math.floor(((totalQuestions - errors) / totalQuestions) * 100);
}

function rowsFromThresholds(
  totalQuestions: number,
  thresholds: { gradeName: string; gradeSymbol: string; minPercentage: number }[]
) {
  const sorted = [...thresholds].sort((a, b) => b.minPercentage - a.minPercentage);
  return sorted.map((item) => {
    const estimatedCorrect = Math.ceil((item.minPercentage / 100) * totalQuestions);
    const maxErrors = Math.max(0, totalQuestions - estimatedCorrect);
    return {
      gradeName: item.gradeName,
      gradeSymbol: item.gradeSymbol,
      maxErrors
    };
  });
}

export function GradeThresholdsPage() {
  const { testId = "" } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState<CriteriaRow[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const detailsQuery = useQuery({
    queryKey: ["test-details", testId],
    queryFn: () => fetchTestDetails(testId),
    enabled: !!testId
  });

  const thresholdsQuery = useQuery({
    queryKey: ["grade-thresholds", testId],
    queryFn: () => fetchGradeThresholds(testId),
    enabled: !!testId
  });

  const totalQuestions = detailsQuery.data?.totalQuestions ?? 0;

  useEffect(() => {
    if (!totalQuestions) return;

    if (thresholdsQuery.data && thresholdsQuery.data.length > 0) {
      setRows(rowsFromThresholds(totalQuestions, thresholdsQuery.data));
      return;
    }

    setRows(buildDefaultRows(totalQuestions));
  }, [thresholdsQuery.data, totalQuestions]);

  const validationMessage = useMemo(() => {
    if (rows.length === 0) return "Добавьте хотя бы один критерий оценки.";

    for (const row of rows) {
      if (!row.gradeName.trim() || !row.gradeSymbol.trim()) {
        return "У каждого критерия должны быть название и оценка.";
      }
      if (row.maxErrors < 0 || row.maxErrors > totalQuestions) {
        return `Количество ошибок должно быть от 0 до ${totalQuestions}.`;
      }
    }

    return null;
  }, [rows, totalQuestions]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const sortedRows = [...rows].sort((a, b) => a.maxErrors - b.maxErrors);
      const payload: CreateGradeThresholdRequest[] = sortedRows
        .map((row, index) => {
          const minPercentage = percentageFromErrors(totalQuestions, row.maxErrors);
          const prev = sortedRows[index - 1];
          const maxPercentage =
            index === 0
              ? 100
              : Math.max(minPercentage, percentageFromErrors(totalQuestions, prev.maxErrors) - 1);

          return {
            gradeName: row.gradeName.trim(),
            gradeSymbol: row.gradeSymbol.trim(),
            minPercentage,
            maxPercentage
          };
        })
        .sort((a, b) => a.minPercentage - b.minPercentage);

      await createGradeThresholds(testId, payload);
    },
    onSuccess: () => {
      navigate(`/tests/${testId}`);
    },
    onError: () => {
      setSaveSuccess(null);
      setSaveError("Не удалось сохранить критерии оценки. Проверьте поля и повторите попытку.");
    }
  });

  const updateRow = <K extends keyof CriteriaRow>(index: number, field: K, value: CriteriaRow[K]) => {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    setRows((current) => [
      ...current,
      { gradeName: "Новый критерий", gradeSymbol: String(current.length + 2), maxErrors: totalQuestions }
    ]);
  };

  const removeRow = (index: number) => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  if (detailsQuery.isLoading || thresholdsQuery.isLoading) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
        <Typography color="text.secondary">Загрузка критериев оценки...</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Критерии оценки</Typography>
        <Typography color="text.secondary">
          Укажите, сколько ошибок можно допустить для каждой оценки. Система сама переведёт это в проценты для
          проверки, но вам достаточно работать только с количеством ошибок.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <SectionCard title="О шкале">
            <Stack spacing={1.5}>
              <Typography>Тест: {detailsQuery.data?.title}</Typography>
              <Typography>Вопросов: {totalQuestions}</Typography>
              <Typography>Критериев: {rows.length}</Typography>
            </Stack>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <SectionCard title="Быстрые действия">
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={addRow}>
                Добавить критерий
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  setRows(buildDefaultRows(totalQuestions));
                  setSaveError(null);
                  setSaveSuccess(null);
                }}
              >
                Вернуть стандартную шкалу
              </Button>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>

      {validationMessage ? <Alert severity="warning">{validationMessage}</Alert> : null}
      {saveError ? <Alert severity="error">{saveError}</Alert> : null}
      {saveSuccess ? <Alert severity="success">{saveSuccess}</Alert> : null}

      <Stack spacing={2}>
        {rows.map((row, index) => {
          const minPercentage = percentageFromErrors(totalQuestions, row.maxErrors);

          return (
            <SectionCard
              key={`${row.gradeSymbol}-${index}`}
              title={`Критерий ${index + 1}`}
              subtitle={`Если ошибок ${row.maxErrors}, то это примерно от ${minPercentage}%.`}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Название"
                    value={row.gradeName}
                    onChange={(event) => updateRow(index, "gradeName", event.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                  <TextField
                    fullWidth
                    label="Оценка"
                    value={row.gradeSymbol}
                    onChange={(event) => updateRow(index, "gradeSymbol", event.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Сколько ошибок можно"
                    value={row.maxErrors}
                    onChange={(event) => updateRow(index, "maxErrors", Number(event.target.value))}
                    inputProps={{ min: 0, max: totalQuestions }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                  <TextField fullWidth label="Примерно от %" value={minPercentage} InputProps={{ readOnly: true }} />
                </Grid>
                <Grid size={{ xs: 12, md: 1 }}>
                  <Stack alignItems={{ xs: "stretch", md: "flex-end" }}>
                    <IconButton
                      color="error"
                      aria-label="Удалить критерий"
                      onClick={() => removeRow(index)}
                      disabled={rows.length === 1}
                    >
                      <DeleteOutlineRoundedIcon />
                    </IconButton>
                  </Stack>
                </Grid>
              </Grid>
            </SectionCard>
          );
        })}
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Button
          variant="contained"
          size="large"
          disabled={saveMutation.isPending || Boolean(validationMessage)}
          onClick={() => {
            setSaveSuccess(null);
            setSaveError(null);
            saveMutation.mutate();
          }}
        >
          {saveMutation.isPending ? "Сохраняем..." : "Сохранить критерии"}
        </Button>
        <Button variant="outlined" size="large" onClick={() => navigate(`/tests/${testId}`)}>
          Вернуться к тесту
        </Button>
      </Stack>
    </Stack>
  );
}
