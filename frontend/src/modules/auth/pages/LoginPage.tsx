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
  email: z.string().trim().toLowerCase().email("Введите корректный адрес электронной почты"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов")
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
      const data = await loginRequest({
        email: values.email.trim().toLowerCase(),
        password: values.password
      });
      login(data);
      navigate("/tests");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseMessage = (error.response?.data as ApiResponse<unknown> | undefined)?.message;
        const status = error.response?.status;

        if (!error.response) {
          setError("root", {
            message: "Не удалось связаться с сервером. Проверьте, что сайт открыт по защищённому соединению и сервер приложения запущен."
          });
          return;
        }

        if (status === 400 || status === 401 || status === 404) {
          setError("root", { message: responseMessage || "Неверный адрес электронной почты или пароль." });
          return;
        }

        if (status === 502 || status === 503 || status === 504) {
          setError("root", {
            message: "Сайт не может подключиться к серверу приложения. Проверьте, что сервер запущен и доступен."
          });
          return;
        }

        setError("root", { message: responseMessage || `Ошибка входа. Код ответа: ${status}.` });
        return;
      }

      setError("root", { message: "Не удалось войти. Проверьте адрес электронной почты и пароль." });
    }
  });

  return (
    <AuthShell>
      <form onSubmit={onSubmit}>
        <Stack spacing={2}>
          {errors.root ? <Alert severity="error">{errors.root.message}</Alert> : null}
          <TextField
            label="Электронная почта"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            label="Пароль"
            type="password"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
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
