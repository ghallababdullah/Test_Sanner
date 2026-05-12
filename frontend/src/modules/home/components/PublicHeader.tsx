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
  Toolbar
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { useAuth } from "../../auth/AuthContext";
import { SiteContactActions } from "../../site/components/SiteContactActions";
import { ScanProvVerkaWordmark } from "../../../resources/ScanProvVerkaLogoKit";

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

function BrandMark() {
  return <ScanProvVerkaWordmark compact />;
}

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
            minHeight: { xs: 72, md: 82 },
            justifyContent: "space-between",
            gap: 2,
            bgcolor: "rgba(251,248,241,0.92)",
            backdropFilter: "blur(14px)"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <IconButton
              sx={{
                display: { xs: "inline-flex", md: "none" },
                border: "1px solid",
                borderColor: "divider"
              }}
              onClick={() => setMobileDrawerOpen(true)}
            >
              <MenuRoundedIcon />
            </IconButton>

            <Button onClick={() => navigate("/")} sx={{ p: 0, minWidth: 0, textAlign: "left" }}>
              <BrandMark />
            </Button>
          </Box>

          <Stack direction="row" spacing={0.75} sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
            {navItems.map((item) => {
              const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              return (
                <Button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  color={active ? "primary" : "inherit"}
                  variant={active ? "contained" : "text"}
                  sx={{
                    color: active ? "primary.contrastText" : "text.primary",
                    bgcolor: active ? "primary.main" : "transparent",
                    border: active ? "1px solid transparent" : "1px solid",
                    borderColor: active ? "transparent" : "divider"
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center" }}>
            <SiteContactActions />
            {isAuthenticated ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    cursor: "pointer",
                    width: 38,
                    height: 38,
                    borderRadius: 0
                  }}
                  onClick={(event) => setMenuAnchor(event.currentTarget)}
                >
                  {user?.fullName?.[0] ?? "У"}
                </Avatar>
                <Box
                  sx={{ display: { xs: "none", sm: "block" }, cursor: "pointer", minWidth: 0 }}
                  onClick={(event) => setMenuAnchor(event.currentTarget as HTMLElement)}
                >
                  <Button sx={{ p: 0, minWidth: 0, color: "text.primary", fontWeight: 700 }}>{user?.fullName}</Button>
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
                    onClick={async () => {
                      setMenuAnchor(null);
                      await logout();
                      navigate("/login");
                    }}
                  >
                    Выйти
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                <Button component={Link} to="/login" variant="outlined" color="primary" size="small">
                  Войти
                </Button>
                <Button component={Link} to="/register" variant="contained" color="secondary">
                  Регистрация
                </Button>
              </Stack>
            )}
          </Stack>

          {isAuthenticated ? (
            <Box sx={{ display: { xs: "flex", lg: "none" }, alignItems: "center", gap: 1.25, minWidth: 0 }}>
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  cursor: "pointer",
                  width: 38,
                  height: 38,
                  borderRadius: 0
                }}
                onClick={(event) => setMenuAnchor(event.currentTarget)}
              >
                {user?.fullName?.[0] ?? "У"}
              </Avatar>
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
                  onClick={async () => {
                    setMenuAnchor(null);
                    await logout();
                    navigate("/login");
                  }}
                >
                  Выйти
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: "flex", lg: "none" } }}>
              <Button component={Link} to="/login" variant="outlined" color="primary" size="small">
                Войти
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Drawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} sx={{ display: { xs: "block", md: "none" } }}>
        <Box sx={{ width: 292, p: 2.5, height: "100%", bgcolor: "background.paper" }}>
          <Box sx={{ mb: 2.5 }}>
            <BrandMark />
          </Box>
          <List sx={{ p: 0 }}>
            {navItems.map((item) => (
              <ListItemButton
                key={item.label}
                selected={location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)}
                sx={{
                  mb: 0.75,
                  border: "1px solid",
                  borderColor: "divider"
                }}
                onClick={() => {
                  navigate(item.path);
                  setMobileDrawerOpen(false);
                }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>

          <Box sx={{ mt: 2 }}>
            <SiteContactActions mobile onNavigate={() => setMobileDrawerOpen(false)} />
          </Box>

          {!isAuthenticated && (
            <List sx={{ p: 0, mt: 2 }}>
              <ListItemButton
                sx={{ mb: 0.75, border: "1px solid", borderColor: "divider" }}
                onClick={() => {
                  navigate("/login");
                  setMobileDrawerOpen(false);
                }}
              >
                <ListItemText primary="Войти" />
              </ListItemButton>
              <ListItemButton
                sx={{ border: "1px solid", borderColor: "divider" }}
                onClick={() => {
                  navigate("/register");
                  setMobileDrawerOpen(false);
                }}
              >
                <ListItemText primary="Регистрация" />
              </ListItemButton>
            </List>
          )}
        </Box>
      </Drawer>
    </>
  );
}
