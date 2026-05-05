import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useNavigate, useParams } from "react-router-dom";
import { SectionCard } from "../../../shared/components/SectionCard";
import { fetchTestDetails } from "../../tests/api";
import { fetchSessionBlanks, startScanSession, submitScannedBlank } from "../api";
import type { ScanSessionResponse } from "../../../shared/types/scan";

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

export function ScanSessionsPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"file" | "camera">("file");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [session, setSession] = useState<ScanSessionResponse | null>(null);
  const [testDate, setTestDate] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const isDemoMode = sessionId === "demo";

  const testQuery = useQuery({
    queryKey: ["test-details", sessionId],
    queryFn: () => fetchTestDetails(sessionId),
    enabled: !!sessionId && !isDemoMode
  });

  const effectiveSessionId = session?.id ?? "";

  const sessionBlanksQuery = useQuery({
    queryKey: ["scan-session-blanks", effectiveSessionId],
    queryFn: () => fetchSessionBlanks(effectiveSessionId),
    enabled: !!effectiveSessionId
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
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!session?.id || !testQuery.data?.id || selectedFiles.length === 0) {
        throw new Error("Session, test and files are required");
      }

      const uploadedBlanks = [];
      for (const file of selectedFiles) {
        const uploadedBlank = await submitScannedBlank({
          scanSessionId: session.id,
          testId: testQuery.data.id,
          image: file,
          testDate: testDate || undefined
        });
        uploadedBlanks.push(uploadedBlank);
      }

      return uploadedBlanks;
    },
    onSuccess: (uploadedBlanks) => {
      setSelectedFiles([]);
      sessionBlanksQuery.refetch();
      if (uploadedBlanks.length === 1) {
        navigate(`/scan/blanks/${uploadedBlanks[0].id}`);
      }
    }
  });

  const helperText = useMemo(() => {
    if (isDemoMode) {
      return "Сначала откройте нужный тест и запускайте сканирование уже из его карточки.";
    }
    if (!session) {
      return "Сначала начните сессию сканирования, а затем добавьте один или несколько бланков.";
    }
    return `Сессия активна. Уже загружено бланков: ${sessionBlanksQuery.data?.length ?? 0}.`;
  }, [isDemoMode, session, sessionBlanksQuery.data]);

  const appendFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    setSelectedFiles((current) => [...current, ...Array.from(files)]);
  };

  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles((current) => current.filter((_, index) => index !== indexToRemove));
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Сканирование</Typography>
        <Typography color="text.secondary">
          Запускайте отдельную сессию для каждого теста и загружайте бланки с телефона или компьютера.
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
        <Alert severity="error">Не удалось загрузить бланки. Проверьте, что файлы выбраны и сессия уже создана.</Alert>
      ) : null}
      {uploadMutation.isSuccess && selectedFiles.length === 0 ? (
        <Alert severity="success">
          Бланки отправлены. Каждый бланк уходит в backend отдельно, а дальше RabbitMQ уже организует OCR-обработку для каждого изображения.
        </Alert>
      ) : null}

      <SectionCard title="Сессия сканирования" subtitle={helperText}>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              startIcon={<PlayArrowRoundedIcon />}
              variant="contained"
              size="large"
              disabled={isDemoMode || !testQuery.data || startSessionMutation.isPending || Boolean(session)}
              onClick={() => startSessionMutation.mutate()}
            >
              {session ? "Сессия активна" : startSessionMutation.isPending ? "Создаём сессию..." : "Начать сессию сканирования"}
            </Button>
            {session ? <Chip color="success" label={`ID сессии: ${session.id}`} /> : null}
          </Stack>

          {!isDemoMode && testQuery.data ? (
            <Alert severity="info">
              Тест: {testQuery.data.title}. Класс: {testQuery.data.classLevel}. Вопросов: {testQuery.data.totalQuestions}.
            </Alert>
          ) : null}

          {!isDemoMode ? (
            <Alert severity="info">
              Можно отправить несколько бланков за один раз. При загрузке фронтенд отправит все выбранные изображения в одну сессию по очереди, а backend и RabbitMQ обработают их независимо.
            </Alert>
          ) : null}

          <Divider />

          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Как загрузить бланки
            </Typography>
            <Tabs value={mode} onChange={(_, value) => setMode(value)} sx={{ mb: 2 }} variant="scrollable">
              <Tab value="file" label="Загрузить файлы" />
              <Tab value="camera" label="Камера устройства" />
            </Tabs>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 7 }}>
                <SectionCard
                  title={mode === "file" ? "Загрузка файлов" : "Съёмка с камеры"}
                  subtitle={
                    mode === "file"
                      ? "Можно выбрать сразу несколько изображений бланков."
                      : "На телефоне можно открыть камеру устройства, сделать снимок, а затем снова открыть камеру и добавить следующий бланк."
                  }
                >
                  <Stack spacing={2}>
                    <TextField
                      label="Дата теста"
                      type="date"
                      value={testDate}
                      onChange={(event) => setTestDate(event.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />

                    {mode === "file" ? (
                      <>
                        <input
                          ref={inputRef}
                          hidden
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) => {
                            appendFiles(event.target.files);
                            event.target.value = "";
                          }}
                        />
                        <Button
                          startIcon={<CloudUploadRoundedIcon />}
                          variant="contained"
                          onClick={() => inputRef.current?.click()}
                        >
                          Выбрать файлы
                        </Button>
                      </>
                    ) : (
                      <>
                        <input
                          ref={cameraInputRef}
                          hidden
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(event) => {
                            appendFiles(event.target.files);
                            event.target.value = "";
                          }}
                        />
                        <Button
                          startIcon={<PhotoCameraRoundedIcon />}
                          variant="contained"
                          onClick={() => cameraInputRef.current?.click()}
                        >
                          Открыть камеру
                        </Button>
                        <Typography variant="body2" color="text.secondary">
                          Да, сейчас на мобильном устройстве можно открыть камеру телефона. После первого снимка можно снова нажать кнопку и добавить ещё один бланк в ту же очередь.
                        </Typography>
                      </>
                    )}

                    {selectedFiles.length ? (
                      <Stack spacing={1}>
                        <Typography variant="body2" color="text.secondary">
                          Выбрано бланков: {selectedFiles.length}
                        </Typography>
                        {selectedFiles.map((file, index) => (
                          <Box
                            key={`${file.name}-${index}`}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              p: 1,
                              borderRadius: 2,
                              bgcolor: "background.default"
                            }}
                          >
                            <Chip label={file.name} color="success" />
                            <IconButton color="error" onClick={() => removeSelectedFile(index)}>
                              <DeleteOutlineRoundedIcon />
                            </IconButton>
                          </Box>
                        ))}
                      </Stack>
                    ) : null}

                    <Button
                      variant="outlined"
                      disabled={!session || selectedFiles.length === 0 || uploadMutation.isPending}
                      onClick={() => uploadMutation.mutate()}
                    >
                      {uploadMutation.isPending
                        ? "Загружаем..."
                        : selectedFiles.length > 1
                          ? `Загрузить ${selectedFiles.length} бланков`
                          : "Загрузить бланк"}
                    </Button>
                  </Stack>
                </SectionCard>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <SectionCard title="Подсказки по качеству">
                  <Stack spacing={1.5}>
                    <Typography>• Бланк должен быть хорошо освещён</Typography>
                    <Typography>• Камера должна смотреть прямо на лист</Typography>
                    <Typography>• Углы и метки должны быть полностью видны</Typography>
                    <Typography>• Лучше использовать ровный однотонный фон</Typography>
                  </Stack>
                </SectionCard>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </SectionCard>
    </Stack>
  );
}
