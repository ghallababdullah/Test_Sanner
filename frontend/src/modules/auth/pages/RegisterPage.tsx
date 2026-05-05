import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Stack, TextField } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerRequest(values);
      navigate("/login");
    } catch {
      setError("root", { message: "Не удалось зарегистрироваться." });
    }
  });

  return (
    <AuthShell>
      <form onSubmit={onSubmit}>
        <Stack spacing={2}>
          {errors.root ? <Alert severity="error">{errors.root.message}</Alert> : null}
          <TextField label="Имя" {...register("firstName")} error={!!errors.firstName} helperText={errors.firstName?.message} />
          <TextField label="Фамилия" {...register("lastName")} error={!!errors.lastName} helperText={errors.lastName?.message} />
          <TextField label="Email" {...register("email")} error={!!errors.email} helperText={errors.email?.message} />
          <TextField label="Пароль" type="password" {...register("password")} error={!!errors.password} helperText={errors.password?.message} />
          <TextField label="Повторите пароль" type="password" {...register("confirmPassword")} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            Зарегистрироваться
          </Button>
          <Button component={Link} to="/login">Уже есть аккаунт</Button>
        </Stack>
      </form>
    </AuthShell>
  );
}
