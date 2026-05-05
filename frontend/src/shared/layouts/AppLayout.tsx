import { useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { useAuth } from "../../modules/auth/AuthContext";

const drawerWidth = 260;

const navItems = [
  { label: "Тесты", path: "/tests" },
  { label: "Сканирование", path: "/scan/sessions/demo" },
  { label: "Проверка", path: "/tests" },
  { label: "Аналитика", path: "/tests" }
];

export function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const profileMenuOpen = useMemo(() => Boolean(profileAnchor), [profileAnchor]);

  const drawerContent = (
    <Box sx={{ height: "100%", bgcolor: "background.paper" }}>
      <Toolbar>
        <Button
          onClick={() => {
            navigate("/");
            setMobileDrawerOpen(false);
          }}
          sx={{ p: 0, minWidth: 0, color: "primary.main", fontSize: 24, fontWeight: 800 }}
        >
          СканПроверка
        </Button>
      </Toolbar>
      <List sx={{ px: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.label}
            sx={{ borderRadius: 3, mb: 0.5 }}
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
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
              bgcolor: "background.paper",
              borderRight: "1px solid rgba(31, 78, 95, 0.08)"
            }
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Drawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        sx={{
          display: { xs: "block", md: "none" },
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box"
          }
        }}
      >
        {drawerContent}
      </Drawer>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <AppBar position="sticky" elevation={0} color="transparent">
          <Toolbar
            sx={{
              justifyContent: "space-between",
              gap: 2,
              bgcolor: "rgba(247,244,238,0.92)",
              backdropFilter: "blur(12px)"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
              <IconButton sx={{ display: { xs: "inline-flex", md: "none" } }} onClick={() => setMobileDrawerOpen(true)}>
                <MenuRoundedIcon />
              </IconButton>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Панель преподавателя
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
                  Управление тестами, сканированием и аналитикой
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar
                sx={{ bgcolor: "primary.main", cursor: "pointer", width: 40, height: 40 }}
                onClick={(event) => setProfileAnchor(event.currentTarget)}
              >
                {user?.fullName?.[0] ?? "У"}
              </Avatar>
              <Box
                sx={{ cursor: "pointer", display: { xs: "none", sm: "block" } }}
                onClick={(event) => setProfileAnchor(event.currentTarget as HTMLElement)}
              >
                <Typography variant="body1" fontWeight={700} noWrap>
                  {user?.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {user?.email}
                </Typography>
              </Box>
              <Menu anchorEl={profileAnchor} open={profileMenuOpen} onClose={() => setProfileAnchor(null)}>
                <MenuItem
                  onClick={() => {
                    setProfileAnchor(null);
                    navigate("/");
                  }}
                >
                  Главная
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setProfileAnchor(null);
                    navigate("/profile");
                  }}
                >
                  Профиль
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setProfileAnchor(null);
                    logout();
                  }}
                >
                  Выйти
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
