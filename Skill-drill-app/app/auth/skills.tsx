// @ts-nocheck
import React, { useMemo, useState, useEffect, useCallback } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import TierSection from "../components/TierSection";
import { useSkillsData } from "../../hooks/useSkillsData";
import SkillsSkeleton from "../components/SkillsSkeleton";
// Temporarily disabled Redux hook to fix import error
// import { useSkillsRedux } from "../../hooks/useSkillsRedux";

import { BRAND, GRADIENTS, BORDER_RADIUS, SHADOWS, PADDING } from "../components/Brand";
const APP_NAME = "Skill Drill";
const logoSrc = require("../../assets/images/logo.png");



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

  const {
    skillsData,
    skillsByTier,
    selected,
    loading,
    error,
    canContinue,
    toggleSkill,
    setSelected,
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

        // For assessment mode, if user already has skills, start assessment directly
        // But if they're coming from dashboard after completing assessments, allow them to add new skills
        if (isAssessmentMode && !isFromCompleted) {
          console.log('🎯 Assessment mode with existing skills: Starting assessment directly');
          showToast('info', 'Starting Assessment', 'You already have skills selected. Starting your assessment...');
          router.replace('/assessment-intro');
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

  // Check for skills with existing assessments
  useEffect(() => {
    checkSkillsWithAssessments();
  }, [checkSkillsWithAssessments]);

  const handleToggleSkill = useCallback(async (skillId) => {
    // Check if skill already has an assessment
    const skill = skillsData.find(s => s.id === skillId);
    if (skill && skillsWithAssessments.has(skill.mongo_id)) {
      showToast('info', 'Assessment Exists', 'You already have an assessment for this skill. Please select a different skill.');
      return;
    }
    
    try { await Haptics.selectionAsync(); } catch {}
    toggleSkill(skillId);
  }, [toggleSkill, skillsData, skillsWithAssessments, showToast]);

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

  const handleContinue = async () => {
    if (!canContinue || busy) return;
    
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    
    try {
      if (isAddToAssessmentMode) {
        // For add-to-assessment mode, call the add skills API
        console.log('➕ Add-to-Assessment Mode: Adding skills to existing session...');

        // Convert skill_id selections to MongoDB IDs for backend
        const validSkillIds = selected
          .map(skillId => {
            const skill = skillsData.find(s => s.id === skillId);
            return skill?.mongo_id;
          })
          .filter(id => id && !id.startsWith('fallback_') && id.length > 10);

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

        // Convert skill_id selections to MongoDB IDs for backend
        const validSkillIds = selected
          .map(skillId => {
            const skill = skillsData.find(s => s.id === skillId);
            return skill?.mongo_id;
          })
          .filter(id => id && !id.startsWith('fallback_') && id.length > 10);

        console.log('🎯 Valid skill IDs for assessment:', validSkillIds);

        if (validSkillIds.length === 0) {
          showToast('error', 'No Valid Skills', 'Please select valid skills before continuing.');
          setBusy(false);
          return;
        }

        // Save skills to backend (required for assessment)
        const response = await apiService.post('/user/skills', {
          skill_ids: validSkillIds
        });

        if (response.success) {
          console.log('✅ Skills saved, navigating to assessment...');
          AsyncStorage.removeItem('selectedSkills').catch(console.error);

          router.replace({
            pathname: '/assessment-intro',
            params: { selectedSkills: JSON.stringify(validSkillIds) }
          });
          return; // Exit early to prevent dashboard navigation
        } else {
          console.error('❌ Failed to save skills for assessment:', response.message);
          showToast('error', 'Save Error', response.message || 'Failed to save skills');
        }
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
          
          // Only update onboarding step if NOT in assessment mode
          if (!isAssessmentMode) {
            try {
              await updateOnboardingStep('SKILLS_SELECTED');
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
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
        <StatusBar style="light" />
        <SkillsSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
      <StatusBar style="light" />

      {/* Hero header */}
      <View style={{ minHeight: 200, position: "relative" }}>
        <LinearGradient colors={GRADIENTS.footer} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0 }} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start", paddingHorizontal: PADDING.md, paddingTop: 10 }}>
          <Image source={logoSrc} style={{ width: 56, height: 56, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10 }} resizeMode="contain" />
          <Text style={{ marginLeft: 12, color: "#ffffff", fontSize: 22, fontWeight: "900", letterSpacing: 0.8, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>{APP_NAME}</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: PADDING.md, paddingBottom: 20 }}>
          <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 480 }}>
            <Text style={{ fontSize: 24, fontWeight: "900", color: "#ffffff" }}>
              {isAddToAssessmentMode ? 'Add More Skills' : isAddMoreSkillsMode ? 'Add More Skills' : 'Select Your Skills'}
            </Text>
            <Text style={{ marginTop: 8, color: "#E6F2FF", fontSize: 15 }}>
              {isAddToAssessmentMode ? 'Choose additional skills to add to your current assessment' : isAddMoreSkillsMode ? 'Choose additional skills to add to your profile' : 'Choose the skills you want to assess and improve'}
            </Text>
            <Text style={{ marginTop: 4, color: "#E6F2FF", fontSize: 13, opacity: 0.9 }}>
              {isAddToAssessmentMode
                ? (selected.length > 0 ? `${selected.length} skill${selected.length !== 1 ? 's' : ''} will be added to assessment` : 'Select additional skills to add')
                : isAddMoreSkillsMode
                ? (selected.length > 0 ? `${selected.length} skill${selected.length !== 1 ? 's' : ''} will be added to your profile` : 'Select additional skills to add')
                : (selected.length > 0 ? `${selected.length} skill${selected.length !== 1 ? 's' : ''} selected` : 'Select at least one skill to continue')
              }
            </Text>
          </MotiView>
        </View>
      </View>

      {/* Content card */}
      <View style={{ flex: 1, marginTop: -24 }}>
        <View style={{ flex: 1, backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 24, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16 }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: PADDING.md, paddingBottom: 100, maxWidth: 560, width: '100%', alignSelf: 'center' }} showsVerticalScrollIndicator={false}>
            
                        {/* Skills organized by tier */}
            {(() => {
              const tierConfig = {
                'TIER_1_CORE_SURVIVAL': { name: 'Core Survival Skills', icon: '🛡️', color: '#3B82F6' },
                'TIER_2_PROGRESSION': { name: 'Progression Enabler Skills', icon: '🚀', color: '#1D4ED8' },
                'TIER_3_EXECUTIVE': { name: 'Executive & Strategic Multipliers', icon: '👑', color: '#1E3A8A' }
              } as const;
              const tierOrder = ['TIER_1_CORE_SURVIVAL', 'TIER_2_PROGRESSION', 'TIER_3_EXECUTIVE'] as const;
              return tierOrder.map((tierKey) => {
                const tierSkills = skillsByTier[tierKey as keyof typeof skillsByTier];
                if (!tierSkills || tierSkills.length === 0) return null;
                const config = tierConfig[tierKey];
                return (
                  <TierSection
                    key={tierKey}
                    tierKey={tierKey}
                    title={config.name}
                    icon={config.icon}
                    skills={tierSkills}
                    selectedIds={selected}
                    onToggle={handleToggleSkill}
                    brand={BRAND}
                    skillsWithAssessments={skillsWithAssessments}
                  />
                );
              });
            })()}
        
                {/* Skills Summary removed per UX update */}

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
          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: PADDING.md, paddingTop: 12, paddingBottom: 34, zIndex: 1000, backgroundColor: "#ffffff" }}>
            <LinearGradient colors={GRADIENTS.footer} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0, opacity: 0.1 }} />
            <Button
              mode="contained"
              onPress={handleContinue}
              loading={busy}
              disabled={!canContinue || busy}
              contentStyle={{ height: 56 }}
              style={{ borderRadius: 28, backgroundColor: BRAND, opacity: canContinue ? 1 : 0.7, shadowColor: BRAND, shadowOpacity: 0.35, shadowRadius: 14 }}
              labelStyle={{ fontWeight: "800", letterSpacing: 0.3 }}
            >
              Continue
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
