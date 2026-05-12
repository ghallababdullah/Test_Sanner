import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { AxiosError } from "axios";
import type { LoginResponse } from "../../shared/types/auth";
import { getCurrentUserRequest, logoutRequest } from "./api";
import { AUTH_SESSION_EXPIRED_EVENT } from "../../shared/api/http";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { email: string; fullName: string } | null;
  login: (payload: LoginResponse) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<{ email: string; fullName: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const bootstrapSession = async () => {
      try {
        const payload = await getCurrentUserRequest();
        if (!active) {
          return;
        }

        setUser({
          email: payload.email,
          fullName: `${payload.firstName} ${payload.lastName}`.trim()
        });
        setIsAuthenticated(true);
      } catch (error) {
        if (!active) {
          return;
        }

        if (!(error instanceof AxiosError) || error.response?.status !== 401) {
          console.error("Failed to restore auth session", error);
        }
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void bootstrapSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      login: (payload) => {
        const fullName = `${payload.firstName} ${payload.lastName}`.trim();
        setUser({ email: payload.email, fullName });
        setIsAuthenticated(true);
        setIsLoading(false);
      },
      logout: async () => {
        try {
          await logoutRequest();
        } catch (error) {
          console.error("Failed to logout cleanly", error);
        }
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    }),
    [isAuthenticated, isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
