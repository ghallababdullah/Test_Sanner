import { Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createTest } from "../api";
import { SectionCard } from "../../../shared/components/SectionCard";
import { TestForm } from "../components/TestForm";

export function CreateTestPage() {
  const navigate = useNavigate();

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Создание теста</Typography>
      <SectionCard title="Новый тест" subtitle="Заполните основные параметры теста перед настройкой ответов и порогов.">
        <TestForm
          mode="create"
          onSubmit={async (payload) => {
            const created = await createTest(payload);
            navigate(`/tests/${created.id}`);
          }}
        />
      </SectionCard>
    </Stack>
  );
}
