import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Drawer,
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

const authenticatedNav = [
  { label: "Тесты", path: "/tests" },
  { label: "Сканирование", path: "/scan" },
  { label: "Проверка", path: "/review" },
  { label: "Аналитика", path: "/analytics" },
  { label: "Инструкция", path: "/guide" }
];

const publicNav = [
  { label: "Главная", path: "/" },
  { label: "Инструкция", path: "/guide" }
];

export function PublicHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navItems = isAuthenticated ? authenticatedNav : publicNav;

  return (
    <>
      <AppBar position="sticky" elevation={0} color="transparent">
        <Toolbar
          sx={{
            minHeight: { xs: 68, md: 76 },
            justifyContent: "space-between",
            gap: 2,
            bgcolor: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(14px)"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
            <IconButton sx={{ display: { xs: "inline-flex", md: "none" } }} onClick={() => setMobileDrawerOpen(true)}>
              <MenuRoundedIcon />
            </IconButton>

            <Button
              onClick={() => navigate("/")}
              sx={{
                p: 0,
                minWidth: 0,
                color: "text.primary",
                fontSize: { xs: 22, md: 24 },
                fontWeight: 800,
                letterSpacing: "-0.03em"
              }}
            >
              СканПроверка
            </Button>
          </Box>

          <Stack direction="row" spacing={0.5} sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
            {navItems.map((item) => {
              const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              return (
                <Button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  color={active ? "primary" : "inherit"}
                  variant={active ? "contained" : "text"}
                  sx={{
                    color: active ? "common.white" : "text.primary",
                    bgcolor: active ? "primary.main" : "transparent"
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>

          {isAuthenticated ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
              <Avatar
                sx={{ bgcolor: "primary.main", cursor: "pointer", width: 38, height: 38 }}
                onClick={(event) => setMenuAnchor(event.currentTarget)}
              >
                {user?.fullName?.[0] ?? "У"}
              </Avatar>
              <Box
                sx={{ display: { xs: "none", sm: "block" }, cursor: "pointer", minWidth: 0 }}
                onClick={(event) => setMenuAnchor(event.currentTarget as HTMLElement)}
              >
                <Typography variant="body1" fontWeight={700} noWrap>
                  {user?.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {user?.email}
                </Typography>
              </Box>
              <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    navigate("/profile");
                  }}
                >
                  Профиль
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    logout();
                  }}
                >
                  Выйти
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button component={Link} to="/login" sx={{ display: { xs: "none", sm: "inline-flex" } }}>
                Войти
              </Button>
              <Button component={Link} to="/register" variant="contained" color="secondary">
                Регистрация
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Drawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} sx={{ display: { xs: "block", md: "none" } }}>
        <Box sx={{ width: 280, p: 2.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            СканПроверка
          </Typography>
          <List sx={{ p: 0 }}>
            {navItems.map((item) => (
              <ListItemButton
                key={item.label}
                selected={location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)}
                sx={{ borderRadius: 3, mb: 0.5 }}
                onClick={() => {
                  navigate(item.path);
                  setMobileDrawerOpen(false);
                }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
            {!isAuthenticated && (
              <ListItemButton
                sx={{ borderRadius: 3, mt: 1 }}
                onClick={() => {
                  navigate("/login");
                  setMobileDrawerOpen(false);
                }}
              >
                <ListItemText primary="Войти" />
              </ListItemButton>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
