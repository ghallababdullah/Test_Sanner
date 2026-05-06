import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import { useNavigate, useParams } from "react-router-dom";
import { SectionCard } from "../../../shared/components/SectionCard";
import {
  fetchBlankAsset,
  fetchBlankDetails,
  fetchBlankRoiMetadata,
  fetchBlankRoiOverrides,
  retryBlankOcr
} from "../api";
import { fetchTestDetails } from "../../tests/api";
import { DEFAULT_ROI_DEFINITIONS, ROI_CANVAS_HEIGHT, ROI_CANVAS_WIDTH } from "../roiDefinitions";
import { buildRelevantRoiNames } from "../roiScope";

function useAssetUrl(blob?: Blob) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return url;
}

function scoreRoiRisk(item: {
  empty?: boolean;
  inkRatio?: number;
  meaningfulComponents?: number;
  numComponents?: number;
}) {
  if (item.empty) {
    return "low";
  }
  if ((item.meaningfulComponents ?? 0) === 0) {
    return "high";
  }
  if ((item.inkRatio ?? 0) < 0.01 || (item.numComponents ?? 0) > 10) {
    return "medium";
  }
  return "low";
}

function needsOcrStart(processingStatus?: string) {
  return processingStatus === "PENDING_OCR" || processingStatus === "PROCESSING";
}

export function RoiReviewPage() {
  const { blankId = "" } = useParams();
  const navigate = useNavigate();

  const detailsQuery = useQuery({
    queryKey: ["blank-details", blankId],
    queryFn: () => fetchBlankDetails(blankId),
    enabled: !!blankId
  });

  const testDetailsQuery = useQuery({
    queryKey: ["test-details", detailsQuery.data?.testId],
    queryFn: () => fetchTestDetails(detailsQuery.data!.testId),
    enabled: !!detailsQuery.data?.testId
  });

  const roiMetadataQuery = useQuery({
    queryKey: ["blank-roi-metadata", blankId],
    queryFn: () => fetchBlankRoiMetadata(blankId),
    enabled: !!blankId
  });

  const roiOverridesQuery = useQuery({
    queryKey: ["blank-roi-overrides", blankId],
    queryFn: () => fetchBlankRoiOverrides(blankId),
    enabled: !!blankId
  });

  const annotatedAssetQuery = useQuery({
    queryKey: ["blank-asset", blankId, "annotated"],
    queryFn: () => fetchBlankAsset(blankId, "annotated"),
    enabled: !!blankId,
    retry: false
  });

  const processedAssetQuery = useQuery({
    queryKey: ["blank-asset", blankId, "processed"],
    queryFn: () => fetchBlankAsset(blankId, "processed"),
    enabled: !!blankId
  });

  const annotatedUrl = useAssetUrl(annotatedAssetQuery.data);
  const processedUrl = useAssetUrl(processedAssetQuery.data);
  const reviewPreviewUrl = annotatedUrl ?? processedUrl;

  const relevantRoiNames = useMemo(
    () => buildRelevantRoiNames(testDetailsQuery.data?.totalQuestions),
    [testDetailsQuery.data?.totalQuestions]
  );
  const relevantSet = useMemo(() => new Set(relevantRoiNames), [relevantRoiNames]);

  const displayBoxes = useMemo(() => {
    const merged = { ...DEFAULT_ROI_DEFINITIONS, ...(roiOverridesQuery.data ?? {}) };
    return relevantRoiNames
      .filter((roiName) => merged[roiName])
      .map((roiName) => ({ roiName, box: merged[roiName] }));
  }, [relevantRoiNames, roiOverridesQuery.data]);

  const sortedMetadata = useMemo(() => {
    return [...(roiMetadataQuery.data ?? [])]
      .filter((item) => relevantSet.has(item.roiName))
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[scoreRoiRisk(a)] - order[scoreRoiRisk(b)];
      });
  }, [relevantSet, roiMetadataQuery.data]);

  const riskyCount = useMemo(
    () => sortedMetadata.filter((item) => scoreRoiRisk(item) !== "low").length,
    [sortedMetadata]
  );

  const shouldStartOcr = needsOcrStart(detailsQuery.data?.processingStatus);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (shouldStartOcr) {
        return retryBlankOcr(blankId);
      }
      return true;
    },
    onSuccess: () => navigate(`/scan/blanks/${blankId}`)
  });

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Проверка разметки полей</Typography>
        <Typography color="text.secondary">
          {detailsQuery.data?.studentName ?? "Бланк"}: здесь видны только области, которые реально
          относятся к текущему тесту — метаданные, нужные вопросы и блок исправлений.
        </Typography>
      </Box>

      <Alert severity="info">
        Это контрольный шаг перед распознаванием. Если разметка выглядит нормально, можно сразу
        запустить проверку. Если какая-то область съехала, лучше сначала поправить её вручную.
      </Alert>

      {shouldStartOcr ? (
        <Alert severity="success">
          Для этого бланка распознавание ещё не запускалось окончательно. После подтверждения разметки
          начнётся обработка.
        </Alert>
      ) : (
        <Alert severity="warning">
          Распознавание для этого бланка уже запускалось. Если разметка выглядит неточно, можно перейти в
          редактор полей, сохранить новые координаты и запустить обработку ещё раз.
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SectionCard
            title="Предпросмотр разметки"
            subtitle="Подсвечиваются только зоны, которые нужны именно этому тесту."
          >
            {(annotatedAssetQuery.isLoading || processedAssetQuery.isLoading) && !reviewPreviewUrl ? (
              <Box sx={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
              </Box>
            ) : reviewPreviewUrl ? (
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: `${ROI_CANVAS_WIDTH} / ${ROI_CANVAS_HEIGHT}`,
                  borderRadius: 3,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.default"
                }}
              >
                <Box
                  component="img"
                  src={reviewPreviewUrl}
                  alt="Предпросмотр разметки"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block"
                  }}
                />
                {displayBoxes.map(({ roiName, box }) => (
                  <Box
                    key={roiName}
                    sx={{
                      position: "absolute",
                      left: `${(box.x1 / ROI_CANVAS_WIDTH) * 100}%`,
                      top: `${(box.y1 / ROI_CANVAS_HEIGHT) * 100}%`,
                      width: `${((box.x2 - box.x1) / ROI_CANVAS_WIDTH) * 100}%`,
                      height: `${((box.y2 - box.y1) / ROI_CANVAS_HEIGHT) * 100}%`,
                      border: "2px solid rgba(25,118,210,0.85)",
                      bgcolor: "rgba(25,118,210,0.08)",
                      boxSizing: "border-box"
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: -22,
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: "rgba(25,118,210,0.92)",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      {roiName}
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Alert severity="warning">
                Для этого бланка пока нет изображения предпросмотра разметки.
              </Alert>
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard title="Решение по разметке">
            <Stack spacing={2}>
              <Chip
                color={riskyCount > 0 ? "warning" : "success"}
                label={
                  riskyCount > 0
                    ? `Есть сомнительные зоны: ${riskyCount}`
                    : "Разметка выглядит стабильной"
                }
              />
              <Typography variant="body2" color="text.secondary">
                Если один из прямоугольников лёг неровно, лучше исправить его до запуска проверки. Если всё
                хорошо, можно запускать распознавание.
              </Typography>
              <Button
                variant="contained"
                startIcon={<CheckCircleRoundedIcon />}
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
              >
                {shouldStartOcr ? "Разметка верна, запустить распознавание" : "Разметка верна"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<EditRoundedIcon />}
                onClick={() => navigate(`/scan/blanks/${blankId}/roi-editor`)}
              >
                Исправить области
              </Button>
              <Button
                variant="text"
                startIcon={<AutorenewRoundedIcon />}
                onClick={() => navigate(`/scan/blanks/${blankId}`)}
              >
                Вернуться к бланку
              </Button>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>

      <SectionCard
        title="Список полей"
        subtitle="Ниже показаны только области, которые реально участвуют в этом тесте."
      >
        <Grid container spacing={2}>
          {sortedMetadata.map((item) => {
            const risk = scoreRoiRisk(item);
            return (
              <Grid key={item.sourceFile ?? item.roiName} size={{ xs: 12, md: 6, xl: 4 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor:
                      risk === "high" ? "error.light" : risk === "medium" ? "warning.light" : "divider",
                    bgcolor: "background.paper"
                  }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={700}>{item.roiName}</Typography>
                      <Chip
                        size="small"
                        color={risk === "high" ? "error" : risk === "medium" ? "warning" : "success"}
                        label={risk === "high" ? "Риск" : risk === "medium" ? "Проверить" : "Ок"}
                      />
                    </Stack>
                    <Typography variant="body2">Пусто: {item.empty ? "Да" : "Нет"}</Typography>
                    <Typography variant="body2">Ink ratio: {item.inkRatio?.toFixed(4) ?? "—"}</Typography>
                    <Typography variant="body2">Компоненты: {item.numComponents ?? "—"}</Typography>
                    <Typography variant="body2">Значимые: {item.meaningfulComponents ?? "—"}</Typography>
                    <Typography variant="body2">Площадь: {item.totalArea ?? "—"}</Typography>
                  </Stack>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </SectionCard>
    </Stack>
  );
}
