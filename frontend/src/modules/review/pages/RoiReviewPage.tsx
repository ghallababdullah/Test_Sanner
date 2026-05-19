import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { SectionCard } from "../../../shared/components/SectionCard";
import {
  fetchBlankAsset,
  fetchBlankDetails,
  fetchBlankRoiMetadata,
  fetchBlankRoiOverrides
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

function formatRoiLabel(roiName: string) {
  return roiName.replaceAll("_", " ");
}

export function RoiReviewPage() {
  const { blankId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = (location.state as {
    returnTo?: string;
    guidedBlankIds?: string[];
    guidedIndex?: number;
  } | null);
  const returnTo = navigationState?.returnTo;
  const guidedBlankIds = navigationState?.guidedBlankIds ?? [];
  const fallbackGuidedIndex = guidedBlankIds.findIndex((id) => id === blankId);
  const guidedIndex = typeof navigationState?.guidedIndex === "number"
    ? navigationState.guidedIndex
    : fallbackGuidedIndex >= 0 ? fallbackGuidedIndex : -1;
  const hasGuidedBatch = guidedBlankIds.length > 1 && guidedIndex >= 0;
  const guidedProgressLabel = hasGuidedBatch ? `Бланк ${guidedIndex + 1} из ${guidedBlankIds.length}` : null;
  const nextBlankId = hasGuidedBatch && guidedIndex < guidedBlankIds.length - 1
    ? guidedBlankIds[guidedIndex + 1]
    : null;

  const goToList = () => {
    if (returnTo) {
      navigate(returnTo, { replace: true });
      return;
    }
    navigate("/scan", { replace: true });
  };

  const sharedGuidedState = hasGuidedBatch
    ? {
        returnTo,
        guidedBlankIds,
        guidedIndex
      }
    : returnTo
      ? { returnTo }
      : undefined;

  const confirmCurrentRoi = () => {
    if (nextBlankId) {
      navigate(`/scan/blanks/${nextBlankId}/roi-review`, {
        replace: true,
        state: {
          returnTo,
          guidedBlankIds,
          guidedIndex: guidedIndex + 1
        }
      });
      return;
    }

    if (returnTo) {
      navigate(returnTo, { replace: true });
      return;
    }

    navigate(`/scan/blanks/${blankId}?refresh=${Date.now()}`, {
      replace: true
    });
  };

  const detailsQuery = useQuery({
    queryKey: ["blank-details", blankId],
    queryFn: () => fetchBlankDetails(blankId),
    enabled: !!blankId
  });

  const previewVersion = detailsQuery.data?.processedImagePath ?? detailsQuery.data?.createdAt ?? blankId;

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
    queryKey: ["blank-asset", blankId, "annotated", previewVersion],
    queryFn: () => fetchBlankAsset(blankId, "annotated", previewVersion),
    enabled: !!blankId,
    retry: false
  });

  const processedAssetQuery = useQuery({
    queryKey: ["blank-asset", blankId, "processed", previewVersion],
    queryFn: () => fetchBlankAsset(blankId, "processed", previewVersion),
    enabled: !!blankId
  });

  const processedUrl = useAssetUrl(processedAssetQuery.data);
  const annotatedUrl = useAssetUrl(annotatedAssetQuery.data);
  const reviewPreviewUrl = processedUrl ?? annotatedUrl;

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

  if (detailsQuery.isLoading && !detailsQuery.data) {
    return (
      <Box sx={{ minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Box sx={{ borderLeft: "6px solid", borderColor: "secondary.main", pl: 2 }}>
        <Typography variant="h4">Проверка выделения полей</Typography>
        <Typography color="text.secondary">
          {detailsQuery.data?.studentName ?? "Бланк"}: здесь показаны только зоны, которые реально участвуют в текущем тесте.
        </Typography>
      </Box>

      <Alert severity="info">
        Это контрольный шаг перед распознаванием. Если рамки стоят ровно, подтвердите разметку и вернитесь в карточку бланка,
        где уже можно будет запустить проверку.
      </Alert>

      {guidedProgressLabel ? (
        <Alert severity="info" icon={<FormatListBulletedRoundedIcon fontSize="inherit" />}>
          {guidedProgressLabel}. Сначала пройдите все бланки по разметке, а OCR запустите потом отдельно.
        </Alert>
      ) : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SectionCard
            title="Предпросмотр разметки"
            subtitle="Подсвечены только те зоны, которые нужны именно этому тесту."
          >
            {(processedAssetQuery.isLoading || annotatedAssetQuery.isLoading) && !reviewPreviewUrl ? (
              <Box sx={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
              </Box>
            ) : reviewPreviewUrl ? (
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: `${ROI_CANVAS_WIDTH} / ${ROI_CANVAS_HEIGHT}`,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#fffdf8"
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
                      border: "2px solid rgba(23,50,77,0.92)",
                      bgcolor: "rgba(23,50,77,0.08)",
                      boxSizing: "border-box"
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: -24,
                        px: 0.75,
                        py: 0.25,
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      {formatRoiLabel(roiName)}
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Alert severity="warning">Для этого бланка пока нет изображения предпросмотра разметки.</Alert>
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard title="Что делать дальше">
            <Stack spacing={2}>
              <Chip
                color={riskyCount > 0 ? "warning" : "success"}
                label={riskyCount > 0 ? `Есть сомнительные зоны: ${riskyCount}` : "Разметка выглядит стабильной"}
              />
              <Typography variant="body2" color="text.secondary">
                Если какой-то прямоугольник смещён, лучше исправить его сейчас. Если всё выглядит нормально, подтвердите
                разметку и вернитесь к карточке бланка.
              </Typography>
                <Button
                  variant="contained"
                  startIcon={<CheckCircleRoundedIcon />}
                  onClick={confirmCurrentRoi}
                >
                Поля выделены верно
              </Button>
              <Button
                variant="outlined"
                startIcon={<EditRoundedIcon />}
                onClick={() =>
                  navigate(`/scan/blanks/${blankId}/roi-editor`, {
                    replace: true,
                    state: sharedGuidedState
                  })
                }
              >
                Исправить области
              </Button>
              {nextBlankId ? (
                <Button
                  variant="text"
                  startIcon={<ArrowForwardRoundedIcon />}
                  onClick={() =>
                    navigate(`/scan/blanks/${nextBlankId}/roi-review`, {
                      replace: true,
                      state: {
                        returnTo,
                        guidedBlankIds,
                        guidedIndex: guidedIndex + 1
                      }
                    })
                  }
                >
                  Следующий бланк
                </Button>
              ) : null}
              <Button
                variant="text"
                startIcon={<FormatListBulletedRoundedIcon />}
                onClick={goToList}
              >
                Вернуться к списку
              </Button>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>

      <SectionCard title="Список полей" subtitle="Ниже показаны только области, которые реально участвуют в этом тесте.">
        <Grid container spacing={2}>
          {sortedMetadata.map((item) => {
            const risk = scoreRoiRisk(item);
            return (
              <Grid key={item.sourceFile ?? item.roiName} size={{ xs: 12, md: 6, xl: 4 }}>
                <Box
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: risk === "high" ? "error.main" : risk === "medium" ? "warning.main" : "divider",
                    bgcolor: "background.paper"
                  }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={700}>{formatRoiLabel(item.roiName)}</Typography>
                      <Chip
                        size="small"
                        color={risk === "high" ? "error" : risk === "medium" ? "warning" : "success"}
                        label={risk === "high" ? "Риск" : risk === "medium" ? "Проверить" : "Норма"}
                      />
                    </Stack>
                    <Typography variant="body2">Пустое поле: {item.empty ? "Да" : "Нет"}</Typography>
                    <Typography variant="body2">Плотность штрихов: {item.inkRatio?.toFixed(4) ?? "—"}</Typography>
                    <Typography variant="body2">Всего компонентов: {item.numComponents ?? "—"}</Typography>
                    <Typography variant="body2">Значимых компонентов: {item.meaningfulComponents ?? "—"}</Typography>
                    <Typography variant="body2">Площадь выделения: {item.totalArea ?? "—"}</Typography>
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
