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
import { View, Text, Alert, Modal, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';

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

  // ==================== RESULTS MODE STATE ====================
  const [parsedResults, setParsedResults] = useState<any>(null);

  // ==================== QUESTIONS MODE LOGIC ====================

  const handleSubmitResponse = async (text: string) => {
    if (!text.trim()) {
      showToast('error', 'Response Required', 'Please provide your response before continuing.');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const response = await apiService.submitAnswerAndGetNext(currentSessionId, text.trim());

      if (response.success) {
        if (response.data.isComplete) {
          setCompletedSessionId(response.data.sessionId || currentSessionId);
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
        router.push({
          pathname: "/assessmentResults",
          params: {
            results: JSON.stringify(assessmentResults),
            skillName: skillName,
          }
        });
      }
      return;
    }

    // Hide completion dialog and show AI loader
    setShowCompletionDialog(false);
    setShowAiLoader(true);
    setIsLoadingResults(true);

    try {
      const targetSessionId = completedSessionId || currentSessionId;
      const response = await apiService.getAdaptiveResults(targetSessionId);

      if (response.success) {
        setAssessmentResults(response.data);
        setShowAiLoader(false);

        if (onComplete) {
          onComplete(response.data);
        } else {
          router.push({
            pathname: "/assessmentResults",
            params: {
              results: JSON.stringify({ ...response.data, assessmentId: targetSessionId, skillName }),
              skillName: skillName,
              assessmentId: targetSessionId,
            }
          });
        }
      } else {
        setShowAiLoader(false);
        showToast('error', 'Error', 'Failed to load assessment results');
      }
    } catch (error) {
      setShowAiLoader(false);
      showToast('error', 'Error', 'Failed to load assessment results');
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleContinueNext = () => {
    setShowCompletionDialog(false);
    setCompletedSessionId(null);
    router.push("/dashboard");
  };

  // ==================== RESULTS MODE LOGIC ====================
  const [isLoadingResultsPage, setIsLoadingResultsPage] = useState(false);

  useEffect(() => {
    if (mode === 'results') {
      if (resultsData) {
        // Results data provided directly - parse it
        try {
          const parsed = typeof resultsData === 'string' ? JSON.parse(resultsData) : resultsData;
          setParsedResults(parsed);
        } catch (error) {
          console.error('Error parsing results:', error);
          setParsedResults({});
        }
      } else if (assessmentIdProp) {
        // Only assessmentId provided - fetch results from API
        fetchResultsByAssessmentId(assessmentIdProp);
      }
    }
  }, [mode, resultsData, assessmentIdProp]);

  const fetchResultsByAssessmentId = async (assessmentId: string) => {
    setIsLoadingResultsPage(true);
    try {
      console.log('🔍 Fetching results for assessment:', assessmentId);
      const response = await apiService.getAdaptiveResults(assessmentId);

      if (response.success) {
        console.log('✅ Results fetched:', response.data);
        setParsedResults({
          ...response.data,
          assessmentId: assessmentId
        });
      } else {
        console.error('❌ Failed to fetch results:', response.message);
        showToast('error', 'Error', 'Failed to load assessment results');
      }
    } catch (error) {
      console.error('❌ Error fetching results:', error);
      showToast('error', 'Error', 'Failed to load assessment results');
    } finally {
      setIsLoadingResultsPage(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleRecommendedSteps = () => {
    const derivedAssessmentId = assessmentIdProp || parsedResults?.assessmentId;
    const resolvedSkillName = skillNameProp || parsedResults?.skillName || 'Assessment';
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

  // ==================== RENDER ====================

  // QUESTIONS MODE
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
          loading={isLoadingResults}
          loadingMessage={isLoadingResults ? 'Finalizing your results...' : 'Processing...'}
          loadingSubMessage={isLoadingResults ? 'Summarizing your performance' : ''}
          submitting={loading}
        />

        <AssessmentCompletionDialog
          visible={showCompletionDialog}
          skillName={skillName || "Assessment"}
          onSeeResults={handleSeeResults}
          onContinueNext={handleContinueNext}
          isLoadingResults={isLoadingResults}
        />

        {/* AI Loader Modal for Results Generation */}
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
      </>
    );
  }

  // RESULTS MODE
  if (mode === 'results') {
    // Show loading while fetching results
    // if (isLoadingResultsPage) {
    //   return null; 
    // }

    const finalScoreNumber = typeof parsedResults?.finalScore === 'number'
      ? parsedResults.finalScore
      : undefined;

    return (
      <Results
        type="assessment"
        score={finalScoreNumber}
        feedbackGood={parsedResults?.feedbackGood}
        feedbackImprove={parsedResults?.feedbackImprove}
        feedbackSummary={parsedResults?.feedbackSummary}
        onAction={handleRecommendedSteps}
        onBack={handleBack}
        title="Assessment Result"
        completionText="You've completed the assessment"
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
});

export default AssessmentScreen;
