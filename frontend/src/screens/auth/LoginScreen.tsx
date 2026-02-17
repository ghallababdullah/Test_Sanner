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
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { Card } from '../../components/ui/Card';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../config/theme';
import { Validation, ErrorMessages } from '../../utils/validation';

export const LoginScreen = ({ navigation }: any) => {
  const { signIn } = useAuth();
  const { showError, showSuccess } = useToast();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!Validation.isNotEmpty(email)) {
      newErrors.email = ErrorMessages.EMAIL_REQUIRED;
    } else if (!Validation.isValidEmail(email)) {
      newErrors.email = ErrorMessages.EMAIL_INVALID;
    }

    if (!Validation.isNotEmpty(password)) {
      newErrors.password = ErrorMessages.PASSWORD_REQUIRED;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await signIn(email, password);
      showSuccess('Login successful!');
    } catch (error: any) {
      showError(error.message || 'Login failed. Please try again.');
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
          <Text style={[styles.title, { color: textColor }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: isDark ? COLORS.darkGray : COLORS.lightGray }]}>
            Sign in to your account
          </Text>
        </View>

        {/* Form Card */}
        <Card style={styles.card}>
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

          <TextInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
            required
          />

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPasswordContainer}
          >
            <Text style={[styles.forgotPasswordText, { color: COLORS.primary }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <Button
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            fullWidth
            style={styles.button}
          />
        </Card>

        {/* Sign Up Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: textColor }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.signUpLink, { color: COLORS.secondary }]}>
              Create one
            </Text>
          </TouchableOpacity>
        </View>
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
  forgotPasswordContainer: {
    marginBottom: SPACING.lg,
    alignItems: 'flex-end',
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '500',
  },
  button: {
    marginTop: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    ...TYPOGRAPHY.body,
  },
  signUpLink: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
});
