import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { AuthShell } from "./AuthShell";
import { resetPasswordRequest } from "../api";

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<ResetPasswordFormValues>();

  const onSubmit = handleSubmit(async ({ password, confirmPassword }) => {
    if (password !== confirmPassword) {
      setError("root", { message: "Пароли не совпадают." });
      return;
    }

    try {
      await resetPasswordRequest(token, password, confirmPassword);
      setSuccess(true);
    } catch {
      setError("root", {
        message: "Не удалось сохранить новый пароль. Проверьте ссылку и попробуйте ещё раз."
      });
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
            {!token ? (
              <Alert severity="error">Ссылка для смены пароля повреждена или устарела.</Alert>
            ) : null}

            {errors.root?.message ? <Alert severity="error">{errors.root.message}</Alert> : null}

            <input
              type="password"
              {...register("password", {
                required: "Введите новый пароль.",
                minLength: {
                  value: 8,
                  message: "Пароль должен содержать минимум 8 символов."
                }
              })}
              placeholder="Новый пароль"
              style={{ padding: 14, borderRadius: 12, border: "1px solid #cbd5e1" }}
            />

            <input
              type="password"
              {...register("confirmPassword", {
                required: "Повторите пароль.",
                validate: (value, formValues) =>
                  value === formValues.password || "Пароли не совпадают."
              })}
              placeholder="Повторите пароль"
              style={{ padding: 14, borderRadius: 12, border: "1px solid #cbd5e1" }}
            />

            {errors.password?.message ? <Alert severity="error">{errors.password.message}</Alert> : null}
            {errors.confirmPassword?.message ? (
              <Alert severity="error">{errors.confirmPassword.message}</Alert>
            ) : null}

            <Button type="submit" variant="contained" disabled={isSubmitting || !token}>
              Сохранить новый пароль
            </Button>
          </Stack>
        </form>
      )}
    </AuthShell>
  );
}
