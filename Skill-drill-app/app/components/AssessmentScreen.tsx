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
import { View, Text, Alert, Modal, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { useAssessmentSession } from "../../hooks/useAssessmentSession";
import { useAIJobPolling } from "../../hooks/useAIJobPolling";
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

  const [parsedResults, setParsedResults] = useState<any>(null);

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
    onError: (errorMessage) => {
      setShowAiLoader(false);
      setIsLoadingResults(false);
      Alert.alert('Error', `Failed to generate results: ${errorMessage}`);
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
      Alert.alert('Error', 'Failed to load results. Please try again.');
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
          if (!response.data.sessionId) {
            throw new Error('Session ID not found in response');
          }
          setCompletedSessionId(response.data.sessionId);
          setShowCompletionDialog(true);
        } else {
          setCurrentQuestion(response.data.question);
          setProgress(response.data.progress);
        }
      } else {
        throw new Error(response.message || 'Failed to submit answer');
      }
    } catch (error: unknown) {
      // Log error for debugging but don't show to user for smoother experience
      const message = error instanceof Error ? error.message : 'Failed to submit answer';
      console.warn('[AssessmentScreen] Submit error:', message);
    } finally {
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
            Alert.alert('Timeout', 'Results generation is taking longer than expected. Please try again later.');
          }
        } catch {
          if (attempt < maxAttempts) {
            setTimeout(() => pollForResults(attempt + 1), delay);
          } else {
            setShowAiLoader(false);
            setIsLoadingResults(false);
            Alert.alert('Error', 'Failed to fetch results. Please try again.');
          }
        }
      };

      pollForResults();
    } catch {
      setShowAiLoader(false);
      setIsLoadingResults(false);
      Alert.alert('Error', 'Failed to fetch results. Please try again.');
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
          <View style={styles.blurContainer}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={[styles.loadingText, { color: '#FFFFFF', marginTop: SCREEN_WIDTH * 0.04 }]}>Processing your response...</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SCREEN_WIDTH * 0.06,
  },
  loadingText: {
    marginTop: SCREEN_WIDTH * 0.025,
    fontSize: SCREEN_WIDTH * 0.04,
  },
});

export default AssessmentScreen;
