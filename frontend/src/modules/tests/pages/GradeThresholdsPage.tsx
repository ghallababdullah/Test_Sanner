import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useNavigate, useParams } from "react-router-dom";
import { createGradeThresholds, fetchGradeThresholds, fetchTestDetails } from "../api";
import { SectionCard } from "../../../shared/components/SectionCard";
import type { CreateGradeThresholdRequest } from "../../../shared/types/tests";

interface ThresholdRow {
  gradeName: string;
  gradeSymbol: string;
  minPercentage: number;
  maxPercentage: number;
}

const defaultThresholds: ThresholdRow[] = [
  { gradeName: "Неудовлетворительно", gradeSymbol: "2", minPercentage: 0, maxPercentage: 49 },
  { gradeName: "Удовлетворительно", gradeSymbol: "3", minPercentage: 50, maxPercentage: 69 },
  { gradeName: "Хорошо", gradeSymbol: "4", minPercentage: 70, maxPercentage: 84 },
  { gradeName: "Отлично", gradeSymbol: "5", minPercentage: 85, maxPercentage: 100 }
];

export function GradeThresholdsPage() {
  const { testId = "" } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ThresholdRow[]>(defaultThresholds);
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

  useEffect(() => {
    if (thresholdsQuery.data && thresholdsQuery.data.length > 0) {
      setRows(
        thresholdsQuery.data.map((item) => ({
          gradeName: item.gradeName,
          gradeSymbol: item.gradeSymbol,
          minPercentage: item.minPercentage,
          maxPercentage: item.maxPercentage
        }))
      );
      return;
    }

    if (thresholdsQuery.data && thresholdsQuery.data.length === 0) {
      setRows(defaultThresholds);
    }
  }, [thresholdsQuery.data]);

  const validationMessage = useMemo(() => {
    if (rows.length === 0) {
      return "Добавьте хотя бы один порог оценки.";
    }

    for (const row of rows) {
      if (!row.gradeName.trim() || !row.gradeSymbol.trim()) {
        return "У каждого порога должны быть название и обозначение.";
      }
      if (row.minPercentage < 0 || row.maxPercentage > 100 || row.minPercentage > row.maxPercentage) {
        return "Проверьте диапазоны процентов: от 0 до 100 и без перевёрнутых границ.";
      }
    }

    return null;
  }, [rows]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: CreateGradeThresholdRequest[] = rows.map((row) => ({
        gradeName: row.gradeName.trim(),
        gradeSymbol: row.gradeSymbol.trim(),
        minPercentage: Number(row.minPercentage),
        maxPercentage: Number(row.maxPercentage)
      }));
      await createGradeThresholds(testId, payload);
    },
    onSuccess: () => {
      setSaveError(null);
      setSaveSuccess("Пороги оценок сохранены.");
    },
    onError: () => {
      setSaveSuccess(null);
      setSaveError("Не удалось сохранить пороги оценок. Проверьте заполнение полей и повторите попытку.");
    }
  });

  const updateRow = <K extends keyof ThresholdRow>(index: number, field: K, value: ThresholdRow[K]) => {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    setRows((current) => [
      ...current,
      { gradeName: "Новая оценка", gradeSymbol: String(current.length + 2), minPercentage: 0, maxPercentage: 100 }
    ]);
  };

  const removeRow = (index: number) => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  if (detailsQuery.isLoading || thresholdsQuery.isLoading) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
        <Typography color="text.secondary">Загрузка порогов оценок...</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Пороги оценок</Typography>
        <Typography color="text.secondary">
          Сохранение здесь полностью обновляет шкалу для теста. Удобно сначала настроить стандартную шкалу, а потом подправить границы.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <SectionCard title="О шкале">
            <Stack spacing={1.5}>
              <Typography>Тест: {detailsQuery.data?.title}</Typography>
              <Typography>Текущих порогов: {rows.length}</Typography>
              <Typography color="text.secondary">
                Обычно хватает четырёх строк: 2, 3, 4 и 5. Но при необходимости можно использовать любую собственную шкалу.
              </Typography>
            </Stack>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <SectionCard title="Быстрые действия">
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={addRow}>
                Добавить порог
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  setRows(defaultThresholds);
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
        {rows.map((row, index) => (
          <SectionCard
            key={`${row.gradeSymbol}-${index}`}
            title={`Порог ${index + 1}`}
            subtitle="Укажите название оценки, условное обозначение и диапазон процентов."
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
              <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="От %"
                  value={row.minPercentage}
                  onChange={(event) => updateRow(index, "minPercentage", Number(event.target.value))}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="До %"
                  value={row.maxPercentage}
                  onChange={(event) => updateRow(index, "maxPercentage", Number(event.target.value))}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Stack alignItems={{ xs: "stretch", md: "flex-end" }}>
                  <IconButton
                    color="error"
                    aria-label="Удалить порог"
                    onClick={() => removeRow(index)}
                    disabled={rows.length === 1}
                  >
                    <DeleteOutlineRoundedIcon />
                  </IconButton>
                </Stack>
              </Grid>
            </Grid>
          </SectionCard>
        ))}
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
          {saveMutation.isPending ? "Сохраняем..." : "Сохранить пороги"}
        </Button>
        <Button variant="outlined" size="large" onClick={() => navigate(`/tests/${testId}`)}>
          Вернуться к тесту
        </Button>
      </Stack>
    </Stack>
  );
}
