import { useReducer, useCallback } from 'react';
import { apiService } from '../services/api';
import { AssessmentProgress, AssessmentScenario } from '../types/assessment';

interface UserResponse {
  questionId: string;
  answer: string;
  timeTaken?: number;
}

interface AssessmentState {
  sessionId: string | null;
  currentQuestion: any;
  progress: AssessmentProgress | null;
  skillName: string | null;
  userResponses: UserResponse[];
  loading: boolean;
  error: string | null;
  isAssessmentActive: boolean;
  assessmentId: string | null;
  questions: AssessmentScenario[];
  currentQuestionIndex: number;
}

type AssessmentAction =
  | { type: 'START_LOADING' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SESSION_STARTED'; payload: { sessionId: string; question: any; progress: AssessmentProgress; skillName: string } }
  | { type: 'SESSION_RESUMED'; payload: { sessionId: string; question: any; progress: AssessmentProgress; skillName: string } }
  | { type: 'NEXT_QUESTION'; payload: { question: any; progress: AssessmentProgress } }
  | { type: 'SAVE_ANSWER'; payload: UserResponse }
  | { type: 'MOVE_TO_QUESTION'; payload: number }
  | { type: 'CLEAR_SESSION' }
  | { type: 'STOP_LOADING' };

const initialState: AssessmentState = {
  sessionId: null,
  currentQuestion: null,
  progress: null,
  skillName: null,
  userResponses: [],
  loading: false,
  error: null,
  isAssessmentActive: false,
  assessmentId: null,
  questions: [],
  currentQuestionIndex: 0,
};

function assessmentReducer(state: AssessmentState, action: AssessmentAction): AssessmentState {
  switch (action.type) {
    case 'START_LOADING':
      return { ...state, loading: true, error: null };

    case 'STOP_LOADING':
      return { ...state, loading: false };

    case 'SET_ERROR':
      return { ...state, loading: false, error: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SESSION_STARTED':
    case 'SESSION_RESUMED':
      return {
        ...state,
        loading: false,
        sessionId: action.payload.sessionId,
        currentQuestion: action.payload.question,
        progress: action.payload.progress,
        skillName: action.payload.skillName,
        isAssessmentActive: true,
        assessmentId: action.payload.sessionId,
        questions: action.payload.question ? [action.payload.question] : [],
        currentQuestionIndex: 0,
        userResponses: [],
      };

    case 'NEXT_QUESTION':
      return {
        ...state,
        loading: false,
        currentQuestion: action.payload.question,
        progress: action.payload.progress,
        questions: [...state.questions, action.payload.question],
        currentQuestionIndex: state.currentQuestionIndex + 1,
      };

    case 'SAVE_ANSWER': {
      const existingIndex = state.userResponses.findIndex(
        r => r.questionId === action.payload.questionId
      );
      const newResponses = existingIndex >= 0
        ? state.userResponses.map((r, i) => i === existingIndex ? action.payload : r)
        : [...state.userResponses, action.payload];
      return { ...state, userResponses: newResponses };
    }

    case 'MOVE_TO_QUESTION':
      return { ...state, currentQuestionIndex: action.payload };

    case 'CLEAR_SESSION':
      return initialState;

    default:
      return state;
  }
}

export const useAssessmentSession = () => {
  const [state, dispatch] = useReducer(assessmentReducer, initialState);

  const clearAssessmentData = useCallback(async () => {
    dispatch({ type: 'CLEAR_SESSION' });
  }, []);

  const loadSessionFromStorage = useCallback(async (skillId: string) => {
    try {
      const response = await apiService.resumeAssessment(skillId);

      if (response.success && response.data) {
        dispatch({
          type: 'SESSION_RESUMED',
          payload: {
            sessionId: response.data.sessionId,
            question: response.data.question,
            progress: response.data.progress,
            skillName: response.data.skillName,
          },
        });
        return response.data;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const startAssessmentSession = useCallback(async (skillId: string) => {
    try {
      dispatch({ type: 'START_LOADING' });

      const response = await apiService.startAssessment(skillId);

      if (response.success) {
        dispatch({
          type: 'SESSION_STARTED',
          payload: {
            sessionId: response.data.sessionId,
            question: response.data.question,
            progress: response.data.progress,
            skillName: response.data.skillName,
          },
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to start assessment');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start assessment';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const submitAnswerAndGetNext = useCallback(async (answer: string) => {
    if (!state.sessionId) {
      throw new Error('No active session');
    }

    try {
      dispatch({ type: 'START_LOADING' });

      const response = await apiService.submitAnswerAndGetNext(state.sessionId, answer.trim());

      if (response.success) {
        if (response.data.isComplete) {
          dispatch({ type: 'STOP_LOADING' });
          return { completed: true, isComplete: true, sessionId: response.data.sessionId };
        } else {
          dispatch({
            type: 'NEXT_QUESTION',
            payload: {
              question: response.data.question,
              progress: response.data.progress,
            },
          });
          return { completed: false, question: response.data.question, progress: response.data.progress };
        }
      } else {
        throw new Error(response.message || 'Failed to submit answer');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit answer';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.sessionId]);

  const saveAnswer = useCallback((answer: string, timeTaken?: number) => {
    if (!state.currentQuestion) {
      throw new Error('No current question');
    }
    if (!state.progress) {
      throw new Error('No progress data available');
    }

    dispatch({
      type: 'SAVE_ANSWER',
      payload: {
        questionId: state.currentQuestion.id || `q_${state.progress.currentQuestion}`,
        answer: answer.trim(),
        timeTaken,
      },
    });
  }, [state.currentQuestion, state.progress]);

  const nextQuestion = useCallback(() => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      dispatch({ type: 'MOVE_TO_QUESTION', payload: state.currentQuestionIndex + 1 });
      return true;
    }
    return false;
  }, [state.currentQuestionIndex, state.questions.length]);

  const previousQuestion = useCallback(() => {
    if (state.currentQuestionIndex > 0) {
      dispatch({ type: 'MOVE_TO_QUESTION', payload: state.currentQuestionIndex - 1 });
      return true;
    }
    return false;
  }, [state.currentQuestionIndex]);

  return {
    sessionId: state.sessionId,
    currentQuestion: state.currentQuestion,
    progress: state.progress,
    skillName: state.skillName,
    submitAnswerAndGetNext,
    assessmentId: state.assessmentId,
    questions: state.questions,
    currentQuestionIndex: state.currentQuestionIndex,
    userResponses: state.userResponses,
    loading: state.loading,
    error: state.error,
    isAssessmentActive: state.isAssessmentActive,
    startAssessmentSession,
    loadSessionFromStorage,
    saveAnswer,
    nextQuestion,
    previousQuestion,
    clearAssessmentData,
  };
};
