import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { authService, LoginResponse } from '../services/auth.service';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  roles?: string[];
}

export interface AuthState {
  isLoading: boolean;
  isSignout: boolean;
  user: User | null;
  accessToken: string | null;
  error: string | null;
}

export type AuthAction =
  | { type: 'RESTORE_TOKEN'; payload: { token: string; user: User } }
  | { type: 'SIGN_IN'; payload: { token: string; user: User } }
  | { type: 'SIGN_OUT' }
  | { type: 'SIGN_UP'; payload: { token: string; user: User } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

interface AuthContextType {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  signOut: () => Promise<void>;
  bootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  isLoading: true,
  isSignout: false,
  user: null,
  accessToken: null,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        isLoading: false,
        accessToken: action.payload.token,
        user: action.payload.user,
        isSignout: false,
      };

    case 'SIGN_IN':
      return {
        ...state,
        isSignout: false,
        accessToken: action.payload.token,
        user: action.payload.user,
        error: null,
      };

    case 'SIGN_OUT':
      return {
        ...state,
        isSignout: true,
        accessToken: null,
        user: null,
        error: null,
      };

    case 'SIGN_UP':
      return {
        ...state,
        isSignout: false,
        accessToken: action.payload.token,
        user: action.payload.user,
        error: null,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Bootstrap auth state on app startup
   */
  const bootstrap = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        const token = await authService.getAccessToken();
        const userInfo = await authService.getUserInfo();

        if (token && userInfo) {
          dispatch({
            type: 'RESTORE_TOKEN',
            payload: {
              token,
              user: {
                id: userInfo.userEmail,
                email: userInfo.userEmail,
                firstName: userInfo.firstName || '',
                lastName: userInfo.lastName || '',
              },
            },
          });
        } else {
          dispatch({ type: 'SIGN_OUT' });
        }
      } else {
        dispatch({ type: 'SIGN_OUT' });
      }
    } catch (error) {
      console.error('Bootstrap error:', error);
      dispatch({ type: 'SIGN_OUT' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await authService.login({ email, password });

      if (!response.data) {
        throw new Error('Invalid login response structure');
      }

      // Backend returns email which is used as identifier for all endpoints
      const userData: User = {
        id: response.data.email,
        email: response.data.email,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
      };

      const token = response.data.accessToken;

      if (!token || !userData.email) {
        throw new Error('Missing token or email in response');
      }

      dispatch({
        type: 'SIGN_IN',
        payload: {
          token: token,
          user: userData,
        },
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      console.error('Login error:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Sign up with registration data
   */
  const signUp = async (data: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      await authService.register(data);

      // After registration, auto-login
      const loginResponse = await authService.login({
        email: data.email,
        password: data.password,
      });

      const userData: User = {
        id: loginResponse.data.email,
        email: loginResponse.data.email,
        firstName: loginResponse.data.firstName,
        lastName: loginResponse.data.lastName,
      };

      dispatch({
        type: 'SIGN_UP',
        payload: {
          token: loginResponse.data.accessToken,
          user: userData,
        },
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Sign out
   */
  const signOut = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await authService.logout();
      dispatch({ type: 'SIGN_OUT' });
    } catch (error) {
      console.error('Sign out error:', error);
      dispatch({ type: 'SIGN_OUT' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Bootstrap on mount
  useEffect(() => {
    bootstrap();
  }, []);

  const value: AuthContextType = {
    state,
    dispatch,
    signIn,
    signUp,
    signOut,
    bootstrap,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
