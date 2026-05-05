import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Button, Stack, TextField } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "./AuthShell";
import { loginRequest } from "../api";
import { useAuth } from "../AuthContext";

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
    } catch {
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
