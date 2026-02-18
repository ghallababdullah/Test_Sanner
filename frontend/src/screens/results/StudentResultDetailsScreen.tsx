import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Text,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useToast } from '../../components/ui/Toast';
import { Card } from '../../components/ui/Card';
import { resultsService, GradingResult, AnswerDetail } from '../../services/results.service';
import { COLORS, SPACING, TYPOGRAPHY } from '../../config/theme';

export const StudentResultDetailsScreen = ({ route }: any) => {
  const { gradingResultId, studentName } = route.params;
  const { showError } = useToast();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [result, setResult] = useState<GradingResult | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const data = await resultsService.getResultDetails(gradingResultId);
      setResult(data);
    } catch (error: any) {
      showError(error.message || 'Failed to load result details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDetails();
    }, [gradingResultId])
  );

  const bgColor = isDark ? COLORS.darkBg : COLORS.lightBg;
  const textColor = isDark ? COLORS.darkText : COLORS.lightText;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!result) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: textColor }]}>No data available</Text>
        </View>
      </View>
    );
  }

  const renderAnswerDetail = ({ item, index }: { item: AnswerDetail; index: number }) => {
    const isCorrect = item.isCorrect;
    const statusColor = isCorrect ? COLORS.success : COLORS.error;

    return (
      <Card
        style={{
          ...styles.answerCard,
          borderLeftColor: statusColor,
          borderLeftWidth: 4,
        }}
      >
        <View style={styles.answerHeader}>
          <Text style={[styles.questionNumber, { color: textColor }]}>
            Question {item.questionNumber}
          </Text>
          <Text style={[styles.matchType, { color: statusColor }]}>
            {item.isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </Text>
        </View>

        <View style={styles.answerContent}>
          <View style={styles.answerItem}>
            <Text style={[styles.label, { color: textColor, opacity: 0.7 }]}>
              Student Answer:
            </Text>
            <Text style={[styles.answerText, { color: textColor }]}>
              {item.studentAnswer || '(No answer)'}
            </Text>
          </View>

          <View style={styles.answerItem}>
            <Text style={[styles.label, { color: textColor, opacity: 0.7 }]}>
              Correct Answer:
            </Text>
            <Text style={[styles.answerText, { color: textColor }]}>
              {item.correctAnswer}
            </Text>
          </View>

          <View style={styles.pointsContainer}>
            <View style={styles.pointsItem}>
              <Text style={[styles.label, { color: textColor, opacity: 0.7 }]}>
                Points Earned
              </Text>
              <Text style={[styles.pointsValue, { color: COLORS.primary }]}>
                {item.pointsEarned}/{item.maxPoints}
              </Text>
            </View>

            {item.distance !== undefined && (
              <View style={styles.pointsItem}>
                <Text style={[styles.label, { color: textColor, opacity: 0.7 }]}>
                  Match Type
                </Text>
                <Text style={[styles.pointsValue, { color: textColor }]}>
                  {item.matchType}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Overall Result Summary */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={[styles.studentNameText, { color: textColor }]}>
              {studentName}
            </Text>
            <Text style={[styles.classText, { color: textColor, opacity: 0.7 }]}>
              Class: {result.studentClass}
            </Text>
          </View>
          <View style={[styles.gradeCircle, { borderColor: COLORS.primary }]}>
            <Text style={[styles.gradeText, { color: COLORS.primary }]}>
              {result.grade}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: '#E5E7EB' }]} />

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: textColor, opacity: 0.7 }]}>
              Raw Score
            </Text>
            <Text style={[styles.statValue, { color: textColor }]}>
              {result.rawScore}/{result.maxScore}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: textColor, opacity: 0.7 }]}>
              Percentage
            </Text>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>
              {result.percentage.toFixed(1)}%
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: textColor, opacity: 0.7 }]}>
              Class Match
            </Text>
            <Text style={[styles.statValue, { color: result.classMatchesStudent ? COLORS.success : COLORS.error }]}>
              {result.classMatchesStudent ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>

        {result.feedback && (
          <>
            <View style={[styles.divider, { backgroundColor: '#E5E7EB' }]} />
            <Text style={[styles.feedbackText, { color: textColor }]}>
              {result.feedback}
            </Text>
          </>
        )}
      </Card>

      {/* Answer Details */}
      <View style={styles.answersSection}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Answer Details ({result.answerDetails.length})
        </Text>
      </View>

      <View style={styles.answersContainer}>
        <FlatList
          data={result.answerDetails}
          renderItem={renderAnswerDetail}
          keyExtractor={(item, index) => `${item.questionNumber}-${index}`}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...TYPOGRAPHY.h2,
  },
  summaryCard: {
    margin: SPACING.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  studentNameText: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.sm,
  },
  classText: {
    ...TYPOGRAPHY.caption,
  },
  gradeCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeText: {
    ...TYPOGRAPHY.h1,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.xs,
  },
  statValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  feedbackText: {
    ...TYPOGRAPHY.body,
    fontStyle: 'italic',
    marginTop: SPACING.md,
  },
  answersSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
  },
  answersContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  answerCard: {
    marginBottom: SPACING.md,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  questionNumber: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  matchType: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  answerContent: {
    gap: SPACING.md,
  },
  answerItem: {
    marginBottom: SPACING.sm,
  },
  label: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.xs,
  },
  answerText: {
    ...TYPOGRAPHY.body,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  pointsItem: {
    alignItems: 'center',
  },
  pointsValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
});
