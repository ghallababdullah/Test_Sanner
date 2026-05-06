import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { AuthShell } from "./AuthShell";
import { forgotPasswordRequest } from "../api";

export function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const { register, handleSubmit, formState: { isSubmitting }, setError } = useForm<{ email: string }>();

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      await forgotPasswordRequest(email);
      setSubmittedEmail(email);
      setSuccess(true);
    } catch {
      setError("root", { message: "Не удалось отправить письмо. Попробуйте ещё раз." });
    }
  });

  return (
    <AuthShell>
      {success ? (
        <Stack spacing={2}>
          <Alert severity="success">Письмо отправлено.</Alert>
          <Typography color="text.secondary">
            Если аккаунт с адресом <strong>{submittedEmail}</strong> существует, вы получите письмо со ссылкой для смены пароля.
          </Typography>
        </Stack>
      ) : (
        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            <TextField label="Email" {...register("email")} />
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              Отправить ссылку
            </Button>
            <Alert severity="info">Введите email, и система отправит письмо для восстановления доступа.</Alert>
          </Stack>
        </form>
      )}
    </AuthShell>
  );
}
