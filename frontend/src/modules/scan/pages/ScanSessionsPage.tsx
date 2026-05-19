import { useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Typography
} from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CameraswitchRoundedIcon from "@mui/icons-material/CameraswitchRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import HourglassBottomRoundedIcon from "@mui/icons-material/HourglassBottomRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { SectionCard } from "../../../shared/components/SectionCard";
import { fetchTestDetails } from "../../tests/api";
import { fetchSessionBlanks, startScanSession, submitScannedBlank, submitScannedBlankForPreview } from "../api";
import type { ApiResponse } from "../../../shared/types/api";
import type { ScanSessionResponse } from "../../../shared/types/scan";
import { explainScanError } from "../../review/scanErrorMessages";

type CaptureMode = "file" | "camera";
type QueueStatus = "queued" | "uploading" | "uploaded" | "failed";
type ProcessingFlow = "guided" | "quick";

type QueuedBlank = {
  id: string;
  file: File;
  previewUrl: string;
  source: CaptureMode;
  status: QueueStatus;
  progress: number;
  message?: string;
  uploadedBlankId?: string;
};

function clampText(value: string, maxLength: number) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function buildDeviceInfo() {
  if (typeof navigator === "undefined") {
    return {};
  }

  const rawPlatform = navigator.platform || "unknown-device";
  const ua = navigator.userAgent || "unknown-agent";
  const browserToken =
    ua.includes("Chrome") ? "chrome" :
    ua.includes("Firefox") ? "firefox" :
    ua.includes("Safari") ? "safari" :
    ua.includes("Edg") ? "edge" :
    "browser";

  return {
    deviceId: clampText(`${rawPlatform}-${browserToken}`, 100),
    deviceModel: clampText(rawPlatform, 100),
    metadata: {
      language: navigator.language,
      online: navigator.onLine,
      userAgent: ua
    }
  };
}

function buildQueueItems(files: File[], source: CaptureMode): QueuedBlank[] {
  return files.map((file) => ({
    id: `${source}-${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    previewUrl: URL.createObjectURL(file),
    source,
    status: "queued",
    progress: 0
  }));
}

function buildCapturedFile(blob: Blob) {
  const extension = blob.type === "image/png" ? "png" : "jpg";
  return new File(
    [blob],
    `scan-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`,
    { type: blob.type || "image/jpeg" }
  );
}

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;

function validateSelectedFiles(files: File[]) {
  for (const file of files) {
    const normalizedName = file.name.toLowerCase();
    const hasAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.some((extension) => normalizedName.endsWith(extension));
    const hasAllowedMimeType = ALLOWED_IMAGE_TYPES.has(file.type);

    if (!hasAllowedExtension || !hasAllowedMimeType) {
      return `Файл "${file.name}" не похож на поддерживаемое изображение. Разрешены только JPG, PNG и WEBP.`;
    }

    if (file.size <= 0) {
      return `Файл "${file.name}" пустой и не может быть загружен.`;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return `Файл "${file.name}" слишком большой. Максимальный размер: 20 МБ.`;
    }
  }

  return null;
}

function statusLabel(status: QueueStatus) {
  switch (status) {
    case "uploading":
      return "Загружается";
    case "uploaded":
      return "Отправлен";
    case "failed":
      return "Ошибка";
    default:
      return "Ожидает";
  }
}

function statusColor(status: QueueStatus): "default" | "warning" | "success" | "error" {
  switch (status) {
    case "uploading":
      return "warning";
    case "uploaded":
      return "success";
    case "failed":
      return "error";
    default:
      return "default";
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} Б`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} КБ`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function explainScanRequestError(error: unknown) {
  if (!(error instanceof AxiosError)) {
    return "Не удалось загрузить бланк. Попробуйте ещё раз.";
  }

  const responseMessage = (error.response?.data as ApiResponse<unknown> | undefined)?.message;
  const scanError = explainScanError(responseMessage);
  if (scanError) {
    return `${scanError.title}. ${scanError.details}${scanError.nextStep ? ` Что сделать: ${scanError.nextStep}` : ""}`;
  }

  if (!error.response) {
    return "Нет связи с сервером во время загрузки бланка. Проверьте сеть и попробуйте снова.";
  }

  return responseMessage || `Ошибка загрузки бланка. Код ответа: ${error.response.status}.`;
}

function CameraGuide({
  available,
  status,
  error,
  onOpenFallback,
  onCapture,
  videoRef
}: {
  available: boolean;
  status: string;
  error: string | null;
  onOpenFallback: () => void;
  onCapture: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  return (
    <Card
      sx={{
        overflow: "hidden",
        bgcolor: "#08111d"
      }}
    >
      <CardContent sx={{ p: { xs: 1.25, md: 2 } }}>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Камера устройства
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.78)">
              Режим съёмки открыт почти на весь экран. Держите лист строго внутри A4-рамки перед снимком.
            </Typography>
          </Box>
        <Box
          sx={{
            position: "relative",
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "#050b14",
            minHeight: { xs: "calc(100vh - 290px)", md: "78vh" },
            maxHeight: { xs: "calc(100vh - 290px)", md: "78vh" },
            border: "1px solid rgba(255,255,255,0.12)"
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: "100%",
              height: "100%",
              minHeight: 320,
              objectFit: "cover",
              display: "block",
              opacity: available ? 1 : 0.08
            }}
          />
          <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <Box
              sx={{
                position: "absolute",
                width: { xs: "72%", sm: "60%", md: "46%" },
                aspectRatio: "210 / 297",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                border: "3px solid rgba(255,255,255,0.95)",
                boxShadow: "0 0 0 9999px rgba(6, 11, 20, 0.28)"
              }}
            />
            <Box
              sx={{
                position: "absolute",
                left: "50%",
                bottom: 16,
                transform: "translateX(-50%)",
                px: 2,
                py: 0.75,
                  bgcolor: "rgba(10, 17, 29, 0.72)",
                  borderRadius: 999,
                  color: "common.white"
                }}
              >
              <Typography variant="body2">Совместите весь лист с рамкой A4</Typography>
            </Box>
          </Box>
          {!available ? (
            <Stack
              spacing={2}
              sx={{
                position: "absolute",
                inset: 0,
                minHeight: 320,
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                p: 3,
                color: "common.white"
              }}
            >
              <Avatar sx={{ width: 64, height: 64, bgcolor: "rgba(255,255,255,0.12)" }}>
                <CameraswitchRoundedIcon />
              </Avatar>
              <Typography variant="h6">Камера не запущена</Typography>
              <Typography variant="body2" sx={{ maxWidth: 420, opacity: 0.8 }}>
                {error ?? "Если браузер не показывает изображение с камеры сразу, можно открыть системную камеру и добавить фото через обычный выбор файла."}
              </Typography>
              <Button variant="contained" onClick={onOpenFallback} startIcon={<PhotoCameraRoundedIcon />}>
                Открыть камеру устройства
              </Button>
            </Stack>
          ) : null}
        </Box>

        <Alert severity={error ? "warning" : "info"}>
          {error ?? status}
        </Alert>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button variant="contained" startIcon={<PhotoCameraRoundedIcon />} onClick={onCapture} disabled={!available}>
            Снять бланк
          </Button>
          <Button variant="outlined" startIcon={<CameraswitchRoundedIcon />} onClick={onOpenFallback}>
            Открыть системную камеру
          </Button>
        </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function ScanSessionsPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<CaptureMode>("camera");
  const [processingFlow, setProcessingFlow] = useState<ProcessingFlow>("guided");
  const [queueItems, setQueueItems] = useState<QueuedBlank[]>([]);
  const [session, setSession] = useState<ScanSessionResponse | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [queueValidationError, setQueueValidationError] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState("Откройте камеру и расположите лист внутри рамки A4.");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const queueRef = useRef<QueuedBlank[]>([]);
  const isDemoMode = sessionId === "demo";
  const activeSessionIdFromUrl = searchParams.get("activeSession") ?? "";

  useEffect(() => {
    queueRef.current = queueItems;
  }, [queueItems]);

  useEffect(() => {
    return () => {
      queueRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const testQuery = useQuery({
    queryKey: ["test-details", sessionId],
    queryFn: () => fetchTestDetails(sessionId),
    enabled: !!sessionId && !isDemoMode
  });

  const effectiveSessionId = session?.id ?? activeSessionIdFromUrl;
  const hasActiveSession = Boolean(effectiveSessionId);

  const syncActiveSessionId = (activeSessionId: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (activeSessionId) {
        next.set("activeSession", activeSessionId);
      } else {
        next.delete("activeSession");
      }
      return next;
    }, { replace: true });
  };

  const buildSessionReturnTo = (activeSessionId: string) => {
    const next = new URLSearchParams(searchParams);
    if (activeSessionId) {
      next.set("activeSession", activeSessionId);
    } else {
      next.delete("activeSession");
    }
    const query = next.toString();
    return `${location.pathname}${query ? `?${query}` : ""}`;
  };

  const sessionBlanksQuery = useQuery({
    queryKey: ["scan-session-blanks", effectiveSessionId],
    queryFn: () => fetchSessionBlanks(effectiveSessionId),
    enabled: !!effectiveSessionId,
    refetchInterval: effectiveSessionId ? 5000 : false
  });

  const startSessionMutation = useMutation({
    mutationFn: async () => {
      if (!testQuery.data?.id) {
        throw new Error("Test id is required");
      }
      return startScanSession({
        testId: testQuery.data.id,
        name: `Сканирование: ${testQuery.data.title}`,
        description: `Сессия для теста ${testQuery.data.title}`,
        ...buildDeviceInfo()
      });
    },
    onSuccess: (createdSession) => {
      setSession(createdSession);
      syncActiveSessionId(createdSession.id);
    }
  });

  const updateQueueItem = (id: string, updater: (item: QueuedBlank) => QueuedBlank) => {
    setQueueItems((current) => current.map((item) => (item.id === id ? updater(item) : item)));
  };

  const clearQueue = (items: QueuedBlank[]) => {
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setQueueItems([]);
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!testQuery.data?.id || queueItems.length === 0) {
        throw new Error("Test and files are required");
      }

      let activeSessionId = effectiveSessionId;
      if (!activeSessionId) {
        const createdSession = await startSessionMutation.mutateAsync();
        setSession(createdSession);
        activeSessionId = createdSession.id;
      }

      if (!activeSessionId) {
        throw new Error("Scan session was not created");
      }

      const submitFn = processingFlow === "guided" ? submitScannedBlankForPreview : submitScannedBlank;
      const uploadedBlanks = [];

      for (const item of queueItems) {
        updateQueueItem(item.id, (current) => ({
          ...current,
          status: "uploading",
          progress: 0,
          message: processingFlow === "guided" ? "Подготавливаем предварительную разметку" : "Загружаем файл в очередь на распознавание"
        }));

        try {
          const uploadedBlank = await submitFn({
            scanSessionId: activeSessionId,
            testId: testQuery.data.id,
            image: item.file,
            onUploadProgress: (event) => {
              const total = event.total ?? item.file.size;
              const progress = total > 0 ? Math.min(100, Math.round((event.loaded / total) * 100)) : 0;
              updateQueueItem(item.id, (current) => ({
                ...current,
                progress,
                message: progress >= 100
                  ? (processingFlow === "guided" ? "Файл передан, строим разметку полей" : "Файл передан, ждём запуска распознавания")
                  : `Загрузка ${progress}%`
              }));
            }
          });

          uploadedBlanks.push(uploadedBlank);
          updateQueueItem(item.id, (current) => ({
            ...current,
            status: "uploaded",
            progress: 100,
            message: processingFlow === "guided"
              ? "Предварительная разметка готова. Можно проверить поля перед распознаванием."
              : "Бланк отправлен в очередь на распознавание",
            uploadedBlankId: uploadedBlank.id
          }));
        } catch (error) {
          updateQueueItem(item.id, (current) => ({
            ...current,
            status: "failed",
            message: error instanceof Error ? error.message : "Не удалось загрузить бланк"
          }));
          throw error;
        }
      }

      return {
        uploadedBlanks,
        activeSessionId
      };
    },
    onSuccess: async ({ uploadedBlanks, activeSessionId }) => {
      await sessionBlanksQuery.refetch();
      const snapshot = [...queueRef.current];
      clearQueue(snapshot);
      const returnTo = buildSessionReturnTo(activeSessionId);
      const guidedBlankIds = uploadedBlanks.map((blank) => blank.id);
      if (uploadedBlanks.length === 1) {
        navigate(
          processingFlow === "guided"
            ? `/scan/blanks/${uploadedBlanks[0].id}/roi-review`
            : `/scan/blanks/${uploadedBlanks[0].id}`,
          {
            state: processingFlow === "guided"
              ? { returnTo, guidedBlankIds, guidedIndex: 0 }
              : { returnTo }
          }
        );
      } else if (uploadedBlanks.length > 1 && processingFlow === "guided") {
        navigate(`/scan/blanks/${uploadedBlanks[0].id}/roi-review`, {
          state: { returnTo, guidedBlankIds, guidedIndex: 0 }
        });
      }
    }
  });

  useEffect(() => {
    if (mode !== "camera") {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraReady(false);
      return;
    }

    if (!window.isSecureContext) {
      setIsCameraReady(false);
      setCameraError("Live-камера работает только в защищённом режиме. Откройте сайт по HTTPS или через localhost, либо используйте системную камеру ниже.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setIsCameraReady(false);
      setCameraError("Браузер не поддерживает live-камеру. Можно использовать системную камеру через кнопку ниже.");
      return;
    }

    let cancelled = false;
    const startCamera = async () => {
      try {
        setCameraError(null);
        setIsCameraReady(false);
        setCameraStatus("Поднесите телефон ближе и держите лист полностью внутри рамки.");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;
          await video.play().catch(() => undefined);

          if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
            setIsCameraReady(true);
            setCameraStatus("Камера готова. Держите бланк внутри рамки A4 и сделайте снимок.");
            return;
          }

          await new Promise<void>((resolve) => {
            const markReady = () => {
              video.removeEventListener("loadedmetadata", markReady);
              video.removeEventListener("canplay", markReady);
              resolve();
            };

            video.addEventListener("loadedmetadata", markReady, { once: true });
            video.addEventListener("canplay", markReady, { once: true });
          });
        }
        setIsCameraReady(true);
        setCameraStatus("Камера готова. Держите бланк внутри рамки A4 и сделайте снимок.");
      } catch {
        setIsCameraReady(false);
        setCameraError("Не удалось открыть live-камеру. Проверьте разрешение браузера или используйте системную камеру.");
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraReady(false);
    };
  }, [mode]);

  const helperText = useMemo(() => {
    if (isDemoMode) {
      return "Сначала откройте нужный тест и запускайте сканирование уже из его карточки.";
    }
    if (!session) {
      return "Сначала начните сессию сканирования, а затем добавьте один или несколько бланков.";
    }
    return `Сессия активна. Уже загружено бланков: ${sessionBlanksQuery.data?.length ?? 0}.`;
  }, [isDemoMode, session, sessionBlanksQuery.data]);

  const sessionSubtitle = isDemoMode
    ? helperText
    : hasActiveSession
      ? `Сессия активна. Уже загружено бланков: ${sessionBlanksQuery.data?.length ?? 0}.`
      : "Можно сразу добавить бланки, и система создаст сессию автоматически. Кнопка ниже нужна только если вы хотите открыть сессию заранее.";

  const sessionButtonLabel = hasActiveSession
    ? "Сессия активна"
    : startSessionMutation.isPending
      ? "Создаём сессию..."
      : "Создать сессию заранее";

  const appendFiles = (files: FileList | null, source: CaptureMode) => {
    if (!files || files.length === 0) {
      return;
    }
    const nextFiles = Array.from(files);
    const validationError = validateSelectedFiles(nextFiles);
    if (validationError) {
      setQueueValidationError(validationError);
      return;
    }
    setQueueValidationError(null);
    setQueueItems((current) => [...current, ...buildQueueItems(nextFiles, source)]);
    if (source === "camera") {
      setCameraStatus("Снимок добавлен. Можно сделать ещё один или отправить очередь.");
    }
  };

  const removeQueueItem = (id: string) => {
    setQueueItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setCameraError("Камера ещё не готова. Подождите секунду и попробуйте снова.");
      return;
    }

    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("Не удалось подготовить снимок камеры.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError("Не удалось сохранить снимок. Попробуйте ещё раз.");
        return;
      }
      const file = buildCapturedFile(blob);
      const validationError = validateSelectedFiles([file]);
      if (validationError) {
        setQueueValidationError(validationError);
        return;
      }
      setQueueValidationError(null);
      setQueueItems((current) => [...current, ...buildQueueItems([file], "camera")]);
      setCameraError(null);
      setCameraStatus("Снимок добавлен в очередь. При необходимости снимите ещё один бланк.");
    }, "image/jpeg", 0.95);
  };

  const queuedCount = queueItems.filter((item) => item.status === "queued").length;
  const uploadedCount = queueItems.filter((item) => item.status === "uploaded").length;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Сканирование</Typography>
        <Typography color="text.secondary">
          Выберите удобный режим: сначала проверить поля на бланке или сразу отправить работу на распознавание.
        </Typography>
      </Box>

      {isDemoMode ? (
        <Alert severity="info">
          Это демонстрационный экран. Для реального запуска выберите тест и нажмите «Начать сессию сканирования» из карточки теста.
        </Alert>
      ) : null}

      {startSessionMutation.isError ? (
        <Alert severity="error">Не удалось создать сессию сканирования.</Alert>
      ) : null}

      {uploadMutation.isError ? (
        <Alert severity="error">
          {explainScanRequestError(uploadMutation.error)}
        </Alert>
      ) : null}

      {queueValidationError ? (
        <Alert severity="warning">{queueValidationError}</Alert>
      ) : null}

      {uploadMutation.isSuccess && queueItems.length === 0 ? (
        <Alert severity="success">
          {processingFlow === "guided"
            ? "Бланки загружены в режим предварительной проверки полей."
            : "Бланки отправлены в очередь на распознавание. Каждый будет обработан отдельно."}
        </Alert>
      ) : null}

      <SectionCard title="Сессия сканирования" subtitle={sessionSubtitle}>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              startIcon={<PlayArrowRoundedIcon />}
              variant="contained"
              size="large"
              disabled={isDemoMode || !testQuery.data || startSessionMutation.isPending || hasActiveSession}
              onClick={() => startSessionMutation.mutate()}
            >
              {sessionButtonLabel}
            </Button>
            {hasActiveSession ? <Chip color="success" label={`ID сессии: ${effectiveSessionId}`} /> : null}
          </Stack>

          {!isDemoMode && testQuery.data ? (
            <Alert severity="info">
              Тест: {testQuery.data.title}. Класс: {testQuery.data.classLevel}. Вопросов: {testQuery.data.totalQuestions}.
            </Alert>
          ) : null}

          <SectionCard
            title="Как проверить бланк"
            subtitle="В одном режиме можно сначала посмотреть, как система выделила поля. Во втором режиме проверка начинается сразу."
          >
            <Stack spacing={2}>
              <Tabs value={processingFlow} onChange={(_, value) => setProcessingFlow(value)} variant="scrollable">
                <Tab value="guided" label="Проверить поля перед распознаванием" />
                <Tab value="quick" label="Сразу распознать бланк" />
              </Tabs>
              {processingFlow === "guided" ? (
                <Alert severity="info">
                  Сначала загружаем бланк, показываем разметку полей, вы её подтверждаете, и только потом запускается распознавание.
                </Alert>
              ) : (
                <Alert severity="warning">
                  Бланк сразу уходит в очередь на распознавание без шага проверки полей. Это быстрее, но риск ошибок выше.
                </Alert>
              )}
            </Stack>
          </SectionCard>

          <Divider />

          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Как добавить бланки
            </Typography>
            <Tabs value={mode} onChange={(_, value) => setMode(value)} sx={{ mb: 2 }} variant="scrollable">
              <Tab value="file" label="Файлы" />
              <Tab value="camera" label="Камера телефона" />
            </Tabs>

            {mode === "file" ? (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, lg: 7 }}>
                  <SectionCard
                    title="Загрузка файлов"
                    subtitle="Можно выбрать сразу несколько бланков. Они войдут в одну сессию сканирования, но каждый будет обработан как отдельный бланк."
                  >
                    <Stack spacing={2}>
                      <input
                        ref={inputRef}
                        hidden
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) => {
                          appendFiles(event.target.files, "file");
                          event.target.value = "";
                        }}
                      />

                      <Button startIcon={<CloudUploadRoundedIcon />} variant="contained" onClick={() => inputRef.current?.click()}>
                        Выбрать файлы
                      </Button>

                      <Typography variant="body2" color="text.secondary">
                        Подойдут несколько JPG или PNG-файлов. После выбора они появятся в очереди ниже.
                      </Typography>
                    </Stack>
                  </SectionCard>
                </Grid>

                <Grid size={{ xs: 12, lg: 5 }}>
                  <SectionCard title="Подсказки по качеству">
                    <Stack spacing={1.5}>
                      <Typography>• Весь лист A4 должен быть виден целиком</Typography>
                      <Typography>• Камеру лучше держать параллельно бланку</Typography>
                      <Typography>• Углы и маркеры должны попадать внутрь кадра</Typography>
                      <Typography>• Если фото плохое, лучше переснять сразу, чем исправлять потом</Typography>
                      <Typography>• В режиме проверки после загрузки откроется шаг проверки разметки полей</Typography>
                    </Stack>
                  </SectionCard>
                </Grid>
              </Grid>
            ) : (
              <Stack spacing={2}>
                <Box sx={{ mx: { xs: -1, md: 0 } }}>
                  <CameraGuide
                    available={isCameraReady}
                    status={cameraStatus}
                    error={cameraError}
                    videoRef={videoRef}
                    onCapture={captureFrame}
                    onOpenFallback={() => cameraInputRef.current?.click()}
                  />
                </Box>
                <SectionCard title="Подсказки по съёмке">
                  <Stack spacing={1.5}>
                    <Typography>• Режим камеры теперь приоритетный и занимает почти весь экран</Typography>
                    <Typography>• Белая рамка повторяет портретный лист A4, поэтому весь лист должен войти внутрь</Typography>
                    <Typography>• Держите телефон прямо над бланком, без сильного наклона</Typography>
                    <Typography>• Если края листа выходят за рамку, немного отведите телефон выше</Typography>
                  </Stack>
                </SectionCard>
              </Stack>
            )}
          </Box>

          <input
            ref={cameraInputRef}
            hidden
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => {
              appendFiles(event.target.files, "camera");
              event.target.value = "";
            }}
          />
          <canvas ref={canvasRef} hidden />

          <SectionCard
            title="Очередь бланков"
            subtitle={
              queueItems.length
                ? `Сейчас в очереди: ${queueItems.length}. Ожидают отправки: ${queuedCount}. Уже отправлены: ${uploadedCount}.`
                : "Добавьте хотя бы один бланк, и здесь появятся миниатюры, статусы и progress по каждому файлу."
            }
          >
            <Stack spacing={2}>
              {queueItems.length === 0 ? (
                <Alert severity="info">
                  Пока очередь пуста. Выберите файлы или сделайте фото через камеру телефона.
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {queueItems.map((item, index) => (
                    <Grid key={item.id} size={{ xs: 12, md: 6 }}>
                      <Box
                        sx={{
                          borderRadius: 3,
                          overflow: "hidden",
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "background.paper"
                        }}
                      >
                        <Box
                          component="img"
                          src={item.previewUrl}
                          alt={item.file.name}
                          sx={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
                        />
                        <Stack spacing={1.5} sx={{ p: 2 }}>
                          <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                            <Box>
                              <Typography variant="subtitle2">{`Бланк ${index + 1}`}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                                {item.file.name}
                              </Typography>
                            </Box>
                            <IconButton color="error" onClick={() => removeQueueItem(item.id)} disabled={item.status === "uploading"}>
                              <DeleteOutlineRoundedIcon />
                            </IconButton>
                          </Stack>

                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Chip
                              size="small"
                              label={item.source === "camera" ? "Камера" : "Файл"}
                              icon={item.source === "camera" ? <PhotoCameraRoundedIcon /> : <ImageRoundedIcon />}
                            />
                            <Chip
                              size="small"
                              color={statusColor(item.status)}
                              label={statusLabel(item.status)}
                              icon={
                                item.status === "uploaded" ? <CheckCircleRoundedIcon /> :
                                  item.status === "failed" ? <ErrorOutlineRoundedIcon /> :
                                    <HourglassBottomRoundedIcon />
                              }
                            />
                            <Chip size="small" label={formatFileSize(item.file.size)} />
                          </Stack>

                          <LinearProgress
                            variant="determinate"
                            value={item.status === "queued" ? 5 : item.progress}
                            color={item.status === "failed" ? "error" : item.status === "uploaded" ? "success" : "primary"}
                            sx={{ height: 8, borderRadius: 999 }}
                          />

                          <Typography variant="body2" color="text.secondary">
                            {item.message ?? (item.status === "queued" ? "Готов к отправке" : "")}
                          </Typography>

                          {item.uploadedBlankId ? (
                            <Button
                              size="small"
                              variant="text"
                              onClick={() =>
                                navigate(
                                  processingFlow === "guided"
                                    ? `/scan/blanks/${item.uploadedBlankId}/roi-review`
                                    : `/scan/blanks/${item.uploadedBlankId}`,
                                  { state: { returnTo: buildSessionReturnTo(effectiveSessionId) } }
                                )
                              }
                            >
                              {processingFlow === "guided" ? "Открыть проверку полей" : "Открыть бланк"}
                            </Button>
                          ) : null}
                        </Stack>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  disabled={isDemoMode || !testQuery.data || queueItems.length === 0 || uploadMutation.isPending || startSessionMutation.isPending}
                  onClick={() => uploadMutation.mutate()}
                >
                  {uploadMutation.isPending
                    ? processingFlow === "guided"
                      ? "Готовим предварительную разметку..."
                      : "Отправляем очередь..."
                    : queueItems.length > 1
                      ? processingFlow === "guided"
                        ? `Загрузить ${queueItems.length} бланков и проверить поля`
                        : `Сразу распознать ${queueItems.length} бланков`
                      : processingFlow === "guided"
                        ? "Проверить поля перед распознаванием"
                        : "Сразу распознать бланк"}
                </Button>
                <Button
                  variant="outlined"
                  disabled={queueItems.length === 0 || uploadMutation.isPending}
                  onClick={() => clearQueue([...queueItems])}
                >
                  Очистить очередь
                </Button>
              </Stack>
            </Stack>
          </SectionCard>
        </Stack>
      </SectionCard>
    </Stack>
  );
}
