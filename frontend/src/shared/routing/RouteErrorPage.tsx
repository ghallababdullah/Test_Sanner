import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";

function buildMessage(error: unknown) {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        title: "Страница не найдена",
        details: "Похоже, нужная страница отсутствует или была перемещена."
      };
    }

    return {
      title: `Ошибка ${error.status}`,
      details: typeof error.data === "string" && error.data ? error.data : "Не удалось открыть страницу. Попробуйте обновить её ещё раз."
    };
  }

  if (error instanceof Error) {
    return {
      title: "Произошла непредвиденная ошибка",
      details: error.message || "Страница временно недоступна. Попробуйте обновить её ещё раз."
    };
  }

  return {
    title: "Произошла непредвиденная ошибка",
    details: "Страница временно недоступна. Попробуйте обновить её ещё раз."
  };
}

export function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const message = buildMessage(error);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
        bgcolor: "background.default"
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 720,
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          bgcolor: "background.paper",
          boxShadow: 3
        }}
      >
        <Stack spacing={3}>
          <Box sx={{ borderLeft: "6px solid", borderColor: "error.main", pl: 2 }}>
            <Typography variant="h4">{message.title}</Typography>
            <Typography color="text.secondary">
              Мы уже перехватили эту ошибку, поэтому приложение не должно показывать технический экран.
            </Typography>
          </Box>

          <Alert severity="error">{message.details}</Alert>

          <Typography variant="body2" color="text.secondary">
            Если ошибка повторяется, попробуйте вернуться на предыдущую страницу или открыть раздел заново с главной панели.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<RefreshRoundedIcon />}
              onClick={() => window.location.reload()}
            >
              Обновить страницу
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeRoundedIcon />}
              onClick={() => navigate("/")}
            >
              На главную
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
