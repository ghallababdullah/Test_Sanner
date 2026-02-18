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
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { Card } from '../../components/ui/Card';
import {
  testService,
  TestDetails,
  AnswerKey,
  GradeThreshold,
} from '../../services/test.service';
import { resultsService } from '../../services/results.service';
import { COLORS, SPACING, TYPOGRAPHY } from '../../config/theme';

type TabType = 'overview' | 'answerKeys' | 'gradeThresholds';

export const TestDetailsScreen = ({ route, navigation }: any) => {
  const { testId } = route.params;
  const { showError, showSuccess } = useToast();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [test, setTest] = useState<TestDetails | null>(null);
  const [answerKeys, setAnswerKeys] = useState<AnswerKey[]>([]);
  const [gradeThresholds, setGradeThresholds] = useState<GradeThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Answer Key form state
  const [answerKeyForm, setAnswerKeyForm] = useState({
    questionNumber: '',
    correctAnswer: '',
    maxPoints: '',
    toleranceLevel: '',
  });
  const [answerKeyErrors, setAnswerKeyErrors] = useState<any>({});
  const [addingAnswerKey, setAddingAnswerKey] = useState(false);

  // Grade Threshold form state
  const [gradeThresholdForm, setGradeThresholdForm] = useState({
    gradeName: '',
    gradeSymbol: '',
    minPercentage: '',
    maxPercentage: '',
  });
  const [gradeThresholdErrors, setGradeThresholdErrors] = useState<any>({});
  const [addingGradeThreshold, setAddingGradeThreshold] = useState(false);

  // Load test details
  const loadTestData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading test details for testId:', testId);
      
      // Load answer keys and grade thresholds first (these should work)
      const [keys, thresholds] = await Promise.all([
        testService.getAnswerKeys(testId),
        testService.getGradeThresholds(testId),
      ]);
      
      setAnswerKeys(keys);
      setGradeThresholds(thresholds);
      
      // Then try to load test details - if it fails due to ModelMapper, 
      // we can still display the answer keys and thresholds
      try {
        const testData = await testService.getTestDetails(testId);
        console.log('Test data loaded:', testData);
        setTest(testData);
      } catch (detailsError: any) {
        console.error('Error loading test details:', detailsError.message);
        // If test details fails but we got answer keys/thresholds, 
        // create a minimal test object so we can still navigate
        if (keys.length > 0 || thresholds.length > 0) {
          console.log('Using minimal test object with loaded answer keys and thresholds');
          setTest({
            id: testId,
            title: 'Test Details',
            subject: 'Loading...',
            classLevel: '',
            totalQuestions: keys.length,
            maxScore: 0,
            isActive: false,
            createdAt: '',
          });
        } else {
          throw detailsError;
        }
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to load test details';
      console.error('Error loading test:', errorMsg);
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTestData();
    }, [testId])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTestData();
    setRefreshing(false);
  };

  // Handle delete test
  const handleDeleteTest = () => {
    Alert.alert('Delete Test', 'Are you sure you want to delete this test?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await testService.deleteTest(testId);
            showSuccess('Test deleted successfully');
            navigation.goBack();
          } catch (error: any) {
            showError(error.message || 'Failed to delete test');
          }
        },
      },
    ]);
  };

  // Handle activate test
  const handleActivateTest = async () => {
    try {
      const updated = await testService.activateTest(testId);
      setTest(updated);
      showSuccess('Test activated successfully');
    } catch (error: any) {
      showError(error.message || 'Failed to activate test');
    }
  };

  // Handle check results
  const handleCheckResults = async () => {
    try {
      setLoading(true);
      const results = await resultsService.getTestResults(testId);
      
      if (results.length === 0) {
        showError('No results yet for this test');
        setLoading(false);
        return;
      }

      // Navigate to StudentResultsList with the results data
      navigation.navigate('StudentResultsList', {
        testId,
        testTitle: test?.title || 'Test Results',
        results,
      });
    } catch (error: any) {
      showError(error.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  // Handle add answer key
  const validateAnswerKey = (): boolean => {
    const errors: any = {};
    if (!answerKeyForm.questionNumber) {
      errors.questionNumber = 'Required';
    } else {
      const qNum = Number(answerKeyForm.questionNumber);
      if (isNaN(qNum) || qNum < 1) {
        errors.questionNumber = 'Must be a number >= 1';
      } else if (qNum > (test?.totalQuestions || 0)) {
        errors.questionNumber = `Question number must be <= ${test?.totalQuestions}`;
      } else if (answerKeys.some(key => key.questionNumber === qNum)) {
        errors.questionNumber = `Answer key for question ${qNum} already exists`;
      }
    }
    if (!answerKeyForm.correctAnswer) errors.correctAnswer = 'Required';
    if (!answerKeyForm.maxPoints) {
      errors.maxPoints = 'Required';
    } else {
      const points = Number(answerKeyForm.maxPoints);
      if (isNaN(points) || points <= 0) {
        errors.maxPoints = 'Must be a number > 0';
      }
    }
    setAnswerKeyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAnswerKey = async () => {
    if (!validateAnswerKey() || !test) return;

    try {
      setAddingAnswerKey(true);
      const newKey = await testService.addAnswerKey(testId, {
        questionNumber: Number(answerKeyForm.questionNumber),
        correctAnswer: answerKeyForm.correctAnswer,
        maxPoints: Number(answerKeyForm.maxPoints),
        toleranceLevel: answerKeyForm.toleranceLevel
          ? Number(answerKeyForm.toleranceLevel)
          : 0,
        answerType: 'TEXT',
      });

      setAnswerKeys([...answerKeys, newKey]);
      setAnswerKeyForm({
        questionNumber: '',
        correctAnswer: '',
        maxPoints: '',
        toleranceLevel: '',
      });
      showSuccess('Answer key added successfully');
    } catch (error: any) {
      showError(error.message || 'Failed to add answer key');
    } finally {
      setAddingAnswerKey(false);
    }
  };

  const handleDeleteAnswerKey = async (keyId: string) => {
    Alert.alert(
      'Delete Answer Key',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await testService.deleteAnswerKey(testId, keyId);
              setAnswerKeys(answerKeys.filter((k) => k.id !== keyId));
              showSuccess('Answer key deleted');
            } catch (error: any) {
              showError(error.message || 'Failed to delete answer key');
            }
          },
        },
      ]
    );
  };

  // Handle add grade threshold
  const validateGradeThreshold = (): boolean => {
    const errors: any = {};
    if (!gradeThresholdForm.gradeName) errors.gradeName = 'Required';
    if (!gradeThresholdForm.gradeSymbol) errors.gradeSymbol = 'Required';
    
    if (!gradeThresholdForm.minPercentage) {
      errors.minPercentage = 'Required';
    } else {
      const minVal = Number(gradeThresholdForm.minPercentage);
      if (isNaN(minVal) || minVal < 0 || minVal > 100) {
        errors.minPercentage = 'Must be 0-100';
      }
    }
    
    if (!gradeThresholdForm.maxPercentage) {
      errors.maxPercentage = 'Required';
    } else {
      const maxVal = Number(gradeThresholdForm.maxPercentage);
      if (isNaN(maxVal) || maxVal < 0 || maxVal > 100) {
        errors.maxPercentage = 'Must be 0-100';
      }
    }
    
    // Check that min <= max
    if (gradeThresholdForm.minPercentage && gradeThresholdForm.maxPercentage) {
      const minVal = Number(gradeThresholdForm.minPercentage);
      const maxVal = Number(gradeThresholdForm.maxPercentage);
      if (minVal > maxVal) {
        errors.maxPercentage = 'Max must be >= Min';
      }
      
      // Check for overlapping ranges with existing thresholds
      const overlapping = gradeThresholds.some(threshold => {
        // Two ranges [a, b] and [c, d] overlap if: a <= d AND c <= b
        return minVal <= threshold.maxPercentage && threshold.minPercentage <= maxVal;
      });
      
      if (overlapping) {
        errors.minPercentage = 'Range overlaps with existing grade threshold';
      }
    }
    
    setGradeThresholdErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddGradeThreshold = async () => {
    if (!validateGradeThreshold()) return;

    try {
      setAddingGradeThreshold(true);
      const newThreshold = await testService.addGradeThreshold(testId, {
        gradeName: gradeThresholdForm.gradeName,
        gradeSymbol: gradeThresholdForm.gradeSymbol,
        minPercentage: Number(gradeThresholdForm.minPercentage),
        maxPercentage: Number(gradeThresholdForm.maxPercentage),
      });

      setGradeThresholds([...gradeThresholds, newThreshold]);
      setGradeThresholdForm({
        gradeName: '',
        gradeSymbol: '',
        minPercentage: '',
        maxPercentage: '',
      });
      showSuccess('Grade threshold added successfully');
    } catch (error: any) {
      showError(error.message || 'Failed to add grade threshold');
    } finally {
      setAddingGradeThreshold(false);
    }
  };

  const handleDeleteGradeThreshold = async (thresholdId: string) => {
    Alert.alert(
      'Delete Grade Threshold',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await testService.deleteGradeThreshold(testId, thresholdId);
              setGradeThresholds(
                gradeThresholds.filter((t) => t.id !== thresholdId)
              );
              showSuccess('Grade threshold deleted');
            } catch (error: any) {
              showError(error.message || 'Failed to delete grade threshold');
            }
          },
        },
      ]
    );
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

  if (error || !test) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg }}>
          <Text style={[styles.label, { color: COLORS.error, fontSize: 18 }]}>Error Loading Test</Text>
          <Text style={[{ color: textColor, marginTop: SPACING.md, textAlign: 'center' }]}>
            {error || 'Test data not found'}
          </Text>
          <Button
            label="Go Back"
            onPress={() => navigation.goBack()}
            style={{ marginTop: SPACING.lg }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Tab buttons */}
      <View style={styles.tabContainer}>
        {(['overview', 'answerKeys', 'gradeThresholds'] as TabType[]).map(
          (tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && {
                  borderBottomColor: COLORS.primary,
                  borderBottomWidth: 3,
                },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === tab ? COLORS.primary : textColor,
                    fontWeight: activeTab === tab ? '700' : '400',
                  },
                ]}
              >
                {tab === 'overview'
                  ? 'Overview'
                  : tab === 'answerKeys'
                  ? 'Answer Keys'
                  : 'Grade Thresholds'}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* Tab content */}
      <ScrollView style={styles.contentContainer}>
        {activeTab === 'overview' && test && (
          <View style={styles.tabContent}>
            {/* Basic Information */}
            <Card>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Test Information</Text>

              <Text style={[styles.label, { color: textColor }]}>Title</Text>
              <Text style={[styles.value, { color: textColor }]}>
                {test.title}
              </Text>

              <Text style={[styles.label, { color: textColor, marginTop: SPACING.lg }]}>
                Subject
              </Text>
              <Text style={[styles.value, { color: textColor }]}>
                {test.subject}
              </Text>

              <Text style={[styles.label, { color: textColor, marginTop: SPACING.lg }]}>
                Class Level
              </Text>
              <Text style={[styles.value, { color: textColor }]}>
                {test.classLevel}
              </Text>

              {test.description && (
                <>
                  <Text style={[styles.label, { color: textColor, marginTop: SPACING.lg }]}>
                    Description
                  </Text>
                  <Text style={[styles.value, { color: textColor }]}>
                    {test.description}
                  </Text>
                </>
              )}
            </Card>

            {/* Test Specifications */}
            <Card style={{ marginTop: SPACING.lg }}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Specifications</Text>

              <View style={styles.specRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: textColor }]}>Total Questions</Text>
                  <Text style={[styles.value, { color: textColor }]}>
                    {test.totalQuestions}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: textColor }]}>Max Score</Text>
                  <Text style={[styles.value, { color: textColor }]}>
                    {test.maxScore}
                  </Text>
                </View>
              </View>

              <Text style={[styles.label, { color: textColor, marginTop: SPACING.lg }]}>
                Status
              </Text>
              <Text style={[styles.value, { color: test.isActive ? COLORS.success : COLORS.warning }]}>
                {test.isActive ? '🟢 Active' : '🔴 Inactive'}
              </Text>

              <Text style={[styles.label, { color: textColor, marginTop: SPACING.lg }]}>
                Created
              </Text>
              <Text style={[styles.value, { color: textColor }]}>
                {test.createdAt}
              </Text>
            </Card>

            {/* Answer Keys Summary */}
            <Card style={{ marginTop: SPACING.lg }}>
              <View style={styles.summaryHeader}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Answer Keys
                </Text>
                <Text style={[styles.summaryBadge, { color: COLORS.primary }]}>
                  {answerKeys.length}/{test.totalQuestions}
                </Text>
              </View>
              {answerKeys.length === 0 ? (
                <Text style={[styles.label, { color: textColor, opacity: 0.7 }]}>
                  No answer keys added yet
                </Text>
              ) : (
                <View style={styles.summaryList}>
                  {answerKeys.slice(0, 3).map((key) => (
                    <Text key={key.id} style={[styles.summaryItem, { color: textColor }]}>
                      • Q{key.questionNumber}: {key.correctAnswer} ({key.maxPoints} pts)
                    </Text>
                  ))}
                  {answerKeys.length > 3 && (
                    <Text style={[styles.summaryItem, { color: textColor, opacity: 0.7 }]}>
                      ... and {answerKeys.length - 3} more
                    </Text>
                  )}
                </View>
              )}
            </Card>

            {/* Grade Thresholds Summary */}
            <Card style={{ marginTop: SPACING.lg }}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Grade Thresholds
              </Text>
              {gradeThresholds.length === 0 ? (
                <Text style={[styles.label, { color: textColor, opacity: 0.7 }]}>
                  No grade thresholds added yet
                </Text>
              ) : (
                <View style={styles.summaryList}>
                  {gradeThresholds.map((threshold) => (
                    <Text key={threshold.id} style={[styles.summaryItem, { color: textColor }]}>
                      • {threshold.gradeSymbol} ({threshold.gradeName}): {threshold.minPercentage}% - {threshold.maxPercentage}%
                    </Text>
                  ))}
                </View>
              )}
            </Card>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <Button
                label="Edit Test"
                onPress={() => {
                  // TODO: Navigate to edit test screen or show edit modal
                  Alert.alert('Edit Test', 'Coming Soon');
                }}
                variant="outline"
                fullWidth
                style={{ marginBottom: SPACING.md }}
              />

              <Button
                label="📸 Start Scanning"
                onPress={() => {
                  navigation.navigate('Scan', {
                    screen: 'ScannerHub',
                    params: { testId },
                  });
                }}
                fullWidth
                style={{ marginBottom: SPACING.md }}
              />

              <Button
                label="📊 Check Results"
                onPress={handleCheckResults}
                variant="secondary"
                fullWidth
                style={{ marginBottom: SPACING.md }}
              />

              {!test.isActive && (
                <Button
                  label="Activate Test"
                  onPress={handleActivateTest}
                  fullWidth
                  style={{ marginBottom: SPACING.md }}
                />
              )}

              <Button
                label="Delete Test"
                onPress={handleDeleteTest}
                variant="outline"
                fullWidth
                style={{}}
              />
            </View>
          </View>
        )}

        {activeTab === 'answerKeys' && (
          <View style={styles.tabContent}>
            {/* Add Answer Key Form */}
            <Card>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Add Answer Key ({answerKeys.length}/{test?.totalQuestions || 0})
              </Text>

              <TextInput
                label="Question Number"
                placeholder={`1-${test?.totalQuestions || 0}`}
                value={answerKeyForm.questionNumber}
                onChangeText={(text: string) =>
                  setAnswerKeyForm({ ...answerKeyForm, questionNumber: text })
                }
                keyboardType="numeric"
                error={answerKeyErrors.questionNumber}
              />

              <TextInput
                label="Correct Answer"
                placeholder="e.g., A, B, C, D"
                value={answerKeyForm.correctAnswer}
                onChangeText={(text) =>
                  setAnswerKeyForm({ ...answerKeyForm, correctAnswer: text })
                }
                error={answerKeyErrors.correctAnswer}
              />

              <TextInput
                label="Max Points"
                placeholder="e.g., 5"
                value={answerKeyForm.maxPoints}
                onChangeText={(text) =>
                  setAnswerKeyForm({ ...answerKeyForm, maxPoints: text })
                }
                keyboardType="numeric"
                error={answerKeyErrors.maxPoints}
              />

              <TextInput
                label="Tolerance Level (Optional)"
                placeholder="e.g., 0.5"
                value={answerKeyForm.toleranceLevel}
                onChangeText={(text) =>
                  setAnswerKeyForm({ ...answerKeyForm, toleranceLevel: text })
                }
                keyboardType="numeric"
              />

              <Button
                label="Add Answer Key"
                onPress={handleAddAnswerKey}
                loading={addingAnswerKey}
                disabled={
                  addingAnswerKey ||
                  answerKeys.length >= (test?.totalQuestions || 0)
                }
                fullWidth
                style={styles.actionButton}
              />
            </Card>

            {/* Answer Keys List */}
            {answerKeys.length > 0 && (
              <View style={styles.listSection}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Existing Answer Keys
                </Text>
                {answerKeys.map((key) => (
                  <Card key={key.id} style={styles.listItem}>
                    <View style={styles.keyInfo}>
                      <Text style={[styles.keyNumber, { color: textColor }]}>
                        Q{key.questionNumber}
                      </Text>
                      <Text style={[styles.keyAnswer, { color: textColor }]}>
                        {key.correctAnswer}
                      </Text>
                      <Text style={[styles.keyPoints, { color: textColor }]}>
                        ({key.maxPoints} points)
                      </Text>
                    </View>
                    <Button
                      label="Delete"
                      onPress={() => handleDeleteAnswerKey(key.id)}
                      variant="outline"
                      size="small"
                    />
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'gradeThresholds' && (
          <View style={styles.tabContent}>
            {/* Add Grade Threshold Form */}
            <Card>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Add Grade Threshold
              </Text>

              <TextInput
                label="Grade Name"
                placeholder="e.g., Отлично"
                value={gradeThresholdForm.gradeName}
                onChangeText={(text) =>
                  setGradeThresholdForm({ ...gradeThresholdForm, gradeName: text })
                }
                error={gradeThresholdErrors.gradeName}
              />

              <TextInput
                label="Grade Symbol"
                placeholder="e.g., 5, A, Excellent"
                value={gradeThresholdForm.gradeSymbol}
                onChangeText={(text) =>
                  setGradeThresholdForm({ ...gradeThresholdForm, gradeSymbol: text })
                }
                error={gradeThresholdErrors.gradeSymbol}
              />

              <TextInput
                label="Min Percentage"
                placeholder="e.g., 80"
                value={gradeThresholdForm.minPercentage}
                onChangeText={(text) =>
                  setGradeThresholdForm({ ...gradeThresholdForm, minPercentage: text })
                }
                keyboardType="numeric"
                error={gradeThresholdErrors.minPercentage}
              />

              <TextInput
                label="Max Percentage"
                placeholder="e.g., 100"
                value={gradeThresholdForm.maxPercentage}
                onChangeText={(text) =>
                  setGradeThresholdForm({ ...gradeThresholdForm, maxPercentage: text })
                }
                keyboardType="numeric"
                error={gradeThresholdErrors.maxPercentage}
              />

              <Button
                label="Add Grade Threshold"
                onPress={handleAddGradeThreshold}
                loading={addingGradeThreshold}
                disabled={addingGradeThreshold}
                fullWidth
                style={styles.actionButton}
              />
            </Card>

            {/* Grade Thresholds List */}
            {gradeThresholds.length > 0 && (
              <View style={styles.listSection}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Existing Grade Thresholds
                </Text>
                {gradeThresholds.map((threshold) => (
                  <Card key={threshold.id} style={styles.listItem}>
                    <View style={styles.thresholdInfo}>
                      <Text style={[styles.thresholdName, { color: textColor }]}>
                        {threshold.gradeName} ({threshold.gradeSymbol})
                      </Text>
                      <Text style={[styles.thresholdRange, { color: textColor }]}>
                        {threshold.minPercentage}% - {threshold.maxPercentage}%
                      </Text>
                    </View>
                    <Button
                      label="Delete"
                      onPress={() => handleDeleteGradeThreshold(threshold.id)}
                      variant="outline"
                      size="small"
                    />
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  tabText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  tabContent: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  value: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.md,
  },
  actionButton: {
    marginTop: SPACING.lg,
  },
  listSection: {
    marginTop: SPACING.xl,
  },
  listItem: {
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keyInfo: {
    flex: 1,
  },
  keyNumber: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xs,
  },
  keyAnswer: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.xs,
  },
  keyPoints: {
    ...TYPOGRAPHY.caption,
  },
  thresholdInfo: {
    flex: 1,
  },
  thresholdName: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xs,
  },
  thresholdRange: {
    ...TYPOGRAPHY.body,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  summaryBadge: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  summaryList: {
    marginTop: SPACING.md,
  },
  summaryItem: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.sm,
  },
  actionButtonsContainer: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
});
