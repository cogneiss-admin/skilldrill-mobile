/**
 * Drill Practice Screen
 *
 * Interactive drill practice with milestone feedback.
 *
 * Features:
 * - Load drill assignment with all items
 * - Display scenario and collect text/audio responses
 * - AI-powered scoring (hidden per-drill, shown at milestones)
 * - Progress tracking with SkillBar
 * - Milestone celebration modals (25%, 50%, 75%, 100%)
 * - Navigation between drills
 * - Beautiful motivating UI
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

import Button from '../components/Button';
import SkillBar from '../components/SkillBar';
import { useDrillProgress } from '../hooks/useDrillProgress';
import { useAnimation } from '../hooks/useAnimation';

import {
  BRAND,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  GRADIENTS
} from './components/Brand';

export default function DrillPractice() {
  const params = useLocalSearchParams<{ assignmentId?: string }>();

  const {
    loading,
    error,
    assignment,
    drills,
    currentDrill,
    currentIndex,
    totalDrills,
    completedCount,
    progress,
    submitting,
    milestoneData,
    submitDrill,
    nextDrill,
    previousDrill,
    dismissMilestone
  } = useDrillProgress(params.assignmentId || '');

  const { celebrate, fadeIn, fadeAnim, scale, scaleAnim } = useAnimation();

  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    fadeIn();
  }, []);

  useEffect(() => {
    // Trigger celebration animation when milestone is reached
    if (milestoneData?.reached) {
      celebrate();
    }
  }, [milestoneData]);

  useEffect(() => {
    // Clear response when drill changes
    setResponseText('');
  }, [currentIndex]);

  const handleSubmit = async () => {
    if (!responseText.trim()) {
      return;
    }

    try {
      await submitDrill({
        textContent: responseText.trim()
      });
    } catch (error) {
      console.error('Submit failed:', error);
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND} />
          <Text style={styles.loadingText}>Loading your drills...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !currentDrill) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>
            {error || 'Failed to load drills'}
          </Text>
          <Button
            variant="primary"
            onPress={() => router.back()}
            style={{ marginTop: SPACING.margin.lg }}
          >
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const canSubmit = responseText.trim().length > 0 && !submitting;
  const isLastDrill = currentIndex === totalDrills - 1;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Practice Drill</Text>
              <Text style={styles.headerSubtitle}>
                Drill {currentIndex + 1} of {totalDrills}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <SkillBar
              progress={progress.percentage}
              total={totalDrills}
              completed={completedCount}
              showMilestones
              animated
              label="Overall Progress"
            />
          </View>

          {/* Drill Card */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 200 }}
            style={styles.drillCard}
          >
            <LinearGradient
              colors={[COLORS.background.card, COLORS.background.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.drillCardGradient}
            >
              {/* Drill Number Badge */}
              <View style={styles.drillBadge}>
                <Ionicons name="document-text" size={16} color={BRAND} />
                <Text style={styles.drillBadgeText}>Scenario #{currentIndex + 1}</Text>
              </View>

              {/* Scenario Text */}
              <Text style={styles.scenarioLabel}>Scenario:</Text>
              <Text style={styles.scenarioText}>{currentDrill.scenarioText}</Text>

              {/* Completion Status */}
              {currentDrill.isCompleted && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              )}
            </LinearGradient>
          </MotiView>

          {/* Response Input */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 400 }}
            style={styles.responseContainer}
          >
            <Text style={styles.responseLabel}>Your Response:</Text>
            <TextInput
              style={styles.responseInput}
              placeholder="Type your response here..."
              placeholderTextColor={COLORS.text.disabled}
              multiline
              numberOfLines={6}
              value={responseText}
              onChangeText={setResponseText}
              editable={!submitting}
              textAlignVertical="top"
              maxLength={2400}
            />

            <Text style={styles.characterCounter}>
              {responseText.length}/2400 characters
            </Text>

            <Text style={styles.inputHint}>
              <Ionicons name="information-circle" size={14} color={COLORS.text.tertiary} />
              {' '}Provide a detailed response demonstrating the skill
            </Text>
          </MotiView>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Button
              variant="gradient"
              size="large"
              onPress={handleSubmit}
              loading={submitting}
              disabled={!canSubmit}
              icon="checkmark-circle"
              fullWidth
            >
              Submit Response
            </Button>

            {/* Navigation Buttons */}
            {totalDrills > 1 && (
              <View style={styles.navigationButtons}>
                <Button
                  variant="secondary"
                  size="medium"
                  onPress={previousDrill}
                  disabled={currentIndex === 0 || submitting}
                  icon="arrow-back"
                  style={{ flex: 1 }}
                >
                  Previous
                </Button>

                <Button
                  variant="secondary"
                  size="medium"
                  onPress={nextDrill}
                  disabled={isLastDrill || submitting}
                  icon="arrow-forward"
                  iconPosition="right"
                  style={{ flex: 1 }}
                >
                  Next
                </Button>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Milestone Modal */}
      {milestoneData && (
        <Modal
          visible={true}
          animationType="fade"
          transparent
          onRequestClose={dismissMilestone}
        >
          <View style={styles.modalOverlay}>
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={styles.modalContent}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalGradient}
              >
                {/* Trophy Icon */}
                <MotiView
                  from={{ scale: 0, rotate: '-180deg' }}
                  animate={{ scale: 1, rotate: '0deg' }}
                  transition={{ type: 'spring', delay: 200 }}
                  style={styles.trophyContainer}
                >
                  <Ionicons name="trophy" size={64} color={COLORS.warning} />
                </MotiView>

                {/* Milestone Title */}
                <Text style={styles.modalTitle}>
                  {milestoneData.percentage === 100 ? '🎉 Congratulations!' : '🎯 Milestone Reached!'}
                </Text>

                <Text style={styles.modalSubtitle}>
                  {milestoneData.percentage}% Complete
                </Text>

                {/* Stats Card */}
                <View style={styles.statsCard}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {milestoneData.averageScore.toFixed(1)}
                    </Text>
                    <Text style={styles.statLabel}>Average Score</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {milestoneData.attemptsCount}
                    </Text>
                    <Text style={styles.statLabel}>Drills Completed</Text>
                  </View>
                </View>

                {/* Motivational Message */}
                <Text style={styles.motivationalText}>
                  {milestoneData.percentage === 100
                    ? "You've completed all drills! You're mastering this skill. Keep up the excellent work!"
                    : milestoneData.percentage >= 75
                    ? "Almost there! You're doing fantastic. Finish strong!"
                    : milestoneData.percentage >= 50
                    ? "You're halfway through! Your progress is impressive. Keep going!"
                    : "Great start! You're building momentum. Keep practicing!"}
                </Text>

                {/* Action Button */}
                <Button
                  variant="secondary"
                  size="large"
                  onPress={milestoneData.percentage === 100 ? handleGoToDashboard : dismissMilestone}
                  icon={milestoneData.percentage === 100 ? 'home' : 'arrow-forward'}
                  iconPosition="right"
                  style={styles.modalButton}
                  fullWidth
                >
                  {milestoneData.percentage === 100 ? 'Go to Dashboard' : 'Continue Practice'}
                </Button>
              </LinearGradient>
            </MotiView>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.md,
    color: COLORS.text.tertiary
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.padding['2xl']
  },
  errorTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: SPACING['3xl']
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.padding.lg,
    paddingVertical: SPACING.padding.md
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    marginTop: SPACING.xs
  },
  progressContainer: {
    paddingHorizontal: SPACING.padding.lg,
    marginBottom: SPACING.margin.lg
  },
  drillCard: {
    marginHorizontal: SPACING.padding.lg,
    marginBottom: SPACING.margin.lg,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.lg
  },
  drillCardGradient: {
    padding: SPACING.padding.lg
  },
  drillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.padding.sm,
    paddingVertical: SPACING.padding.xs,
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.md
  },
  drillBadgeText: {
    ...TYPOGRAPHY.label,
    color: BRAND,
    fontWeight: '700',
    marginLeft: SPACING.xs
  },
  scenarioLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.text.tertiary,
    marginBottom: SPACING.xs
  },
  scenarioText: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: COLORS.text.primary,
    lineHeight: 24
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light
  },
  completedText: {
    ...TYPOGRAPHY.body,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: SPACING.xs
  },
  responseContainer: {
    paddingHorizontal: SPACING.padding.lg,
    marginBottom: SPACING.margin.lg
  },
  responseLabel: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm
  },
  responseInput: {
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.background.card,
    borderWidth: 1.5,
    borderColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.padding.md,
    minHeight: 150,
    color: COLORS.text.primary
  },
  characterCounter: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8
  },
  inputHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    marginTop: SPACING.xs
  },
  actionsContainer: {
    paddingHorizontal: SPACING.padding.lg
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: SPACING.gap.md,
    marginTop: SPACING.margin.md
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.padding.lg
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BORDER_RADIUS['2xl'],
    overflow: 'hidden',
    ...SHADOWS.xl
  },
  modalGradient: {
    padding: SPACING.padding['2xl'],
    alignItems: 'center'
  },
  trophyContainer: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg
  },
  modalTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 28,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xs
  },
  modalSubtitle: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SPACING.lg
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.padding.lg,
    marginBottom: SPACING.lg,
    width: '100%'
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: BRAND,
    marginBottom: SPACING.xs
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    textAlign: 'center'
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border.light,
    marginHorizontal: SPACING.md
  },
  motivationalText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg
  },
  modalButton: {
    backgroundColor: COLORS.white
  }
});
