import { useCallback, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiService } from '../services/api';
import authService from '../services/authService';
import { Skill } from '../features/skillsSlice';
import { SkillGroup } from '../types/skills';
import { User } from '../services/api';

const SELECTED_SKILLS_KEY = 'selectedSkills';

export function useSkillsData(params: {
  isAssessmentMode: boolean;
  isAddToAssessmentMode: boolean;
}) {
  const { isAssessmentMode, isAddToAssessmentMode } = params;

  const [skillsData, setSkillsData] = useState<Skill[]>([]);
  const [selected, setSelected] = useState<Array<string | number>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eligibleSet, setEligibleSet] = useState<Set<string>>(new Set());

  const canContinue = useMemo(() => selected.length > 0, [selected]);


  const loadSkills = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiService.get('/skills/categories');
      if (response.success) {
        const allSkills: Skill[] = [];
        response.data.forEach((group: SkillGroup) => {
          if (group.skills && Array.isArray(group.skills)) {
            group.skills.forEach((skill: Skill) => {
              allSkills.push({
                id: skill.id,
                name: skill.name,
                description: skill.description,
                category: skill.category,
                skillTierId: skill.skillTierId,
                skillTier: skill.skillTier,
                tier: skill.tier,
                mongoId: skill.mongoId,
              });
            });
          }
        });
        setSkillsData(allSkills);
        try {
          const keys = Array.from(new Set(allSkills.map(s => s?.skillTier?.key).filter(Boolean)));
        } catch {}
      } else {
        setError('Failed to load skills');
      }
    } catch (e) {
      try {  } catch {}
      setError('Failed to load skills. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  // Load eligible skills for the user's career level
  useEffect(() => {
    (async () => {
      try {
        const user = await authService.getUserData();
        const careerLevelId = user?.careerLevelId || user?.careerLevel?.id;
        try {  } catch {}
        if (!careerLevelId) return;
        const resp = await apiService.get(`/skills/career-level/${careerLevelId}/categories`);
        if (resp.success) {
          const ids = new Set<string>();
          (resp.data || []).forEach((group: SkillGroup) => {
            if (group?.skills && Array.isArray(group.skills)) {
              group.skills.forEach((s: Skill) => {
                // Add both id and mongoId as strings to handle different formats
                if (s?.id) {
                  ids.add(String(s.id));
                  ids.add(s.id); // Also add as-is in case it's already a string
                }
                if (s?.mongoId) {
                  ids.add(String(s.mongoId));
                  ids.add(s.mongoId);
                }
                // Also check for skillId field (some API responses might use this)
                if (s?.skillId) {
                  ids.add(String(s.skillId));
                  ids.add(s.skillId);
                }
              });
            }
          });
          setEligibleSet(ids);
        }
      } catch {}
    })();
  }, []);

  // Load user's current skills for add-to-assessment
  useEffect(() => {
    if (skillsData.length > 0 && isAddToAssessmentMode) {
      (async () => {
        try {
          const response = await apiService.get('/user/skills');
          if (response.success && response.data?.length > 0) {
            const currentSkillIds = response.data.map((userSkill: { skill?: { id: string }; id?: string }) => userSkill.skill?.id || userSkill.id);
            setSelected(currentSkillIds);
          }
        } catch {}
      })();
    }
  }, [skillsData, isAddToAssessmentMode]);

  // Restore persisted selection for assessment mode
  useEffect(() => {
    if (skillsData.length > 0 && isAssessmentMode && !isAddToAssessmentMode) {
      SecureStore.getItemAsync(SELECTED_SKILLS_KEY)
        .then((persisted) => {
          if (persisted) {
            try {
              const parsed = JSON.parse(persisted);
              const validSelections = parsed.filter((id: string | number) => skillsData.some((s) => s.id === id));
              setSelected(validSelections);
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, [skillsData, isAssessmentMode, isAddToAssessmentMode]);

  const toggleSkill = useCallback((skillId: string | number) => {
    setSelected((prev) => {
      const has = prev.includes(skillId);
      const next = has ? prev.filter((s) => s !== skillId) : [...prev, skillId];
      if (!isAddToAssessmentMode) {
        SecureStore.setItemAsync(SELECTED_SKILLS_KEY, JSON.stringify(next)).catch(() => {});
      }
      return next;
    });
  }, [isAddToAssessmentMode]);

  // Group by tier memo
  const skillsByTier = useMemo(() => {
    const groups: Record<string, Skill[]> = {};
    for (const skill of skillsData) {
      // Use skillTier data for grouping; fall back to 'default'
      const tierKey = (skill.skillTier && skill.skillTier.key) ? skill.skillTier.key : 'default';
      (groups[tierKey] ||= []).push({ ...skill });
    }
    return groups;
  }, [skillsData]);

  return {
    skillsData,
    skillsByTier,
    selected,
    loading,
    error,
    canContinue,
    setSelected,
    setSkillsData,
    setError,
    toggleSkill,
    eligibleSet,
  };
}

export default useSkillsData;


