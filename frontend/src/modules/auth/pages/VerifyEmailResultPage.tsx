import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { AuthShell } from "./AuthShell";

export function VerifyEmailResultPage() {
  const [searchParams] = useSearchParams();
  const status = useMemo(() => searchParams.get("status") ?? "error", [searchParams]);
  const message = useMemo(
    () => searchParams.get("message") ?? (status === "success" ? "Почта успешно подтверждена." : "Не удалось подтвердить почту."),
    [searchParams, status]
  );

  const isSuccess = status === "success";

  return (
    <AuthShell>
      <Stack spacing={2}>
        <Alert severity={isSuccess ? "success" : "error"}>{message}</Alert>
        <Typography color="text.secondary">
          {isSuccess
            ? "Теперь можно войти в приложение и продолжить работу."
            : "Ссылка может быть устаревшей или уже использованной. При необходимости зарегистрируйтесь заново или запросите новое письмо."}
        </Typography>
        <Button component={Link} to={isSuccess ? "/login" : "/register"} variant="contained">
          {isSuccess ? "Перейти ко входу" : "Открыть регистрацию"}
        </Button>
      </Stack>
    </AuthShell>
  );
}
