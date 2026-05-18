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
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { useNavigate, useParams } from "react-router-dom";
import { applyBlankCorrections, fetchBlankAsset, fetchBlankDetails, retryBlankOcr } from "../api";
import { SectionCard } from "../../../shared/components/SectionCard";
import { fetchAnswerKeys } from "../../tests/api";
import { explainScanError } from "../scanErrorMessages";
import { formatMatchType, formatProcessingStatus } from "../statusLabels";

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

function formatConfidence(value?: number) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  return `${Math.round(value * 100)}%`;
}

function matchTypeColor(matchType?: string): "success" | "warning" | "error" | "default" {
  switch (matchType) {
    case "EXACT":
    case "EXACT_MATCH":
      return "success";
    case "TOLERANCE_1":
    case "TOLERANCE_2":
    case "ONE_CHAR_DIFF":
    case "TWO_CHAR_DIFF":
      return "warning";
    case "NO_MATCH":
      return "error";
    default:
      return "default";
  }
}

function formatEngineName(engine?: string) {
  switch (engine) {
    case "tesseract":
      return "Tesseract";
    case "trocr":
      return "TrOCR";
    case "combined":
    case "ensemble":
      return "Совмещённая оценка";
    default:
      return engine ?? "";
  }
}

function getConfidenceBadge(
  value?: number,
  reviewRecommended?: boolean
): { label: string; color: "success" | "warning" | "error" | "default" } {
  if (value == null) {
    return { label: "Нет оценки уверенности", color: "default" };
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

function buildStatusTone(status?: string): "success" | "warning" | "error" {
  if (status === "OCR_COMPLETED") {
    return "success";
  }

  if (status === "OCR_FAILED") {
    return "error";
  }

  return "warning";
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
    enabled: !!blankId,
    refetchInterval: (query) => {
      const status = query.state.data?.processingStatus;
      return status === "QUEUED" || status === "PROCESSING" ? 3000 : false;
    }
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

  const startOcrMutation = useMutation({
    mutationFn: () => retryBlankOcr(blankId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["blank-details", blankId] });
      await queryClient.invalidateQueries({ queryKey: ["test-blanks"] });
    }
  });

  const data = detailsQuery.data;
  const scanError = explainScanError(data?.processingError);
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
        ? "Схема разметки полей. Здесь видно, как система разделила бланк на зоны для распознавания."
        : "Схема разметки пока недоступна, поэтому временно показываем выровненный бланк.";
    }

    if (previewTab === "processed") {
      return "Выровненное изображение после определения листа и исправления перспективы.";
    }

    return "Исходное изображение, которое было загружено или снято камерой.";
  }, [annotatedUrl, previewTab]);

  const sortedAnswerGrades = useMemo(() => {
    const existingGrades = (data?.answerGrades ?? [])
      .filter((grade): grade is NonNullable<typeof grade> => Boolean(grade))
      .sort((left, right) => left.questionNumber - right.questionNumber);
    if (existingGrades.length > 0) {
      return existingGrades;
    }

    const answerMap = data?.answers ?? {};
    const finalAnswerMap = data?.finalAnswers ?? {};
    const scannedBlankId = data?.id ?? "";

    return (answerKeysQuery.data ?? [])
      .filter((answerKey): answerKey is NonNullable<typeof answerKey> => Boolean(answerKey))
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
    () => Object.values(draftCorrections).some((value) => value.trim().length > 0),
    [draftCorrections]
  );

  const isOcrCompleted = data?.processingStatus === "OCR_COMPLETED";
  const canStartOcr = data?.processingStatus === "PENDING_OCR";
  const isOcrInProgress = data?.processingStatus === "QUEUED" || data?.processingStatus === "PROCESSING";

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
      <Box sx={{ borderLeft: "6px solid", borderColor: "primary.main", pl: 2 }}>
        <Typography variant="h4">Карточка бланка</Typography>
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
                  Баллы: {data.rawScore}/{data.maxScore}
                </Typography>
                <Typography>Процент: {data.percentage ?? 0}%</Typography>
                <Typography>Нужна проверка: {data.needsReview ? "Да" : "Нет"}</Typography>
                <Typography>Сканирован: {formatDateTime(data.scannedAt)}</Typography>
                <Typography>Обработан: {formatDateTime(data.processedAt)}</Typography>
              </Stack>
            </SectionCard>

            <SectionCard title="Статус распознавания" subtitle="Сначала подтвердите разметку, затем запустите проверку и дождитесь завершения OCR.">
              <Stack spacing={1.5}>
                <Chip color={buildStatusTone(data.processingStatus)} label={formatProcessingStatus(data.processingStatus)} />
                {scanError ? (
                  <Alert severity="error">
                    <strong>{scanError.title}</strong>
                    <br />
                    {scanError.details}
                    {scanError.nextStep ? (
                      <>
                        <br />
                        Что сделать: {scanError.nextStep}
                      </>
                    ) : null}
                  </Alert>
                ) : null}
                {startOcrMutation.isError ? (
                  <Alert severity="error">Не удалось запустить распознавание. Попробуйте ещё раз.</Alert>
                ) : null}
                <Button
                  variant="outlined"
                  startIcon={<VisibilityRoundedIcon />}
                  onClick={() => navigate(`/scan/blanks/${blankId}/roi-review`)}
                >
                  Проверить разметку полей
                </Button>
                {canStartOcr ? (
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowRoundedIcon />}
                    onClick={() => startOcrMutation.mutate()}
                    disabled={startOcrMutation.isPending}
                  >
                    {startOcrMutation.isPending ? "Запускаем проверку..." : "Начать проверку"}
                  </Button>
                ) : null}
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
                <Tab value="processed" label="Выровненный бланк" />
                <Tab value="original" label="Оригинал" />
              </Tabs>

              {previewTab === "annotated" && annotatedAssetQuery.isError ? (
                <Alert severity="info">
                  Схема разметки для этого бланка пока не найдена. Поэтому временно показываем выровненное изображение.
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
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "#fffdf8"
                  }}
                />
              ) : (
                <Alert severity="warning">Не удалось получить изображение для предпросмотра.</Alert>
              )}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>

      <SectionCard
        title="Сравнение с правильными ответами"
        subtitle="Здесь видно, какой ответ увидела система, какой ответ принят как итоговый и какие правки можно внести вручную."
      >
        <Stack spacing={2}>
          {!isOcrCompleted ? (
            <Alert severity="info">
              {canStartOcr
                ? "Разметка уже подтверждена, но распознавание ещё не запускалось. Нажмите «Начать проверку» в блоке статуса распознавания."
                : isOcrInProgress
                  ? "Распознавание ещё выполняется. Сравнение ответов и ручные исправления станут доступны сразу после завершения."
                  : "Сравнение ответов появится после завершения распознавания."}
            </Alert>
          ) : sortedAnswerGrades.length === 0 ? (
            <Alert severity="info">
              Распознавание уже завершено, но детальное оценивание по вопросам ещё не пришло. Поэтому сейчас показываем ответы,
              собранные напрямую из результатов распознавания и ключей теста.
            </Alert>
          ) : null}

          {applyCorrectionsMutation.isError ? (
            <Alert severity="error">Не удалось применить исправления. Проверьте значения и попробуйте ещё раз.</Alert>
          ) : null}

          {applyCorrectionsMutation.isSuccess ? (
            <Alert severity="success">Исправления сохранены. Карточка бланка уже обновлена.</Alert>
          ) : null}

          {isOcrCompleted ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Если система ошиблась, введите правильный ответ в нужное поле и нажмите «Применить исправления».
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
          ) : null}

          <Grid container spacing={2}>
            {sortedAnswerGrades.map((answerGrade) => {
              const questionKey = String(answerGrade.questionNumber);
              const draftValue = draftCorrections[questionKey] ?? "";
              const rawAnswer = data.answers?.[questionKey] ?? answerGrade.studentAnswer ?? "";
              const existingCorrection = data.errorCorrections?.[questionKey] ?? "";
              const assessment = data.answerAssessments?.[questionKey];
              const confidenceBadge = getConfidenceBadge(assessment?.combinedConfidence, assessment?.reviewRecommended);

              return (
                <Grid key={answerGrade.id || questionKey} size={{ xs: 12, md: 6, xl: 4 }}>
                  <Box
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                      height: "100%",
                      position: "relative"
                    }}
                  >
                    <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, bgcolor: "primary.main" }} />
                    <Stack spacing={1.5} sx={{ p: 2, pl: 2.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Typography variant="h6">Вопрос {questionKey}</Typography>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="flex-end">
                          <Chip size="small" color={matchTypeColor(answerGrade.matchType)} label={formatMatchType(answerGrade.matchType)} />
                          <Chip size="small" color={confidenceBadge.color} label={confidenceBadge.label} />
                        </Stack>
                      </Stack>

                      <Typography variant="body2">
                        {"Правильный ответ: "}<strong>{answerGrade.correctAnswer || "—"}</strong>
                      </Typography>
                      <Typography variant="body2">
                        {"Распознанный ответ: "}<strong>{rawAnswer || "—"}</strong>
                      </Typography>
                      <Typography variant="body2">
                        {"Баллы: "}<strong>{answerGrade.matchType === "PENDING_SCORING" ? "—" : answerGrade.score}</strong> / {answerGrade.maxPoints}
                      </Typography>

                      {existingCorrection ? (
                        <Alert severity="info" sx={{ py: 0 }}>
                          Уже применено исправление: {existingCorrection}
                        </Alert>
                      ) : null}

                      {isOcrCompleted ? (
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
                      ) : null}
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
