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
import { View, Text, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import Button from '../../components/Button';
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { AntDesign } from '@expo/vector-icons';

import { useAssessmentSession } from "../../hooks/useAssessmentSession";
import { useToast } from "../../hooks/useToast";
import { apiService } from "../../services/api";
import { safeNumber } from '../../utils/assessmentUtils';

import ScenarioInteraction from './ScenarioInteraction';
import Results from './Results';
import AssessmentCompletionDialog from './AssessmentCompletionDialog';

const BRAND = "#0A66C2";

export interface AssessmentScreenProps {
  mode: 'questions' | 'results';
  // Props for questions mode
  skillId?: string;
  sessionId?: string;
  isResuming?: boolean;
  onComplete?: (results: import('../../types/assessment').AssessmentResults) => void;
  onExit?: () => void;
  // Props for results mode
  results?: import('../../types/assessment').AssessmentResults;
  skillName?: string;
  assessmentId?: string;
}

const AssessmentScreen: React.FC<AssessmentScreenProps> = ({
  mode,
  skillId,
  sessionId: initialSessionId,
  isResuming,
  onComplete,
  onExit,
  results: resultsData,
  skillName: skillNameProp,
  assessmentId: assessmentIdProp,
}) => {
  const router = useRouter();
  const { showToast } = useToast();

  // ==================== QUESTIONS MODE STATE ====================
  const {
    sessionId,
    currentQuestion,
    progress,
    skillName: apiSkillName,
    submitAnswerAndGetNext,
    loading,
    error,
    isAssessmentActive,
    startAdaptiveSession,
    clearAssessmentData,
  } = useAssessmentSession();

  const [isInitializing, setIsInitializing] = useState(mode === 'questions');
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);

  // ==================== RESULTS MODE STATE ====================
  const [parsedResults, setParsedResults] = useState<any>(null);

  // ==================== QUESTIONS MODE LOGIC ====================

  // Initialize assessment session
  useEffect(() => {
    if (mode === 'questions') {
      if (isResuming && initialSessionId) {
        console.log('🔄 Resuming assessment for skill:', skillId, 'with session:', initialSessionId);
        initializeSession();
      } else if (!sessionId && !completedSessionId) {
        initializeSession();
      }
    }
  }, [mode, isResuming, initialSessionId]);

  const initializeSession = async () => {
    if (!skillId) {
      console.error('❌ No skillId provided');
      return;
    }

    try {
      setIsInitializing(true);
      console.log('🎯 Initializing adaptive assessment for skill:', skillId);

      const sessionData = await startAdaptiveSession(skillId);

      showToast('success', 'Assessment Started', `${apiSkillName || 'Assessment'} initialized`);

    } catch (error: unknown) {
      console.error('❌ Session initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize session';
      Alert.alert(
        'Assessment Error',
        errorMessage || 'Failed to start assessment. Please try again.',
        [
          { text: 'Retry', onPress: initializeSession },
          { text: 'Exit', onPress: handleExit }
        ]
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSubmitResponse = async (text: string) => {
    if (!text.trim()) {
      showToast('error', 'Response Required', 'Please provide your response before continuing.');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      console.log('📝 Submitting response for sequential assessment');

      const result = await submitAnswerAndGetNext(text.trim());

      if (result.isComplete || result.completed) {
        console.log('🎉 Assessment completed! SessionId:', result.sessionId);
        showToast('success', 'Assessment Complete', 'Generating your personalized feedback...');

        setCompletedSessionId(result.sessionId || sessionId);
        setShowCompletionDialog(true);
      } else {
        showToast('success', 'Response Saved', `Question ${result.progress?.currentQuestion || 'unknown'} of ${result.progress?.totalQuestions || 'unknown'}`);
      }

    } catch (error: unknown) {
      console.error('❌ Response submission failed:', error);
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
    console.log('See Results pressed');

    if (assessmentResults) {
      setShowCompletionDialog(false);
      if (onComplete && assessmentResults) {
        onComplete(assessmentResults);
      } else {
        clearAssessmentData();
        setCompletedSessionId(null);

        router.push({
          pathname: "/assessmentResults",
          params: {
            results: JSON.stringify(assessmentResults),
            skillName: apiSkillName || 'Assessment',
          }
        });
      }
      return;
    }

    setIsLoadingResults(true);
    try {
      const targetSessionId = completedSessionId || sessionId;
      console.log('🔍 Fetching assessment results for session:', targetSessionId);
      const response = await apiService.getAdaptiveResults(targetSessionId);

      if (response.success) {
        console.log('✅ Assessment results fetched:', response.data);
        setAssessmentResults(response.data);
        setShowCompletionDialog(false);

        if (onComplete) {
          onComplete(response.data);
        } else {
          clearAssessmentData();
          setCompletedSessionId(null);

          const payload = {
            ...response.data,
            assessmentId: targetSessionId,
            skillName: apiSkillName || 'Assessment',
          };
          router.push({
            pathname: "/assessmentResults",
            params: {
              results: JSON.stringify(payload),
              skillName: apiSkillName || 'Assessment',
              assessmentId: targetSessionId,
            }
          });
        }
      } else {
        console.error('❌ Failed to fetch results:', response.message);
        showToast('error', 'Error', 'Failed to load assessment results');
      }
    } catch (error) {
      console.error('❌ Error fetching results:', error);
      showToast('error', 'Error', 'Failed to load assessment results');
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleContinueNext = () => {
    console.log('Continue to Next Assessment pressed');
    setShowCompletionDialog(false);
    clearAssessmentData();
    setCompletedSessionId(null);
    router.push("/dashboard");
  };

  // ==================== RESULTS MODE LOGIC ====================

  useEffect(() => {
    if (mode === 'results' && resultsData) {
      try {
        const parsed = typeof resultsData === 'string' ? JSON.parse(resultsData) : resultsData;
        setParsedResults(parsed);
      } catch (error) {
        console.error('Error parsing results:', error);
        setParsedResults({});
      }
    }
  }, [mode, resultsData]);

  const handleBack = () => {
    router.push('/dashboard');
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
    // Determine loader state
    const showLoader = isInitializing || loading || isLoadingResults;
    const loaderMessage = isInitializing
      ? 'Initializing adaptive assessment...'
      : isLoadingResults
        ? 'Finalizing your results...'
        : 'Generating next question...';
    const loaderSubMessage = isInitializing
      ? `Preparing ${apiSkillName || 'Assessment'} evaluation`
      : isLoadingResults
        ? 'Summarizing your performance'
        : 'Analyzing your response';

    // Show error state if session failed to start
    if (error && !isAssessmentActive) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
          <StatusBar barStyle="light-content" />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <AntDesign name="exclamationcircle" size={64} color="white" />
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 16 }}>
              Assessment Error
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, textAlign: 'center', marginTop: 8 }}>
              {error}
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 24 }}>
              <Button variant="primary" onPress={initializeSession} style={{ marginRight: 12 }}>
                Retry
              </Button>
              <Button variant="secondary" onPress={handleExit}>
                Exit
              </Button>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <>
        <ScenarioInteraction
          type="assessment"
          title={`${apiSkillName} Assessment`}
          currentIndex={safeNumber(progress?.currentQuestion, 1) - 1}
          totalItems={safeNumber(progress?.totalQuestions, 4)}
          scenarioText={currentQuestion?.scenario || 'Loading scenario...'}
          onSubmit={handleSubmitResponse}
          onExit={handleExit}
          loading={showLoader}
          loadingMessage={loaderMessage}
          loadingSubMessage={loaderSubMessage}
          submitting={loading}
        />

        <AssessmentCompletionDialog
          visible={showCompletionDialog}
          skillName={apiSkillName || "Communication"}
          onSeeResults={handleSeeResults}
          onContinueNext={handleContinueNext}
          isLoadingResults={isLoadingResults}
        />
      </>
    );
  }

  // RESULTS MODE
  if (mode === 'results') {
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

export default AssessmentScreen;
