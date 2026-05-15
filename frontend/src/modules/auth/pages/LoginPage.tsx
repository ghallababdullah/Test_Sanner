import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Alert, Box, Button, Stack, TextField } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "./AuthShell";
import { loginRequest } from "../api";
import { useAuth } from "../AuthContext";
import type { ApiResponse } from "../../../shared/types/api";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const data = await loginRequest({
        email: values.email.trim().toLowerCase(),
        password: values.password
      });
      login(data);
      navigate("/tests");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseMessage = (error.response?.data as ApiResponse<unknown> | undefined)?.message;
        const status = error.response?.status;

        if (!error.response) {
          setError("root", {
            message: "Unable to reach the server. Make sure the site is open over HTTPS and the backend is running."
          });
          return;
        }

        if (status === 400 || status === 401 || status === 404) {
          setError("root", { message: responseMessage || "Invalid email or password." });
          return;
        }

        if (status === 502 || status === 503 || status === 504) {
          setError("root", {
            message: "The frontend cannot reach the backend. Check that Spring Boot is running on port 8080."
          });
          return;
        }

        setError("root", { message: responseMessage || `Login failed. Response code: ${status}.` });
        return;
      }

      setError("root", { message: "Unable to sign in. Check your email and password." });
    }
  });

  return (
    <AuthShell>
      <form onSubmit={onSubmit}>
        <Stack spacing={2}>
          {errors.root ? <Alert severity="error">{errors.root.message}</Alert> : null}
          <TextField label="Email" {...register("email")} error={!!errors.email} helperText={errors.email?.message} />
          <TextField
            label="Password"
            type="password"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            Sign in
          </Button>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Button component={Link} to="/register">Register</Button>
            <Button component={Link} to="/forgot-password">Forgot password?</Button>
          </Box>
        </Stack>
      </form>
    </AuthShell>
  );
}
