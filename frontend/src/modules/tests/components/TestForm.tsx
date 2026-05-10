import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Grid, Stack, Switch, TextField, Typography, FormControlLabel } from "@mui/material";
import type { CreateTestRequest, UpdateTestRequest, TestResponse, TestWithDetailsResponse } from "../../../shared/types/tests";

const createSchema = z.object({
  title: z.string().min(1, "Укажите название теста"),
  subject: z.string().optional(),
  classLevel: z.string().optional(),
  description: z.string().optional(),
  totalQuestions: z.coerce.number().min(1, "Минимум 1 вопрос").max(32, "Максимум 32 вопроса"),
  maxScore: z.coerce.number().positive("Укажите максимальный балл")
});

const editSchema = z.object({
  title: z.string().min(1, "Укажите название теста"),
  subject: z.string().optional(),
  classLevel: z.string().optional(),
  description: z.string().optional(),
  totalQuestions: z.coerce.number().min(1, "Минимум 1 вопрос").max(32, "Максимум 32 вопроса"),
  maxScore: z.coerce.number().positive("Укажите максимальный балл"),
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
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
      setError
    } = useForm<CreateFormValues>({
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
      <form
        onSubmit={handleSubmit(async (values) => {
          try {
            await props.onSubmit({
              ...values,
              subject: values.subject?.trim() || "",
              classLevel: values.classLevel?.trim() || "",
              description: values.description?.trim() || ""
            });
          } catch {
            setError("root", { message: "Не удалось создать тест. Проверьте обязательные поля и попробуйте ещё раз." });
          }
        })}
      >
        <Stack spacing={3}>
          {errors.root ? <Alert severity="error">{errors.root.message}</Alert> : null}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Название теста" {...register("title")} error={!!errors.title} helperText={errors.title?.message} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Предмет" placeholder="Можно оставить пустым" {...register("subject")} error={!!errors.subject} helperText={errors.subject?.message} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Класс" placeholder="Можно оставить пустым" {...register("classLevel")} error={!!errors.classLevel} helperText={errors.classLevel?.message} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField fullWidth type="number" label="Количество вопросов" {...register("totalQuestions")} error={!!errors.totalQuestions} helperText={errors.totalQuestions?.message} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField fullWidth type="number" label="Максимальный балл" {...register("maxScore")} error={!!errors.maxScore} helperText={errors.maxScore?.message} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline minRows={3} label="Описание" placeholder="Необязательно" {...register("description")} error={!!errors.description} helperText={errors.description?.message} />
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? "Создаём тест..." : "Создать тест"}
          </Button>
        </Stack>
      </form>
    );
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    setError
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: props.initialValues.title,
      subject: props.initialValues.subject,
      classLevel: props.initialValues.classLevel ?? "",
      description: props.initialValues.description ?? "",
      totalQuestions: props.initialValues.totalQuestions,
      maxScore: Number(props.initialValues.maxScore ?? 0),
      isActive: props.initialValues.isActive
    }
  });

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        try {
          await props.onSubmit({
            title: values.title,
            subject: values.subject?.trim() || "",
            classLevel: values.classLevel?.trim() || "",
            description: values.description?.trim() || "",
            totalQuestions: values.totalQuestions,
            maxScore: values.maxScore,
            isActive: values.isActive
          });
        } catch {
          setError("root", { message: "Не удалось сохранить изменения. Попробуйте ещё раз." });
        }
      })}
    >
      <Stack spacing={3}>
        {errors.root ? <Alert severity="error">{errors.root.message}</Alert> : null}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Название теста" {...register("title")} error={!!errors.title} helperText={errors.title?.message} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Предмет" {...register("subject")} error={!!errors.subject} helperText={errors.subject?.message} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Класс" placeholder="Можно оставить пустым" {...register("classLevel")} error={!!errors.classLevel} helperText={errors.classLevel?.message} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth type="number" label="Количество вопросов" {...register("totalQuestions")} error={!!errors.totalQuestions} helperText={errors.totalQuestions?.message} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth type="number" label="Максимальный балл" {...register("maxScore")} error={!!errors.maxScore} helperText={errors.maxScore?.message} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth multiline minRows={3} label="Описание" placeholder="Необязательно" {...register("description")} error={!!errors.description} helperText={errors.description?.message} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={<Switch checked={watch("isActive")} onChange={(_, checked) => setValue("isActive", checked)} />}
              label={<Typography>Тест активен</Typography>}
            />
          </Grid>
        </Grid>
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          {isSubmitting ? "Сохраняем..." : "Сохранить изменения"}
        </Button>
      </Stack>
    </form>
  );
}
