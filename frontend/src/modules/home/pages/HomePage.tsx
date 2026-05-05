import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { useAuth } from "../../auth/AuthContext";

const steps = [
  {
    title: "1. Создайте тест",
    description: "Настройте название, предмет, класс, ответы и пороги оценок."
  },
  {
    title: "2. Начните сканирование",
    description: "Создайте сессию сканирования и загружайте бланки для OCR-обработки."
  },
  {
    title: "3. Проверьте сложные случаи",
    description: "Система сама выделит бланки, которым нужна ручная проверка."
  },
  {
    title: "4. Анализируйте результаты",
    description: "Смотрите средний балл, распределение оценок и сложные вопросы."
  }
];

const features = [
  "Автоматическое распознавание ответов на бумажных бланках",
  "Поддержка исправлений на бланке и финальных ответов",
  "Очередь ручной проверки для сомнительных случаев",
  "Аналитика по тестам, вопросам и результатам учеников"
];

const authenticatedNav = [
  { label: "Тесты", path: "/tests" },
  { label: "Сканирование", path: "/scan/sessions/demo" },
  { label: "Аналитика", path: "/tests" },
  { label: "Проверка", path: "/tests" }
];

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const mobileNav = (
    <Box sx={{ width: 260, p: 2 }}>
      <Typography variant="h6" color="primary.main" fontWeight={800} sx={{ mb: 2 }}>
        СканПроверка
      </Typography>
      <List>
        {authenticatedNav.map((item) => (
          <ListItemButton
            key={item.label}
            sx={{ borderRadius: 3 }}
            onClick={() => {
              navigate(item.path);
              setMobileDrawerOpen(false);
            }}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" elevation={0} color="transparent">
        <Toolbar
          sx={{
            justifyContent: "space-between",
            bgcolor: "rgba(247,244,238,0.9)",
            backdropFilter: "blur(12px)"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {isAuthenticated ? (
              <IconButton sx={{ display: { xs: "inline-flex", md: "none" } }} onClick={() => setMobileDrawerOpen(true)}>
                <MenuRoundedIcon />
              </IconButton>
            ) : null}
            <Button onClick={() => navigate("/")} sx={{ p: 0, minWidth: 0, color: "primary.main", fontSize: 24, fontWeight: 800 }}>
              СканПроверка
            </Button>
          </Box>

          {isAuthenticated ? (
            <>
              <Stack direction="row" spacing={1} sx={{ display: { xs: "none", md: "flex" } }}>
                {authenticatedNav.map((item) => (
                  <Button key={item.label} onClick={() => navigate(item.path)}>
                    {item.label}
                  </Button>
                ))}
              </Stack>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar
                  sx={{ bgcolor: "primary.main", cursor: "pointer", width: 40, height: 40 }}
                  onClick={(event) => setMenuAnchor(event.currentTarget)}
                >
                  {user?.fullName?.[0] ?? "У"}
                </Avatar>
                <Box sx={{ display: { xs: "none", sm: "block" }, cursor: "pointer" }} onClick={(event) => setMenuAnchor(event.currentTarget as HTMLElement)}>
                  <Typography variant="body1" fontWeight={700}>
                    {user?.fullName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
                <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                  <MenuItem onClick={() => { setMenuAnchor(null); navigate("/profile"); }}>Профиль</MenuItem>
                  <MenuItem onClick={() => { setMenuAnchor(null); logout(); }}>Выйти</MenuItem>
                </Menu>
              </Box>
            </>
          ) : (
            <Stack direction="row" spacing={1.5}>
              <Button component={Link} to="/login">Войти</Button>
              <Button component={Link} to="/register" variant="contained" color="secondary">
                Регистрация
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        {mobileNav}
      </Drawer>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 6 } }}>
        <Stack spacing={6}>
          <Box
            sx={{
              p: { xs: 3, md: 6 },
              borderRadius: 6,
              color: "white",
              background: "linear-gradient(135deg, #1f4e5f 0%, #2f6d70 100%)"
            }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid size={{ xs: 12, md: 7 }}>
                <Stack spacing={3}>
                  <Typography variant="h2" sx={{ fontSize: { xs: 32, md: 54 }, fontWeight: 800, lineHeight: 1.08 }}>
                    СканПроверка
                  </Typography>
                  <Typography variant="h5" sx={{ opacity: 0.92, maxWidth: 760, fontSize: { xs: 22, md: 30 } }}>
                    Система для сканирования, проверки и аналитики бумажных тестов для русскоязычной образовательной среды.
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.86, maxWidth: 760 }}>
                    Загружайте бланки, автоматически распознавайте ответы, обрабатывайте исправления и получайте понятную аналитику по каждому тесту.
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    {isAuthenticated ? (
                      <>
                        <Button variant="contained" color="secondary" size="large" onClick={() => navigate("/tests")}>
                          Открыть тесты
                        </Button>
                        <Button variant="outlined" size="large" sx={{ color: "white", borderColor: "rgba(255,255,255,0.5)" }} onClick={() => navigate("/scan/sessions/demo")}>
                          Перейти к сканированию
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button component={Link} to="/login" variant="contained" color="secondary" size="large">
                          Войти
                        </Button>
                        <Button component={Link} to="/register" variant="outlined" size="large" sx={{ color: "white", borderColor: "rgba(255,255,255,0.5)" }}>
                          Регистрация
                        </Button>
                      </>
                    )}
                  </Stack>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <Card sx={{ borderRadius: 5, bgcolor: "rgba(255,255,255,0.08)", color: "white", boxShadow: "none" }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Что умеет система
                    </Typography>
                    <Stack spacing={1.5}>
                      {features.map((feature) => (
                        <Typography key={feature} variant="body1">
                          • {feature}
                        </Typography>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Как это работает
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Рабочий процесс преподавателя от создания теста до итоговой аналитики.
            </Typography>
            <Grid container spacing={2}>
              {steps.map((step) => (
                <Grid key={step.title} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Card sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {step.title}
                      </Typography>
                      <Typography color="text.secondary">{step.description}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 6,
              bgcolor: "background.paper",
              border: "1px solid rgba(31, 78, 95, 0.08)"
            }}
          >
            <Stack spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
              <Typography variant="h4">Готовы начать работу?</Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 720, textAlign: { md: "center" } }}>
                {isAuthenticated
                  ? "Вы уже вошли в систему. Перейдите к тестам, запустите сканирование или откройте аналитику."
                  : "Войдите в систему, создайте первый тест и начните сессию сканирования. После обработки бланков вы сможете перейти к проверке и аналитике."}
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                {isAuthenticated ? (
                  <>
                    <Button variant="contained" size="large" onClick={() => navigate("/tests")}>
                      Перейти к тестам
                    </Button>
                    <Button variant="outlined" size="large" onClick={() => navigate("/profile")}>
                      Открыть профиль
                    </Button>
                  </>
                ) : (
                  <>
                    <Button component={Link} to="/login" variant="contained" size="large">
                      Перейти ко входу
                    </Button>
                    <Button component={Link} to="/register" variant="outlined" size="large">
                      Создать аккаунт
                    </Button>
                  </>
                )}
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
