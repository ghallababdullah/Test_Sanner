import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, Box, Button, CircularProgress, Grid, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { createAnswerKeys, fetchAnswerKeys, fetchTestDetails, updateAnswerKey } from "../api";
import { SectionCard } from "../../../shared/components/SectionCard";
import type { AnswerKeyResponse, CreateAnswerKeyRequest } from "../../../shared/types/tests";

interface AnswerKeyRow {
  id?: string;
  questionNumber: number;
  correctAnswer: string;
}

function normalizeAnswer(value: string) {
  return value.replace(/\s+$/u, "");
}

function buildRows(totalQuestions: number, keys: AnswerKeyResponse[]): AnswerKeyRow[] {
  const byQuestion = new Map(keys.map((item) => [item.questionNumber, item]));
  return Array.from({ length: totalQuestions }, (_, index) => {
    const questionNumber = index + 1;
    const existing = byQuestion.get(questionNumber);
    return {
      id: existing?.id,
      questionNumber,
      correctAnswer: existing?.correctAnswer ?? ""
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
    if (!totalQuestions) return;
    setRows(buildRows(totalQuestions, existingKeys));
  }, [existingKeys, totalQuestions]);

  const completionStats = useMemo(() => {
    const filled = rows.filter((row) => row.correctAnswer.trim().length > 0).length;
    return { filled, total: rows.length };
  }, [rows]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const normalizedRows = rows
        .map((row) => ({ ...row, correctAnswer: normalizeAnswer(row.correctAnswer) }))
        .filter((row) => row.correctAnswer.length > 0);

      const existingRows = normalizedRows.filter((row) => row.id);
      const newRows = normalizedRows.filter((row) => !row.id);

      await Promise.all(
        existingRows.map((row) =>
          updateAnswerKey(testId, row.id!, {
            correctAnswer: row.correctAnswer,
            maxPoints: 1,
            toleranceLevel: 1
          })
        )
      );

      if (newRows.length > 0) {
        const payload: CreateAnswerKeyRequest[] = newRows.map((row) => ({
          questionNumber: row.questionNumber,
          correctAnswer: row.correctAnswer,
          maxPoints: 1,
          toleranceLevel: 1,
          answerType: "TEXT"
        }));
        await createAnswerKeys(testId, payload);
      }
    },
    onSuccess: () => {
      navigate(`/tests/${testId}`);
    },
    onError: () => {
      setSaveSuccess(null);
      setSaveError("Не удалось сохранить правильные ответы. Проверьте поля и повторите попытку.");
    }
  });

  const updateRow = (questionNumber: number, value: string) => {
    setRows((current) =>
      current.map((row) => (row.questionNumber === questionNumber ? { ...row, correctAnswer: value } : row))
    );
  };

  if (detailsQuery.isLoading || answerKeysQuery.isLoading) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
        <Typography color="text.secondary">Загрузка правильных ответов...</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Правильные ответы</Typography>
        <Typography color="text.secondary">
          Для каждого вопроса укажите только правильный текст ответа. Система будет проверять точное совпадение,
          без допусков и частичных совпадений.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title="Сводка">
            <Stack spacing={1.5}>
              <Typography>Тест: {detailsQuery.data?.title}</Typography>
              <Typography>Вопросов: {totalQuestions}</Typography>
              <Typography>
                Заполнено: {completionStats.filled} из {completionStats.total}
              </Typography>
            </Stack>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <SectionCard title="Важно">
            <Stack spacing={1}>
              <Typography color="text.secondary">Тип ответа всегда используется как текст.</Typography>
              <Typography color="text.secondary">Ответ считается правильным только при точном совпадении.</Typography>
              <Typography color="text.secondary">Баллы за отдельные вопросы здесь не задаются.</Typography>
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
            subtitle={row.id ? "Ответ будет обновлён." : "Ответ будет создан при сохранении."}
          >
            <TextField
              fullWidth
              label="Правильный ответ"
              value={row.correctAnswer}
              onChange={(event) => updateRow(row.questionNumber, event.target.value)}
              onBlur={(event) => updateRow(row.questionNumber, normalizeAnswer(event.target.value))}
            />
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
          {saveMutation.isPending ? "Сохраняем..." : "Сохранить ответы"}
        </Button>
        <Button variant="outlined" size="large" onClick={() => navigate(`/tests/${testId}/grade-thresholds`)}>
          Перейти к критериям оценки
        </Button>
        <Button variant="text" size="large" onClick={() => navigate(`/tests/${testId}`)}>
          Вернуться к тесту
        </Button>
      </Stack>
    </Stack>
  );
}
