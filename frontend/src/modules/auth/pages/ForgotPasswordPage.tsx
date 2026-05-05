import { useForm } from "react-hook-form";
import { Alert, Button, Stack, TextField } from "@mui/material";
import { AuthShell } from "./AuthShell";
import { forgotPasswordRequest } from "../api";

export function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { isSubmitting }, setError, watch } = useForm<{ email: string }>();

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      await forgotPasswordRequest(email);
      alert("Если пользователь существует, письмо для сброса отправлено.");
    } catch {
      setError("root", { message: "Не удалось отправить письмо." });
    }
  });

  return (
    <AuthShell>
      <form onSubmit={onSubmit}>
        <Stack spacing={2}>
          <TextField label="Email" defaultValue={watch("email")} {...register("email")} />
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Отправить ссылку
          </Button>
          <Alert severity="info">Введите email, и система отправит ссылку для сброса пароля.</Alert>
        </Stack>
      </form>
    </AuthShell>
  );
}
