import { useQuery } from "@tanstack/react-query";
import { Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { fetchTestDetails, updateTest } from "../api";
import { SectionCard } from "../../../shared/components/SectionCard";
import { TestForm } from "../components/TestForm";

export function EditTestPage() {
  const { testId = "" } = useParams();
  const navigate = useNavigate();
  const detailsQuery = useQuery({ queryKey: ["test-details", testId], queryFn: () => fetchTestDetails(testId), enabled: !!testId });

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Редактирование теста</Typography>
      <SectionCard title="Параметры теста">
        {detailsQuery.data ? (
          <TestForm
            mode="edit"
            initialValues={detailsQuery.data}
            onSubmit={async (payload) => {
              await updateTest(testId, payload);
              navigate(`/tests/${testId}`);
            }}
          />
        ) : (
          <Typography>Загрузка...</Typography>
        )}
      </SectionCard>
    </Stack>
  );
}
