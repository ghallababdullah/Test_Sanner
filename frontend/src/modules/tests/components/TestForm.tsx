import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Grid, Stack, Switch, TextField, Typography, FormControlLabel } from "@mui/material";
import type { CreateTestRequest, UpdateTestRequest, TestResponse, TestWithDetailsResponse } from "../../../shared/types/tests";

const createSchema = z.object({
  title: z.string().min(3, "Минимум 3 символа"),
  subject: z.string().min(2, "Минимум 2 символа"),
  classLevel: z.string().min(1, "Укажите класс"),
  description: z.string().min(3, "Добавьте описание"),
  totalQuestions: z.coerce.number().min(1).max(32),
  maxScore: z.coerce.number().positive()
});

const editSchema = z.object({
  title: z.string().min(3, "Минимум 3 символа"),
  subject: z.string().min(2, "Минимум 2 символа"),
  description: z.string().min(3, "Добавьте описание"),
  isActive: z.boolean()
});

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;

interface CreateTestFormProps {
  mode: "create";
  initialValues?: Partial<TestResponse>;
  onSubmit: (payload: CreateTestRequest) => Promise<void>;
}

interface EditTestFormProps {
  mode: "edit";
  initialValues: TestWithDetailsResponse;
  onSubmit: (payload: UpdateTestRequest) => Promise<void>;
}

type TestFormProps = CreateTestFormProps | EditTestFormProps;

export function TestForm(props: TestFormProps) {
  if (props.mode === "create") {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateFormValues>({
      resolver: zodResolver(createSchema),
      defaultValues: {
        title: props.initialValues?.title ?? "",
        subject: props.initialValues?.subject ?? "",
        classLevel: props.initialValues?.classLevel ?? "",
        description: props.initialValues?.description ?? "",
        totalQuestions: props.initialValues?.totalQuestions ?? 32,
        maxScore: Number(props.initialValues?.maxScore ?? 32)
      }
    });

    return (
      <form onSubmit={handleSubmit(async (values) => props.onSubmit(values))}>
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Название теста" {...register("title")} error={!!errors.title} helperText={errors.title?.message} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Предмет" {...register("subject")} error={!!errors.subject} helperText={errors.subject?.message} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Класс" {...register("classLevel")} error={!!errors.classLevel} helperText={errors.classLevel?.message} /></Grid>
            <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth type="number" label="Количество вопросов" {...register("totalQuestions")} error={!!errors.totalQuestions} helperText={errors.totalQuestions?.message} /></Grid>
            <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth type="number" label="Макс. балл" {...register("maxScore")} error={!!errors.maxScore} helperText={errors.maxScore?.message} /></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth multiline minRows={4} label="Описание" {...register("description")} error={!!errors.description} helperText={errors.description?.message} /></Grid>
          </Grid>
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            Создать тест
          </Button>
        </Stack>
      </form>
    );
  }

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: props.initialValues.title,
      subject: props.initialValues.subject,
      description: props.initialValues.description,
      isActive: props.initialValues.isActive
    }
  });

  return (
    <form onSubmit={handleSubmit(async (values) => props.onSubmit(values))}>
      <Stack spacing={3}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Название теста" {...register("title")} error={!!errors.title} helperText={errors.title?.message} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Предмет" {...register("subject")} error={!!errors.subject} helperText={errors.subject?.message} /></Grid>
          <Grid size={{ xs: 12 }}><TextField fullWidth multiline minRows={4} label="Описание" {...register("description")} error={!!errors.description} helperText={errors.description?.message} /></Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={<Switch checked={watch("isActive")} onChange={(_, checked) => setValue("isActive", checked)} />}
              label={<Typography>Тест активен</Typography>}
            />
          </Grid>
        </Grid>
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          Сохранить изменения
        </Button>
      </Stack>
    </form>
  );
}
