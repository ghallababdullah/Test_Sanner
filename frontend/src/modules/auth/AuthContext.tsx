import { createContext, useContext, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { LoginResponse } from "../../shared/types/auth";
import { clearAuthTokens, getAccessToken, getStoredUser, setAuthTokens } from "../../shared/api/tokenStorage";

interface AuthContextValue {
  isAuthenticated: boolean;
  user: { email: string; fullName: string } | null;
  login: (payload: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState(getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAccessToken()));

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      user,
      login: (payload) => {
        const fullName = `${payload.firstName} ${payload.lastName}`.trim();
        setAuthTokens({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          email: payload.email,
          fullName
        });
        setUser({ email: payload.email, fullName });
        setIsAuthenticated(true);
      },
      logout: () => {
        clearAuthTokens();
        setUser(null);
        setIsAuthenticated(false);
      }
    }),
    [isAuthenticated, user]
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
