import { Skill } from '../hooks/useSkillsData';

export interface SkillGroup {
  title: string;
  skills: Skill[];
}

export interface SkillTier {
  key?: string;
  name?: string;
  value?: string;
  order?: number;
}

export interface UserSkill {
  id: string;
  skill: Skill;
  skillId?: string;
  assessmentStatus?: string;
}
