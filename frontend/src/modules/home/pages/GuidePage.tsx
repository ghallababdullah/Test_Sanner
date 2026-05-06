import { Link } from "react-router-dom";
import { Box, Button, Card, CardContent, Container, Grid, Stack, Typography } from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import templatePdf from "../../../resources/template.pdf";
import scanAnimationHtml from "../../../resources/scan_3d_real_blank_hands_only.html?raw";
import blankTemplateImage from "../../../resources/шаблон бланка (1) (1).jpg";
import { useAuth } from "../../auth/AuthContext";
import { PublicHeader } from "../components/PublicHeader";

const processSteps = [
  "Скачайте и распечатайте шаблон бланка.",
  "Заполните бланк аккуратно и без исправлений.",
  "Сфотографируйте лист целиком при хорошем освещении.",
  "Проверьте найденные поля и запустите распознавание."
];

const answerRules = [
  "Только печатные символы",
  "Один символ — одна клетка",
  "Запятые, тире и минусы пишутся в отдельной клетке",
  "Слова пишутся слитно, без пустых клеток",
  "Только чёрная гелевая или капиллярная ручка",
  "Исправления запрещены"
];

const photoRules = [
  "Лист должен целиком помещаться в кадр.",
  "Фото лучше делать сверху, без сильного наклона.",
  "На бланк не должны падать тени и блики.",
  "Все четыре угла и метки должны быть хорошо видны."
];

export function GuidePage() {
  const { isAuthenticated } = useAuth();
  const animationHtml = scanAnimationHtml.replace(/__BLANK_IMAGE_URL__/g, blankTemplateImage);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <PublicHeader />

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
        <Stack spacing={{ xs: 3, md: 4 }}>
          <Stack spacing={1.5} sx={{ maxWidth: 760 }}>
            <Typography variant="h2" sx={{ fontSize: { xs: 30, sm: 38, md: 48 }, lineHeight: 1.08 }}>
              Как подготовить бланк и сделать хороший снимок
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              Ниже короткая инструкция для преподавателя и учеников. Анимацию мы оставили как наглядный пример
              процесса.
            </Typography>
          </Stack>

          <Card sx={{ borderRadius: 5, overflow: "hidden" }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box
                component="iframe"
                title="Анимация сканирования бланка"
                srcDoc={animationHtml}
                sx={{
                  width: "100%",
                  minHeight: { xs: 600, sm: 760, md: 650 },
                  border: 0,
                  display: "block",
                  bgcolor: "transparent"
                }}
              />
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: 5, height: "100%" }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={1.5}>
                    <Typography variant="h5">Кратко о процессе</Typography>
                    {processSteps.map((step, index) => (
                      <Typography key={step} color="text.secondary">
                        {index + 1}. {step}
                      </Typography>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: 5, height: "100%" }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={1.5}>
                    <Typography variant="h5">Как должен выглядеть снимок</Typography>
                    {photoRules.map((rule) => (
                      <Typography key={rule} color="text.secondary">
                        • {rule}
                      </Typography>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ borderRadius: 5 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack spacing={1.5}>
                <Typography variant="h5">Рекомендации по заполнению ответов</Typography>
                <Grid container spacing={1.5}>
                  {answerRules.map((rule) => (
                    <Grid key={rule} size={{ xs: 12, sm: 6 }}>
                      <Box
                        sx={{
                          px: 2,
                          py: 1.5,
                          borderRadius: 4,
                          bgcolor: "background.default",
                          border: "1px solid",
                          borderColor: "divider"
                        }}
                      >
                        <Typography>{rule}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 5 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack spacing={2} direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between">
                <Box>
                  <Typography variant="h5">Шаблон бланка</Typography>
                  <Typography color="text.secondary">
                    Скачайте PDF-шаблон и используйте его для печати и тестирования.
                  </Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button variant="contained" startIcon={<DownloadRoundedIcon />} href={templatePdf} download="template.pdf">
                    Скачать шаблон
                  </Button>
                  <Button component={Link} to={isAuthenticated ? "/scan" : "/login"} variant="outlined">
                    Перейти к сканированию
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
