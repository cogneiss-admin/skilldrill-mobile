import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button, Surface, ProgressBar } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useAssessmentSession } from "../../hooks/useAssessmentSession";
import { useToast } from "../../hooks/useToast";
import { useResponsive } from "../../utils/responsive";
import { apiService } from "../../services/api";
import { AntDesign } from '@expo/vector-icons';
import AIGenerationLoader from './AIGenerationLoader';
import AssessmentCompletionDialog from './AssessmentCompletionDialog';
import { safeProgress, safeNumber } from '../../utils/mathUtils';

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";
const logoSrc = require("../../assets/images/logo.png");

interface AdaptiveAssessmentProps {
  skillId: string;
  skillName?: string;
  onComplete?: (results: any) => void;
  onExit?: () => void;
}

// Simple progress indicator without tier information

// Progress indicator component
const ProgressIndicator = ({ currentQuestion, totalQuestions }: {
  currentQuestion: number;
  totalQuestions: number;
}) => {
  // Use bulletproof safe progress calculation
  const progress = safeProgress(safeNumber(currentQuestion), safeNumber(totalQuestions, 1));

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
          Question {currentQuestion} of {totalQuestions}
        </Text>
      </View>
      
      <ProgressBar
        progress={progress}
        color="#4CAF50"
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: 'rgba(255,255,255,0.2)',
        }}
      />
    </View>
  );
};

const AdaptiveAssessment: React.FC<AdaptiveAssessmentProps> = ({
  skillId,
  skillName = "Communication",
  onComplete,
  onExit
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const { wp, hp } = useResponsive();
  
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

  const [userResponse, setUserResponse] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);

  // Initialize adaptive session only if no session exists
  useEffect(() => {
    if (!sessionId && !completedSessionId) {
      initializeSession();
    }
  }, []);

  // Clear response field when question changes
  useEffect(() => {
    setUserResponse('');
  }, [currentQuestion]);

  const initializeSession = async () => {
    try {
      setIsInitializing(true);
      console.log('🎯 Initializing adaptive assessment for skill:', skillId);
      
      const sessionData = await startAdaptiveSession(skillId);
      
      showToast('success', 'Assessment Started', `${skillName} assessment initialized`);
      
    } catch (error: any) {
      console.error('❌ Session initialization failed:', error);
      Alert.alert(
        'Assessment Error',
        error.message || 'Failed to start assessment. Please try again.',
        [
          { text: 'Retry', onPress: initializeSession },
          { text: 'Exit', onPress: handleExit }
        ]
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!userResponse.trim()) {
      showToast('error', 'Response Required', 'Please provide your response before continuing.');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      console.log('📝 Submitting response for sequential assessment');
      
      // Submit answer and get next question or results
      const result = await submitAnswerAndGetNext(userResponse.trim());
      
      // Clear response field
      setUserResponse('');
      
      if (result.isComplete || result.completed) {
        // Assessment completed - show completion dialog
        console.log('🎉 Assessment completed! SessionId:', result.sessionId);
        showToast('success', 'Assessment Complete', 'Generating your personalized feedback...');
        
        // Store the completed session ID for results fetching
        setCompletedSessionId(result.sessionId || sessionId);
        
        // Show completion dialog (results will be fetched when user clicks "See Results")
        setShowCompletionDialog(true);
      } else {
        // Got next question
        showToast('success', 'Response Saved', `Question ${result.progress?.currentQuestion || 'unknown'} of ${result.progress?.totalQuestions || 'unknown'}`);
      }
      
    } catch (error: any) {
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

  // Handle dialog actions
  const handleSeeResults = async () => {
    console.log('See Results pressed');
    
    // If we already have results, navigate immediately
    if (assessmentResults) {
      setShowCompletionDialog(false);
      if (onComplete && assessmentResults) {
        onComplete(assessmentResults);
      } else {
        // Clear assessment data now that user is viewing results
        clearAssessmentData();
        setCompletedSessionId(null);
        
        router.push({
          pathname: "/adaptive-results",
          params: {
            results: JSON.stringify(assessmentResults),
            skillName: apiSkillName || skillName,
          }
        });
      }
      return;
    }

    // If no results yet, fetch them with loading spinner
    setIsLoadingResults(true);
    try {
      const targetSessionId = completedSessionId || sessionId;
      console.log('🔍 Fetching assessment results for session:', targetSessionId);
      const response = await apiService.getAdaptiveResults(targetSessionId);
      
      if (response.success) {
        console.log('✅ Assessment results fetched:', response.data);
        setAssessmentResults(response.data);
        setShowCompletionDialog(false);
        
        // Navigate with fetched results
        if (onComplete) {
          onComplete(response.data);
        } else {
          // Clear assessment data now that user is viewing results
          clearAssessmentData();
          setCompletedSessionId(null);
          
          router.push({
            pathname: "/adaptive-results",
            params: {
              results: JSON.stringify(response.data),
              skillName: apiSkillName || skillName,
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
    
    // Clear assessment data now that user is done
    clearAssessmentData();
    setCompletedSessionId(null);
    
    // Navigate to skills selection page
    router.push("/dashboard");
  };

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <AIGenerationLoader 
        message="Initializing adaptive assessment..."
        subMessage={`Preparing ${skillName} evaluation`}
      />
    );
  }

  // Show error state if session failed to start
  if (error && !isAssessmentActive) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
        <StatusBar style="light" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <AntDesign name="exclamationcircle" size={64} color="white" />
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 16 }}>
            Assessment Error
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, textAlign: 'center', marginTop: 8 }}>
            {error}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 24 }}>
            <Button mode="contained" onPress={initializeSession} style={{ marginRight: 12 }}>
              Retry
            </Button>
            <Button mode="outlined" textColor="white" onPress={handleExit}>
              Exit
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
      <StatusBar style="light" />
      
      {/* Header with Progress */}
      <View style={{ 
        paddingHorizontal: 16, 
        paddingTop: 8, 
        paddingBottom: 16,
        backgroundColor: BRAND
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Button
              mode="text"
              onPress={handleExit}
              textColor="white"
              icon="arrow-left"
              compact
            >
              Exit
            </Button>
          </View>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            {apiSkillName || skillName || "Unknown Skill"} Assessment
          </Text>
          <View style={{ width: 80 }} />
        </View>
        
        <ProgressIndicator 
          currentQuestion={safeNumber(progress?.currentQuestion, 1)}
          totalQuestions={safeNumber(progress?.totalQuestions, 4)}
        />
      </View>

      {/* Main Content */}
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.95)", "rgba(255,255,255,1)"]}
          locations={[0, 0.05, 0.15]}
          style={{ flex: 1 }}
        >
          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ padding: 16, paddingTop: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Question Card */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600 }}
            >
              <Surface style={{
                padding: 20,
                borderRadius: 16,
                backgroundColor: 'white',
                elevation: 4,
                marginBottom: 24,
              }}>

                {/* Scenario Only */}
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: 16,
                  lineHeight: 24,
                }}>
                  Scenario:
                </Text>
                <Text style={{
                  fontSize: 15,
                  color: '#666',
                  lineHeight: 22,
                }}>
                  {currentQuestion?.scenario || 'Loading scenario...'}
                </Text>
              </Surface>
            </MotiView>

            {/* Response Input */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 200 }}
            >
              <Surface style={{
                borderRadius: 16,
                backgroundColor: 'white',
                elevation: 4,
                marginBottom: 24,
              }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#333',
                  padding: 20,
                  paddingBottom: 12,
                }}>
                  Your Response:
                </Text>
                
                <TextInput
                  style={{
                    minHeight: 120,
                    paddingHorizontal: 20,
                    paddingBottom: 20,
                    fontSize: 15,
                    color: '#333',
                    textAlignVertical: 'top',
                  }}
                  multiline
                  placeholder="Type your detailed response here..."
                  placeholderTextColor="#999"
                  value={userResponse}
                  onChangeText={setUserResponse}
                  maxLength={2000}
                />
                
                <Text style={{
                  fontSize: 12,
                  color: '#999',
                  textAlign: 'right',
                  paddingHorizontal: 20,
                  paddingBottom: 16,
                }}>
                  {userResponse.length}/2000 characters
                </Text>
              </Surface>
            </MotiView>

            {/* Submit Button */}
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 600, delay: 400 }}
            >
              <View style={{ marginBottom: 32 }}>
                <Button
                  mode="contained"
                  onPress={handleSubmitResponse}
                  loading={loading}
                  disabled={loading || !userResponse.trim()}
                  buttonColor={BRAND}
                  style={{
                    borderRadius: 12,
                    paddingVertical: 6,
                  }}
                  contentStyle={{ paddingVertical: 8 }}
                  labelStyle={{ fontSize: 16, fontWeight: '600' }}
                >
                  {loading ? 'Processing...' : 
                   progress?.currentQuestion === progress?.totalQuestions ? 
                   'Complete Assessment' : 'Submit & Next Question'}
                </Button>
              </View>
            </MotiView>
          </ScrollView>
        </LinearGradient>
      </View>

      {/* Assessment Completion Dialog */}
      <AssessmentCompletionDialog
        visible={showCompletionDialog}
        skillName={apiSkillName || skillName || "Communication"}
        onSeeResults={handleSeeResults}
        onContinueNext={handleContinueNext}
        isLoadingResults={isLoadingResults}
      />
    </SafeAreaView>
  );
};

export default AdaptiveAssessment;