import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSkillsRedux, useSkillsByTier } from '../hooks/useSkillsRedux';
import { useToast } from '../hooks/useToast';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Example component showing how to use Redux skills management
export const SkillsManager = () => {
  const { 
    skills, 
    loading, 
    error, 
    refreshSkills, 
    addSkill, 
    updateSkill, 
    removeSkill,
    addSkillOptimistically,
    removeSkillOptimistically 
  } = useSkillsRedux();
  
  const { showToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  // Get skills by tier using the specialized hook
  const tier1Skills = useSkillsByTier('TIER_1_CORE_SURVIVAL');
  const tier2Skills = useSkillsByTier('TIER_2_PROGRESSION');
  const tier3Skills = useSkillsByTier('TIER_3_EXECUTIVE');

  const handleRefresh = async () => {
    try {
      await refreshSkills();
      showToast('success', 'Skills Updated', 'Skills data has been refreshed');
    } catch (error) {
      showToast('error', 'Refresh Failed', 'Failed to refresh skills data');
    }
  };

  const handleAddSkill = async () => {
    setIsAdding(true);
    try {
      const newSkill = {
        name: 'New Test Skill',
        description: 'A test skill for demonstration',
        icon: 'star',
        category: 'Personal Effectiveness',
        tier: 'TIER_1_CORE_SURVIVAL',
        skill_id: `SK${Date.now()}`, // Generate unique ID
      };

      // Optimistic update - add immediately to UI
      addSkillOptimistically({
        ...newSkill,
        id: newSkill.skill_id,
        mongo_id: newSkill.skill_id
      });

      // Actual API call
      const result = await addSkill(newSkill);
      
      if (result.meta.requestStatus === 'fulfilled') {
        showToast('success', 'Skill Added', 'New skill has been added successfully');
      } else {
        // Revert optimistic update on failure
        showToast('error', 'Add Failed', 'Failed to add skill');
      }
    } catch (error) {
      showToast('error', 'Add Failed', 'Failed to add skill');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateSkill = async (skillId: string) => {
    try {
      const updates = {
        name: 'Updated Skill Name',
        description: 'This skill has been updated'
      };

      const result = await updateSkill(skillId, updates);
      
      if (result.meta.requestStatus === 'fulfilled') {
        showToast('success', 'Skill Updated', 'Skill has been updated successfully');
      } else {
        showToast('error', 'Update Failed', 'Failed to update skill');
      }
    } catch (error) {
      showToast('error', 'Update Failed', 'Failed to update skill');
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    Alert.alert(
      'Remove Skill',
      'Are you sure you want to remove this skill?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistic update - remove immediately from UI
              removeSkillOptimistically(skillId);

              const result = await removeSkill(skillId);
              
              if (result.meta.requestStatus === 'fulfilled') {
                showToast('success', 'Skill Removed', 'Skill has been removed successfully');
              } else {
                // Revert optimistic update on failure
                showToast('error', 'Remove Failed', 'Failed to remove skill');
              }
            } catch (error) {
              showToast('error', 'Remove Failed', 'Failed to remove skill');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading skills...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', marginBottom: 10 }}>Error: {error}</Text>
        <Pressable 
          onPress={handleRefresh}
          style={{ 
            backgroundColor: '#007AFF', 
            padding: 10, 
            borderRadius: 5 
          }}
        >
          <Text style={{ color: 'white' }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {/* Header Actions */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <Pressable 
          onPress={handleRefresh}
          style={{ 
            backgroundColor: '#34C759', 
            padding: 10, 
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <MaterialCommunityIcons name="refresh" size={16} color="white" />
          <Text style={{ color: 'white', marginLeft: 5 }}>Refresh</Text>
        </Pressable>
        
        <Pressable 
          onPress={handleAddSkill}
          disabled={isAdding}
          style={{ 
            backgroundColor: '#007AFF', 
            padding: 10, 
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
            opacity: isAdding ? 0.5 : 1
          }}
        >
          <MaterialCommunityIcons name="plus" size={16} color="white" />
          <Text style={{ color: 'white', marginLeft: 5 }}>
            {isAdding ? 'Adding...' : 'Add Skill'}
          </Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          Skills Overview
        </Text>
        <Text>Total Skills: {skills.length}</Text>
        <Text>Tier 1 Skills: {tier1Skills.length}</Text>
        <Text>Tier 2 Skills: {tier2Skills.length}</Text>
        <Text>Tier 3 Skills: {tier3Skills.length}</Text>
      </View>

      {/* Skills List */}
      <View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          All Skills
        </Text>
        {skills.map((skill) => (
          <View 
            key={skill.id} 
            style={{ 
              backgroundColor: 'white', 
              padding: 15, 
              marginBottom: 10, 
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#E5E7EB'
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600' }}>{skill.name}</Text>
                <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>{skill.category}</Text>
                <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{skill.tier}</Text>
              </View>
              
              <View style={{ flexDirection: 'row' }}>
                <Pressable 
                  onPress={() => handleUpdateSkill(skill.id)}
                  style={{ 
                    backgroundColor: '#FF9500', 
                    padding: 8, 
                    borderRadius: 4,
                    marginRight: 8
                  }}
                >
                  <MaterialCommunityIcons name="pencil" size={14} color="white" />
                </Pressable>
                
                <Pressable 
                  onPress={() => handleRemoveSkill(skill.id)}
                  style={{ 
                    backgroundColor: '#FF3B30', 
                    padding: 8, 
                    borderRadius: 4
                  }}
                >
                  <MaterialCommunityIcons name="delete" size={14} color="white" />
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
