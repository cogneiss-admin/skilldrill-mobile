/*
  Centralized assessment status hook
  - Computes completion from session and userSkills
  - Exposes primary CTA label and handler
  - Indicates whether secondary CTA (Add More Skills) should show
*/
import { useMemo, useCallback } from 'react';
import { Href, useRouter } from 'expo-router';

import { AssessmentStatus } from '../types/assessment';

export type UserSkillLite = {
  assessmentStatus?: AssessmentStatus | 'NOT_STARTED' | string;
  currentScore?: number | null;
  // Keep it lite to avoid tight coupling; callers can pass richer objects
};

export type ActiveSessionLite = {
  sessionId?: string;
  completed?: boolean;
  progress?: { status?: string } | null;
};

export type UseAssessmentStatusArgs = {
  userSkills: UserSkillLite[];
  activeSession: ActiveSessionLite | null;
  // navigation + notifications (optional; hook can still compute labels without them)
  router?: ReturnType<typeof useRouter>;
  showToast?: (type: 'info' | 'success' | 'error', title: string, desc?: string) => void;
  // Optional delegates to keep existing screen handlers
  onStart?: () => void; // start new or open intro
  onResume?: (sessionId: string) => void;
  onAddSkills?: (mode?: 'assessment' | 'add-to-assessment') => void;
};

export type UseAssessmentStatusResult = {
  isCompleted: boolean;
  hasActiveSession: boolean;
  primaryLabel: 'Start Assessment' | 'Resume Assessment';
  onPrimaryPress: () => void;
  showSecondaryAddSkills: boolean;
  onSecondaryPress: () => void;
};

export function useAssessmentStatus(args: UseAssessmentStatusArgs): UseAssessmentStatusResult {
  const { userSkills, activeSession, router, showToast, onStart, onResume, onAddSkills } = args;

  const allSkillsCompleted = useMemo(() => {
    return userSkills.length > 0 && userSkills.every(s => s.assessmentStatus === AssessmentStatus.COMPLETED);
  }, [userSkills]);

  const sessionCompleted = useMemo(() => {
    if (!activeSession) return false;
    return Boolean(activeSession.completed) || activeSession.progress?.status === 'COMPLETED';
  }, [activeSession]);

  const isCompleted = useMemo(() => {
    // Completed if session says completed OR all user skills completed
    return sessionCompleted || allSkillsCompleted;
  }, [sessionCompleted, allSkillsCompleted]);

  const hasActiveSession = useMemo(() => {
    return Boolean(activeSession?.sessionId) && !isCompleted;
  }, [activeSession?.sessionId, isCompleted]);

  const primaryLabel: 'Start Assessment' | 'Resume Assessment' = hasActiveSession ? 'Resume Assessment' : 'Start Assessment';

  const onPrimaryPress = useCallback(() => {
    if (hasActiveSession && activeSession?.sessionId) {
      if (onResume) return onResume(activeSession.sessionId);
      // Fallback navigation if delegate not provided
      router?.push({ pathname: '/assessment' as Href, params: { sessionId: activeSession.sessionId, resume: 'true' } });
      return;
    }
    // Completed or no session → start flow
    if (isCompleted) {
      // If completed, guide user to add skills for new assessment
      if (showToast) showToast('info', 'Free Assessments Used', 'Add more skills to start a new assessment.');
      if (onAddSkills) return onAddSkills('assessment');
      router?.push({ pathname: '/auth/skills' as Href, params: { mode: 'assessment', fromCompleted: 'true' } });
      return;
    }
    // No session and not completed → regular start
    if (onStart) return onStart();
    router?.push('/adaptive-assessment' as Href);
  }, [hasActiveSession, activeSession?.sessionId, isCompleted, onResume, router, onAddSkills, onStart, showToast]);

  const showSecondaryAddSkills = useMemo(() => {
    // Show "Add More Skills" only while an assessment is in progress
    return hasActiveSession && !isCompleted;
  }, [hasActiveSession, isCompleted]);

  const onSecondaryPress = useCallback(() => {
    if (hasActiveSession) {
      if (onAddSkills) return onAddSkills('add-to-assessment');
      router?.push({ pathname: '/auth/skills' as Href, params: { mode: 'add-to-assessment' } });
      return;
    }
    // If completed, same as primary path to add skills for a new assessment
    if (onAddSkills) return onAddSkills(isCompleted ? 'assessment' : 'add-to-assessment');
    router?.push({ pathname: '/auth/skills' as Href, params: { mode: isCompleted ? 'assessment' : 'add-to-assessment' } });
  }, [hasActiveSession, isCompleted, onAddSkills, router]);

  return {
    isCompleted,
    hasActiveSession,
    primaryLabel,
    onPrimaryPress,
    showSecondaryAddSkills,
    onSecondaryPress,
  };
}
