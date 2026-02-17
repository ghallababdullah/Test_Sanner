import React, { useState, useCallback, useEffect } from 'react';
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

export const DashboardScreen = ({ navigation }: any) => {
  const { state: authState, signOut } = useAuth();
  const { showError, showSuccess } = useToast();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [tests, setTests] = useState<TestListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch tests from API
  const fetchTests = async () => {
    try {
      setLoading(true);
      if (authState.user?.email) {
        const response = await testService.getUserTests(authState.user.email);
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
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTests();
    setRefreshing(false);
  };

  const handleCreateTest = () => {
    navigation.navigate('Tests', { screen: 'CreateTest' });
  };

  const handleTestPress = (test: TestListItem) => {
    navigation.navigate('Tests', {
      screen: 'TestDetails',
      params: { testId: test.id },
    });
  };

  const handleEditTest = (testId: string) => {
    navigation.navigate('Tests', {
      screen: 'EditTest',
      params: { testId },
    });
  };

  const handleStartScanning = (testId: string) => {
    navigation.navigate('Scan', {
      screen: 'ScannerHub',
      params: { testId },
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      showSuccess('Logged out successfully');
    } catch (error: any) {
      showError('Logout failed');
    }
  };

  const bgColor = isDark ? COLORS.darkBg : COLORS.lightBg;
  const textColor = isDark ? COLORS.darkText : COLORS.lightText;
  const cardBg = isDark ? COLORS.darkCard : COLORS.lightCard;

  const renderTestCard = ({ item: test }: { item: TestListItem }) => (
    <Card>
      {/* Header with title and status */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.testTitle, { color: textColor }]}>
            {test.title}
          </Text>
          <Text style={[styles.testMeta, { color: isDark ? COLORS.darkGray : COLORS.lightGray }]}>
            {test.subject} • {test.classLevel} • {test.totalQuestions} Q
          </Text>
        </View>

        {/* Status badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: test.isActive ? COLORS.success : COLORS.warning,
            },
          ]}
        >
          <Text style={styles.statusText}>
            {test.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: isDark ? COLORS.darkGray : COLORS.lightGray }]}>
            Max Score
          </Text>
          <Text style={[styles.statValue, { color: textColor }]}>
            {test.maxScore}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: isDark ? COLORS.darkGray : COLORS.lightGray }]}>
            Created
          </Text>
          <Text style={[styles.statValue, { color: textColor }]}>
            {test.createdAt}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <Button
          label="View"
          onPress={() => handleTestPress(test)}
          size="small"
          variant="outline"
          style={{ flex: 1, marginRight: SPACING.md }}
        />
        <Button
          label="Scan"
          onPress={() => handleStartScanning(test.id)}
          size="small"
          variant="secondary"
          style={{ flex: 1, marginRight: SPACING.md }}
        />
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => handleEditTest(test.id)}
        >
          <Text style={[styles.menuIcon, { color: textColor }]}>⋮</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={[styles.greeting, { color: textColor }]}>
            Hello, {authState.user?.firstName || 'Teacher'}
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? COLORS.darkGray : COLORS.lightGray }]}>
            Manage your tests and start scanning
          </Text>
        </View>

        {/* Logout button (top right) */}
        <TouchableOpacity
          style={[styles.avatarButton, { backgroundColor: COLORS.primary }]}
          onPress={handleLogout}
        >
          <Text style={styles.avatarText}>
            {authState.user?.firstName?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick action buttons */}
      <View style={styles.quickActions}>
        <Button
          label="+ Create Test"
          onPress={handleCreateTest}
          fullWidth
        />
      </View>

      {/* Tests list */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : tests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyIcon]}>📋</Text>
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            No tests yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? COLORS.darkGray : COLORS.lightGray }]}>
            Create your first test to get started
          </Text>
          <Button
            label="Create Test"
            onPress={handleCreateTest}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <FlatList
          data={tests}
          renderItem={renderTestCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          scrollEnabled={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
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
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  greeting: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  quickActions: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  listContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  testTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xs,
  },
  testMeta: {
    ...TYPOGRAPHY.caption,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  statItem: {
    flex: 1,
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: SPACING.md,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.xs,
  },
  statValue: {
    ...TYPOGRAPHY.h2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuButton: {
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  emptyButton: {
    marginTop: SPACING.lg,
  },
});
