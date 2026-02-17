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

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const { showError, showSuccess } = useToast();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!Validation.isNotEmpty(email)) {
      newErrors.email = ErrorMessages.EMAIL_REQUIRED;
    } else if (!Validation.isValidEmail(email)) {
      newErrors.email = ErrorMessages.EMAIL_INVALID;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendReset = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await authService.forgetPassword(email);
      setEmailSent(true);
      showSuccess('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      showError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const bgColor = isDark ? COLORS.darkBg : COLORS.lightBg;
  const textColor = isDark ? COLORS.darkText : COLORS.lightText;

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
          <Text style={[styles.title, { color: textColor }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: isDark ? COLORS.darkGray : COLORS.lightGray }]}>
            {emailSent
              ? 'Check your email for a reset link'
              : 'Enter your email to receive a password reset link'}
          </Text>
        </View>

        {/* Form Card */}
        <Card style={styles.card}>
          {!emailSent ? (
            <>
              <TextInput
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
                required
              />

              <Button
                label="Send Reset Link"
                onPress={handleSendReset}
                loading={loading}
                disabled={loading}
                fullWidth
              />
            </>
          ) : (
            <View style={styles.successContainer}>
              <Text style={[styles.successText, { color: COLORS.success }]}>✓</Text>
              <Text style={[styles.successMessage, { color: textColor }]}>
                Password reset email has been sent to {email}
              </Text>
              <Text style={[styles.successHint, { color: isDark ? COLORS.darkGray : COLORS.lightGray }]}>
                Please check your email and follow the instructions. If you don't see it, check your spam folder.
              </Text>

              <Button
                label="Back to Login"
                onPress={() => navigation.navigate('Login')}
                fullWidth
                style={styles.button}
              />
            </View>
          )}
        </Card>

        {/* Back to Login Link */}
        {!emailSent && (
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.backLink, { color: COLORS.primary }]}>
                ← Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  successText: {
    fontSize: 48,
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
  footer: {
    alignItems: 'center',
  },
  backLink: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
});
