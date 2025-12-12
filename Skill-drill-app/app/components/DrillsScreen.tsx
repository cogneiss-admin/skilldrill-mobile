import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Dimensions,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { useDrillProgress } from '../../hooks/useDrillProgress';
import { useAnimation } from '../../hooks/useAnimation';
import { useToast } from '../../hooks/useToast';

import ScenarioInteraction from './ScenarioInteraction';
import Results from './Results';
import Button from '../../components/Button';

const AI_LOADING_ANIMATION = require('../../assets/lottie/AiLoadingAnime.json');

import {
  BRAND,
  COLORS,
  TYPOGRAPHY,
  SPACING,
} from './Brand';

export interface DrillsScreenProps {
  mode: 'questions' | 'results';
  assignmentId?: string;
  completionData?: {
    reached: boolean;
    skillName: string;
    overall: {
      finalScore: number;
      feedbackGood: string;
      feedbackImprove: string;
      feedbackSummary: string;
    };
    stats: {
      averageScore: number;
      attemptsCount: number;
    };
  };
}

const DrillsScreen: React.FC<DrillsScreenProps> = ({
  mode,
  assignmentId,
  completionData: externalCompletionData,
}) => {
  if (mode === 'questions' && !assignmentId) {
    throw new Error('assignmentId is required for questions mode');
  }
  const router = useRouter();
  const { showToast } = useToast();

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
    isLoadingOverallFeedback,
    completionData,
    submitDrill,
    nextDrill,
    previousDrill,
    handleCompletion,
  } = useDrillProgress(assignmentId);

  const { celebrate, fadeIn } = useAnimation();

  useEffect(() => {
    if (mode === 'questions') {
      fadeIn();
    }
  }, [mode]);

  useEffect(() => {
    if (completionData?.reached) {
      celebrate();
    }
  }, [completionData]);

  const handleSubmit = async (text: string) => {
    if (!text.trim()) {
      showToast('error', 'Response Required', 'Please provide your response before continuing.');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await submitDrill({
        textContent: text.trim(),
      });
    } catch (error: any) {
      showToast('error', 'Submission Failed', error?.message || 'Failed to submit response');
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleBack = () => {
    router.replace('/activity?tab=drills');
  };

  if (mode === 'questions') {
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
            <Text style={{
              fontSize: 24,
              fontWeight: '700' as const,
              letterSpacing: 0.1,
              color: COLORS.text.primary,
              marginTop: SPACING.md,
              marginBottom: SPACING.xs,
            }}>Oops!</Text>
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

    return (
      <>
        <ScenarioInteraction
          type="drill"
          title={`${assignment?.skillName} Drill`}
          currentIndex={currentIndex}
          totalItems={totalDrills}
          scenarioText={currentDrill.scenarioText}
          onSubmit={handleSubmit}
          onExit={handleBack}
          loading={loading}
          submitting={submitting}
        />

        <Modal
          visible={submitting}
          transparent
          animationType="fade"
          statusBarTranslucent
        >
          <View style={styles.blurContainer}>
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={[styles.modalLoadingText, { color: '#FFFFFF', marginTop: SCREEN_WIDTH * 0.04 }]}>Processing your response...</Text>
            </View>
          </View>
        </Modal>

        <Modal
          visible={isLoadingOverallFeedback}
          transparent
          animationType="fade"
          statusBarTranslucent
        >
          <BlurView intensity={100} tint="dark" style={styles.blurContainer}>
            <View style={styles.aiLoaderContent}>
              <View style={styles.aiAnimationContainer}>
                <LottieView
                  source={AI_LOADING_ANIMATION}
                  autoPlay
                  loop
                  style={styles.aiAnimation}
                />
              </View>
              <Text style={styles.aiLoaderTitle}>
                {(() => {
                  const skillName = completionData?.skillName || assignment?.skillName;
                  if (!skillName) {
                    return 'Generating your results...';
                  }
                  return `Generating your results for ${skillName}`;
                })()}
              </Text>
            </View>
          </BlurView>
        </Modal>
      </>
    );
  }

  if (mode === 'results' && externalCompletionData) {
    return (
      <Results
        type="drill"
        score={externalCompletionData.overall.finalScore}
        feedbackGood={externalCompletionData.overall.feedbackGood}
        feedbackImprove={externalCompletionData.overall.feedbackImprove}
        feedbackSummary={externalCompletionData.overall.feedbackSummary}
        onAction={handleGoToDashboard}
        onBack={handleBack}
        skillName={externalCompletionData.skillName}
      />
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.md,
    color: COLORS.text.tertiary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.padding['2xl'],
  },
  errorTitle: {
    fontSize: 24,
    letterSpacing: 0.1,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SCREEN_WIDTH * 0.06,
  },
  modalLoadingText: {
    marginTop: SCREEN_WIDTH * 0.025,
    fontSize: SCREEN_WIDTH * 0.04,
  },
  aiLoaderContent: {
    alignItems: 'center',
    padding: 32,
  },
  aiAnimationContainer: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  aiAnimation: {
    width: '100%',
    height: '100%',
  },
  aiLoaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default DrillsScreen;
