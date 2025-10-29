import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { useToast } from './useToast';
import { AssessmentProgress } from '../types/assessment';
import { calculateAssessmentProgress, normalizeProgressData } from '../utils/assessmentUtils';

// Constants
const ASSESSMENT_SESSION_KEY = 'assessment_session_data';

export const useAssessmentSession = () => {
  // State (Updated for sequential flow)
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [progress, setProgress] = useState<AssessmentProgress | null>(null);
  const [skillName, setSkillName] = useState<string | null>(null);
  const [userResponses, setUserResponses] = useState<Array<{
    questionId: string;
    answer: string;
    timeTaken?: number;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAssessmentActive, setIsAssessmentActive] = useState(false);

  const { showToast } = useToast();
  
  // Legacy compatibility - for components that still expect these
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Clear assessment data
  const clearAssessmentData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ASSESSMENT_SESSION_KEY);
      setIsAssessmentActive(false);
      setSessionId(null);
      setCurrentQuestion(null);
      setProgress(null);
      setSkillName(null);
      setUserResponses([]);
      
      // Legacy compatibility
      setAssessmentId(null);
      setQuestions([]);
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error('❌ Error clearing assessment data:', error);
    }
  }, []);

  // Start new assessment (Updated for sequential flow)
  const startAssessmentSession = useCallback(async (skillId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎯 Starting assessment for skill:', skillId);

      const response = await apiService.startAssessment(skillId);

      if (response.success) {
        console.log('✅ Assessment started:', response.data);
        
        // Set sequential state
        setSessionId(response.data.sessionId);
        setCurrentQuestion(response.data.question);
        setProgress(normalizeProgressData(response.data.progress) || 
                   calculateAssessmentProgress(0, response.data.totalQuestions || 1));
        setSkillName(response.data.skillName);
        setIsAssessmentActive(true);
        
        // Legacy compatibility - set these for components that expect them
        setAssessmentId(response.data.sessionId); // Use sessionId as assessmentId for compatibility
        setQuestions([response.data.question]); // Set as array with single question
        setCurrentQuestionIndex(0);
        setUserResponses([]);

        // Save session data for persistence
        await AsyncStorage.setItem(ASSESSMENT_SESSION_KEY, JSON.stringify({
          sessionId: response.data.sessionId,
          skillId: skillId,
          skillName: response.data.skillName,
          currentQuestion: response.data.question,
          progress: response.data.progress,
          timestamp: Date.now()
        }));

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to start assessment');
      }

    } catch (error: any) {
      console.error('❌ Error starting assessment:', error);
      setError(error.message || 'Failed to start assessment');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit answer and get next question (Sequential)
  const submitAnswerAndGetNext = useCallback(async (answer: string) => {
    if (!sessionId) {
      throw new Error('No active session');
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📝 Submitting answer for sequential assessment');

      const response = await apiService.submitAnswerAndGetNext(sessionId, answer.trim());

      if (response.success) {
        if (response.data.isComplete) {
          // Assessment is complete
          console.log('🎉 Sequential assessment completed!');
          // Don't clear data yet - we need sessionId for results fetching
          return { completed: true, isComplete: true, sessionId: response.data.sessionId };
        } else {
          // Got next question
          console.log('✅ Answer submitted, got next question');
          
          // Update state with next question
          setCurrentQuestion(response.data.question);
          setProgress(normalizeProgressData(response.data.progress));
          
          // Legacy compatibility - update questions array
          setQuestions(prev => [...prev, response.data.question]);
          setCurrentQuestionIndex(prev => prev + 1);
          
          return { completed: false, question: response.data.question, progress: response.data.progress };
        }
      } else {
        throw new Error(response.message || 'Failed to submit answer');
      }

    } catch (error: any) {
      console.error('❌ Error submitting answer:', error);
      setError(error.message || 'Failed to submit answer');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [sessionId, clearAssessmentData]);

  // Save answer for current question (Legacy compatibility)
  const saveAnswer = useCallback((answer: string, timeTaken?: number) => {
    if (!currentQuestion) {
      throw new Error('No current question');
    }

    if (!progress) {
      throw new Error('No progress data available');
    }

    const newResponse = {
      questionId: currentQuestion.id || `q_${progress.currentQuestion}`,
      answer: answer.trim(),
      timeTaken: timeTaken
    };

    // Update or add response for current question
    setUserResponses(prev => {
      const existing = prev.findIndex(r => r.questionId === newResponse.questionId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newResponse;
        return updated;
      } else {
        return [...prev, newResponse];
      }
    });

    console.log(`✅ Saved answer for question ${progress?.currentQuestion || 'unknown'}/${progress?.totalQuestions || 'unknown'}`);
  }, [currentQuestion, progress]);

  // Move to next question
  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      return true;
    }
    return false; // No more questions
  }, [currentQuestionIndex, questions.length]);

  // Move to previous question
  const previousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      return true;
    }
    return false; // Already at first question
  }, [currentQuestionIndex]);


  return {
    // Sequential state (NEW)
    sessionId,
    currentQuestion,
    progress,
    skillName,
    
    // Sequential actions (NEW)
    submitAnswerAndGetNext,
    
    // Legacy state (for compatibility)
    assessmentId,
    questions,
    currentQuestionIndex,
    userResponses,
    loading,
    error,
    isAssessmentActive,

    // Actions
    startAssessmentSession,
    startAdaptiveSession: startAssessmentSession, // Legacy alias for backward compatibility
    saveAnswer,
    nextQuestion,
    previousQuestion,
    clearAssessmentData
  };
};
