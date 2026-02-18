import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Text,
  FlatList,
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StudentResult } from '../../services/results.service';
import { COLORS, SPACING, TYPOGRAPHY } from '../../config/theme';

export const StudentResultsListScreen = ({ route, navigation }: any) => {
  const { testId, testTitle, results: initialResults = [] } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [results] = useState<StudentResult[]>(initialResults);

  const handleViewDetails = (result: StudentResult) => {
    navigation.navigate('ResultDetails', {
      gradingResultId: result.gradingResultId,
      studentName: `${result.studentName} ${result.studentLastName}`,
    });
  };

  const bgColor = isDark ? COLORS.darkBg : COLORS.lightBg;
  const textColor = isDark ? COLORS.darkText : COLORS.lightText;
  const cardBg = isDark ? COLORS.darkCard : COLORS.lightCard;

  if (results.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[styles.emptyText, { color: textColor }]}>No results yet</Text>
        </View>
      </View>
    );
  }

  const renderResultCard = ({ item: result }: { item: StudentResult }) => (
    <Card style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.studentName, { color: textColor }]}>
            {result.studentName} {result.studentLastName}
          </Text>
          <Text style={[styles.studentClass, { color: textColor, opacity: 0.7 }]}>
            Class: {result.studentClass}
          </Text>
        </View>
        <View style={styles.gradeContainer}>
          <Text style={[styles.grade, { color: COLORS.primary }]}>
            {result.grade}
          </Text>
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <View style={styles.scoreItem}>
          <Text style={[styles.scoreLabel, { color: textColor, opacity: 0.7 }]}>
            Score
          </Text>
          <Text style={[styles.scoreValue, { color: textColor }]}>
            {result.rawScore}/{result.maxScore}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={[styles.scoreLabel, { color: textColor, opacity: 0.7 }]}>
            Percentage
          </Text>
          <Text style={[styles.scoreValue, { color: COLORS.primary }]}>
            {result.percentage.toFixed(1)}%
          </Text>
        </View>
      </View>

      <Button
        label="View Details"
        onPress={() => handleViewDetails(result)}
        size="small"
        fullWidth
        style={styles.detailsButton}
      />
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>{testTitle}</Text>
        <Text style={[styles.resultCount, { color: textColor, opacity: 0.7 }]}>
          {results.length} student{results.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={results}
        renderItem={renderResultCard}
        keyExtractor={(item) => item.gradingResultId}
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
  title: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.sm,
  },
  resultCount: {
    ...TYPOGRAPHY.caption,
  },
  listContainer: {
    padding: SPACING.lg,
  },
  resultCard: {
    marginBottom: SPACING.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  studentName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  studentClass: {
    ...TYPOGRAPHY.caption,
  },
  gradeContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grade: {
    ...TYPOGRAPHY.h1,
    fontWeight: '700',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomColor: '#E5E7EB',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.xs,
  },
  scoreValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  detailsButton: {
    marginTop: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.h2,
  },
});
