/**
 * Skills Types
 * Type definitions for skills-related data structures
 */

import { Skill } from '../features/skillsSlice';

/**
 * Skill Group - represents a category/group of skills from API
 */
export interface SkillGroup {
  title: string;
  skills: Skill[];
}

/**
 * Skill Tier - represents a skill tier structure
 */
export interface SkillTier {
  key?: string;
  name?: string;
  value?: string;
  order?: number;
}

/**
 * User Skill - represents a skill associated with a user
 */
export interface UserSkill {
  id: string;
  skill: Skill;
  skillId?: string;
  assessmentStatus?: string;
}

