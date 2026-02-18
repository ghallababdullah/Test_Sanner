import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Card } from '../../components/ui/Card';
import { resultsService, TestResultsSummary } from '../../services/results.service';
import { COLORS, SPACING, TYPOGRAPHY } from '../../config/theme';

export const TestResultsListScreen = ({ navigation }: any) => {
  const { state: authState } = useAuth();
  const { showError } = useToast();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [testResults, setTestResults] = useState<TestResultsSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadResults = async () => {
    try {
      setLoading(true);
      if (authState.user?.id) {
        const data = await resultsService.getUserResults(authState.user.id);
        setTestResults(data);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadResults();
    }, [authState.user?.id])
  );

  const handleSelectTest = (testResult: TestResultsSummary) => {
    navigation.navigate('StudentResultsList', {
      testId: testResult.testId,
      testTitle: testResult.testTitle,
      results: testResult.results,
    });
  };

  const bgColor = isDark ? COLORS.darkBg : COLORS.lightBg;
  const textColor = isDark ? COLORS.darkText : COLORS.lightText;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (testResults.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.lg }}>
          <Text style={[styles.emptyTitle, { color: textColor }]}>📊 No Results Yet</Text>
          <Text style={[styles.emptyText, { color: textColor, opacity: 0.7 }]}>
            Once you scan tests, results will appear here
          </Text>
        </View>
      </View>
    );
  }

  const renderTestResult = ({ item: testResult }: { item: TestResultsSummary }) => (
    <TouchableOpacity onPress={() => handleSelectTest(testResult)}>
      <Card style={styles.testCard}>
        <View style={styles.testHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.testTitle, { color: textColor }]}>
              {testResult.testTitle}
            </Text>
          </View>
          <View style={styles.studentCountBadge}>
            <Text style={[styles.studentCount, { color: COLORS.primary }]}>
              {testResult.totalStudents}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statLabel, { color: textColor, opacity: 0.7 }]}>
              Students
            </Text>
            <Text style={[styles.statValue, { color: textColor }]}>
              {testResult.totalStudents}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statLabel, { color: textColor, opacity: 0.7 }]}>
              Avg Score
            </Text>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>
              {testResult.averageScore.toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: '#E5E7EB' }]}>
          <Text style={[styles.footerText, { color: COLORS.primary }]}>
            View Results →
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Test Results</Text>
        <Text style={[styles.headerSubtitle, { color: textColor, opacity: 0.7 }]}>
          {testResults.length} test{testResults.length !== 1 ? 's' : ''} with results
        </Text>
      </View>

      <FlatList
        data={testResults}
        renderItem={renderTestResult}
        keyExtractor={(item) => item.testId}
        contentContainerStyle={styles.listContainer}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.sm,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
  },
  listContainer: {
    padding: SPACING.lg,
  },
  testCard: {
    marginBottom: SPACING.lg,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  testTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '600',
  },
  studentCountBadge: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentCount: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomColor: '#E5E7EB',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.xs,
  },
  statValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  footer: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  footerText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  emptyTitle: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
  },
});
