import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Text,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../config/theme';
import { testService } from '../../services/test.service';
import { resultsService } from '../../services/results.service';

export const DashboardScreen = ({ navigation }: any) => {
  const { state: authState, signOut } = useAuth();
  const { showSuccess, showError } = useToast();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [stats, setStats] = useState({
    totalTests: 0,
    testsWithResults: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      if (authState.user?.id) {
        const tests = await testService.getUserTests(authState.user.id);
        const results = await resultsService.getUserResults(authState.user.id);

        setStats({
          totalTests: tests.length,
          testsWithResults: results.length,
        });
      }
    } catch (error: any) {
      console.log('Note: Some stats could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [authState.user?.id])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
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

  const userFirstName = authState.user?.firstName || 'User';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header with greeting */}
        <View style={styles.headerSection}>
          <View>
            <Text style={[styles.greeting, { color: textColor }]}>
              👋 Hello, {userFirstName}!
            </Text>
            <Text style={[styles.subtitle, { color: textColor, opacity: 0.7 }]}>
              Welcome to Test Scanner
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={[styles.logoutText, { color: COLORS.primary }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        {!loading ? (
          <View style={styles.statsContainer}>
            <Card style={[styles.statCard, { backgroundColor: cardBg }]}>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>
                {stats.totalTests}
              </Text>
              <Text style={[styles.statLabel, { color: textColor, opacity: 0.7 }]}>
                Total Tests
              </Text>
            </Card>

            <Card style={[styles.statCard, { backgroundColor: cardBg }]}>
              <Text style={[styles.statValue, { color: COLORS.secondary }]}>
                {stats.testsWithResults}
              </Text>
              <Text style={[styles.statLabel, { color: textColor, opacity: 0.7 }]}>
                Tests with Results
              </Text>
            </Card>
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        {/* Quick Access Section */}
        <View style={styles.quickAccessSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Quick Access
          </Text>

          <Button
            label="📝 My Tests"
            onPress={() => navigation.navigate('Tests', { screen: 'TestsList' })}
            style={styles.quickButton}
          />

          <Button
            label="📊 View Results"
            onPress={() => navigation.navigate('Results')}
            variant="secondary"
            style={styles.quickButton}
          />

          <Button
            label="📸 Start Scanning"
            onPress={() => navigation.navigate('Scan')}
            variant="outline"
            style={styles.quickButton}
          />
        </View>

        {/* Info Section */}
        <Card style={[styles.infoCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.infoTitle, { color: textColor }]}>
            👤 Account Info
          </Text>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: textColor, opacity: 0.7 }]}>
              Email
            </Text>
            <Text style={[styles.infoValue, { color: textColor }]}>
              {authState.user?.email}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: textColor, opacity: 0.7 }]}>
              Name
            </Text>
            <Text style={[styles.infoValue, { color: textColor }]}>
              {authState.user?.firstName} {authState.user?.lastName}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
  },
  greeting: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
  },
  logoutButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  logoutText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.small,
    textAlign: 'center',
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  quickAccessSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  quickButton: {
    marginBottom: SPACING.md,
  },
  infoCard: {
    marginBottom: SPACING.xl,
  },
  infoTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  infoItem: {
    marginBottom: SPACING.md,
  },
  infoLabel: {
    ...TYPOGRAPHY.small,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
  },
});
