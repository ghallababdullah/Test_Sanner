import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { useNavigate, useParams } from "react-router-dom";
import { applyBlankCorrections, fetchBlankAsset, fetchBlankDetails } from "../api";
import { SectionCard } from "../../../shared/components/SectionCard";
import { fetchAnswerKeys } from "../../tests/api";

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

function formatStatus(status?: string) {
  switch (status) {
    case "OCR_COMPLETED":
      return "OCR завершён";
    case "PROCESSING":
      return "Обрабатывается";
    case "QUEUED":
      return "В очереди";
    case "OCR_FAILED":
      return "Ошибка OCR";
    default:
      return status ?? "—";
  }
}

function formatMatchType(matchType?: string) {
  switch (matchType) {
    case "EXACT_MATCH":
      return "Полное совпадение";
    case "ONE_CHAR_DIFF":
      return "Отличие в 1 символ";
    case "TWO_CHAR_DIFF":
      return "Отличие в 2 символа";
    case "NO_MATCH":
      return "Нет совпадения";
    case "PENDING_SCORING":
      return "Оценивание не готово";
    default:
      return matchType ?? "—";
  }
}

function matchTypeColor(matchType?: string): "success" | "warning" | "error" | "default" {
  switch (matchType) {
    case "EXACT_MATCH":
      return "success";
    case "ONE_CHAR_DIFF":
    case "TWO_CHAR_DIFF":
      return "warning";
    case "NO_MATCH":
      return "error";
    case "PENDING_SCORING":
      return "default";
    default:
      return "default";
  }
}

function formatConfidence(value?: number) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return `${Math.round(value * 100)}%`;
}

function getConfidenceBadge(value?: number, reviewRecommended?: boolean): { label: string; color: "success" | "warning" | "error" | "default" } {
  if (value == null) {
    return { label: "Нет confidence", color: "default" };
  }
  if (reviewRecommended || value < 0.75) {
    return { label: `Низкая уверенность ${formatConfidence(value)}`, color: "error" };
  }
  if (value < 0.9) {
    return { label: `Средняя уверенность ${formatConfidence(value)}`, color: "warning" };
  }
  return { label: `Высокая уверенность ${formatConfidence(value)}`, color: "success" };
}

function useAssetUrl(blob?: Blob) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  return url;
}

export function BlankDetailsPage() {
  const { blankId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [previewTab, setPreviewTab] = useState<"annotated" | "processed" | "original">("annotated");
  const [draftCorrections, setDraftCorrections] = useState<Record<string, string>>({});

  const detailsQuery = useQuery({
    queryKey: ["blank-details", blankId],
    queryFn: () => fetchBlankDetails(blankId),
    enabled: !!blankId
  });

  const answerKeysQuery = useQuery({
    queryKey: ["answer-keys-for-blank", detailsQuery.data?.testId],
    queryFn: () => fetchAnswerKeys(detailsQuery.data!.testId),
    enabled: !!detailsQuery.data?.testId
  });

  const originalAssetQuery = useQuery({
    queryKey: ["blank-asset", blankId, "original"],
    queryFn: () => fetchBlankAsset(blankId, "original"),
    enabled: !!blankId
  });

  const processedAssetQuery = useQuery({
    queryKey: ["blank-asset", blankId, "processed"],
    queryFn: () => fetchBlankAsset(blankId, "processed"),
    enabled: !!blankId
  });

  const annotatedAssetQuery = useQuery({
    queryKey: ["blank-asset", blankId, "annotated"],
    queryFn: () => fetchBlankAsset(blankId, "annotated"),
    enabled: !!blankId,
    retry: false
  });

  useEffect(() => {
    if (detailsQuery.data) {
      setDraftCorrections(detailsQuery.data.errorCorrections ?? {});
    }
  }, [detailsQuery.data]);

  const applyCorrectionsMutation = useMutation({
    mutationFn: async () => {
      const payload = Object.fromEntries(
        Object.entries(draftCorrections)
          .map(([key, value]) => [key, value.trim()])
          .filter(([, value]) => value.length > 0)
      );

      return applyBlankCorrections(blankId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["blank-details", blankId] });
      await queryClient.invalidateQueries({ queryKey: ["test-blanks"] });
    }
  });

  const data = detailsQuery.data;
  const originalUrl = useAssetUrl(originalAssetQuery.data);
  const processedUrl = useAssetUrl(processedAssetQuery.data);
  const annotatedUrl = useAssetUrl(annotatedAssetQuery.data);

  const previewUrl = useMemo(() => {
    if (previewTab === "annotated") {
      return annotatedUrl ?? processedUrl ?? originalUrl;
    }
    if (previewTab === "processed") {
      return processedUrl ?? originalUrl;
    }
    return originalUrl;
  }, [annotatedUrl, originalUrl, previewTab, processedUrl]);

  const previewHint = useMemo(() => {
    if (previewTab === "annotated") {
      return annotatedUrl
        ? "Это схема разметки полей. По ней видно, как система разделила бланк на области для распознавания."
        : "Схема разметки полей пока недоступна, поэтому временно показываем выровненный бланк.";
    }
    if (previewTab === "processed") {
      return "Это выровненное изображение после детекции листа и перспективного преобразования.";
    }
    return "Это исходное изображение, которое пользователь загрузил или снял камерой.";
  }, [annotatedUrl, previewTab]);

  const sortedAnswerGrades = useMemo(() => {
    const existingGrades = [...(data?.answerGrades ?? [])].sort((left, right) => left.questionNumber - right.questionNumber);
    if (existingGrades.length > 0) {
      return existingGrades;
    }

    const answerMap = data?.answers ?? {};
    const finalAnswerMap = data?.finalAnswers ?? {};
    const scannedBlankId = data?.id ?? "";

    return [...(answerKeysQuery.data ?? [])]
      .sort((left, right) => left.questionNumber - right.questionNumber)
      .map((answerKey) => {
        const questionKey = String(answerKey.questionNumber);
        const rawAnswer = answerMap[questionKey] ?? "";
        const finalAnswer = finalAnswerMap[questionKey] ?? rawAnswer;

        return {
          id: `fallback-${questionKey}`,
          scannedBlankId,
          questionNumber: answerKey.questionNumber,
          correctAnswer: answerKey.correctAnswer,
          studentAnswer: rawAnswer,
          finalAnswer,
          score: 0,
          maxPoints: answerKey.maxPoints,
          matchType: "PENDING_SCORING"
        };
      });
  }, [answerKeysQuery.data, data?.answerGrades, data?.answers, data?.finalAnswers, data?.id]);

  const changedCorrectionsCount = useMemo(
    () =>
      Object.entries(draftCorrections).filter(([key, value]) => {
        const normalized = value.trim();
        return normalized.length > 0 && normalized !== (data?.errorCorrections?.[key] ?? "");
      }).length,
    [data?.errorCorrections, draftCorrections]
  );

  const canApplyCorrections = useMemo(
    () =>
      Object.values(draftCorrections).some((value) => value.trim().length > 0),
    [draftCorrections]
  );

  if (detailsQuery.isLoading && !data) {
    return (
      <Box sx={{ minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (detailsQuery.isError || !data) {
    return <Alert severity="error">Не удалось загрузить карточку бланка.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Бланк</Typography>
        <Typography color="text.secondary">{data.studentName || "Без имени"}</Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <SectionCard title="Сводка">
              <Stack spacing={1.25}>
                <Typography>Класс: {data.studentClass || "—"}</Typography>
                <Typography>Дата теста: {data.testDate || "—"}</Typography>
                <Typography>Оценка: {data.grade || "—"}</Typography>
                <Typography>
                  Балл: {data.rawScore}/{data.maxScore}
                </Typography>
                <Typography>Процент: {data.percentage ?? 0}%</Typography>
                <Typography>Нужна проверка: {data.needsReview ? "Да" : "Нет"}</Typography>
                <Typography>Сканирован: {formatDateTime(data.scannedAt)}</Typography>
                <Typography>Обработан: {formatDateTime(data.processedAt)}</Typography>
              </Stack>
            </SectionCard>

            <SectionCard title="Статус распознавания">
              <Stack spacing={1.5}>
                <Chip
                  color={data.processingStatus === "OCR_COMPLETED" ? "success" : data.processingStatus === "OCR_FAILED" ? "error" : "warning"}
                  label={formatStatus(data.processingStatus)}
                />
                {data.processingError ? <Alert severity="error">{data.processingError}</Alert> : null}
                <Button
                  variant="outlined"
                  startIcon={<VisibilityRoundedIcon />}
                  onClick={() => navigate(`/scan/blanks/${blankId}/roi-review`)}
                >
                  Проверить разметку полей
                </Button>
              </Stack>
            </SectionCard>

            <SectionCard title="Ответы и исправления">
              <Stack spacing={1}>
                <Typography variant="body2">Распознано ответов: {Object.keys(data.answers ?? {}).length}</Typography>
                <Typography variant="body2">Исправлений на бланке: {Object.keys(data.errorCorrections ?? {}).length}</Typography>
                <Typography variant="body2">Финальных ответов: {Object.keys(data.finalAnswers ?? {}).length}</Typography>
                <Typography variant="body2">Изменено вручную сейчас: {changedCorrectionsCount}</Typography>
              </Stack>
            </SectionCard>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <SectionCard title="Изображение бланка" subtitle={previewHint}>
            <Stack spacing={2}>
              <Tabs value={previewTab} onChange={(_, value) => setPreviewTab(value)} variant="scrollable">
                <Tab value="annotated" label="Разметка полей" />
                <Tab value="processed" label="Выровненный" />
                <Tab value="original" label="Оригинал" />
              </Tabs>

              {previewTab === "annotated" && annotatedAssetQuery.isError ? (
                <Alert severity="info">
                  Схема разметки полей для этого бланка пока не найдена. Если вы выбрали режим предварительной проверки,
                  сначала откройте страницу разметки. Пока временно используем выровненное изображение.
                </Alert>
              ) : null}

              {(originalAssetQuery.isLoading || processedAssetQuery.isLoading || detailsQuery.isLoading) && !previewUrl ? (
                <Box sx={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CircularProgress />
                </Box>
              ) : previewUrl ? (
                <Box
                  component="img"
                  src={previewUrl}
                  alt="Бланк"
                  sx={{
                    width: "100%",
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.default"
                  }}
                />
              ) : (
                <Alert severity="warning">
                  Не удалось получить изображение для предпросмотра. Проверьте, что файлы обработки сохранились для этого бланка.
                </Alert>
              )}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>

      <SectionCard
        title="Сравнение с эталонными ответами"
        subtitle="Здесь видно, какой ответ увидела система, какой ответ принят как итоговый и какие правки можно внести вручную."
      >
        <Stack spacing={2}>
          {data.answerGrades.length === 0 ? (
            <Alert severity="info">
              Распознавание уже завершено, но детальное оценивание по вопросам ещё не пришло. Поэтому сейчас показываем ответы,
              собранные напрямую из результатов распознавания и ключей теста.
            </Alert>
          ) : null}
          {applyCorrectionsMutation.isError ? (
            <Alert severity="error">
              Не удалось применить исправления. Проверь заполненные значения и попробуй ещё раз.
            </Alert>
          ) : null}
          {applyCorrectionsMutation.isSuccess ? (
            <Alert severity="success">Исправления сохранены. Карточка бланка уже обновлена.</Alert>
          ) : null}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Если система ошиблась, введите правильный ответ в поле нужного вопроса и нажмите «Применить исправления».
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="text"
                onClick={() => setDraftCorrections(data.errorCorrections ?? {})}
                disabled={applyCorrectionsMutation.isPending}
              >
                Сбросить изменения
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveRoundedIcon />}
                disabled={!canApplyCorrections || applyCorrectionsMutation.isPending}
                onClick={() => applyCorrectionsMutation.mutate()}
              >
                {applyCorrectionsMutation.isPending ? "Сохраняем..." : "Применить исправления"}
              </Button>
            </Stack>
          </Stack>

          <Grid container spacing={2}>
            {sortedAnswerGrades.map((answerGrade) => {
              const questionKey = String(answerGrade.questionNumber);
              const draftValue = draftCorrections[questionKey] ?? "";
              const rawAnswer = data.answers?.[questionKey] ?? answerGrade.studentAnswer ?? "";
              const finalAnswer = data.finalAnswers?.[questionKey] ?? answerGrade.finalAnswer ?? "";
              const existingCorrection = data.errorCorrections?.[questionKey] ?? "";
              const assessment = data.answerAssessments?.[questionKey];
              const confidenceBadge = getConfidenceBadge(assessment?.combinedConfidence, assessment?.reviewRecommended);

              return (
                <Grid key={answerGrade.id || questionKey} size={{ xs: 12, md: 6, xl: 4 }}>
                  <Box
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 3,
                      p: 2,
                      height: "100%"
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Вопрос {questionKey}</Typography>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="flex-end">
                          <Chip size="small" color={matchTypeColor(answerGrade.matchType)} label={formatMatchType(answerGrade.matchType)} />
                          <Chip size="small" color={confidenceBadge.color} label={confidenceBadge.label} />
                        </Stack>
                      </Stack>

                      <Typography variant="body2">
                        Эталон: <strong>{answerGrade.correctAnswer || "—"}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Ответ системы: <strong>{rawAnswer || "—"}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Финальный ответ: <strong>{finalAnswer || "—"}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Баллы: <strong>{answerGrade.matchType === "PENDING_SCORING" ? "—" : answerGrade.score}</strong> / {answerGrade.maxPoints}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Уверенность системы: <strong>{formatConfidence(assessment?.combinedConfidence)}</strong>
                        {assessment?.engine ? ` · источник: ${assessment.engine}` : ""}
                      </Typography>

                      {existingCorrection ? (
                        <Alert severity="info" sx={{ py: 0 }}>
                          Уже применено исправление: {existingCorrection}
                        </Alert>
                      ) : null}

                      <TextField
                        label={`Исправить ответ для №${questionKey}`}
                        value={draftValue}
                        onChange={(event) =>
                          setDraftCorrections((current) => ({
                            ...current,
                            [questionKey]: event.target.value
                          }))
                        }
                        placeholder={answerGrade.correctAnswer || "Введите ответ"}
                        size="small"
                        fullWidth
                      />
                    </Stack>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Stack>
      </SectionCard>
    </Stack>
  );
}
