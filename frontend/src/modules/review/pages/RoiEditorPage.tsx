import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import { useNavigate, useParams } from "react-router-dom";
import { SectionCard } from "../../../shared/components/SectionCard";
import {
  fetchBlankAsset,
  fetchBlankDetails,
  fetchBlankRoiOverrides,
  refreshBlankPreview,
  retryBlankOcr,
  saveBlankRoiOverrides
} from "../api";
import { fetchTestDetails } from "../../tests/api";
import { DEFAULT_ROI_DEFINITIONS, ROI_CANVAS_HEIGHT, ROI_CANVAS_WIDTH } from "../roiDefinitions";
import { buildRelevantRoiNames } from "../roiScope";
import type { RoiBox } from "../../../shared/types/scan";

type ResizeHandle = "nw" | "ne" | "sw" | "se";
type DragMode = "move" | ResizeHandle;

type DragState = {
  roiName: string;
  mode: DragMode;
  startClientX: number;
  startClientY: number;
  initialBox: RoiBox;
};

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

function clampBox(box: RoiBox): RoiBox {
  const minSize = 12;
  const x1 = Math.max(0, Math.min(box.x1, ROI_CANVAS_WIDTH - minSize));
  const y1 = Math.max(0, Math.min(box.y1, ROI_CANVAS_HEIGHT - minSize));
  const x2 = Math.max(x1 + minSize, Math.min(box.x2, ROI_CANVAS_WIDTH));
  const y2 = Math.max(y1 + minSize, Math.min(box.y2, ROI_CANVAS_HEIGHT));
  return { x1, y1, x2, y2 };
}

function toPercent(value: number, max: number) {
  return `${(value / max) * 100}%`;
}

export function RoiEditorPage() {
  const { blankId = "" } = useParams();
  const navigate = useNavigate();
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [renderSize, setRenderSize] = useState({ width: 1, height: 1 });
  const [selectedRoi, setSelectedRoi] = useState<string>("surname");
  const [editorBoxes, setEditorBoxes] = useState<Record<string, RoiBox>>(DEFAULT_ROI_DEFINITIONS);
  const [editorMessage, setEditorMessage] = useState<string | null>(null);

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

  const processedAssetQuery = useQuery({
    queryKey: ["blank-asset", blankId, "processed"],
    queryFn: () => fetchBlankAsset(blankId, "processed"),
    enabled: !!blankId
  });

  const roiOverridesQuery = useQuery({
    queryKey: ["blank-roi-overrides", blankId],
    queryFn: () => fetchBlankRoiOverrides(blankId),
    enabled: !!blankId
  });

  const processedUrl = useAssetUrl(processedAssetQuery.data);
  const relevantRoiNames = useMemo(
    () => buildRelevantRoiNames(testDetailsQuery.data?.totalQuestions),
    [testDetailsQuery.data?.totalQuestions]
  );

  useEffect(() => {
    const merged = { ...DEFAULT_ROI_DEFINITIONS, ...(roiOverridesQuery.data ?? {}) };
    setEditorBoxes(merged);
    if (!relevantRoiNames.includes(selectedRoi)) {
      setSelectedRoi(relevantRoiNames[0] ?? "surname");
    }
  }, [relevantRoiNames, roiOverridesQuery.data, selectedRoi]);

  useEffect(() => {
    const updateSize = () => {
      if (!imageContainerRef.current) {
        return;
      }
      const rect = imageContainerRef.current.getBoundingClientRect();
      setRenderSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [processedUrl]);

  const visibleBoxes = useMemo(
    () => relevantRoiNames.filter((roiName) => editorBoxes[roiName]).map((roiName) => ({ roiName, box: editorBoxes[roiName] })),
    [editorBoxes, relevantRoiNames]
  );
  const currentBox = editorBoxes[selectedRoi];

  const saveMutation = useMutation({
    mutationFn: async () => saveBlankRoiOverrides(blankId, editorBoxes),
    onSuccess: () => setEditorMessage("Координаты полей сохранены. Теперь можно обновить предпросмотр или отдельно запустить проверку."),
    onError: () => setEditorMessage("Не удалось сохранить координаты полей.")
  });

  const saveAndRefreshMutation = useMutation({
    mutationFn: async () => {
      await saveBlankRoiOverrides(blankId, editorBoxes);
      return refreshBlankPreview(blankId);
    },
    onSuccess: async () => {
      setEditorMessage("Координаты сохранены, предпросмотр обновлён. Старые изображения полей заменены новой версией.");
      await Promise.all([
        processedAssetQuery.refetch(),
        roiOverridesQuery.refetch(),
        detailsQuery.refetch()
      ]);
      navigate(`/scan/blanks/${blankId}/roi-review`);
    },
    onError: () => setEditorMessage("Не удалось сохранить координаты и обновить предпросмотр.")
  });

  const saveAndRetryMutation = useMutation({
    mutationFn: async () => {
      await saveBlankRoiOverrides(blankId, editorBoxes);
      return retryBlankOcr(blankId);
    },
    onSuccess: () => {
      setEditorMessage("Координаты сохранены, проверка запущена заново. Можно вернуться к бланку и следить за новым статусом.");
      navigate(`/scan/blanks/${blankId}?refresh=${Date.now()}`);
    },
    onError: () => setEditorMessage("Не удалось сохранить координаты и заново запустить проверку.")
  });

  const beginDrag = (roiName: string, mode: DragMode, event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const initialBox = editorBoxes[roiName];
    if (!initialBox) {
      return;
    }
    setSelectedRoi(roiName);
    dragStateRef.current = {
      roiName,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      initialBox
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDrag);
  };

  const handlePointerMove = (event: PointerEvent) => {
    const dragState = dragStateRef.current;
    if (!dragState || renderSize.width <= 0 || renderSize.height <= 0) {
      return;
    }

    const scaleX = ROI_CANVAS_WIDTH / renderSize.width;
    const scaleY = ROI_CANVAS_HEIGHT / renderSize.height;
    const deltaX = Math.round((event.clientX - dragState.startClientX) * scaleX);
    const deltaY = Math.round((event.clientY - dragState.startClientY) * scaleY);

    setEditorBoxes((current) => {
      if (!current[dragState.roiName]) {
        return current;
      }

      let nextBox = { ...dragState.initialBox };
      if (dragState.mode === "move") {
        nextBox = {
          x1: dragState.initialBox.x1 + deltaX,
          y1: dragState.initialBox.y1 + deltaY,
          x2: dragState.initialBox.x2 + deltaX,
          y2: dragState.initialBox.y2 + deltaY
        };
      } else if (dragState.mode === "nw") {
        nextBox = { ...nextBox, x1: dragState.initialBox.x1 + deltaX, y1: dragState.initialBox.y1 + deltaY };
      } else if (dragState.mode === "ne") {
        nextBox = { ...nextBox, x2: dragState.initialBox.x2 + deltaX, y1: dragState.initialBox.y1 + deltaY };
      } else if (dragState.mode === "sw") {
        nextBox = { ...nextBox, x1: dragState.initialBox.x1 + deltaX, y2: dragState.initialBox.y2 + deltaY };
      } else if (dragState.mode === "se") {
        nextBox = { ...nextBox, x2: dragState.initialBox.x2 + deltaX, y2: dragState.initialBox.y2 + deltaY };
      }

      return {
        ...current,
        [dragState.roiName]: clampBox(nextBox)
      };
    });
  };

  const stopDrag = () => {
    dragStateRef.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopDrag);
  };

  useEffect(() => {
    return () => stopDrag();
  }, []);

  const updateSelectedBox = (patch: Partial<RoiBox>) => {
    if (!currentBox) {
      return;
    }
    setEditorBoxes((current) => ({
      ...current,
      [selectedRoi]: clampBox({
        ...current[selectedRoi],
        ...patch
      })
    }));
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Редактор полей</Typography>
        <Typography color="text.secondary">
          {detailsQuery.data?.studentName ?? "Бланк"}: редактируем только зоны, которые реально участвуют в этом тесте — метаданные, нужные вопросы и блок исправлений.
        </Typography>
      </Box>

      <Alert severity="info">
        Если в тесте 10 вопросов, здесь будут только `q1..q10`, метаданные и `error corrections`. Это делает редактирование заметно удобнее, особенно на телефоне.
      </Alert>

      {editorMessage ? <Alert severity={editorMessage.includes("Не удалось") ? "error" : "success"}>{editorMessage}</Alert> : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SectionCard title="Поля на бланке" subtitle="Показываем только те поля, которые нужны для этого теста.">
            <Box
              ref={imageContainerRef}
              sx={{
                position: "relative",
                width: "100%",
                aspectRatio: `${ROI_CANVAS_WIDTH} / ${ROI_CANVAS_HEIGHT}`,
                borderRadius: 3,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.default",
                touchAction: "none"
              }}
            >
              {processedUrl ? (
                <Box
                  component="img"
                  src={processedUrl}
                  alt="Processed blank"
                  sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
              ) : (
                <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography color="text.secondary">Загрузка изображения...</Typography>
                </Box>
              )}

              {visibleBoxes.map(({ roiName, box }) => {
                const isSelected = roiName === selectedRoi;
                return (
                  <Box
                    key={roiName}
                    onPointerDown={(event) => beginDrag(roiName, "move", event)}
                    onClick={() => setSelectedRoi(roiName)}
                    sx={{
                      position: "absolute",
                      left: toPercent(box.x1, ROI_CANVAS_WIDTH),
                      top: toPercent(box.y1, ROI_CANVAS_HEIGHT),
                      width: toPercent(box.x2 - box.x1, ROI_CANVAS_WIDTH),
                      height: toPercent(box.y2 - box.y1, ROI_CANVAS_HEIGHT),
                      border: "2px solid",
                      borderColor: isSelected ? "#F2A65A" : "rgba(25,118,210,0.85)",
                      bgcolor: isSelected ? "rgba(242,166,90,0.12)" : "rgba(25,118,210,0.08)",
                      cursor: "move",
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
                        borderRadius: 1,
                        bgcolor: isSelected ? "#F2A65A" : "rgba(25,118,210,0.92)",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      {roiName}
                    </Box>

                    {(["nw", "ne", "sw", "se"] as ResizeHandle[]).map((handle) => {
                      const positionStyle =
                        handle === "nw" ? { left: -6, top: -6 } :
                        handle === "ne" ? { right: -6, top: -6 } :
                        handle === "sw" ? { left: -6, bottom: -6 } :
                        { right: -6, bottom: -6 };
                      return (
                        <Box
                          key={handle}
                          onPointerDown={(event) => beginDrag(roiName, handle, event)}
                          sx={{
                            position: "absolute",
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            bgcolor: isSelected ? "#F2A65A" : "#1976d2",
                            border: "2px solid white",
                            ...positionStyle,
                            cursor: `${handle}-resize`
                          }}
                        />
                      );
                    })}
                  </Box>
                );
              })}
            </Box>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard title="Параметры поля" subtitle="Здесь можно вручную поправить выбранную область.">
            <Stack spacing={2}>
              <TextField
                select
                label="Область"
                value={selectedRoi}
                onChange={(event) => setSelectedRoi(event.target.value)}
              >
                {relevantRoiNames.map((roiName) => (
                  <MenuItem key={roiName} value={roiName}>
                    {roiName}
                  </MenuItem>
                ))}
              </TextField>

              {currentBox ? (
                <>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip size="small" label={`x1: ${currentBox.x1}`} />
                    <Chip size="small" label={`y1: ${currentBox.y1}`} />
                    <Chip size="small" label={`x2: ${currentBox.x2}`} />
                    <Chip size="small" label={`y2: ${currentBox.y2}`} />
                  </Stack>

                  <Grid container spacing={1}>
                    <Grid size={{ xs: 6 }}>
                      <TextField fullWidth size="small" type="number" label="x1" value={currentBox.x1} onChange={(event) => updateSelectedBox({ x1: Number(event.target.value) })} />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField fullWidth size="small" type="number" label="y1" value={currentBox.y1} onChange={(event) => updateSelectedBox({ y1: Number(event.target.value) })} />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField fullWidth size="small" type="number" label="x2" value={currentBox.x2} onChange={(event) => updateSelectedBox({ x2: Number(event.target.value) })} />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField fullWidth size="small" type="number" label="y2" value={currentBox.y2} onChange={(event) => updateSelectedBox({ y2: Number(event.target.value) })} />
                    </Grid>
                  </Grid>
                </>
              ) : null}

              <Button
                variant="contained"
                startIcon={<SaveRoundedIcon />}
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || saveAndRefreshMutation.isPending || saveAndRetryMutation.isPending}
              >
                Сохранить поля
              </Button>
              <Button
                variant="outlined"
                startIcon={<AutorenewRoundedIcon />}
                onClick={() => saveAndRefreshMutation.mutate()}
                disabled={saveMutation.isPending || saveAndRefreshMutation.isPending || saveAndRetryMutation.isPending}
              >
                {saveAndRefreshMutation.isPending ? "Обновляем предпросмотр..." : "Сохранить и обновить предпросмотр"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<AutorenewRoundedIcon />}
                onClick={() => saveAndRetryMutation.mutate()}
                disabled={saveMutation.isPending || saveAndRefreshMutation.isPending || saveAndRetryMutation.isPending}
              >
                {saveAndRetryMutation.isPending ? "Запускаем проверку..." : "Сохранить и повторить проверку"}
              </Button>
              <Button
                variant="text"
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigate(`/scan/blanks/${blankId}/roi-review`)}
              >
                Назад к проверке полей
              </Button>
              <Button
                variant="text"
                startIcon={<EditRoundedIcon />}
                onClick={() => setEditorBoxes({ ...DEFAULT_ROI_DEFINITIONS, ...(roiOverridesQuery.data ?? {}) })}
              >
                Сбросить несохранённые правки
              </Button>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
