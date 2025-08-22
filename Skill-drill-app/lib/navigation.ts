// Lightweight navigation helpers to keep screens clean
// All functions are safe no-ops if a router is not provided
import { Href } from 'expo-router';

export type RouterLike = {
  push: (href: string | { pathname: Href; params?: Record<string, string> }) => void;
  replace?: (href: string | { pathname: Href; params?: Record<string, string> }) => void;
};

export const goToAssessmentIntro = (router?: RouterLike) => {
  router?.push('/assessment-intro' as Href);
};

export const resumeAssessment = (router: RouterLike | undefined, sessionId: string) => {
  if (!router || !sessionId) return;
  router.push({ pathname: '/assessment' as Href, params: { sessionId, resume: 'true' } });
};

export const goToSkillsAddToAssessment = (router?: RouterLike) => {
  router?.push({ pathname: '/auth/skills' as Href, params: { mode: 'add-to-assessment' } });
};

export const goToSkillsForNewAssessment = (router?: RouterLike) => {
  router?.push({ pathname: '/auth/skills' as Href, params: { mode: 'assessment', fromCompleted: 'true' } });
};

export const goToLogin = (router?: RouterLike) => {
  router?.replace?.('/auth/login' as Href);
};


