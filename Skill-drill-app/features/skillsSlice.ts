import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../services/api';

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  skill_id: string;
  mongo_id: string;
}

interface SkillsState {
  skills: Skill[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: SkillsState = {
  skills: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

// Async thunk for fetching skills
export const fetchSkills = createAsyncThunk(
  'skills/fetchSkills',
  async (_, { rejectWithValue }) => {
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
                description: skill.description || 'Skill description',
                icon: icon,
                category: group.title || 'Personal Effectiveness',
                tier: skill.tier || 'TIER_1_CORE_SURVIVAL',
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
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch skills');
    }
  }
);

// Async thunk for adding a new skill (for admin panel integration)
export const addSkill = createAsyncThunk(
  'skills/addSkill',
  async (skillData: Omit<Skill, 'id' | 'mongo_id'>, { rejectWithValue }) => {
    try {
      const response = await apiService.post('/admin/skills', skillData);
      
      if (response.success) {
        return {
          ...skillData,
          id: skillData.skill_id,
          mongo_id: response.data.id || skillData.skill_id
        };
      } else {
        throw new Error(response.message || 'Failed to add skill');
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add skill');
    }
  }
);

// Async thunk for updating a skill
export const updateSkill = createAsyncThunk(
  'skills/updateSkill',
  async ({ skillId, updates }: { skillId: string; updates: Partial<Skill> }, { rejectWithValue }) => {
    try {
      const response = await apiService.put(`/admin/skills/${skillId}`, updates);
      
      if (response.success) {
        return { skillId, updates: response.data };
      } else {
        throw new Error(response.message || 'Failed to update skill');
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update skill');
    }
  }
);

// Async thunk for removing a skill
export const removeSkill = createAsyncThunk(
  'skills/removeSkill',
  async (skillId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.delete(`/admin/skills/${skillId}`);
      
      if (response.success) {
        return skillId;
      } else {
        throw new Error(response.message || 'Failed to remove skill');
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove skill');
    }
  }
);

const skillsSlice = createSlice({
  name: 'skills',
  initialState,
  reducers: {
    // Clear skills state
    clearSkills: (state) => {
      state.skills = [];
      state.error = null;
      state.lastUpdated = null;
    },
    
    // Set loading state manually
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Update a skill locally (for optimistic updates)
    updateSkillLocally: (state, action: PayloadAction<{ skillId: string; updates: Partial<Skill> }>) => {
      const { skillId, updates } = action.payload;
      const skillIndex = state.skills.findIndex(skill => skill.id === skillId || skill.skill_id === skillId);
      
      if (skillIndex !== -1) {
        state.skills[skillIndex] = { ...state.skills[skillIndex], ...updates };
      }
    },
    
    // Add a skill locally (for optimistic updates)
    addSkillLocally: (state, action: PayloadAction<Skill>) => {
      state.skills.push(action.payload);
    },
    
    // Remove a skill locally (for optimistic updates)
    removeSkillLocally: (state, action: PayloadAction<string>) => {
      const skillId = action.payload;
      state.skills = state.skills.filter(skill => skill.id !== skillId && skill.skill_id !== skillId);
    },
  },
  extraReducers: (builder) => {
    // Fetch skills
    builder
      .addCase(fetchSkills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSkills.fulfilled, (state, action) => {
        state.loading = false;
        state.skills = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchSkills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Add skill
    builder
      .addCase(addSkill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSkill.fulfilled, (state, action) => {
        state.loading = false;
        state.skills.push(action.payload);
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(addSkill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update skill
    builder
      .addCase(updateSkill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSkill.fulfilled, (state, action) => {
        state.loading = false;
        const { skillId, updates } = action.payload;
        const skillIndex = state.skills.findIndex(skill => skill.id === skillId || skill.skill_id === skillId);
        
        if (skillIndex !== -1) {
          state.skills[skillIndex] = { ...state.skills[skillIndex], ...updates };
        }
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(updateSkill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Remove skill
    builder
      .addCase(removeSkill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeSkill.fulfilled, (state, action) => {
        state.loading = false;
        const skillId = action.payload;
        state.skills = state.skills.filter(skill => skill.id !== skillId && skill.skill_id !== skillId);
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(removeSkill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  clearSkills,
  setLoading,
  clearError,
  updateSkillLocally,
  addSkillLocally,
  removeSkillLocally,
} = skillsSlice.actions;

// Export selectors
export const selectAllSkills = (state: { skills: SkillsState }) => state.skills.skills;
export const selectSkillsLoading = (state: { skills: SkillsState }) => state.skills.loading;
export const selectSkillsError = (state: { skills: SkillsState }) => state.skills.error;
export const selectSkillsLastUpdated = (state: { skills: SkillsState }) => state.skills.lastUpdated;

// Utility selectors
export const selectSkillsByTier = (state: { skills: SkillsState }, tier: string) => 
  state.skills.skills.filter(skill => skill.tier === tier);

export const selectSkillsByCategory = (state: { skills: SkillsState }, category: string) => 
  state.skills.skills.filter(skill => skill.category === category);

export const selectSkillById = (state: { skills: SkillsState }, id: string) => 
  state.skills.skills.find(skill => skill.id === id || skill.skill_id === id || skill.mongo_id === id);

export default skillsSlice.reducer;
