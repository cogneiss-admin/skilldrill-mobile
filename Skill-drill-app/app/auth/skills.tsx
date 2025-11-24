import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { AntDesign } from "@expo/vector-icons";
import { useSkillsData } from "../../hooks/useSkillsData";
import SkillsSkeleton from "../components/SkillsSkeleton";

import { BRAND, PADDING } from "../components/Brand";
import { Dimensions } from 'react-native';
const { width } = Dimensions.get('window');



export default function SkillsScreen() {
  const params = useLocalSearchParams();
  const isAssessmentMode = params.mode === 'assessment' || params.assessment === 'true' || params.fromAssessment === 'true';
  const isAddToAssessmentMode = params.mode === 'add-to-assessment';
  const isFromCompleted = params.fromCompleted === 'true';
  const isAddMoreSkillsMode = params.mode === 'add-more-skills';

  console.log('🎯 Skills Screen - Assessment Mode:', isAssessmentMode, 'Add-to-Assessment Mode:', isAddToAssessmentMode, 'Add More Skills Mode:', isAddMoreSkillsMode, 'Params:', params);
  
  const router = useRouter();
  const { updateOnboardingStep } = useAuth();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [skillsWithAssessments, setSkillsWithAssessments] = useState(new Set());
  const [tiers, setTiers] = useState<Array<{ key: string; name: string; order?: number }>>([]);
  const [timelineEndY, setTimelineEndY] = useState<number | null>(null);
  const timelineContainerRef = useRef<View>(null);

  const {
    skillsData,
    skillsByTier,
    selected,
    loading,
    error,
    canContinue,
    toggleSkill,
    setSelected,
    eligibleSet,
  } = useSkillsData({
    isAssessmentMode,
    isAddToAssessmentMode,
  });

  // Check if user already has skills and redirect to dashboard (but not in add-to-assessment mode)
  useEffect(() => {
    const checkExistingSkills = async () => {
      try {
        console.log('🔍 Skills Screen: Checking if user already has skills...');
        console.log('🔍 Add-to-assessment mode:', isAddToAssessmentMode);
        
        // Don't redirect if we're in add-to-assessment mode
        if (isAddToAssessmentMode) {
          console.log('➕ Add-to-assessment mode: Allowing user to add more skills');
          return;
        }

        // Don't redirect if we're in add-more-skills mode
        if (isAddMoreSkillsMode) {
          console.log('➕ Add-more-skills mode: Allowing user to add more skills');
          return;
        }

        // For assessment mode, if user already has skills, navigate to skill selection in assessment mode
        // But if they're coming from dashboard after completing assessments, allow them to add new skills
        if (isAssessmentMode && !isFromCompleted) {
          console.log('🎯 Assessment mode with existing skills: Continuing to skill selection...');
          // Don't redirect - let user choose skills for assessment
          return;
        }

        // If coming from completed assessment, allow adding new skills
        if (isFromCompleted) {
          console.log('✅ Coming from completed assessment - allowing to add new skills');
          return;
        }

        const response = await apiService.get('/user/skills');

        if (response.success && response.data && response.data.length > 0) {
          console.log('✅ Skills Screen: User already has skills, redirecting to dashboard');
          showToast('info', 'Skills Already Selected', 'You have already selected skills. Redirecting to dashboard.');
          router.replace('/dashboard');
          return;
        }
      } catch (error) {
        console.log('ℹ️ Skills Screen: Error checking existing skills (user may not have any):', error.message);
      }
    };

    checkExistingSkills();
  }, [router, isAddToAssessmentMode, isAddMoreSkillsMode]);

  useEffect(() => {
    if (selected) {
      console.log('🎯 Selected skills count:', selected.length);
    }
  }, [selected]);

  // Check which skills already have assessments
  const checkSkillsWithAssessments = useCallback(async () => {
    try {
      // Use unified results endpoint used elsewhere in the app
      const response = await apiService.get('/assessment/results');
      if (response.success && Array.isArray(response.data)) {
        const ids = new Set(
          response.data
            .map((r) => r?.skillId)
            .filter((id) => typeof id === 'string' && id.length > 0)
        );
        setSkillsWithAssessments(ids);
        console.log('📊 Skills with existing assessments:', Array.from(ids));
      } else {
        setSkillsWithAssessments(new Set());
      }
    } catch (error) {
      console.log('ℹ️ Could not fetch assessments:', error.message);
    }
  }, []);

  // Check for skills with existing assessments
  useEffect(() => {
    checkSkillsWithAssessments();
  }, [checkSkillsWithAssessments]);

  // Load tier list from backend public endpoint
  useEffect(() => {
    (async () => {
      try {
        // Prefer alias to avoid collision with /skills/:skillId in some setups
        const resp = await apiService.get('/skill-tiers');
        if (resp?.success && Array.isArray(resp.data)) {
          interface TierData {
            key?: string;
            name?: string;
            value?: string;
            order?: number;
          }
          const parsed = (resp.data as TierData[])
            .map((t) => ({ key: t.key || t.name || t.value || '', name: t.name || t.key || '', order: t.order ?? 0 }))
            .filter((t) => t.key);
          parsed.sort((a, b) => a.order - b.order);
          setTiers(parsed);
          try { console.log('📚 Tiers fetched:', parsed); } catch {}
        }
      } catch (e: unknown) {
        try { console.error('❌ /skills/tiers error:', e?.response?.status, e?.response?.data || e?.message); } catch {}
      }
    })();
  }, []);

  const handleToggleSkill = useCallback(async (skillId) => {
    // Check if skill is locked (not eligible for user's career level)
    const skill = skillsData.find(s => s.id === skillId);
    if (skill) {
      const hasEligible = eligibleSet && eligibleSet.size > 0;
      const isLocked = hasEligible ? !(eligibleSet.has(skill.id) || eligibleSet.has(skill.mongoId)) : false;
      
      if (isLocked) {
        showToast('info', 'Skill Locked', 'This skill is not available for your career level.');
        return;
      }
      
      // Check if skill already has an assessment
      if (skillsWithAssessments.has(skill.mongoId)) {
        showToast('info', 'Assessment Exists', 'You already have an assessment for this skill. Please select a different skill.');
        return;
      }
    }
    
    try { await Haptics.selectionAsync(); } catch {}
    toggleSkill(skillId);
  }, [toggleSkill, skillsData, skillsWithAssessments, eligibleSet, showToast]);

  // No traditional assessment CTA in this inlined layout

  const handleContinue = async () => {
    if (!canContinue || busy) return;
    
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    
    try {
      if (isAddToAssessmentMode) {
        // For add-to-assessment mode, call the add skills API
        console.log('➕ Add-to-Assessment Mode: Adding skills to existing session...');

        // Map selected skills to backend skillIds
        const validSkillIds = selected
          .map(skillId => {
            const skill = skillsData.find(s => s.id === skillId);
            return skill?.mongoId;
          })
          .filter(id => id && id.length > 10);

        console.log('➕ Valid skill IDs to add:', validSkillIds);

        if (validSkillIds.length === 0) {
          showToast('error', 'No Valid Skills', 'Please select valid skills before continuing.');
          setBusy(false);
          return;
        }

        // Add skills to existing session
        const response = await apiService.post('/assessment/session/add-skills', {
          skillIds: validSkillIds
        });

        if (response.success) {
          console.log('✅ Skills added to session successfully');
          
          // Clear persisted selection
          AsyncStorage.removeItem('selectedSkills').catch(console.error);
          
          showToast('success', 'Skills Added!', `${response.data.addedSkills} skill(s) added to your assessment.`);
          
          router.replace('/dashboard');
          return;
        } else {
          console.error('❌ Failed to add skills to session:', response.message);
          showToast('error', 'Add Skills Error', response.message || 'Failed to add skills to assessment');
        }
      } else if (isAssessmentMode) {
        // For assessment mode, we need to save skills to backend first
        // because assessment creation requires skill IDs to exist
        console.log('🎯 Assessment Mode: Saving skills before assessment...');

        // Map selected skills to backend skillIds
        const validSkillIds = selected
          .map(skillId => {
            const skill = skillsData.find(s => s.id === skillId);
            return skill?.mongoId;
          })
          .filter(id => id && id.length > 10);

        console.log('🎯 Valid skill IDs for assessment:', validSkillIds);

        if (validSkillIds.length === 0) {
          showToast('error', 'No Valid Skills', 'Please select valid skills before continuing.');
          setBusy(false);
          return;
        }

        // Save skills to backend (required for assessment)
        const response = await apiService.post('/user/skills', {
          skillIds: validSkillIds
        });

        if (response.success) {
          console.log('✅ Skills saved, navigating to assessment...');
          AsyncStorage.removeItem('selectedSkills').catch(console.error);

          router.replace({
            pathname: '/assessmentScenarios',
            params: { selectedSkills: JSON.stringify(validSkillIds) }
          });
          return; // Exit early to prevent dashboard navigation
        } else {
          console.error('❌ Failed to save skills for assessment:', response.message);
          showToast('error', 'Save Error', response.message || 'Failed to save skills');
        }
      } else {
        // Map selected skills to backend skillIds
        const validSkillIds = selected
          .map(skillId => {
            const skill = skillsData.find(s => s.id === skillId);
            return skill?.mongoId;
          })
          .filter(id => id && id.length > 10);
        
        if (validSkillIds.length === 0) {
          showToast('error', 'No Valid Skills', 'Please select valid skills before continuing.');
          setBusy(false);
          return;
        }
        
        const response = await apiService.post('/user/skills', {
          skillIds: validSkillIds
        });
        
        if (response.success) {
          showToast('success', 'Success', 'Skills saved successfully!');
          
          // Clear persisted selection
          AsyncStorage.removeItem('selectedSkills').catch(console.error);
          
          // Only update onboarding step if NOT in assessment mode
          if (!isAssessmentMode) {
            try {
              await updateOnboardingStep('Completed');
            } catch (error) {
              console.error('❌ Failed to update onboarding step:', error);
            }
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <StatusBar barStyle="dark-content" />
        <SkillsSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header with divider */}
      <View style={{ paddingVertical: 16, paddingHorizontal: width * 0.06, borderBottomWidth: 1.5, borderBottomColor: '#D1D5DB', marginHorizontal: -(width * 0.06) }}>
        <Text style={{ textAlign: 'center', fontSize: width * 0.048, fontWeight: '700', color: '#0F172A' }}>
              {isAddToAssessmentMode ? 'Add More Skills' : isAddMoreSkillsMode ? 'Add More Skills' : 'Select Your Skills'}
            </Text>
      </View>

      {/* Body */}
      <View style={{ flex: 1, backgroundColor: '#F3F4F6', marginHorizontal: -(width * 0.06), paddingHorizontal: width * 0.06 }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: width * 0.06, maxWidth: 560, width: '100%', alignSelf: 'center', paddingTop: 16 }} showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 4 }}>Choose the skills you want to assess and improve</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>{isAddToAssessmentMode
                ? (selected.length > 0 ? `${selected.length} skill${selected.length !== 1 ? 's' : ''} will be added to assessment` : 'Select additional skills to add')
                : isAddMoreSkillsMode
                ? (selected.length > 0 ? `${selected.length} skill${selected.length !== 1 ? 's' : ''} will be added to your profile` : 'Select additional skills to add')
                : (selected.length > 0 ? `${selected.length} skill${selected.length !== 1 ? 's' : ''} selected` : 'Select at least one skill to continue')}
            </Text>

            {/* Skills organized by tier with a single continuous vertical line */}
            {(() => { try { console.log('🔎 Render keys:', { tiers: tiers.map(t=>t.key), skillsTierKeys: Object.keys(skillsByTier) }); } catch {} return null; })()}
            <View ref={timelineContainerRef} style={{ position: 'relative' }}>
              {timelineEndY != null ? (
                <View style={{ position: 'absolute', left: 16, top: 14, height: Math.max(0, timelineEndY - 14), width: 2.5, backgroundColor: '#000000', zIndex: 10 }} />
              ) : (
                <View style={{ position: 'absolute', left: 16, top: 14, bottom: 0, width: 2.5, backgroundColor: '#000000', zIndex: 10 }} />
              )}
            {tiers.map((t, tierIdx) => [t.key, skillsByTier[t.key] || [], t.name, tierIdx] as const).map(([tierKey, tierSkills, tierName, tierIdx]) => {
              const isLastTier = tierIdx === tiers.length - 1;
              return (
                <View 
                  key={tierKey} 
                  style={{ marginBottom: 28 }}
                  onLayout={isLastTier ? (e) => {
                    const { y, height } = e.nativeEvent.layout;
                    if (!tierSkills || tierSkills.length === 0) {
                      // Empty tier: end at the tier header connector center
                      // Header has marginBottom: 12, so connector is roughly at y + 10-12px (center of ~20px header)
                      setTimelineEndY(y + 11);
                    } else {
                      // Tier with skills: end at the last skill indicator center
                      // Last skill row has marginBottom: 12, and indicator is vertically centered in the row
                      // Row height: ~12px padding top + ~20px text + ~4px subtitle + ~12px padding bottom = ~48px
                      // Indicator center is at row center = row bottom - 24px
                      // But we need to account for the marginBottom: 12 on the last row
                      // So: container height - marginBottom (12) - half row height (24)
                      const lastRowHeight = 48; // estimated row height
                      setTimelineEndY(y + height - 12 - (lastRowHeight / 2));
                    }
                  } : undefined}
                >
                  {/* Tier header with connector */}
                  <View 
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
                  >
                    {/* Spacer to align connector start with vertical line center (17.25px) */}
                    <View style={{ width: 17.25 }} />
                    {/* Horizontal connector starting from vertical line center */}
                    <View style={{ width: 18, height: 2.5, backgroundColor: '#000000', marginRight: 8, zIndex: 10 }} />
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>{tierName}</Text>
                  </View>

                  {/* Skills list (empty allowed) */}
                  <View>
                    {(tierSkills || []).map((skill, idx: number) => {
                      // Determine if skill is locked based on eligibleSet
                      // Only lock if eligibleSet is populated (user has career level) and skill is not in the set
                      const hasEligible = eligibleSet && eligibleSet.size > 0;
                      const skillIdStr = String(skill.id || '');
                      const mongoIdStr = String(skill.mongoId || '');
                      const isInEligibleSet = eligibleSet?.has(skill.id) || 
                                              eligibleSet?.has(skill.mongoId) || 
                                              eligibleSet?.has(skillIdStr) || 
                                              eligibleSet?.has(mongoIdStr);
                      const locked = hasEligible ? !isInEligibleSet : false;
                      const isSelected = selected.includes(skill.id);
                      const isLastSkill = idx === (tierSkills.length - 1);
                      
                      // Debug logging for first skill only (to avoid spam)
                      if (idx === 0 && tierIdx === 0) {
                        try {
                          console.log('🔒 Skill locking check:', {
                            skillName: skill.name,
                            skillId: skill.id,
                            mongoId: skill.mongoId,
                            hasEligible,
                            eligibleSetSize: eligibleSet?.size || 0,
                            isInEligibleSet,
                            locked
                          });
                        } catch {}
                      }
                      return (
                        <View 
                          key={skill.id} 
                          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, position: 'relative' }}
                        >
                          {/* Timeline indicator - absolutely positioned to center on vertical line */}
                          {/* Vertical line: left: 16, width: 2.5, center at 17.25px from timeline container edge */}
                          {/* Circle: 20px wide, needs center at 17.25px, so left edge at 17.25 - 10 = 7.25px */}
                          <View style={{ position: 'absolute', left: 7.25, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
                            {locked ? (
                              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#000000', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
                                <AntDesign name="lock" size={12} color="#000000" />
                              </View>
                            ) : (
                              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#000000', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
                                {isSelected ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND }} /> : null}
                              </View>
                            )}
                          </View>
                          {/* Spacer to maintain proper spacing for skill card */}
                          <View style={{ width: 32 }} />

                          {/* Skill row */}
                          <View
                            style={{
                              flex: 1,
                              backgroundColor: locked ? '#F9FAFB' : (isSelected ? '#E6F2FF' : '#FFFFFF'),
                              borderRadius: 14,
                              paddingVertical: 12,
                              paddingHorizontal: 14,
                              borderWidth: 1,
                              borderColor: locked ? '#E5E7EB' : (isSelected ? BRAND : '#E5E7EB')
                            }}
                            onStartShouldSetResponder={() => !locked}
                            onResponderRelease={() => { if (!locked) handleToggleSkill(skill.id); }}
                          >
                            <Text style={{ fontSize: 16, fontWeight: '700', color: locked ? '#9CA3AF' : '#111827' }} numberOfLines={1}>
                              {skill.name}
                            </Text>
                            <Text style={{ marginTop: 4, fontSize: 12, color: locked ? '#9CA3AF' : '#6B7280' }} numberOfLines={1}>
                              {skill?.category || ''}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
            </View>

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
          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: width * 0.06, paddingTop: 12, paddingBottom: 12, zIndex: 1000, backgroundColor: "#ffffff", borderTopWidth: 1, borderTopColor: '#D1D5DB' }}>
            <TouchableOpacity
              onPress={handleContinue}
              activeOpacity={0.85}
              disabled={!canContinue || busy}
              style={{ backgroundColor: BRAND, borderRadius: 22, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginHorizontal: 6, opacity: (!canContinue || busy) ? 0.6 : 1 }}
            >
              <Text style={{ color: '#fff', fontSize: width * 0.038, fontWeight: '600' }}>Continue</Text>
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
