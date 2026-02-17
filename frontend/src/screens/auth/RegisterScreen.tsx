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
import { COLORS, SPACING, TYPOGRAPHY } from '../../config/theme';
import { Validation, ErrorMessages } from '../../utils/validation';

export const RegisterScreen = ({ navigation }: any) => {
  const { signUp } = useAuth();
  const { showError, showSuccess } = useToast();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!Validation.isNotEmpty(firstName)) {
      newErrors.firstName = ErrorMessages.FIRST_NAME_REQUIRED;
    }

    if (!Validation.isNotEmpty(email)) {
      newErrors.email = ErrorMessages.EMAIL_REQUIRED;
    } else if (!Validation.isValidEmail(email)) {
      newErrors.email = ErrorMessages.EMAIL_INVALID;
    }

    if (!Validation.isNotEmpty(password)) {
      newErrors.password = ErrorMessages.PASSWORD_REQUIRED;
    } else if (!Validation.isValidPassword(password)) {
      newErrors.password = ErrorMessages.PASSWORD_TOO_SHORT;
    }

    if (!Validation.isNotEmpty(confirmPassword)) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (!Validation.passwordsMatch(password, confirmPassword)) {
      newErrors.confirmPassword = ErrorMessages.PASSWORD_MISMATCH;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await signUp({
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber || undefined,
        password,
      });
      showSuccess('Account created successfully!');
    } catch (error: any) {
      showError(error.message || 'Registration failed. Please try again.');
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
          <Text style={[styles.title, { color: textColor }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: isDark ? COLORS.darkGray : COLORS.lightGray }]}>
            Sign up to get started
          </Text>
        </View>

        {/* Form Card */}
        <Card style={styles.card}>
          <TextInput
            label="First Name"
            placeholder="John"
            value={firstName}
            onChangeText={setFirstName}
            error={errors.firstName}
            required
          />

          <TextInput
            label="Last Name"
            placeholder="Doe"
            value={lastName}
            onChangeText={setLastName}
          />

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
            label="Phone Number"
            placeholder="+1 (555) 000-0000"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
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

          <TextInput
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={errors.confirmPassword}
            required
          />

          {/* Register Button */}
          <Button
            label="Create Account"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            fullWidth
            variant="secondary"
            style={styles.button}
          />
        </Card>

        {/* Sign In Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: textColor }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.signInLink, { color: COLORS.primary }]}>
              Sign in
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
  },
  header: {
    marginBottom: SPACING.xl,
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
  button: {
    marginTop: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  footerText: {
    ...TYPOGRAPHY.body,
  },
  signInLink: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
});
