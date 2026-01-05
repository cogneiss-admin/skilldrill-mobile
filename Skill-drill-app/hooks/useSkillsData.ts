import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiService } from '../services/api';
import authService from '../services/authService';
import { SkillGroup } from '../types/skills';

const SELECTED_SKILLS_KEY = 'selectedSkills';

export interface Skill {
  id: string;
  mongoId?: string;
  name: string;
  description?: string;
  category?: string;
  tier?: string;
  skillTier?: {
    id: string;
    key: string;
    name: string;
    order?: number;
  };
}

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

  const initialSelectionLoaded = useRef(false);

  const canContinue = useMemo(() => selected.length > 0, [selected]);

  useEffect(() => {
    let cancelled = false;

    async function loadAllData() {
      try {
        setLoading(true);
        setError("");

        const [skillsResponse, userResponse, eligibleResponse] = await Promise.all([
          apiService.get('/user/skills/categories').catch(() => apiService.get('/skills/categories')),
          authService.getUserData(),
          null,
        ]);

        if (cancelled) return;

        if (skillsResponse.success && skillsResponse.data) {
          const allSkills: Skill[] = [];
          skillsResponse.data.forEach((group: { title?: string; skills?: Skill[] }) => {
            if (group.skills && Array.isArray(group.skills)) {
              group.skills.forEach((skill) => {
                allSkills.push({
                  id: skill.id,
                  name: skill.name,
                  description: skill.description,
                  category: group.title,
                  tier: skill.tier,
                  skillTier: skill.skillTier,
                  mongoId: skill.id,
                });
              });
            }
          });
          setSkillsData(allSkills);

          const careerLevelId = userResponse?.careerLevelId || userResponse?.careerLevel?.id;
          if (careerLevelId) {
            try {
              const resp = await apiService.get(`/skills/career-level/${careerLevelId}/categories`);
              if (!cancelled && resp.success) {
                const ids = new Set<string>();
                (resp.data || []).forEach((group: SkillGroup) => {
                  if (group?.skills && Array.isArray(group.skills)) {
                    group.skills.forEach((s: Skill) => {
                      if (s?.id) {
                        ids.add(String(s.id));
                        ids.add(s.id);
                      }
                      if (s?.mongoId) {
                        ids.add(String(s.mongoId));
                        ids.add(s.mongoId);
                      }
                    });
                  }
                });
                setEligibleSet(ids);
              }
            } catch {}
          }

          if (!initialSelectionLoaded.current) {
            initialSelectionLoaded.current = true;

            if (isAddToAssessmentMode) {
              try {
                const response = await apiService.get('/user/skills');
                if (!cancelled && response.success && response.data?.length > 0) {
                  const currentSkillIds = response.data.map(
                    (userSkill: { skill?: { id: string }; id?: string }) =>
                      userSkill.skill?.id || userSkill.id
                  );
                  setSelected(currentSkillIds);
                }
              } catch {}
            } else if (isAssessmentMode) {
              try {
                const persisted = await SecureStore.getItemAsync(SELECTED_SKILLS_KEY);
                if (!cancelled && persisted) {
                  const parsed = JSON.parse(persisted);
                  const validSelections = parsed.filter(
                    (id: string | number) => allSkills.some((s) => s.id === id)
                  );
                  setSelected(validSelections);
                }
              } catch {}
            }
          }
        } else {
          setError(skillsResponse.message || 'Failed to load skills');
        }
      } catch (e) {
        if (!cancelled) {
          setError('Failed to load skills. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAllData();

    return () => {
      cancelled = true;
    };
  }, [isAssessmentMode, isAddToAssessmentMode]);

  const toggleSkill = useCallback(
    (skillId: string | number) => {
      setSelected((prev) => {
        const has = prev.includes(skillId);
        const next = has ? prev.filter((s) => s !== skillId) : [...prev, skillId];
        if (!isAddToAssessmentMode) {
          SecureStore.setItemAsync(SELECTED_SKILLS_KEY, JSON.stringify(next)).catch(() => {});
        }
        return next;
      });
    },
    [isAddToAssessmentMode]
  );

  const skillsByTier = useMemo(() => {
    const groups: Record<string, Skill[]> = {};
    for (const skill of skillsData) {
      const tierKey = skill.skillTier?.key || skill.tier || 'default';
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
