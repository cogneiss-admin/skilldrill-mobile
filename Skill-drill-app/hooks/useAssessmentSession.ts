import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { useToast } from './useToast';

// Constants
const ASSESSMENT_SESSION_KEY = 'adaptive_session_data';

export const useAssessmentSession = () => {
  // State (Updated for sequential flow)
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [progress, setProgress] = useState<any>({ currentQuestion: 1, totalQuestions: 5, currentTier: 'L1' });
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
      setProgress({ currentQuestion: 1, totalQuestions: 5, currentTier: 'L1' });
      setUserResponses([]);
      
      // Legacy compatibility
      setAssessmentId(null);
      setQuestions([]);
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error('❌ Error clearing assessment data:', error);
    }
  }, []);

  // Start new adaptive assessment (Updated for sequential flow)
  const startAdaptiveSession = useCallback(async (skillId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎯 Starting sequential adaptive assessment for skill:', skillId);

      const response = await apiService.startAdaptiveAssessment(skillId);

      if (response.success) {
        console.log('✅ Sequential adaptive assessment started:', response.data);
        
        // Set sequential state
        setSessionId(response.data.sessionId);
        setCurrentQuestion(response.data.question);
        setProgress(response.data.progress || { currentQuestion: 1, totalQuestions: 5, currentTier: 'L1' });
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
          currentQuestion: response.data.question,
          progress: response.data.progress,
          timestamp: Date.now()
        }));

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to start assessment');
      }

    } catch (error: any) {
      console.error('❌ Error starting sequential adaptive assessment:', error);
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
        if (response.data.completed) {
          // Assessment is complete
          console.log('🎉 Sequential assessment completed!');
          await clearAssessmentData();
          return { completed: true, results: response.data.results };
        } else {
          // Got next question
          console.log('✅ Answer submitted, got next question');
          
          // Update state with next question
          setCurrentQuestion(response.data.question);
          setProgress(response.data.progress);
          
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

    console.log(`✅ Saved answer for question ${progress.currentQuestion}/${progress.totalQuestions}`);
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

  // Submit all responses
  const submitAllResponses = useCallback(async () => {
    if (!assessmentId) {
      throw new Error('No active assessment');
    }

    if (userResponses.length !== 5) {
      throw new Error('All 5 questions must be answered before submission');
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Submitting all 5 responses for assessment:', assessmentId);

      const response = await apiService.submitAssessmentResponses(assessmentId, userResponses);

      if (response.success) {
        console.log('🎉 Assessment completed successfully!');
        await clearAssessmentData();
        showToast('success', 'Assessment Complete!', 'Your results are ready.');
        return { completed: true, results: response.data };
      } else {
        throw new Error(response.message || 'Failed to submit assessment');
      }

    } catch (error: any) {
      console.error('❌ Error submitting assessment:', error);
      setError(error.message || 'Failed to submit assessment');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [assessmentId, userResponses, clearAssessmentData, showToast]);

  return {
    // Sequential state (NEW)
    sessionId,
    currentQuestion,
    progress,
    
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
    startAdaptiveSession,
    saveAnswer,
    nextQuestion,
    previousQuestion,
    submitAllResponses,
    clearAssessmentData
  };
};
