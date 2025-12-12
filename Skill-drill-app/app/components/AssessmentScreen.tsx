/**
 * AssessmentScreen Component
 *
 * Unified component for assessment flow - handles both questions and results modes.
 *
 * Modes:
 * - 'questions': Shows assessment questions using ScenarioInteraction component
 * - 'results': Shows assessment results using Results component
 */

import React, { useState, useEffect } from "react";
import { View, Text, Alert, Modal, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { useAssessmentSession } from "../../hooks/useAssessmentSession";
import { useToast } from "../../hooks/useToast";
import { apiService } from "../../services/api";

import ScenarioInteraction from './ScenarioInteraction';
import Results from './Results';
import AssessmentCompletionDialog from './AssessmentCompletionDialog';

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
  const { showToast } = useToast();

  const { submitAnswerAndGetNext, loading, error } = useAssessmentSession();

  const [currentSessionId, setCurrentSessionId] = useState(initialSessionId);
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion);
  const [progress, setProgress] = useState(initialProgress);
  const [skillName, setSkillName] = useState(skillNameProp);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [showAiLoader, setShowAiLoader] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [parsedResults, setParsedResults] = useState<any>(null);

  const handleSubmitResponse = async (text: string) => {
    if (!text.trim()) {
      showToast('error', 'Response Required', 'Please provide your response before continuing.');
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
    } catch (error: any) {
      showToast('error', 'Submission Failed', error.message || 'Failed to submit response');
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
    setShowAiLoader(true);
    setIsLoadingResults(true);

    if (!completedSessionId && !currentSessionId) {
      throw new Error('Session ID not available');
    }
    const targetSessionId = completedSessionId || currentSessionId;
    const maxRetries = 20;
    const retryDelay = 2000;
    let attempts = 0;

    const pollForResults = async (): Promise<void> => {
      try {
        const response = await apiService.getAdaptiveResults(targetSessionId);

        if (response.success) {
          if (response.data.status === 'ready') {
            const resultsData = {
              finalScore: response.data.finalScore,
              feedbackGood: response.data.feedbackGood,
              feedbackImprove: response.data.feedbackImprove,
              feedbackSummary: response.data.feedbackSummary,
              skillName: response.data.skillName
            };
            
            setAssessmentResults(resultsData);
            setShowAiLoader(false);
            setIsLoadingResults(false);

            if (onComplete) {
              onComplete(resultsData);
            } else {
              router.replace({
                pathname: "/assessmentResults",
                params: {
                  results: JSON.stringify({ ...resultsData, assessmentId: targetSessionId }),
                  skillName: response.data.skillName,
                  assessmentId: targetSessionId,
                }
              });
            }
          } else if (response.data.status === 'processing') {
            attempts++;
            if (attempts >= maxRetries) {
              setShowAiLoader(false);
              setIsLoadingResults(false);
              showToast('error', 'Timeout', 'Results are taking longer than expected. Please try again later.');
            } else {
              setTimeout(pollForResults, retryDelay);
            }
          } else {
            setShowAiLoader(false);
            setIsLoadingResults(false);
            showToast('error', 'Error', 'Unexpected response format');
          }
        } else {
          setShowAiLoader(false);
          setIsLoadingResults(false);
          showToast('error', 'Error', response.message || 'Failed to load assessment results');
        }
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) {
          setShowAiLoader(false);
          setIsLoadingResults(false);
          showToast('error', 'Error', 'Failed to load assessment results. Please try again later.');
        } else {
          setTimeout(pollForResults, retryDelay);
        }
      }
    };

    pollForResults();
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
          showToast('info', 'Processing', 'Results are still being generated. Please refresh in a moment.');
        } else {
          showToast('error', 'Error', 'Unexpected response format');
        }
      } else {
        showToast('error', 'Error', 'Failed to load assessment results');
      }
    } catch (error) {
      showToast('error', 'Error', 'Failed to load assessment results');
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
      showToast({ type: 'error', message: 'Assessment ID not found' });
      return;
    }
    const resolvedSkillName = parsedResults?.skillName || skillNameProp;
    if (!resolvedSkillName) {
      showToast({ type: 'error', message: 'Skill name not found' });
      return;
    }
    const finalScoreNumber = typeof parsedResults?.finalScore === 'number' ? parsedResults.finalScore : undefined;

    if (!derivedAssessmentId) {
      showToast('error', 'Missing Data', 'We need your assessment details before recommending drills.');
      return;
    }

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
          skillName={skillName}
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
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
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
