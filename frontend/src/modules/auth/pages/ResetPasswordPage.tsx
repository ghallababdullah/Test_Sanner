import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { AuthShell } from "./AuthShell";
import { resetPasswordRequest } from "../api";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting }, setError } = useForm<{ password: string; confirmPassword: string }>();

  const onSubmit = handleSubmit(async ({ password, confirmPassword }) => {
    try {
      await resetPasswordRequest(token, password, confirmPassword);
      setSuccess(true);
    } catch {
      setError("root", { message: "Не удалось сохранить новый пароль. Проверьте ссылку и попробуйте ещё раз." });
    }
  });

  return (
    <AuthShell>
      {success ? (
        <Stack spacing={2}>
          <Alert severity="success">Пароль успешно изменён.</Alert>
          <Typography color="text.secondary">
            Теперь можно войти в систему с новым паролем.
          </Typography>
          <Button component={Link} to="/login" variant="contained">
            Перейти ко входу
          </Button>
        </Stack>
      ) : (
        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            {!token ? <Alert severity="error">Ссылка для смены пароля повреждена или устарела.</Alert> : null}
            <input type="password" {...register("password")} placeholder="Новый пароль" style={{ padding: 14, borderRadius: 12, border: "1px solid #cbd5e1" }} />
            <input type="password" {...register("confirmPassword")} placeholder="Повторите пароль" style={{ padding: 14, borderRadius: 12, border: "1px solid #cbd5e1" }} />
            <Button type="submit" variant="contained" disabled={isSubmitting || !token}>
              Сохранить новый пароль
            </Button>
          </Stack>
        </form>
      )}
    </AuthShell>
  );
}
