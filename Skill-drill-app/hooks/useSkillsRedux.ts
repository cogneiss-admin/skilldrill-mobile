import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  fetchSkills,
  addSkill,
  updateSkill,
  removeSkill,
  selectAllSkills,
  selectSkillsLoading,
  selectSkillsError,
  selectSkillsLastUpdated,
  selectSkillsByTier,
  selectSkillsByCategory,
  selectSkillById,
  clearSkills,
  clearError,
  updateSkillLocally,
  addSkillLocally,
  removeSkillLocally,
  Skill
} from '../features/skillsSlice';

export const useSkillsRedux = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Selectors
  const skills = useSelector(selectAllSkills);
  const loading = useSelector(selectSkillsLoading);
  const error = useSelector(selectSkillsError);
  const lastUpdated = useSelector(selectSkillsLastUpdated);

  // Actions
  const refreshSkills = useCallback(async () => {
    await dispatch(fetchSkills());
  }, [dispatch]);

  const addNewSkill = useCallback(async (skillData: Omit<Skill, 'id' | 'mongo_id'>) => {
    return await dispatch(addSkill(skillData));
  }, [dispatch]);

  const updateExistingSkill = useCallback(async (skillId: string, updates: Partial<Skill>) => {
    return await dispatch(updateSkill({ skillId, updates }));
  }, [dispatch]);

  const removeExistingSkill = useCallback(async (skillId: string) => {
    return await dispatch(removeSkill(skillId));
  }, [dispatch]);

  const clearSkillsData = useCallback(() => {
    dispatch(clearSkills());
  }, [dispatch]);

  const clearErrorState = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Optimistic updates
  const updateSkillOptimistically = useCallback((skillId: string, updates: Partial<Skill>) => {
    dispatch(updateSkillLocally({ skillId, updates }));
  }, [dispatch]);

  const addSkillOptimistically = useCallback((skill: Skill) => {
    dispatch(addSkillLocally(skill));
  }, [dispatch]);

  const removeSkillOptimistically = useCallback((skillId: string) => {
    dispatch(removeSkillLocally(skillId));
  }, [dispatch]);

  // Utility functions
  const getSkillsByTier = useCallback((tier: string): Skill[] => {
    return useSelector((state: RootState) => selectSkillsByTier(state, tier));
  }, []);

  const getSkillsByCategory = useCallback((category: string): Skill[] => {
    return useSelector((state: RootState) => selectSkillsByCategory(state, category));
  }, []);

  const getSkillById = useCallback((id: string): Skill | undefined => {
    return useSelector((state: RootState) => selectSkillById(state, id));
  }, []);

  // Load skills on mount if not already loaded
  useEffect(() => {
    if (skills.length === 0 && !loading) {
      refreshSkills();
    }
  }, [skills.length, loading, refreshSkills]);

  return {
    // State
    skills,
    loading,
    error,
    lastUpdated,
    
    // Actions
    refreshSkills,
    addSkill: addNewSkill,
    updateSkill: updateExistingSkill,
    removeSkill: removeExistingSkill,
    clearSkills: clearSkillsData,
    clearError: clearErrorState,
    
    // Optimistic updates
    updateSkillOptimistically,
    addSkillOptimistically,
    removeSkillOptimistically,
    
    // Utility functions (these need to be called with current state)
    getSkillsByTier: (tier: string) => getSkillsByTier(tier),
    getSkillsByCategory: (category: string) => getSkillsByCategory(category),
    getSkillById: (id: string) => getSkillById(id),
  };
};

// Hook for getting skills by tier with current state
export const useSkillsByTier = (tier: string) => {
  return useSelector((state: RootState) => selectSkillsByTier(state, tier));
};

// Hook for getting skills by category with current state
export const useSkillsByCategory = (category: string) => {
  return useSelector((state: RootState) => selectSkillsByCategory(state, category));
};

// Hook for getting a specific skill by ID with current state
export const useSkillById = (id: string) => {
  return useSelector((state: RootState) => selectSkillById(state, id));
};
