import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { AuthShell } from "./AuthShell";
import { resetPasswordRequest } from "../api";

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<ResetPasswordFormValues>();

  const onSubmit = handleSubmit(async ({ password, confirmPassword }) => {
    if (password !== confirmPassword) {
      return;
    }

    try {
      await resetPasswordRequest(token, password, confirmPassword);
      setSuccess(true);
    } catch {
      setError("root", {
        message: "Could not save the new password. Please check the reset link and try again."
      });
    }
  });

  return (
    <AuthShell>
      {success ? (
        <Stack spacing={2}>
          <Alert severity="success">Password changed successfully.</Alert>
          <Typography color="text.secondary">
            You can now sign in with your new password.
          </Typography>
          <Button component={Link} to="/login" variant="contained">
            Go to sign in
          </Button>
        </Stack>
      ) : (
        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            {!token ? (
              <Alert severity="error">The password reset link is invalid or has expired.</Alert>
            ) : null}

            {errors.root?.message ? <Alert severity="error">{errors.root.message}</Alert> : null}

            <input
              type="password"
              {...register("password", {
                required: "New password is required.",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters."
                }
              })}
              placeholder="New password"
              style={{ padding: 14, borderRadius: 12, border: "1px solid #cbd5e1" }}
            />

            <input
              type="password"
              {...register("confirmPassword", {
                required: "Please confirm your password.",
                validate: (value, formValues) =>
                  value === formValues.password || "Passwords do not match."
              })}
              placeholder="Confirm password"
              style={{ padding: 14, borderRadius: 12, border: "1px solid #cbd5e1" }}
            />

            {errors.password?.message ? <Alert severity="error">{errors.password.message}</Alert> : null}
            {errors.confirmPassword?.message ? (
              <Alert severity="error">{errors.confirmPassword.message}</Alert>
            ) : null}

            <Button type="submit" variant="contained" disabled={isSubmitting || !token}>
              Save new password
            </Button>
          </Stack>
        </form>
      )}
    </AuthShell>
  );
}
