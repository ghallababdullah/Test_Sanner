import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../config/theme';
import { testService, TestListItem } from '../../services/test.service';

export const TestsListScreen = ({ navigation }: any) => {
  const { state: authState } = useAuth();
  const { showError } = useToast();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [tests, setTests] = useState<TestListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch tests from API
  const fetchTests = async () => {
    try {
      setLoading(true);
      if (authState.user?.id) {
        const response = await testService.getUserTests(authState.user.id);
        setTests(response);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  // Load tests on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchTests();
    }, [authState.user?.id])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTests();
    setRefreshing(false);
  };

  const handleCreateTest = () => {
    navigation.navigate('CreateTest');
  };

  const handleTestPress = (test: TestListItem) => {
    navigation.navigate('TestDetails', { testId: test.id });
  };

  const bgColor = isDark ? COLORS.darkBg : COLORS.lightBg;
  const textColor = isDark ? COLORS.darkText : COLORS.lightText;
  const cardBg = isDark ? COLORS.darkCard : COLORS.lightCard;

  const renderTestCard = ({ item: test }: { item: TestListItem }) => (
    <TouchableOpacity onPress={() => handleTestPress(test)}>
      <Card style={StyleSheet.flatten([styles.testCard, { backgroundColor: cardBg }])}>
        <View style={styles.testHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.testTitle, { color: textColor }]}>{test.title}</Text>
            <Text style={[styles.testSubject, { color: textColor, opacity: 0.7 }]}>
              {test.subject}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: test.isActive ? COLORS.primary : COLORS.info },
            ]}
          >
            <Text style={[styles.statusText, { color: COLORS.white }]}>
              {test.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={styles.testDetails}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: textColor, opacity: 0.7 }]}>
              Questions
            </Text>
            <Text style={[styles.detailValue, { color: textColor }]}>{test.totalQuestions}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: textColor, opacity: 0.7 }]}>
              Max Score
            </Text>
            <Text style={[styles.detailValue, { color: textColor }]}>{test.maxScore}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: textColor, opacity: 0.7 }]}>Class</Text>
            <Text style={[styles.detailValue, { color: textColor }]}>{test.classLevel}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading && tests.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.headerContainer}>
        <View style={styles.titleSection}>
          <Text style={[styles.screenTitle, { color: textColor }]}>My Tests</Text>
          <Text style={[styles.testCount, { color: textColor, opacity: 0.7 }]}>
            {tests.length} test{tests.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <Button
          label="+ Create Test"
          onPress={handleCreateTest}
          style={styles.createButton}
        />
      </View>

      {tests.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: bgColor }]}>
          <Text style={[styles.emptyTitle, { color: textColor }]}>📝 No Tests Yet</Text>
          <Text style={[styles.emptyText, { color: textColor, opacity: 0.7 }]}>
            Create a test to get started
          </Text>
          <Button
            label="Create Your First Test"
            onPress={handleCreateTest}
            style={styles.createFirstButton}
          />
        </View>
      ) : (
        <FlatList
          data={tests}
          keyExtractor={(item) => item.id}
          renderItem={renderTestCard}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  titleSection: {
    flex: 1,
  },
  screenTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xs,
  },
  testCount: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
  },
  createButton: {
    marginLeft: SPACING.md,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  testCard: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  testTitle: {
    ...TYPOGRAPHY.h2,
  },
  testSubject: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  testDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.xs,
  },
  detailValue: {
    ...TYPOGRAPHY.h2,
  },
  detailDivider: {
    width: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  createFirstButton: {
    marginTop: SPACING.md,
  },
});
