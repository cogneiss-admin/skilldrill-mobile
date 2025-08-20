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
import { AntDesign } from '@expo/vector-icons';
import { useSkillsRedux } from "../../hooks/useSkillsRedux";

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";
const logoSrc = require("../../assets/images/logo.png");



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

  // Load persisted selection after skills are loaded (only in assessment mode)
  useEffect(() => {
    if (skillsData.length > 0 && isAssessmentMode) {
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
  }, [skillsData, isAssessmentMode]);

  const toggleSkill = useCallback(async (skillId) => {
    try { await Haptics.selectionAsync(); } catch {}
    
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
      <View style={{ minHeight: 200, position: "relative" }}>
        <LinearGradient colors={["#0A66C2", "#0E75D1", "#1285E0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0 }} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start", paddingHorizontal: 18, paddingTop: 10 }}>
          <Image source={logoSrc} style={{ width: 56, height: 56, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10 }} resizeMode="contain" />
          <Text style={{ marginLeft: 12, color: "#ffffff", fontSize: 22, fontWeight: "900", letterSpacing: 0.8, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>{APP_NAME}</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 18, paddingBottom: 20 }}>
          <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 480 }}>
            <Text style={{ fontSize: 24, fontWeight: "900", color: "#ffffff" }}>Select Your Skills</Text>
            <Text style={{ marginTop: 8, color: "#E6F2FF", fontSize: 15 }}>Choose the skills you want to assess and improve</Text>
            <Text style={{ marginTop: 4, color: "#E6F2FF", fontSize: 13, opacity: 0.9 }}>
              {selected.length > 0 ? `${selected.length} skill${selected.length !== 1 ? 's' : ''} selected` : 'Select at least one skill to continue'}
            </Text>
          </MotiView>
        </View>
      </View>

      {/* Content card */}
      <View style={{ flex: 1, marginTop: -24 }}>
        <View style={{ flex: 1, backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 24, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16 }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100, maxWidth: 560, width: '100%', alignSelf: 'center' }} showsVerticalScrollIndicator={false}>
            
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
                    <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 420, delay: 100 }}>
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
                    </MotiView>
                    
                    {/* Skills under this tier */}
                    <View style={{ paddingHorizontal: 20 }}>
                      {tierSkills.map((skill, index) => {
                        const isSelected = selected.includes(skill.id);
                        
                        const cardStyle = {
                          backgroundColor: "#ffffff",
                          padding: 16,
                          paddingHorizontal: 14,
                          borderRadius: 16,
                          borderWidth: isSelected ? 2 : 1,
                          borderColor: isSelected ? BRAND : "#E5E7EB",
                          marginBottom: 12,
                          shadowColor: "#000",
                          shadowOpacity: 0.06,
                          shadowRadius: 8,
                          elevation: 2
                        };
                        
                        const textStyle = {
                          color: "#0f172a",
                          fontSize: 15,
                          fontWeight: "900"
                        };
                        
                        const categoryStyle = {
                          color: "#64748b",
                          fontSize: 14,
                          marginTop: 4
                        };
                        
                        return (
                          <MotiView key={skill.id} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 350, delay: index * 60 }} style={{ marginBottom: 12 }}>
                            <Pressable
                              onPress={() => toggleSkill(skill.id)}
                              style={({ pressed }) => ({
                                width: '100%',
                                paddingVertical: 16,
                                paddingHorizontal: 14,
                                borderRadius: 16,
                                backgroundColor: "#ffffff",
                                borderWidth: isSelected ? 2 : 1,
                                borderColor: isSelected ? BRAND : "#E5E7EB",
                                shadowColor: "#000",
                                shadowOpacity: pressed ? 0.12 : 0.06,
                                shadowRadius: pressed ? 12 : 8,
                                transform: [{ scale: pressed ? 0.98 : 1 }],
                              })}
                            >
                              {isSelected ? (
                                <LinearGradient colors={["#E6F2FF", "#ffffff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0, borderRadius: 16 }} />
                              ) : null}
                              <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ color: "#0f172a", fontSize: 15, fontWeight: "900" }}>
                                    {skill.name || 'Unknown Skill'}
                                  </Text>
                                  <Text style={{ color: "#64748b", marginTop: 4 }}>
                                    {skill.category ? skill.category.replace(/_/g, ' ') : 'Personal Effectiveness'}
                                  </Text>
                                </View>
                                {isSelected ? <AntDesign name="checkcircle" size={22} color="#16A34A" /> : null}
                              </View>
                            </Pressable>
                          </MotiView>
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

          </ScrollView>
          
          {/* Sticky footer CTA */}
          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 34, zIndex: 1000, backgroundColor: "#ffffff" }}>
            <LinearGradient colors={["#0A66C2", "#0E75D1", "#1285E0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0, opacity: 0.1 }} />
            <Button
              mode="contained"
              onPress={handleContinue}
              loading={busy}
              disabled={!canContinue || busy}
              contentStyle={{ height: 56 }}
              style={{ borderRadius: 28, backgroundColor: BRAND, opacity: canContinue ? 1 : 0.7, shadowColor: BRAND, shadowOpacity: 0.35, shadowRadius: 14 }}
              labelStyle={{ fontWeight: "800", letterSpacing: 0.3 }}
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
        </View>
      </View>
    </SafeAreaView>
  );
}
