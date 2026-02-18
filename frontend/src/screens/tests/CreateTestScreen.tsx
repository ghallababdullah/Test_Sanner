import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { Card } from '../../components/ui/Card';
import { testService, CreateTestPayload } from '../../services/test.service';
import { COLORS, SPACING, TYPOGRAPHY } from '../../config/theme';
import { Validation, ErrorMessages } from '../../utils/validation';

interface FormErrors {
  title?: string;
  subject?: string;
  classLevel?: string;
  totalQuestions?: string;
  maxScore?: string;
}

export const CreateTestScreen = ({ navigation }: any) => {
  const { showError, showSuccess } = useToast();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    classLevel: '',
    totalQuestions: '',
    maxScore: '',
    description: '',
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!Validation.isNotEmpty(formData.title)) {
      newErrors.title = 'Test title is required';
    }
    if (!Validation.isNotEmpty(formData.subject)) {
      newErrors.subject = 'Subject is required';
    }
    if (!Validation.isNotEmpty(formData.classLevel)) {
      newErrors.classLevel = 'Class level is required';
    }
    if (!Validation.isNotEmpty(formData.totalQuestions)) {
      newErrors.totalQuestions = 'Total questions is required';
    } else if (isNaN(Number(formData.totalQuestions))) {
      newErrors.totalQuestions = 'Must be a number';
    }
    if (!Validation.isNotEmpty(formData.maxScore)) {
      newErrors.maxScore = 'Max score is required';
    } else if (isNaN(Number(formData.maxScore))) {
      newErrors.maxScore = 'Must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTest = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const payload: CreateTestPayload = {
        title: formData.title,
        subject: formData.subject,
        classLevel: formData.classLevel,
        totalQuestions: Number(formData.totalQuestions),
        maxScore: Number(formData.maxScore),
      };

      // Only add description if it's not empty
      if (formData.description && formData.description.trim()) {
        payload.description = formData.description;
      }

      console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));

      const createdTest = await testService.createTest(payload);
      showSuccess('Test created successfully!');

      // Navigate to TestDetailsScreen with the new test ID
      navigation.navigate('TestDetails', { testId: createdTest.id });
    } catch (error: any) {
      console.error('❌ Create test error:', error);
      showError(error.message || 'Failed to create test');
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
        <Card>
          <TextInput
            label="Test Title"
            placeholder="e.g., Mathematics Quiz 1"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            error={errors.title}
            required
          />

          <TextInput
            label="Subject"
            placeholder="e.g., Mathematics, Physics"
            value={formData.subject}
            onChangeText={(text) => setFormData({ ...formData, subject: text })}
            error={errors.subject}
            required
          />

          <TextInput
            label="Class Level"
            placeholder="e.g., 10A, 11B"
            value={formData.classLevel}
            onChangeText={(text) => setFormData({ ...formData, classLevel: text })}
            error={errors.classLevel}
            required
          />

          <TextInput
            label="Total Questions"
            placeholder="e.g., 20"
            value={formData.totalQuestions}
            onChangeText={(text) => setFormData({ ...formData, totalQuestions: text })}
            keyboardType="numeric"
            error={errors.totalQuestions}
            required
          />

          <TextInput
            label="Max Score"
            placeholder="e.g., 100"
            value={formData.maxScore}
            onChangeText={(text) => setFormData({ ...formData, maxScore: text })}
            keyboardType="numeric"
            error={errors.maxScore}
            required
          />

          <TextInput
            label="Description (Optional)"
            placeholder="Add test description..."
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
          />

          <Button
            label="Create Test"
            onPress={handleCreateTest}
            loading={loading}
            disabled={loading}
            fullWidth
            style={styles.submitButton}
          />
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
  },
  submitButton: {
    marginTop: SPACING.lg,
  },
});
