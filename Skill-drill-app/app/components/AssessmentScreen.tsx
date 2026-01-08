/**
 * AssessmentScreen Component
 *
 * Unified component for assessment flow - handles both questions and results modes.
 *
 * Modes:
 * - 'questions': Shows assessment questions using ScenarioInteraction component
 * - 'results': Shows assessment results using Results component
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Alert, Modal, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { useAssessmentSession } from "../../hooks/useAssessmentSession";
import { useAIJobPolling } from "../../hooks/useAIJobPolling";
import { useResponseScoringPolling } from "../../hooks/useResponseScoringPolling";
import { useAllScoringPolling } from "../../hooks/useAllScoringPolling";
import { apiService } from "../../services/api";

import ScenarioInteraction from './ScenarioInteraction';
import Results from './Results';
import AssessmentCompletionDialog from './AssessmentCompletionDialog';
import AIProgressIndicator from './AIProgressIndicator';

const AI_LOADING_ANIMATION = require('../../assets/lottie/AiLoadingAnime.json');

const BRAND = "#0A66C2";

export interface AssessmentScreenProps {
  mode: 'questions' | 'results';
  skillId?: string;
  sessionId?: string;
  skillName?: string;
  initialQuestion?: any;
  initialProgress?: any;
  onComplete?: (results: import('../../types/assessment').AssessmentResults) => void;
  onExit?: () => void;
  results?: import('../../types/assessment').AssessmentResults;
  assessmentId?: string;
}

const AssessmentScreen: React.FC<AssessmentScreenProps> = ({
  mode,
  skillId,
  sessionId: initialSessionId,
  skillName: skillNameProp,
  initialQuestion,
  initialProgress,
  onComplete,
  onExit,
  results: resultsData,
  assessmentId: assessmentIdProp,
}) => {
  const router = useRouter();

  const { submitAnswerAndGetNext, loading, error } = useAssessmentSession();

  const [currentSessionId, setCurrentSessionId] = useState(initialSessionId);
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion);
  const [progress, setProgress] = useState(initialProgress);
  const [skillName, setSkillName] = useState(skillNameProp);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<import('../../types/assessment').AssessmentResults | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [showAiLoader, setShowAiLoader] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [pendingNextQuestion, setPendingNextQuestion] = useState<any>(null);
  const [pendingProgress, setPendingProgress] = useState<any>(null);

  const [parsedResults, setParsedResults] = useState<any>(null);

  // Error dialog state
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);

  // Response scoring polling hook (for non-last questions - 5 second max wait)
  const { startPolling: startScoringPolling, isPolling: isScoringPolling } = useResponseScoringPolling({
    onComplete: () => {
      // Race completed - show next question
      if (pendingNextQuestion && pendingProgress) {
        setCurrentQuestion(pendingNextQuestion);
        setProgress(pendingProgress);
        setPendingNextQuestion(null);
        setPendingProgress(null);
      }
      setIsSubmitting(false);
    },
  });

  // State for last question - waiting for all scoring
  const [isWaitingForAllScoring, setIsWaitingForAllScoring] = useState(false);
  const [pendingCompletedSessionId, setPendingCompletedSessionId] = useState<string | null>(null);

  // All scoring polling hook (for last question - wait for all scoring to complete)
  const { startPolling: startAllScoringPolling, progress: scoringProgress } = useAllScoringPolling({
    onComplete: async () => {
      // All scoring completed successfully - show completion dialog and trigger final feedback
      setIsWaitingForAllScoring(false);

      const sessionId = pendingCompletedSessionId;
      if (sessionId) {
        setCompletedSessionId(sessionId);
        setPendingCompletedSessionId(null);
        setShowCompletionDialog(true);

        // Trigger final feedback generation in background
        try {
          await apiService.generateFinalFeedback(sessionId);
        } catch (error) {
          // Silent fail - feedback generation will be retried when user clicks "See Results"
          console.warn('[AssessmentScreen] Failed to trigger final feedback:', error);
        }
      }
    },
    onError: (errorMessage) => {
      // Scoring failed - show error dialog with retry option
      setIsWaitingForAllScoring(false);
      setErrorMessage(errorMessage);

      // Set retry action to retry scoring and re-poll
      const sessionId = pendingCompletedSessionId;
      setRetryAction(() => async () => {
        if (!sessionId) return;

        setShowErrorDialog(false);
        setErrorMessage('');
        setIsWaitingForAllScoring(true);

        try {
          // Call retry endpoint
          await apiService.retryResponseScoring(sessionId);
          // Re-start polling
          startAllScoringPolling(sessionId);
        } catch (error) {
          setIsWaitingForAllScoring(false);
          setErrorMessage('Failed to retry. Please try again.');
          setShowErrorDialog(true);
        }
      });

      setShowErrorDialog(true);
    },
  });

  // Helper function to navigate to results
  const navigateToResults = useCallback((resultsData: import('../../types/assessment').AssessmentResults, sessionId: string, resolvedSkillName: string) => {
    setAssessmentResults(resultsData);
    setShowAiLoader(false);
    setIsLoadingResults(false);
    setPendingSessionId(null);

    if (onComplete) {
      onComplete(resultsData);
    } else {
      router.replace({
        pathname: "/assessmentResults",
        params: {
          results: JSON.stringify({ ...resultsData, assessmentId: sessionId }),
          skillName: resolvedSkillName,
          assessmentId: sessionId,
        }
      });
    }
  }, [onComplete, router]);

  // AI Job polling hook for results generation
  const {
    status: aiJobStatus,
    progressMessage: aiProgressMessage,
    isPolling: isPollingResults,
    canRetry: canRetryResults,
    startPolling: startResultsPolling,
    cancelPolling: cancelResultsPolling,
    retry: retryResultsPolling,
    reset: resetResultsPolling,
  } = useAIJobPolling({
    onComplete: async () => {
      // Job completed, fetch the actual results
      if (pendingSessionId) {
        await fetchAndNavigateToResults(pendingSessionId);
      }
    },
    onError: (error, jobStatus) => {
      setShowAiLoader(false);
      setIsLoadingResults(false);
      // Log technical error to console
      console.error('[AssessmentScreen] Failed to generate results:', error);
      // Show error dialog with message from backend
      const errorMsg = jobStatus?.error || error?.message || 'Unable to generate results. Please try again.';
      setErrorMessage(errorMsg);
      setRetryAction(() => retryResultsPolling);
      setShowErrorDialog(true);
    },
  });

  // Fetch results and navigate
  const fetchAndNavigateToResults = useCallback(async (sessionId: string) => {
    try {
      const response = await apiService.getAdaptiveResults(sessionId);

      if (!response.success || response.data.status !== 'ready') {
        throw new Error('Results not ready');
      }

      const resolvedSkillName = response.data.skillName || skillName || 'Unknown Skill';

      const resultsData: import('../../types/assessment').AssessmentResults = {
        assessmentId: sessionId,
        skillName: resolvedSkillName,
        finalScore: response.data.finalScore || 0,
        subskillScores: [],
        feedback: {
          good: response.data.feedbackGood || '',
          improve: response.data.feedbackImprove || '',
          summary: response.data.feedbackSummary || '',
          flaws: []
        },
        completedAt: new Date().toISOString()
      };

      navigateToResults(resultsData, sessionId, resolvedSkillName);
    } catch (err) {
      setShowAiLoader(false);
      setIsLoadingResults(false);
      // Log technical error to console
      console.error('[AssessmentScreen] Failed to load results:', err);
      // Show clean error message to user
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  }, [skillName, navigateToResults]);

  const handleSubmitResponse = async (text: string) => {
    if (!text.trim()) {
      return;
    }

    if (!currentSessionId) {
      return;
    }

    setIsSubmitting(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const response = await apiService.submitAnswerAndGetNext(currentSessionId, text.trim());

      if (response.success) {
        if (response.data.isComplete) {
          // Last question - wait for ALL scoring to complete before showing completion dialog
          if (!response.data.sessionId) {
            throw new Error('Session ID not found in response');
          }

          // Store session ID and show loader while waiting for all scoring
          setPendingCompletedSessionId(response.data.sessionId);
          setIsWaitingForAllScoring(true);
          setIsSubmitting(false);

          // Start polling for all scoring jobs to complete
          startAllScoringPolling(response.data.sessionId);
        } else {
          // More questions - start response scoring polling
          const { scoringJobId, question, progress } = response.data;

          // Store next question in pending state
          setPendingNextQuestion(question);
          setPendingProgress(progress);

          if (scoringJobId) {
            // Start polling for response scoring completion
            // Will show next question when: min(5 seconds, scoring completed)
            startScoringPolling(scoringJobId);
          } else {
            // No jobId (shouldn't happen with updated backend), show immediately
            console.warn('[AssessmentScreen] No scoringJobId in response');
            setCurrentQuestion(question);
            setProgress(progress);
            setIsSubmitting(false);
          }
        }
      } else {
        throw new Error(response.message || 'Failed to submit answer');
      }
    } catch (error: unknown) {
      // Log error for debugging but don't show to user for smoother experience
      const message = error instanceof Error ? error.message : 'Failed to submit answer';
      console.warn('[AssessmentScreen] Submit error:', message);
      setIsSubmitting(false);
    }
  };

  const handleExit = () => {
    Alert.alert(
      'Exit Assessment',
      'Are you sure you want to exit? Your progress will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          onPress: () => {
            if (onExit) {
              onExit();
            } else {
              router.back();
            }
          }
        }
      ]
    );
  };

  const handleSeeResults = async () => {
    if (assessmentResults) {
      setShowCompletionDialog(false);
      if (onComplete) {
        onComplete(assessmentResults);
      } else {
        router.replace({
          pathname: "/assessmentResults",
          params: {
            results: JSON.stringify(assessmentResults),
            skillName: skillName,
          }
        });
      }
      return;
    }

    setShowCompletionDialog(false);

    const targetSessionId = completedSessionId || currentSessionId;
    if (!targetSessionId) {
      return;
    }

    const sessionId: string = targetSessionId;
    setPendingSessionId(sessionId);
    setShowAiLoader(true);
    setIsLoadingResults(true);

    // Try to get results directly first - they might already be ready
    try {
      const response = await apiService.getAdaptiveResults(sessionId);

      if (response.success && response.data.status === 'ready') {
        // Results are ready, navigate directly
        await fetchAndNavigateToResults(sessionId);
        return;
      }

      // If backend returns a jobId, use the polling hook
      if (response.data?.jobId) {
        startResultsPolling(response.data.jobId);
        return;
      }

      // Fallback: poll the results endpoint with exponential backoff
      const pollForResults = async (attempt = 0): Promise<void> => {
        const maxAttempts = 30;
        const delay = Math.min(1000 * Math.pow(1.5, attempt), 10000); // Exponential backoff

        try {
          const pollResponse = await apiService.getAdaptiveResults(sessionId);

          if (pollResponse.success && pollResponse.data.status === 'ready') {
            await fetchAndNavigateToResults(sessionId);
          } else if (attempt < maxAttempts) {
            setTimeout(() => pollForResults(attempt + 1), delay);
          } else {
            setShowAiLoader(false);
            setIsLoadingResults(false);
            console.warn('[AssessmentScreen] Results generation timeout - taking longer than expected');
            Alert.alert('Timeout', 'Something went wrong. Please try again.');
          }
        } catch {
          if (attempt < maxAttempts) {
            setTimeout(() => pollForResults(attempt + 1), delay);
          } else {
            setShowAiLoader(false);
            setIsLoadingResults(false);
            console.warn('[AssessmentScreen] Failed to fetch results after max polling attempts');
            Alert.alert('Error', 'Something went wrong. Please try again.');
          }
        }
      };

      pollForResults();
    } catch (error) {
      setShowAiLoader(false);
      setIsLoadingResults(false);
      // Log technical error to console
      console.error('[AssessmentScreen] Failed to initiate results polling:', error);
      // Show clean error message to user
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  // Retry results generation
  const handleRetryResults = () => {
    if (pendingSessionId) {
      setShowAiLoader(true);
      setIsLoadingResults(true);
      retryResultsPolling();
    }
  };

  // Cancel results generation
  const handleCancelResults = () => {
    cancelResultsPolling();
    setShowAiLoader(false);
    setIsLoadingResults(false);
    setPendingSessionId(null);
  };

  const handleContinueNext = () => {
    setShowCompletionDialog(false);
    setCompletedSessionId(null);
    router.replace("/auth/skills?mode=assessment&assessment=true");
  };

  const [isLoadingResultsPage, setIsLoadingResultsPage] = useState(false);

  useEffect(() => {
    if (mode === 'results') {
      if (resultsData) {
        try {
          const parsed = typeof resultsData === 'string' ? JSON.parse(resultsData) : resultsData;
          setParsedResults(parsed);
        } catch (error) {
          setParsedResults({});
        }
      } else if (assessmentIdProp) {
        fetchResultsByAssessmentId(assessmentIdProp);
      }
    }
  }, [mode, resultsData, assessmentIdProp]);

  const fetchResultsByAssessmentId = async (assessmentId: string) => {
    setIsLoadingResultsPage(true);
    try {
      const response = await apiService.getAdaptiveResults(assessmentId);

      if (response.success) {
        if (response.data.status === 'ready') {
          setParsedResults({
            finalScore: response.data.finalScore,
            feedbackGood: response.data.feedbackGood,
            feedbackImprove: response.data.feedbackImprove,
            feedbackSummary: response.data.feedbackSummary,
            assessmentId: assessmentId
          });
        } else if (response.data.status === 'processing') {
          // Results still processing
        } else {
          // Unexpected response format
        }
      } else {
        // Failed to load assessment results
      }
    } catch (error) {
      // Failed to load assessment results
    } finally {
      setIsLoadingResultsPage(false);
    }
  };

  const handleBack = () => {
    router.replace('/activity?tab=assessments');
  };

  const handleRecommendedSteps = () => {
    const derivedAssessmentId = assessmentIdProp || parsedResults?.assessmentId;
    if (!derivedAssessmentId) {
      return;
    }
    const resolvedSkillName = parsedResults?.skillName || skillNameProp;
    if (!resolvedSkillName) {
      return;
    }
    const finalScoreNumber = typeof parsedResults?.finalScore === 'number' ? parsedResults.finalScore : undefined;

    router.push({
      pathname: '/recommended-drills',
      params: {
        assessmentId: derivedAssessmentId,
        skillName: resolvedSkillName,
        finalScore: finalScoreNumber !== undefined ? String(finalScoreNumber) : undefined,
      },
    });
  };

  if (mode === 'questions') {
    return (
      <>
        <ScenarioInteraction
          type="assessment"
          title={`${skillName} Assessment`}
          currentIndex={progress?.currentQuestion - 1}
          totalItems={progress?.totalQuestions}
          scenarioText={currentQuestion?.scenario}
          onSubmit={handleSubmitResponse}
          onExit={handleExit}
          loading={false}
          loadingMessage="Processing..."
          loadingSubMessage=""
          submitting={loading}
        />

        <AssessmentCompletionDialog
          visible={showCompletionDialog}
          skillName={skillName || 'Assessment'}
          onSeeResults={handleSeeResults}
          onContinueNext={handleContinueNext}
          isLoadingResults={false}
        />

        <Modal
          visible={showAiLoader}
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
                Generating your results for {skillName}
              </Text>
              {/* Show AI progress indicator with status messages */}
              {aiJobStatus && (
                <AIProgressIndicator
                  status={aiJobStatus.status}
                  message={aiProgressMessage || 'Processing your assessment...'}
                  showRetry={canRetryResults}
                  showCancel={isPollingResults}
                  onRetry={handleRetryResults}
                  onCancel={handleCancelResults}
                />
              )}
              {/* Fallback message when no job status */}
              {!aiJobStatus && (
                <Text style={styles.aiLoaderSubtitle}>
                  This may take a moment...
                </Text>
              )}
            </View>
          </BlurView>
        </Modal>

        <Modal
          visible={isSubmitting}
          transparent
          animationType="fade"
          statusBarTranslucent
        >
          <BlurView intensity={80} tint="dark" style={styles.submittingBlurContainer}>
            <View style={styles.submittingLoaderContainer}>
              <ActivityIndicator size={40} color={BRAND} />
            </View>
          </BlurView>
        </Modal>

        {/* Last question - waiting for all scoring to complete */}
        <Modal
          visible={isWaitingForAllScoring}
          transparent
          animationType="fade"
          statusBarTranslucent
        >
          <BlurView intensity={80} tint="dark" style={styles.submittingBlurContainer}>
            <View style={styles.submittingLoaderContainer}>
              <ActivityIndicator size={40} color={BRAND} />
              <Text style={{ marginTop: 16, fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
                {scoringProgress?.message || 'Please wait while we process your answers...'}
              </Text>
            </View>
          </BlurView>
        </Modal>

        {/* Error Dialog */}
        <Modal
          visible={showErrorDialog}
          transparent
          animationType="fade"
          statusBarTranslucent
        >
          <View style={styles.errorDialogBackdrop}>
            <View style={styles.errorDialogContainer}>
              <View style={styles.errorIconContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
              </View>
              <Text style={styles.errorDialogTitle}>Something went wrong</Text>
              <Text style={styles.errorDialogMessage}>{errorMessage}</Text>
              <View style={styles.errorDialogButtons}>
                <TouchableOpacity
                  style={styles.errorDialogCancelButton}
                  onPress={() => {
                    setShowErrorDialog(false);
                    setErrorMessage('');
                    resetResultsPolling();
                    if (onExit) onExit();
                    else router.back();
                  }}
                >
                  <Text style={styles.errorDialogCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.errorDialogRetryButton}
                  onPress={() => {
                    setShowErrorDialog(false);
                    setErrorMessage('');
                    if (retryAction) {
                      retryAction();
                    }
                  }}
                >
                  <Text style={styles.errorDialogRetryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  if (mode === 'results') {
    const finalScoreNumber = typeof parsedResults?.finalScore === 'number'
      ? parsedResults.finalScore
      : undefined;

    if (!parsedResults?.skillName) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#FF0000', textAlign: 'center' }}>
            Error: Skill name is missing from assessment results.
          </Text>
        </View>
      );
    }

    return (
      <Results
        type="assessment"
        score={finalScoreNumber}
        feedbackGood={parsedResults?.feedbackGood}
        feedbackImprove={parsedResults?.feedbackImprove}
        feedbackSummary={parsedResults?.feedbackSummary}
        onAction={handleRecommendedSteps}
        onBack={handleBack}
        skillName={parsedResults.skillName}
      />
    );
  }

  return null;
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  aiLoaderSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  submittingBlurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submittingLoaderContainer: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  // Error Dialog Styles
  errorDialogBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SCREEN_WIDTH * 0.06,
  },
  errorDialogContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SCREEN_WIDTH * 0.06,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  errorIconContainer: {
    marginBottom: SCREEN_WIDTH * 0.04,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorDialogTitle: {
    fontSize: SCREEN_WIDTH * 0.05,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: SCREEN_WIDTH * 0.02,
  },
  errorDialogMessage: {
    fontSize: SCREEN_WIDTH * 0.038,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: SCREEN_WIDTH * 0.06,
    lineHeight: SCREEN_WIDTH * 0.055,
  },
  errorDialogButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: SCREEN_WIDTH * 0.03,
  },
  errorDialogCancelButton: {
    flex: 1,
    paddingVertical: SCREEN_WIDTH * 0.035,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorDialogCancelText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '600',
    color: '#6B7280',
  },
  errorDialogRetryButton: {
    flex: 1,
    paddingVertical: SCREEN_WIDTH * 0.035,
    borderRadius: 8,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorDialogRetryText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AssessmentScreen;
