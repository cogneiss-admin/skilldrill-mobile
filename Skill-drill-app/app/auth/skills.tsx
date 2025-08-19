// @ts-nocheck
import React, { useMemo, useState, useEffect, useCallback } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, Pressable, ScrollView, Image, Platform, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Chip, Surface, Badge } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import { useResponsive } from "../../utils/responsive";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSkillsRedux } from "../../hooks/useSkillsRedux";

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";
const logoSrc = require("../../assets/images/logo.png");

// Helper function to map skill names to icons
const getSkillIcon = (skillName) => {
  const iconMap = {
    'communication': 'message-text',
    'time management': 'clock',
    'listening': 'ear',
    'collaboration': 'account-multiple',
    'accountability': 'shield-check',
    'emotional regulation': 'heart',
    'follow-through': 'check-decagram',
    'email & message hygiene': 'email',
    'responding to feedback': 'comment-text',
    'delegation': 'account-supervisor',
    'negotiation': 'handshake',
    'stakeholder management': 'account-cog',
    'conflict management': 'handshake-outline',
    'visibility & self-advocacy': 'bullhorn',
    'performance feedback delivery': 'comment-text-outline',
    'managing up': 'account-arrow-up',
    'strategic thinking': 'chess-king',
    'vision communication': 'presentation',
    'cross-functional alignment': 'account-network',
    'executive presence': 'account-tie',
    'talent magnetism': 'account-star',
    'change leadership': 'swap-horizontal',
    'crisis communication': 'alert-circle',
    'decision making under uncertainty': 'help-circle',
    'strategic influence': 'handshake',
    'culture building': 'account-group'
  };
  
  const lowerName = skillName.toLowerCase().trim();
  
  // Try exact match first
  if (iconMap[lowerName]) {
    return iconMap[lowerName];
  }
  
  // Try partial matches
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return icon;
    }
  }
  
  return 'star-circle';
};

export default function SkillsScreen() {
  const params = useLocalSearchParams();
  const isAssessmentMode = params.mode === 'assessment';
  
  const router = useRouter();
  const responsive = useResponsive();
  const { updateOnboardingStep } = useAuth();
  const { showToast } = useToast();
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  // Use the Redux-based skills hook
  const { skills: skillsData, loading, error, refreshSkills } = useSkillsRedux();

  const canContinue = useMemo(() => selected.length > 0, [selected]);

  // Load persisted selection after skills are loaded
  useEffect(() => {
    if (skillsData.length > 0) {
      AsyncStorage.getItem('selectedSkills')
        .then((persisted) => {
          if (persisted) {
            try {
              const parsed = JSON.parse(persisted);
              // Only set selection if the IDs exist in current skills data
              const validSelections = parsed.filter(id => 
                skillsData.some(skill => skill.id === id)
              );
              
              setSelected(validSelections);
            } catch (error) {
              console.error('Failed to parse persisted selection:', error);
            }
          }
        })
        .catch(console.error);
    }
  }, [skillsData]);

  const toggleSkill = useCallback((skillId) => {
    Haptics.selectionAsync().catch(() => {});
    
    setSelected((prev) => {
      const has = prev.includes(skillId);
      const newSelected = has ? prev.filter((s) => s !== skillId) : [...prev, skillId];
      
      // Persist the selection state
      AsyncStorage.setItem('selectedSkills', JSON.stringify(newSelected)).catch(console.error);
      
      return newSelected;
    });
  }, [selected]);

  const handleContinue = async () => {
    if (!canContinue || busy) return;
    
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    
    try {
      if (isAssessmentMode) {
        // For assessment mode, pass the skill_id values (not MongoDB IDs)
        AsyncStorage.removeItem('selectedSkills').catch(console.error);
        
        router.push({
          pathname: '/assessment',
          params: { selectedSkills: JSON.stringify(selected) }
        });
      } else {
        // Convert skill_id selections to MongoDB IDs for backend
        const validSkillIds = selected
          .map(skillId => {
            const skill = skillsData.find(s => s.id === skillId);
            return skill?.mongo_id;
          })
          .filter(id => id && !id.startsWith('fallback_') && id.length > 10);
        
        if (validSkillIds.length === 0) {
          showToast('error', 'No Valid Skills', 'Please select valid skills before continuing.');
          setBusy(false);
          return;
        }
        
        const response = await apiService.post('/user/skills', {
          skill_ids: validSkillIds
        });
        
        if (response.success) {
          showToast('success', 'Success', 'Skills saved successfully!');
          
          // Clear persisted selection
          AsyncStorage.removeItem('selectedSkills').catch(console.error);
          
          try {
            await updateOnboardingStep('SKILLS_SELECTED');
          } catch (error) {
            console.error('❌ Failed to update onboarding step:', error);
          }
          
          router.replace("/dashboard");
        } else {
          showToast('error', 'Save Error', response.message || 'Failed to save skills');
        }
      }
    } catch (error) {
      console.error('Save skills error:', error);
      showToast('error', 'Save Error', 'Failed to save skills. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
        <StatusBar style="light" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#ffffff", fontSize: 16 }}>Loading Skills...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
      <StatusBar style="light" />

      {/* Hero header */}
      <View style={{ 
        backgroundColor: "#ffffff", 
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 24
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start", marginBottom: 16 }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: BRAND,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: BRAND,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 2
          }}>
            <Image source={logoSrc} style={{ width: 24, height: 24 }} resizeMode="contain" />
          </View>
          <Text style={{ 
            marginLeft: 12, 
            color: "#111827", 
            fontSize: 18, 
            fontWeight: "700"
          }}>
            {APP_NAME}
          </Text>
        </View>
        
        <View style={{ alignItems: "flex-start" }}>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: "800", 
            color: "#111827",
            marginBottom: 8,
            textAlign: 'left'
          }}>
            Select Your Skills
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: "#6B7280", 
            lineHeight: 22,
            textAlign: 'left',
            marginBottom: 8
          }}>
            Choose the skills you want to assess and improve
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: "#3B82F6", 
            fontWeight: "600",
            textAlign: 'left',
            marginBottom: 8
          }}>
            We'll provide personalized assessments based on your selections
          </Text>
          <Text style={{ 
            fontSize: 12, 
            color: "#9CA3AF",
            textAlign: 'left'
          }}>
            {selected.length > 0 ? `${selected.length} skill${selected.length !== 1 ? 's' : ''} selected` : 'Select at least one skill to continue'}
          </Text>


          
        </View>
      </View>

      {/* Content card */}
      <View style={{ flex: 1, marginTop: -24 }}>
        <View style={{ flex: 1, backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 18 }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
            
                        {/* Skills organized by tier */}
            {(() => {
              // Group skills by tier
              const tierGroups = {};
              skillsData.forEach(skill => {
                const tierName = skill.tier || 'TIER_1_CORE_SURVIVAL';
                if (!tierGroups[tierName]) {
                  tierGroups[tierName] = [];
                }
                // Create a proper copy of the skill object to prevent modification
                tierGroups[tierName].push({
                  ...skill,
                  id: skill.id,
                  name: skill.name,
                  category: skill.category,
                  tier: skill.tier
                });
              });

              // Define tier display names and icons
              const tierConfig = {
                'TIER_1_CORE_SURVIVAL': {
                  name: 'Core Survival Skills',
                  icon: '🛡️',
                  color: '#3B82F6'
                },
                'TIER_2_PROGRESSION': {
                  name: 'Progression Enabler Skills',
                  icon: '🚀',
                  color: '#1D4ED8'
                },
                'TIER_3_EXECUTIVE': {
                  name: 'Executive & Strategic Multipliers',
                  icon: '👑',
                  color: '#1E3A8A'
                }
              };

              // Sort tiers in order
              const tierOrder = ['TIER_1_CORE_SURVIVAL', 'TIER_2_PROGRESSION', 'TIER_3_EXECUTIVE'];
              
              return tierOrder.map(tierKey => {
                const tierSkills = tierGroups[tierKey];
                if (!tierSkills || tierSkills.length === 0) return null;
                
                const config = tierConfig[tierKey];
                
                return (
                  <View key={tierKey} style={{ marginBottom: 32 }}>
                    {/* Tier Header */}
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 16,
                      paddingHorizontal: 20
                    }}>
                      <Text style={{ fontSize: 24, marginRight: 12 }}>
                        {config.icon}
                      </Text>
                      <Text style={{ 
                        fontSize: 18, 
                        fontWeight: "700", 
                        color: "#111827"
                      }}>
                        {config.name}
                      </Text>
                    </View>

                    {/* Skills under this tier */}
                    <View style={{ paddingHorizontal: 20 }}>
                      {tierSkills.map((skill, index) => {
                        const isSelected = selected.includes(skill.id);
                        
                        const cardStyle = {
                          backgroundColor: isSelected ? "#2563EB" : "#ffffff",
                          padding: 16,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: isSelected ? "#2563EB" : "#E5E7EB",
                          marginBottom: 8
                        };
                        
                        const textStyle = {
                          color: isSelected ? "#ffffff" : "#000000",
                          fontSize: 16,
                          fontWeight: "600"
                        };
                        
                        const categoryStyle = {
                          color: isSelected ? "#ffffff" : "#666666",
                          fontSize: 14,
                          marginTop: 4
                        };
                        
                        return (
                          <Pressable
                            key={skill.id}
                            onPress={() => toggleSkill(skill.id)}
                            style={cardStyle}
                          >
                            <Text style={textStyle}>
                              {skill.name || 'Unknown Skill'}
                            </Text>
                            <Text style={categoryStyle}>
                              {skill.category ? skill.category.replace(/_/g, ' ') : 'Personal Effectiveness'}
                            </Text>
                            {isSelected && (
                              <Text style={{ color: "#ffffff", fontSize: 12, marginTop: 4 }}>
                                ✓ Selected
                              </Text>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              });
            })()}
        
                {/* Skills Summary */}
        {selected.length > 0 && (
              <View style={{ 
                marginTop: 20, 
                marginBottom: 16,
                alignItems: 'center'
              }}>
            <Text style={{ 
              textAlign: "center",
                  color: "#374151", 
                  fontSize: 16,
                  fontWeight: "600",
                  marginBottom: 4
            }}>
              {selected.length} of {skillsData.length} skills selected
            </Text>
                <Text style={{ 
                  textAlign: "center",
                  color: "#6B7280", 
                  fontSize: 14
                }}>
                  Ready to continue
                </Text>
              </View>
            )}

            {/* Error Display */}
        {error && (
            <View style={{
              backgroundColor: "#FEF2F2",
              borderLeftWidth: 4,
              borderLeftColor: "#DC2626",
                padding: 16,
                borderRadius: 8,
                marginTop: 16
            }}>
              <Text style={{
                color: "#DC2626",
                  fontSize: 14,
                fontWeight: "500"
              }}>
                {error}
              </Text>
            </View>
        )}

            {/* Bottom spacing */}
            <View style={{ height: 180 }} />
          </ScrollView>
        </View>
      </View>

                    {/* Sticky footer CTA */}
          <View style={{ 
            position: "absolute", 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: "#ffffff",
        paddingHorizontal: 20, 
        paddingTop: 16, 
        paddingBottom: 24,
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB"
          }}>
            <Button
              mode="contained"
              onPress={handleContinue}
              loading={busy}
              disabled={!canContinue || busy}
              style={{ 
            borderRadius: 12,
            backgroundColor: canContinue ? BRAND : "#E5E7EB",
            elevation: 0
          }}
          contentStyle={{ 
            height: 52,
            paddingHorizontal: 24
              }}
              labelStyle={{ 
                fontWeight: "600", 
            fontSize: 16,
            color: canContinue ? "#ffffff" : "#9CA3AF"
              }}
            >
            {busy ? (isAssessmentMode ? "Starting Assessment..." : "Saving...") : 
              selected.length > 0 ? 
                (isAssessmentMode ? 
                `Start Assessment (${selected.length} skills)` : 
                  `Continue with ${selected.length} Skill${selected.length !== 1 ? 's' : ''}`
                ) : 
                "Select at least one skill"}
            </Button>
      </View>
    </SafeAreaView>
  );
}
