import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import { useAuth } from "../../auth/AuthContext";
import { sendSiteContactMessage, type SiteContactRequest, type SiteContactType } from "../api";
import { siteConfig } from "../siteConfig";

type FormState = {
  name: string;
  email: string;
  organization: string;
  subject: string;
  message: string;
};

type Props = {
  mobile?: boolean;
  onNavigate?: () => void;
};

function buildInitialForm(name?: string | null, email?: string | null): FormState {
  return {
    name: name ?? "",
    email: email ?? "",
    organization: "",
    subject: "",
    message: ""
  };
}

function getDialogCopy(mode: SiteContactType) {
  if (mode === "COLLABORATION") {
    return {
      title: "Сотрудничество",
      subject: "Предложение о сотрудничестве",
      message: "Расскажите, чем вы занимаетесь, какой формат сотрудничества вам интересен и как с вами лучше связаться.",
      button: "Отправить предложение"
    };
  }

  return {
    title: "Техническая поддержка",
    subject: "Нужна помощь по работе с системой",
    message: "Опишите проблему, на каком экране она возникла и что вы уже пробовали сделать.",
    button: "Отправить запрос"
  };
}

function extractErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || "Не удалось отправить сообщение. Попробуйте ещё раз.";
  }

  return "Не удалось отправить сообщение. Попробуйте ещё раз.";
}

export function SiteContactActions({ mobile = false, onNavigate }: Props) {
  const { user } = useAuth();
  const [dialogMode, setDialogMode] = useState<SiteContactType | null>(null);
  const [form, setForm] = useState<FormState>(() => buildInitialForm(user?.fullName, user?.email));

  useEffect(() => {
    if (!dialogMode) {
      setForm(buildInitialForm(user?.fullName, user?.email));
      return;
    }

    const copy = getDialogCopy(dialogMode);
    setForm((current) => ({
      ...buildInitialForm(user?.fullName, user?.email),
      subject: current.subject || copy.subject,
      message: current.message || copy.message
    }));
  }, [dialogMode, user?.email, user?.fullName]);

  const sendMutation = useMutation({
    mutationFn: (payload: SiteContactRequest) => sendSiteContactMessage(payload)
  });

  const dialogCopy = useMemo(
    () => (dialogMode ? getDialogCopy(dialogMode) : null),
    [dialogMode]
  );

  const openDialog = (mode: SiteContactType) => {
    onNavigate?.();
    sendMutation.reset();
    setDialogMode(mode);
  };

  const closeDialog = () => {
    setDialogMode(null);
    sendMutation.reset();
  };

  const handleSubmit = () => {
    if (!dialogMode) {
      return;
    }

    sendMutation.mutate({
      type: dialogMode,
      name: form.name.trim(),
      email: form.email.trim(),
      organization: form.organization.trim(),
      subject: form.subject.trim(),
      message: form.message.trim()
    });
  };

  return (
    <>
      <Stack direction={mobile ? "column" : "row"} spacing={1} alignItems={mobile ? "stretch" : "center"}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<SupportAgentRoundedIcon />}
          onClick={() => openDialog("SUPPORT")}
        >
          Поддержка
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<HandshakeRoundedIcon />}
          onClick={() => openDialog("COLLABORATION")}
        >
          Сотрудничество
        </Button>
      </Stack>

      <Dialog open={Boolean(dialogMode)} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{dialogCopy?.title}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {sendMutation.isSuccess ? (
              <Alert severity="success">
                Сообщение отправлено. Подтверждение уже отправлено на вашу почту, а запрос поступил разработчику.
              </Alert>
            ) : null}
            {sendMutation.isError ? <Alert severity="error">{extractErrorMessage(sendMutation.error)}</Alert> : null}
            <TextField
              label="Ваше имя"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Школа, компания или организация"
              value={form.organization}
              onChange={(event) => setForm((current) => ({ ...current, organization: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Тема"
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Сообщение"
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              fullWidth
              multiline
              minRows={5}
            />
            <Typography variant="body2" color="text.secondary">
              Сообщение будет отправлено на {siteConfig.supportEmail}.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeDialog}>Закрыть</Button>
          <Button
            variant="contained"
            startIcon={<MailOutlineRoundedIcon />}
            onClick={handleSubmit}
            disabled={
              sendMutation.isPending ||
              form.name.trim().length === 0 ||
              form.email.trim().length === 0 ||
              form.subject.trim().length === 0 ||
              form.message.trim().length === 0
            }
          >
            {sendMutation.isPending ? "Отправляем..." : dialogCopy?.button}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
