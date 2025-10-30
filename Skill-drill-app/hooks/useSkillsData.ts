// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import authService from '../services/authService';

export function useSkillsData(params: {
  isAssessmentMode: boolean;
  isAddToAssessmentMode: boolean;
}) {
  const { isAssessmentMode, isAddToAssessmentMode } = params;

  const [skillsData, setSkillsData] = useState<any[]>([]);
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
        try {
          console.log('🧩 /skills/categories success:', {
            groups: Array.isArray(response.data) ? response.data.length : 'n/a',
            sampleGroup: Array.isArray(response.data) && response.data[0]?.title,
          });
        } catch {}
        const allSkills: any[] = [];
        response.data.forEach((group: any) => {
          if (group.skills && Array.isArray(group.skills)) {
            group.skills.forEach((skill: any) => {
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
          console.log('🧩 Flattened skills:', { count: allSkills.length, tierKeys: keys });
        } catch {}
      } else {
        setError('Failed to load skills');
      }
    } catch (e) {
      try { console.error('❌ /skills/categories error:', e?.response?.status, e?.response?.data || e?.message); } catch {}
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
        const careerLevelId = (user as any)?.careerLevelId || (user as any)?.careerLevel?.id;
        try { console.log('🎯 Eligible fetch: user careerLevelId:', careerLevelId); } catch {}
        if (!careerLevelId) return;
        const resp = await apiService.get(`/skills/career-level/${careerLevelId}/categories`);
        if (resp.success) {
          const ids = new Set<string>();
          (resp.data || []).forEach((group: any) => {
            if (group?.skills && Array.isArray(group.skills)) {
              group.skills.forEach((s: any) => {
                if (s?.id) ids.add(s.id);
                if (s?.mongoId) ids.add(s.mongoId);
              });
            }
          });
          setEligibleSet(ids);
          try { console.log('🎯 Eligible set ready:', { count: ids.size }); } catch {}
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
            const currentSkillIds = response.data.map((userSkill: any) => userSkill.skill?.id || userSkill.id);
            setSelected(currentSkillIds);
          }
        } catch {}
      })();
    }
  }, [skillsData, isAddToAssessmentMode]);

  // Restore persisted selection for assessment mode
  useEffect(() => {
    if (skillsData.length > 0 && isAssessmentMode && !isAddToAssessmentMode) {
      AsyncStorage.getItem('selectedSkills')
        .then((persisted) => {
          if (persisted) {
            try {
              const parsed = JSON.parse(persisted);
              const validSelections = parsed.filter((id: any) => skillsData.some((s) => s.id === id));
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
        AsyncStorage.setItem('selectedSkills', JSON.stringify(next)).catch(() => {});
      }
      return next;
    });
  }, [isAddToAssessmentMode]);

  // Group by tier memo
  const skillsByTier = useMemo(() => {
    const groups: Record<string, any[]> = {};
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


