import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Alert, Button, Stack, TextField } from "@mui/material";
import { AuthShell } from "./AuthShell";
import { resetPasswordRequest } from "../api";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const { register, handleSubmit, formState: { isSubmitting }, setError } = useForm<{ password: string; confirmPassword: string }>();

  const onSubmit = handleSubmit(async ({ password, confirmPassword }) => {
    try {
      await resetPasswordRequest(token, password, confirmPassword);
      alert("Пароль успешно изменён.");
    } catch {
      setError("root", { message: "Не удалось сбросить пароль." });
    }
  });

  return (
    <AuthShell>
      <form onSubmit={onSubmit}>
        <Stack spacing={2}>
          {!token ? <Alert severity="error">Отсутствует токен сброса пароля.</Alert> : null}
          <TextField label="Новый пароль" type="password" {...register("password")} />
          <TextField label="Повторите пароль" type="password" {...register("confirmPassword")} />
          <Button type="submit" variant="contained" disabled={isSubmitting || !token}>
            Сохранить новый пароль
          </Button>
        </Stack>
      </form>
    </AuthShell>
  );
}
