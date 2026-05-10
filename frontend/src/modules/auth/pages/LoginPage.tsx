import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Alert, Box, Button, Stack, TextField } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "./AuthShell";
import { loginRequest } from "../api";
import { useAuth } from "../AuthContext";
import type { ApiResponse } from "../../../shared/types/api";

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов")
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const data = await loginRequest(values);
      login(data);
      navigate("/tests");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseMessage = (error.response?.data as ApiResponse<unknown> | undefined)?.message;
        const status = error.response?.status;

        if (!error.response) {
          setError("root", {
            message: "Нет связи с сервером. Проверьте, что страница открыта по HTTPS, а бэкенд запущен и доступен по сети."
          });
          return;
        }

        if (status === 400 || status === 401 || status === 404) {
          setError("root", { message: responseMessage || "Неверный email или пароль." });
          return;
        }

        if (status === 502 || status === 503 || status === 504) {
          setError("root", { message: "Фронтенд не может достучаться до бэкенда. Проверьте, что Spring Boot запущен на порту 8080." });
          return;
        }

        setError("root", { message: responseMessage || `Ошибка входа. Код ответа: ${status}.` });
        return;
      }

      setError("root", { message: "Не удалось войти. Проверьте email и пароль." });
    }
  });

  return (
    <AuthShell>
      <form onSubmit={onSubmit}>
        <Stack spacing={2}>
          {errors.root ? <Alert severity="error">{errors.root.message}</Alert> : null}
          <TextField label="Email" {...register("email")} error={!!errors.email} helperText={errors.email?.message} />
          <TextField label="Пароль" type="password" {...register("password")} error={!!errors.password} helperText={errors.password?.message} />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            Войти
          </Button>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Button component={Link} to="/register">Регистрация</Button>
            <Button component={Link} to="/forgot-password">Забыли пароль?</Button>
          </Box>
        </Stack>
      </form>
    </AuthShell>
  );
}
