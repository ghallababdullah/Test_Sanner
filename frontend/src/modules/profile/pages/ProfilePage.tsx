import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, Button, Grid, Stack, TextField, Typography } from "@mui/material";
import { SectionCard } from "../../../shared/components/SectionCard";
import { MetricCard } from "../../../shared/components/MetricCard";
import { useAuth } from "../../auth/AuthContext";
import { fetchOverview } from "../../analytics/api";
import { changePasswordRequest } from "../../auth/api";
import type { ApiResponse } from "../../../shared/types/api";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: z.string().min(6, "Минимум 6 символов"),
    confirmPassword: z.string().min(1, "Повторите новый пароль")
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"]
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function ProfilePage() {
  const { user } = useAuth();
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const overviewQuery = useQuery({
    queryKey: ["profile-overview"],
    queryFn: fetchOverview
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema)
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePasswordRequest,
    onSuccess: () => {
      reset();
      setIsPasswordFormOpen(false);
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePasswordMutation.mutateAsync(values);
    } catch (error) {
      let message = "Не удалось изменить пароль.";
      if (error instanceof AxiosError) {
        message = (error.response?.data as ApiResponse<unknown> | undefined)?.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      setError("root", { message });
    }
  });

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Профиль</Typography>
      <SectionCard title="Пользователь">
        <Typography>Имя: {user?.fullName}</Typography>
        <Typography>Email: {user?.email}</Typography>
      </SectionCard>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label="Создано тестов" value={overviewQuery.data?.totalTests ?? 0} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label="Отсканировано бланков" value={overviewQuery.data?.totalScannedBlanks ?? 0} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label="Проверено бланков" value={overviewQuery.data?.totalScoredBlanks ?? 0} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label="Нуждаются в проверке" value={overviewQuery.data?.totalNeedsReview ?? 0} />
        </Grid>
      </Grid>

      <SectionCard title="Общая статистика">
        <Typography>Средний балл: {overviewQuery.data?.averageScore ?? 0}</Typography>
        <Typography>Средний процент: {overviewQuery.data?.averagePercentage ?? 0}%</Typography>
      </SectionCard>

      <SectionCard title="Смена пароля" subtitle="Введите текущий пароль и задайте новый пароль для входа.">
        <Stack spacing={2}>
          {changePasswordMutation.isSuccess ? <Alert severity="success">Пароль успешно изменён.</Alert> : null}

          {!isPasswordFormOpen ? (
            <Button
              variant="contained"
              onClick={() => {
                changePasswordMutation.reset();
                setIsPasswordFormOpen(true);
              }}
            >
              Открыть форму смены пароля
            </Button>
          ) : (
            <form onSubmit={onSubmit}>
              <Stack spacing={2}>
                {errors.root ? <Alert severity="error">{errors.root.message}</Alert> : null}

                <TextField
                  label="Текущий пароль"
                  type="password"
                  {...register("currentPassword")}
                  error={!!errors.currentPassword}
                  helperText={errors.currentPassword?.message}
                />
                <TextField
                  label="Новый пароль"
                  type="password"
                  {...register("newPassword")}
                  error={!!errors.newPassword}
                  helperText={errors.newPassword?.message}
                />
                <TextField
                  label="Повторите новый пароль"
                  type="password"
                  {...register("confirmPassword")}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button type="submit" variant="contained" disabled={isSubmitting || changePasswordMutation.isPending}>
                    {isSubmitting || changePasswordMutation.isPending ? "Сохраняем..." : "Изменить пароль"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      reset();
                      changePasswordMutation.reset();
                      setIsPasswordFormOpen(false);
                    }}
                  >
                    Отмена
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
