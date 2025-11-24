import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

// Redux hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Custom hooks - export all for easier imports
export { useAuth } from './useAuth';
export { useAssessmentSession } from './useAssessmentSession';
export { useDrillProgress } from './useDrillProgress';
export { useSocialAuth } from './useSocialAuth';
export { usePayment } from './usePayment';
export { useSubscription } from './useSubscription';
export { useToast } from './useToast';
export { useAnimation } from './useAnimation';
export { useCountries } from './useCountries';
export { useSkillsData } from './useSkillsData';