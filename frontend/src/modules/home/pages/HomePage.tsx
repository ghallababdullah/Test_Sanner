import { Link, useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Container, Grid, Stack, Typography } from "@mui/material";
import { useAuth } from "../../auth/AuthContext";
import { PublicHeader } from "../components/PublicHeader";

const steps = [
  {
    title: "Создайте тест",
    description: "Укажите предмет, класс, количество вопросов и правильные ответы."
  },
  {
    title: "Распечатайте бланк",
    description: "Скачайте шаблон и объясните ученикам, как его правильно заполнять."
  },
  {
    title: "Загрузите работы",
    description: "Можно использовать файлы, камеру телефона и несколько бланков сразу."
  },
  {
    title: "Проверьте результат",
    description: "Система покажет ответы, спорные места и статистику по тесту."
  }
];

const features = [
  "Проверка бумажных бланков с телефона или компьютера",
  "Предпросмотр полей перед распознаванием",
  "Ручная проверка спорных ответов",
  "Наглядная статистика по тестам и ученикам"
];

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <PublicHeader />

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 6 } }}>
        <Stack spacing={{ xs: 4, md: 6 }}>
          <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
            <Grid size={{ xs: 12, lg: 7 }}>
              <Stack spacing={2.5}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: 34, sm: 42, md: 56 },
                    lineHeight: 1.05,
                    maxWidth: 720
                  }}
                >
                  Проверка бланков без лишней ручной работы
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 720, fontWeight: 400 }}>
                  СканПроверка помогает загружать бланки, распознавать ответы, находить спорные места и собирать
                  понятную аналитику по каждому тесту.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  {isAuthenticated ? (
                    <>
                      <Button variant="contained" size="large" onClick={() => navigate("/tests")}>
                        Открыть тесты
                      </Button>
                      <Button variant="outlined" size="large" onClick={() => navigate("/guide")}>
                        Посмотреть инструкцию
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button component={Link} to="/guide" variant="contained" size="large">
                        Как это работает
                      </Button>
                      <Button component={Link} to="/register" variant="outlined" size="large">
                        Создать аккаунт
                      </Button>
                    </>
                  )}
                </Stack>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <Card sx={{ borderRadius: 5 }}>
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Stack spacing={1.5}>
                    <Typography variant="h6">Что умеет система</Typography>
                    {features.map((feature) => (
                      <Typography key={feature} color="text.secondary">
                        • {feature}
                      </Typography>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Как проходит работа
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 760 }}>
              От создания теста до итоговой статистики весь процесс остаётся в одном месте.
            </Typography>
            <Grid container spacing={2}>
              {steps.map((step) => (
                <Grid key={step.title} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Card sx={{ height: "100%", borderRadius: 5 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack spacing={1.25}>
                        <Typography variant="h6">{step.title}</Typography>
                        <Typography color="text.secondary">{step.description}</Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Card sx={{ borderRadius: 5 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              <Stack spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
                <Typography variant="h4">С чего начать</Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 760, textAlign: { md: "center" } }}>
                  Сначала откройте инструкцию и скачайте шаблон бланка. После этого можно создавать тест и переходить к
                  загрузке первых работ.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button variant="contained" size="large" onClick={() => navigate("/guide")}>
                    Открыть инструкцию
                  </Button>
                  {isAuthenticated ? (
                    <Button variant="outlined" size="large" onClick={() => navigate("/scan")}>
                      Перейти к сканированию
                    </Button>
                  ) : (
                    <Button component={Link} to="/login" variant="outlined" size="large">
                      Войти в систему
                    </Button>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
