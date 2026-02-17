import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/auth.service';
import { COLORS, SPACING, TYPOGRAPHY } from '../../config/theme';
import { Validation, ErrorMessages } from '../../utils/validation';

interface ResetPasswordScreenProps {
  navigation: any;
  route?: {
    params?: {
      token?: string;
    };
  };
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation, route }) => {
  const { showError, showSuccess } = useToast();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const token = route?.params?.token || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!Validation.isNotEmpty(newPassword)) {
      newErrors.newPassword = ErrorMessages.PASSWORD_REQUIRED;
    } else if (!Validation.isValidPassword(newPassword)) {
      newErrors.newPassword = ErrorMessages.PASSWORD_TOO_SHORT;
    }

    if (!Validation.isNotEmpty(confirmPassword)) {
      newErrors.confirmPassword = ErrorMessages.CONFIRM_PASSWORD_REQUIRED;
    } else if (!Validation.passwordsMatch(newPassword, confirmPassword)) {
      newErrors.confirmPassword = ErrorMessages.PASSWORD_MISMATCH;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm() || !token) return;

    try {
      setLoading(true);
      await authService.resetPassword(token, {
        newPassword,
        confirmPassword,
      });
      setResetSuccess(true);
      showSuccess('Password reset successfully!');
    } catch (error: any) {
      showError(error.message || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const bgColor = isDark ? COLORS.darkBg : COLORS.lightBg;
  const textColor = isDark ? COLORS.darkText : COLORS.lightText;

  if (!token) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: COLORS.error }]}>
            Invalid reset link
          </Text>
          <Button
            label="Back to Login"
            onPress={() => navigation.navigate('Login')}
            fullWidth
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: bgColor }]}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Set New Password</Text>
          <Text style={[styles.subtitle, { color: isDark ? COLORS.darkGray : COLORS.lightGray }]}>
            {resetSuccess
              ? 'Your password has been reset successfully'
              : 'Enter your new password below'}
          </Text>
        </View>

        {/* Form Card */}
        <Card style={styles.card}>
          {!resetSuccess ? (
            <>
              <TextInput
                label="New Password"
                placeholder="••••••••"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                error={errors.newPassword}
                required
              />

              <TextInput
                label="Confirm Password"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                error={errors.confirmPassword}
                required
              />

              <Button
                label="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                disabled={loading}
                fullWidth
                variant="secondary"
              />
            </>
          ) : (
            <View style={styles.successContainer}>
              <Text style={[styles.successIcon]}>✓</Text>
              <Text style={[styles.successMessage, { color: textColor }]}>
                Password Reset Complete
              </Text>
              <Text style={[styles.successHint, { color: isDark ? COLORS.darkGray : COLORS.lightGray }]}>
                You can now log in with your new password
              </Text>

              <Button
                label="Go to Login"
                onPress={() => navigation.navigate('Login')}
                fullWidth
                style={styles.button}
              />
            </View>
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xxl,
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.display,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
  },
  card: {
    marginBottom: SPACING.xl,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  successIcon: {
    fontSize: 48,
    color: COLORS.success,
    marginBottom: SPACING.md,
  },
  successMessage: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  successHint: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  button: {
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xl,
  },
});
