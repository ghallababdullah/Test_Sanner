import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, useColorScheme } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../config/theme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  show: (message: string, type: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = generateId();
    const toast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, toast]);

    const timer = setTimeout(() => {
      removeToast(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [removeToast]);

  const showSuccess = useCallback(
    (message: string, duration?: number) => show(message, 'success', duration),
    [show]
  );
  const showError = useCallback(
    (message: string, duration?: number) => show(message, 'error', duration),
    [show]
  );
  const showInfo = useCallback(
    (message: string, duration?: number) => show(message, 'info', duration),
    [show]
  );
  const showWarning = useCallback(
    (message: string, duration?: number) => show(message, 'warning', duration),
    [show]
  );

  return (
    <ToastContext.Provider value={{ show, showSuccess, showError, showInfo, showWarning }}>
      {children}
      <ToastStack toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastStackProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastStack: React.FC<ToastStackProps> = ({ toasts, onRemove }) => {
  return (
    <View style={styles.container}>
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </View>
  );
};

interface ToastMessageProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastMessage: React.FC<ToastMessageProps> = ({ toast, onRemove }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return COLORS.success;
      case 'error':
        return COLORS.error;
      case 'warning':
        return COLORS.warning;
      case 'info':
      default:
        return COLORS.info;
    }
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <Text style={styles.message}>{toast.message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    pointerEvents: 'none',
  },
  toast: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '500',
  },
});
