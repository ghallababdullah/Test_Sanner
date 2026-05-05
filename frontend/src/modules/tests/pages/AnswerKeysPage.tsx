import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { createAnswerKeys, fetchAnswerKeys, fetchTestDetails, updateAnswerKey } from "../api";
import { SectionCard } from "../../../shared/components/SectionCard";
import type { AnswerKeyResponse, CreateAnswerKeyRequest } from "../../../shared/types/tests";

type AnswerType = "TEXT" | "MULTIPLE_CHOICE" | "NUMERIC";

interface AnswerKeyRow {
  id?: string;
  questionNumber: number;
  correctAnswer: string;
  maxPoints: number;
  toleranceLevel: number;
  answerType: AnswerType;
}

function defaultAnswerType(questionNumber: number): AnswerType {
  const numericQuestions = new Set([2, 3, 9, 14, 17, 22, 27, 31]);
  return numericQuestions.has(questionNumber) ? "NUMERIC" : "TEXT";
}

function buildRows(totalQuestions: number, keys: AnswerKeyResponse[]): AnswerKeyRow[] {
  const byQuestion = new Map(keys.map((item) => [item.questionNumber, item]));
  return Array.from({ length: totalQuestions }, (_, index) => {
    const questionNumber = index + 1;
    const existing = byQuestion.get(questionNumber);
    return {
      id: existing?.id,
      questionNumber,
      correctAnswer: existing?.correctAnswer ?? "",
      maxPoints: existing?.maxPoints ?? 1,
      toleranceLevel: existing?.toleranceLevel ?? 0,
      answerType: existing?.answerType ?? defaultAnswerType(questionNumber)
    };
  });
}

export function AnswerKeysPage() {
  const { testId = "" } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState<AnswerKeyRow[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const detailsQuery = useQuery({
    queryKey: ["test-details", testId],
    queryFn: () => fetchTestDetails(testId),
    enabled: !!testId
  });

  const answerKeysQuery = useQuery({
    queryKey: ["answer-keys", testId],
    queryFn: () => fetchAnswerKeys(testId),
    enabled: !!testId
  });

  const totalQuestions = detailsQuery.data?.totalQuestions ?? 0;
  const existingKeys = answerKeysQuery.data ?? [];

  useEffect(() => {
    if (!totalQuestions) {
      return;
    }
    setRows(buildRows(totalQuestions, existingKeys));
  }, [existingKeys, totalQuestions]);

  const completionStats = useMemo(() => {
    const filled = rows.filter((row) => row.correctAnswer.trim().length > 0).length;
    return { filled, total: rows.length };
  }, [rows]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const normalizedRows = rows
        .map((row) => ({
          ...row,
          correctAnswer: row.correctAnswer.trim(),
          maxPoints: Number(row.maxPoints) || 1,
          toleranceLevel: Number(row.toleranceLevel) || 0
        }))
        .filter((row) => row.correctAnswer.length > 0);

      const existingRows = normalizedRows.filter((row) => row.id);
      const newRows = normalizedRows.filter((row) => !row.id);

      await Promise.all(
        existingRows.map((row) =>
          updateAnswerKey(testId, row.id!, {
            correctAnswer: row.correctAnswer,
            maxPoints: row.maxPoints,
            toleranceLevel: row.toleranceLevel
          })
        )
      );

      if (newRows.length > 0) {
        const payload: CreateAnswerKeyRequest[] = newRows.map((row) => ({
          questionNumber: row.questionNumber,
          correctAnswer: row.correctAnswer,
          maxPoints: row.maxPoints,
          toleranceLevel: row.toleranceLevel,
          answerType: row.answerType
        }));
        await createAnswerKeys(testId, payload);
      }
    },
    onSuccess: () => {
      setSaveError(null);
      setSaveSuccess("Ключи ответов сохранены.");
    },
    onError: () => {
      setSaveSuccess(null);
      setSaveError("Не удалось сохранить ключи ответов. Проверьте заполнение полей и попробуйте ещё раз.");
    }
  });

  const updateRow = <K extends keyof AnswerKeyRow>(questionNumber: number, field: K, value: AnswerKeyRow[K]) => {
    setRows((current) =>
      current.map((row) => (row.questionNumber === questionNumber ? { ...row, [field]: value } : row))
    );
  };

  if (detailsQuery.isLoading || answerKeysQuery.isLoading) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
        <Typography color="text.secondary">Загрузка ключей ответов...</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Ключи ответов</Typography>
        <Typography color="text.secondary">
          Заполните правильные ответы для каждого вопроса. На телефоне удобнее двигаться по карточкам сверху вниз.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title="Сводка">
            <Stack spacing={1.5}>
              <Typography>Тест: {detailsQuery.data?.title}</Typography>
              <Typography>Вопросов: {totalQuestions}</Typography>
              <Typography>Заполнено: {completionStats.filled} из {completionStats.total}</Typography>
              <Typography color="text.secondary">
                Для существующих ключей можно обновлять ответ, баллы и допуск. Тип ответа пока фиксируется при первом создании.
              </Typography>
            </Stack>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <SectionCard title="Подсказки">
            <Stack spacing={1.5}>
              <Typography color="text.secondary">
                Для текстовых ответов вводите слово или фразу без лишних комментариев.
              </Typography>
              <Typography color="text.secondary">
                Для числовых ответов можно использовать цифры и запятые, как в бланке.
              </Typography>
              <Typography color="text.secondary">
                Если у задания один балл, оставьте значение по умолчанию. Допуск нужен только там, где он действительно используется.
              </Typography>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>

      {saveError ? <Alert severity="error">{saveError}</Alert> : null}
      {saveSuccess ? <Alert severity="success">{saveSuccess}</Alert> : null}

      <Stack spacing={2}>
        {rows.map((row) => (
          <SectionCard
            key={row.questionNumber}
            title={`Вопрос ${row.questionNumber}`}
            subtitle={row.id ? "Ключ уже существует и будет обновлён." : "Новый ключ будет создан при сохранении."}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Правильный ответ"
                  value={row.correctAnswer}
                  onChange={(event) => updateRow(row.questionNumber, "correctAnswer", event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Баллы"
                  value={row.maxPoints}
                  onChange={(event) => updateRow(row.questionNumber, "maxPoints", Number(event.target.value))}
                  inputProps={{ min: 1, step: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Допуск"
                  value={row.toleranceLevel}
                  onChange={(event) => updateRow(row.questionNumber, "toleranceLevel", Number(event.target.value))}
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel id={`answer-type-${row.questionNumber}`}>Тип</InputLabel>
                  <Select
                    labelId={`answer-type-${row.questionNumber}`}
                    label="Тип"
                    value={row.answerType}
                    disabled={Boolean(row.id)}
                    onChange={(event) => updateRow(row.questionNumber, "answerType", event.target.value as AnswerType)}
                  >
                    <MenuItem value="TEXT">Текст</MenuItem>
                    <MenuItem value="NUMERIC">Число</MenuItem>
                    <MenuItem value="MULTIPLE_CHOICE">Выбор</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </SectionCard>
        ))}
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Button
          variant="contained"
          size="large"
          disabled={saveMutation.isPending}
          onClick={() => {
            setSaveSuccess(null);
            setSaveError(null);
            saveMutation.mutate();
          }}
        >
          {saveMutation.isPending ? "Сохраняем..." : "Сохранить ключи"}
        </Button>
        <Button variant="outlined" size="large" onClick={() => navigate(`/tests/${testId}/grade-thresholds`)}>
          Перейти к порогам оценок
        </Button>
        <Button variant="text" size="large" onClick={() => navigate(`/tests/${testId}`)}>
          Вернуться к тесту
        </Button>
      </Stack>
    </Stack>
  );
}
