import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import * as SecureStore from 'expo-secure-store';
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/api";
import { Ionicons } from "@expo/vector-icons";
import { useSkillsData } from "../../hooks/useSkillsData";
import SkillsSkeleton from "../components/SkillsSkeleton";
import { BlurView } from 'expo-blur';

import { BRAND, SCREEN_BACKGROUND, COLORS, BORDER_RADIUS } from "../components/Brand";
import { Dimensions } from 'react-native';
const { width: SCREEN_WIDTH } = Dimensions.get('window');



export default function SkillsScreen() {
  const params = useLocalSearchParams();
  const isAssessmentMode = params.mode === 'assessment' || params.assessment === 'true' || params.fromAssessment === 'true';
  const isAddToAssessmentMode = params.mode === 'add-to-assessment';
  const isFromCompleted = params.fromCompleted === 'true';
  const isAddMoreSkillsMode = params.mode === 'add-more-skills';
  const returnTo = params.returnTo as string;

  const router = useRouter();
  const { updateOnboardingStep } = useAuth();
  const [busy, setBusy] = useState(false);
  const [skillsWithAssessments, setSkillsWithAssessments] = useState(new Set());
  const [tiers, setTiers] = useState<Array<{ key: string; name: string; order?: number }>>([]);
  const [timelineEndY, setTimelineEndY] = useState<number | null>(null);
  const timelineContainerRef = useRef<View>(null);
  const [showAssessmentMessage, setShowAssessmentMessage] = useState(false);
  const [selectedSkillName, setSelectedSkillName] = useState<string>('');

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

  useEffect(() => {
    const checkExistingSkills = async () => {
      try {
        if (isAddToAssessmentMode || isAddMoreSkillsMode || returnTo) {
          return;
        }

        if (isAssessmentMode && !isFromCompleted) {
          return;
        }

        if (isFromCompleted) {
          return;
        }

        const response = await apiService.get('/user/skills');

        if (response.success && response.data && response.data.length > 0) {
          router.replace('/dashboard');
          return;
        }
      } catch (error) {
        // Error checking existing skills - user may not have any
      }
    };

    checkExistingSkills();
  }, [router, isAddToAssessmentMode, isAddMoreSkillsMode, returnTo, isAssessmentMode, isFromCompleted]);

  const checkSkillsWithAssessments = useCallback(async () => {
    try {
      const response = await apiService.get('/assessment/results');
      if (response.success && Array.isArray(response.data)) {
        const ids = new Set(
          response.data
            .map((r) => r?.skillId)
            .filter((id) => typeof id === 'string' && id.length > 0)
        );
        setSkillsWithAssessments(ids);
      } else {
        setSkillsWithAssessments(new Set());
      }
    } catch (error) {
      // Could not fetch assessments
    }
  }, []);

  useEffect(() => {
    checkSkillsWithAssessments();
  }, [checkSkillsWithAssessments]);

  useEffect(() => {
    (async () => {
      try {
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
        }
      } catch (e: unknown) {
        // Error loading tiers
      }
    })();
  }, []);

  const handleToggleSkill = useCallback(async (skillId: string) => {
    const skill = skillsData.find(s => s.id === skillId);
    if (skill) {
      const hasEligible = eligibleSet && eligibleSet.size > 0;
      const isLocked = hasEligible ? !(eligibleSet.has(skill.id) || eligibleSet.has(skill.mongoId || '')) : false;

      if (isLocked) {
        return;
      }

      const hasAssessment = skillsWithAssessments.has(skill.mongoId || '') || skillsWithAssessments.has(skill.id);
      if (hasAssessment) {
        setSelectedSkillName(skill.name);
        setShowAssessmentMessage(true);
        return;
      }
    }

    try { await Haptics.selectionAsync(); } catch {}
    toggleSkill(skillId);
  }, [toggleSkill, skillsData, skillsWithAssessments, eligibleSet]);

  const handleContinue = async () => {
    if (!canContinue || busy) return;
    
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    
    try {
      if (isAddToAssessmentMode) {
        const validSkillIds = selected
          .map(skillId => {
            const skill = skillsData.find(s => s.id === skillId);
            return skill?.mongoId;
          })
          .filter(id => id && id.length > 10);

        if (validSkillIds.length === 0) {
          setBusy(false);
          return;
        }

        const response = await apiService.post('/assessment/session/add-skills', {
          skillIds: validSkillIds
        });

        if (response.success) {
          SecureStore.deleteItemAsync('selectedSkills').catch(() => {});

          if (returnTo === 'discover') {
            router.replace('/discover');
          } else if (returnTo === 'activity') {
            router.replace('/activity');
          } else {
            router.replace('/dashboard');
          }
          return;
        } else {
          // Failed to add skills to assessment
        }
      } else if (isAssessmentMode) {
        const validSkillIds = selected
          .map(skillId => {
            const skill = skillsData.find(s => s.id === skillId);
            return skill?.mongoId;
          })
          .filter(id => id && id.length > 10);

        if (validSkillIds.length === 0) {
          setBusy(false);
          return;
        }

        const response = await apiService.post('/user/skills', {
          skillIds: validSkillIds
        });

        if (response.success) {
          SecureStore.deleteItemAsync('selectedSkills').catch(() => {});

          router.replace({
            pathname: '/assessmentScenarios',
            params: { selectedSkills: JSON.stringify(validSkillIds) }
          });
          return;
        } else {
          // Failed to save skills
        }
      } else {
        const validSkillIds = selected
          .map(skillId => {
            const skill = skillsData.find(s => s.id === skillId);
            return skill?.mongoId;
          })
          .filter(id => id && id.length > 10);
        
        if (validSkillIds.length === 0) {
          setBusy(false);
          return;
        }

        const response = await apiService.post('/user/skills', {
          skillIds: validSkillIds
        });

        if (response.success) {
          SecureStore.deleteItemAsync('selectedSkills').catch(() => {});

          if (!isAssessmentMode) {
            try {
              await updateOnboardingStep('Completed');
            } catch (error) {
              // Failed to update onboarding step
            }
          }

          if (returnTo === 'discover') {
            router.replace('/discover');
          } else if (returnTo === 'activity') {
            router.replace('/activity');
          } else {
            router.replace('/dashboard');
          }
        } else {
          // Failed to save skills
        }
      }
    } catch (error) {
      // Failed to save skills
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
        <StatusBar barStyle="dark-content" />
        <SkillsSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <StatusBar barStyle="dark-content" />

      <View style={{ paddingVertical: SCREEN_WIDTH * 0.04, paddingHorizontal: SCREEN_WIDTH * 0.06, borderBottomWidth: 1.5, borderBottomColor: COLORS.border.medium, marginHorizontal: -(SCREEN_WIDTH * 0.06) }}>
        <Text style={{ textAlign: 'center', fontSize: SCREEN_WIDTH * 0.048, fontWeight: '700', color: COLORS.gray[900] }}>
              {isAddToAssessmentMode ? 'Add More Skills' : isAddMoreSkillsMode ? 'Add More Skills' : 'Select Your Skills'}
            </Text>
      </View>

      <View style={{ flex: 1, backgroundColor: SCREEN_BACKGROUND, marginHorizontal: -(SCREEN_WIDTH * 0.06), paddingHorizontal: SCREEN_WIDTH * 0.06 }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: SCREEN_WIDTH * 0.06, maxWidth: 560, width: '100%', alignSelf: 'center', paddingTop: 16 }} showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 14, color: COLORS.text.secondary, marginBottom: 4 }}>Choose the skills you want to assess and improve</Text>
            <Text style={{ fontSize: 13, color: COLORS.text.tertiary, marginBottom: 16 }}>{isAddToAssessmentMode
                ? (selected.length > 0 ? `${selected.length} skill${selected.length !== 1 ? 's' : ''} will be added to assessment` : 'Select additional skills to add')
                : isAddMoreSkillsMode
                ? (selected.length > 0 ? `${selected.length} skill${selected.length !== 1 ? 's' : ''} will be added to your profile` : 'Select additional skills to add')
                : (selected.length > 0 ? `${selected.length} skill${selected.length !== 1 ? 's' : ''} selected` : 'Select at least one skill to continue')}
            </Text>

            <View ref={timelineContainerRef} style={{ position: 'relative' }}>
              {timelineEndY != null ? (
                <View style={{ position: 'absolute', left: 16, top: 14, height: Math.max(0, timelineEndY - 14), width: 2.5, backgroundColor: COLORS.black, zIndex: 10 }} />
              ) : (
                <View style={{ position: 'absolute', left: 16, top: 14, bottom: 0, width: 2.5, backgroundColor: COLORS.black, zIndex: 10 }} />
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
                      setTimelineEndY(y + 11);
                    } else {
                      const lastRowHeight = 48;
                      setTimelineEndY(y + height - 12 - (lastRowHeight / 2));
                    }
                  } : undefined}
                >
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
                  >
                    <View style={{ width: 17.25 }} />
                    <View style={{ width: 18, height: 2.5, backgroundColor: COLORS.black, marginRight: 8, zIndex: 10 }} />
                    <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.gray[900] }}>{tierName}</Text>
                  </View>

                  <View>
                    {(tierSkills || []).map((skill, idx: number) => {
                      const hasEligible = eligibleSet && eligibleSet.size > 0;
                      const skillIdStr = String(skill.id || '');
                      const mongoIdStr = String(skill.mongoId || '');
                      const isInEligibleSet = eligibleSet?.has(skill.id) ||
                                              eligibleSet?.has(mongoIdStr) ||
                                              eligibleSet?.has(skillIdStr);
                      const locked = hasEligible ? !isInEligibleSet : false;
                      const hasAssessment = skillsWithAssessments.has(mongoIdStr) || skillsWithAssessments.has(skill.id);
                      const isDisabled = locked || hasAssessment;
                      const isSelected = selected.includes(skill.id);
                      const isLastSkill = idx === (tierSkills.length - 1);
                      
                      return (
                        <View 
                          key={skill.id} 
                          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, position: 'relative' }}
                        >
                          <View style={{ position: 'absolute', left: 7.25, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
                            {locked ? (
                              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.black, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white }}>
                                <Ionicons name="lock-closed" size={12} color={COLORS.black} />
                              </View>
                            ) : hasAssessment ? (
                              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#10B981', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white }}>
                                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                              </View>
                            ) : (
                              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.black, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white }}>
                                {isSelected ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND }} /> : null}
                              </View>
                            )}
                          </View>
                          <View style={{ width: 32 }} />

                          <TouchableOpacity
                            activeOpacity={isDisabled ? 0.6 : 0.7}
                            onPress={() => {
                              if (isDisabled) {
                                if (hasAssessment) {
                                  setSelectedSkillName(skill.name);
                                  setShowAssessmentMessage(true);
                                }
                              } else {
                                handleToggleSkill(skill.id);
                              }
                            }}
                            style={{
                              flex: 1,
                              backgroundColor: isDisabled ? COLORS.gray[50] : (isSelected ? '#E6F2FF' : COLORS.white),
                              borderRadius: BORDER_RADIUS.lg,
                              paddingVertical: 12,
                              paddingHorizontal: 14,
                              borderWidth: 1,
                              borderColor: isDisabled ? COLORS.border.light : (isSelected ? BRAND : COLORS.border.light),
                              opacity: isDisabled ? 0.6 : 1
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: '700', color: isDisabled ? COLORS.text.disabled : COLORS.gray[900] }} numberOfLines={1}>
                                  {skill.name}
                                </Text>
                                <Text style={{ marginTop: 4, fontSize: 12, color: isDisabled ? COLORS.text.disabled : COLORS.text.tertiary }} numberOfLines={1}>
                                  {skill?.category || ''}
                                </Text>
                              </View>
                              {hasAssessment && (
                                <View style={{ marginLeft: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#D1FAE5', borderRadius: 12 }}>
                                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#059669' }}>Completed</Text>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
            </View>

        {error && (
            <View style={{
              backgroundColor: "#FEF2F2",
              borderLeftWidth: 4,
              borderLeftColor: COLORS.errorDark,
                padding: 16,
                borderRadius: BORDER_RADIUS.md,
                marginTop: 16
            }}>
              <Text style={{
                color: COLORS.errorDark,
                  fontSize: 14,
                fontWeight: "500"
              }}>
                {error}
              </Text>
            </View>
        )}

          </ScrollView>

          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: SCREEN_WIDTH * 0.06, paddingTop: 12, paddingBottom: 12, zIndex: 1000, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border.medium }}>
            <TouchableOpacity
              onPress={handleContinue}
              activeOpacity={0.85}
              disabled={!canContinue || busy}
              style={{ backgroundColor: BRAND, borderRadius: BORDER_RADIUS['2xl'], alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginHorizontal: 6, opacity: (!canContinue || busy) ? 0.6 : 1 }}
            >
              <Text style={{ color: COLORS.white, fontSize: SCREEN_WIDTH * 0.038, fontWeight: '600' }}>Continue</Text>
            </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showAssessmentMessage}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowAssessmentMessage(false)}
      >
        <BlurView intensity={100} tint="dark" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: BORDER_RADIUS.xl,
            padding: SCREEN_WIDTH * 0.06,
            marginHorizontal: SCREEN_WIDTH * 0.06,
            maxWidth: 400,
            width: '100%',
            alignItems: 'center'
          }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#D1FAE5',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <Ionicons name="checkmark-circle" size={32} color="#10B981" />
            </View>
            
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: COLORS.gray[900],
              textAlign: 'center',
              marginBottom: 8
            }}>
              Assessment Already Completed
            </Text>
            
            <Text style={{
              fontSize: 15,
              color: COLORS.text.secondary,
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 22
            }}>
              You've already completed an assessment for <Text style={{ fontWeight: '600', color: COLORS.gray[900] }}>{selectedSkillName}</Text>. Please select a different skill to assess.
            </Text>
            
            <TouchableOpacity
              onPress={() => setShowAssessmentMessage(false)}
              style={{
                backgroundColor: BRAND,
                paddingVertical: 12,
                paddingHorizontal: 32,
                borderRadius: BORDER_RADIUS.md,
                width: '100%',
                alignItems: 'center'
              }}
              activeOpacity={0.8}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: COLORS.white
              }}>
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}
