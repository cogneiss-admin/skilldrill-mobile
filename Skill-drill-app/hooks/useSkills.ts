import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Skill {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category: string;
  tier: string;
  skill_id: string;
  mongo_id?: string;
}

interface UseSkillsReturn {
  skills: Skill[];
  loading: boolean;
  error: string | null;
  refreshSkills: () => Promise<void>;
  getSkillsByTier: (tier: string) => Skill[];
  getSkillsByCategory: (category: string) => Skill[];
  getSkillById: (id: string) => Skill | undefined;
}

const CACHE_KEY = 'skills_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useSkills = (): UseSkillsReturn => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  const loadSkillsFromCache = useCallback(async (): Promise<Skill[] | null> => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid
        if (now - timestamp < CACHE_DURATION) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading skills from cache:', error);
      return null;
    }
  }, []);

  const saveSkillsToCache = useCallback(async (skillsData: Skill[]) => {
    try {
      const cacheData = {
        data: skillsData,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving skills to cache:', error);
    }
  }, []);

  const fetchSkills = useCallback(async (): Promise<Skill[]> => {
    try {
      // Try user-specific endpoint first, fallback to public endpoint
      let response;
      try {
        response = await apiService.get('/user/skills/categories');
      } catch (authError) {
        response = await apiService.get('/skills/categories');
      }
      
      if (response.success) {
        const allSkills: Skill[] = [];
        
        // Transform the API response format
        response.data.forEach((group: any) => {
          if (group.skills && Array.isArray(group.skills)) {
            group.skills.forEach((skill: any) => {
              const skillName = skill.name || skill.skill_name || 'Unknown Skill';
              const icon = skill.icon || 'brain'; // Default icon
              
              const skillData: Skill = {
                id: skill.skill_id, // Use skill_id for selection
                name: skillName,
                description: skill.description,
                icon: icon,
                category: group.title || 'Personal Effectiveness',
                tier: skill.tier || 'TIER_1',
                skill_id: skill.skill_id,
                mongo_id: skill.id // Keep MongoDB id for backend operations
              };
              
              allSkills.push(skillData);
            });
          }
        });
        
        return allSkills;
      } else {
        throw new Error('Failed to fetch skills data');
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      throw error;
    }
  }, []);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to load from cache first
      let skillsData = await loadSkillsFromCache();
      
      if (!skillsData) {
        // If no cache or expired, fetch from API
        skillsData = await fetchSkills();
        // Save to cache
        await saveSkillsToCache(skillsData);
      }

      setSkills(skillsData);
    } catch (error) {
      console.error('Error loading skills:', error);
      setError(error instanceof Error ? error.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  }, [loadSkillsFromCache, fetchSkills, saveSkillsToCache]);

  const refreshSkills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear cache and fetch fresh data
      await AsyncStorage.removeItem(CACHE_KEY);
      const skillsData = await fetchSkills();
      await saveSkillsToCache(skillsData);
      
      setSkills(skillsData);
    } catch (error) {
      console.error('Error refreshing skills:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh skills');
    } finally {
      setLoading(false);
    }
  }, [fetchSkills, saveSkillsToCache]);

  // Utility functions
  const getSkillsByTier = useCallback((tier: string): Skill[] => {
    return skills.filter(skill => skill.tier === tier);
  }, [skills]);

  const getSkillsByCategory = useCallback((category: string): Skill[] => {
    return skills.filter(skill => skill.category === category);
  }, [skills]);

  const getSkillById = useCallback((id: string): Skill | undefined => {
    return skills.find(skill => skill.id === id || skill.skill_id === id || skill.mongo_id === id);
  }, [skills]);

  // Load skills on mount
  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  return {
    skills,
    loading,
    error,
    refreshSkills,
    getSkillsByTier,
    getSkillsByCategory,
    getSkillById
  };
};
