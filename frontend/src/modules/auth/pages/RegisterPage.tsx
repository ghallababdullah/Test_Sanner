import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { AuthShell } from "./AuthShell";
import { registerRequest } from "../api";

const schema = z
  .object({
    firstName: z.string().min(2, "Минимум 2 символа"),
    lastName: z.string().min(2, "Минимум 2 символа"),
    email: z.string().email("Введите корректный email"),
    password: z.string().min(6, "Минимум 6 символов"),
    confirmPassword: z.string().min(6, "Минимум 6 символов")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"]
  });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await registerRequest(values);
      setSuccessMessage(
        response.message ||
          "Регистрация завершена. Проверьте почту, подтвердите адрес и затем войдите в систему."
      );
    } catch {
      setError("root", { message: "Не удалось завершить регистрацию. Попробуйте ещё раз." });
    }
  });

  return (
    <AuthShell>
      {successMessage ? (
        <Stack spacing={2.5}>
          <Alert severity="success">{successMessage}</Alert>
          <Typography color="text.secondary">
            Что делать дальше:
            <br />
            1. Откройте письмо на почте.
            <br />
            2. Нажмите на ссылку подтверждения.
            <br />
            3. После этого войдите в систему.
          </Typography>
          <Button component={Link} to="/login" variant="contained" size="large">
            Перейти ко входу
          </Button>
        </Stack>
      ) : (
        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            {errors.root ? <Alert severity="error">{errors.root.message}</Alert> : null}
            {isSubmitting ? <Alert severity="info">Идёт регистрация, подождите...</Alert> : null}

            <TextField label="Имя" {...register("firstName")} error={!!errors.firstName} helperText={errors.firstName?.message} />
            <TextField label="Фамилия" {...register("lastName")} error={!!errors.lastName} helperText={errors.lastName?.message} />
            <TextField label="Email" {...register("email")} error={!!errors.email} helperText={errors.email?.message} />
            <TextField label="Пароль" type="password" {...register("password")} error={!!errors.password} helperText={errors.password?.message} />
            <TextField
              label="Повторите пароль"
              type="password"
              {...register("confirmPassword")}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              {isSubmitting ? "Идёт регистрация..." : "Зарегистрироваться"}
            </Button>
            <Button component={Link} to="/login">Уже есть аккаунт</Button>
          </Stack>
        </form>
      )}
    </AuthShell>
  );
}
