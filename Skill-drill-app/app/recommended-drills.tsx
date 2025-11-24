import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { apiService } from "../services/api";
import { useToast } from "../hooks/useToast";
import { useAnimation } from "../hooks/useAnimation";
import Button from "../components/Button";
import { PricingCard, PricingData } from "../components/PricingCard";
import { BRAND, BRAND_LIGHT, BRAND_ACCENT, TYPOGRAPHY, CARD, SPACING, COLORS, BORDER_RADIUS, SHADOWS, GRADIENTS } from "./components/Brand";

type RecommendationResponse = {
  id?: string; // Recommendation ID (legacy)
  recommendationId?: string; // Recommendation ID (current backend field)
  assessmentId: string;
  skillId?: string;
  skillName?: string;
  skillCategory?: string;
  finalScore?: number;
  recommendedNextSteps?: {
    drillPackSize?: number;
    reason?: string;
    ruleUsed?: {
      minScore?: number;
      maxScore?: number;
      drillCount?: number;
      policyId?: string;
      policyName?: string;
    };
    packagePricing?: {
      drillCount?: number;
      basePrice?: number;
      currency?: string;
      description?: string;
    };
    drills?: Array<{
      id?: string;
      name?: string;
      difficulty?: string;
      durationMinutes?: number;
      description?: string;
      scope?: string;
    }>;
  };
  recommendedDrills?: number;
  ruleUsed?: {
    minScore?: number;
    maxScore?: number;
    drillCount?: number;
    policyId?: string;
    policyName?: string;
  };
  status?: string;
  createdAt?: string;
  // New dynamic pricing structure
  pricing?: PricingData;
};

type DrillItem = {
  id: string;
  name: string;
  difficulty?: string;
  durationMinutes?: number;
  description?: string;
  scope?: string;
  locked?: boolean;
};

const deriveDrillItems = (
  recommendation: RecommendationResponse | null,
  skillName: string,
  drillCount: number
): DrillItem[] => {
  if (!recommendation) return [];

  const explicitDrills =
    recommendation.recommendedNextSteps?.drills ?? [];

  if (explicitDrills.length > 0) {
    return explicitDrills.map((drill, index) => ({
      id: drill.id || `drill-${index}`,
      name: drill.name || `Personalized Drill ${index + 1}`,
      difficulty: drill.difficulty,
      durationMinutes: drill.durationMinutes,
      description: drill.description,
      scope: drill.scope,
      locked: true,
    }));
  }

  // No drill payload returned yet – wait for assignment generation
  return [];
};

const normalizeDrillCount = (recommendation: RecommendationResponse | null): number => {
  if (!recommendation) return 0;
  return (
    recommendation.recommendedNextSteps?.drillPackSize ??
    recommendation.recommendedDrills ??
    recommendation.recommendedNextSteps?.ruleUsed?.drillCount ??
    recommendation.ruleUsed?.drillCount ??
    0
  );
};

// Get pricing data with fallback to old structure for backward compatibility
const getPricingData = (recommendation: RecommendationResponse | null): PricingData | null => {
  if (!recommendation) return null;

  // New pricing structure from backend
  const pricing = recommendation.pricing;
  if (pricing) {
    const drillCount = recommendation.recommendedDrills || 0;

    // Handle FIXED pricing mode
    if (pricing.pricingMode === 'FIXED') {
      return {
        finalPrice: pricing.totalPrice || 0,
        recommendedDrills: drillCount,
        validUntil: pricing.config?.expiresAt,
        calculation: {
          config: {
            pricingMode: 'FIXED',
            pricePerDrill: pricing.pricePerDrill,
          }
        }
      };
    }

    // Handle DYNAMIC pricing mode
    if (pricing.pricingMode === 'DYNAMIC') {
      return {
        finalPrice: pricing.pricing?.totalPrice || 0,
        recommendedDrills: drillCount,
        validUntil: pricing.config?.expiresAt,
        calculation: {
          config: {
            pricingMode: 'DYNAMIC',
            pricePerDrill: pricing.pricing?.finalCostPerDrill,
            marginType: pricing.pricing?.marginType,
            marginValue: pricing.pricing?.marginValue,
            bufferPercent: pricing.config?.bufferPercent,
          },
          tokenEstimation: {
            total: pricing.tokens?.breakdown?.scoring?.raw,
            totalWithBuffer: pricing.tokens?.totalWithBuffer,
            buffer: pricing.tokens?.buffer,
          },
          costCalculation: {
            baseCost: pricing.pricing?.baseCost,
            margin: pricing.pricing?.marginApplied,
            costPerDrill: pricing.pricing?.finalCostPerDrill,
            totalPrice: pricing.pricing?.totalPrice,
          }
        }
      };
    }
  }

  // Fallback to old structure (legacy)
  const oldPricing = recommendation.recommendedNextSteps?.packagePricing;
  if (oldPricing?.basePrice !== undefined) {
    return {
      finalPrice: oldPricing.basePrice,
      recommendedDrills: oldPricing.drillCount || recommendation.recommendedDrills || 0,
    };
  }

  return null;
};

const RecommendedDrillsScreen = () => {
  const { assessmentId: assessmentIdParam, skillName, finalScore } = useLocalSearchParams<{
    assessmentId?: string;
    skillName?: string;
    finalScore?: string;
  }>();
  const router = useRouter();
  const { showError, showInfo } = useToast();
  const isMountedRef = useRef(true);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [policyMissing, setPolicyMissing] = useState(false);
  const [existingAssignment, setExistingAssignment] = useState<any>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);

  const assessmentId = useMemo(() => {
    if (Array.isArray(assessmentIdParam)) return assessmentIdParam[0];
    return assessmentIdParam || '';
  }, [assessmentIdParam]);

  const resolvedSkillName = useMemo(() => {
    const backendSkill = recommendation?.skillName;
    return backendSkill || skillName || 'Your Skill';
  }, [recommendation?.skillName, skillName]);

  const resolvedScore = useMemo(() => {
    if (recommendation?.finalScore !== undefined) return recommendation.finalScore;
    const parsed = parseFloat(Array.isArray(finalScore) ? finalScore[0] : finalScore || '');
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [finalScore, recommendation?.finalScore]);

  const drillCount = useMemo(() => normalizeDrillCount(recommendation), [recommendation]);
  const drillItems = useMemo(() => deriveDrillItems(recommendation, resolvedSkillName, drillCount), [recommendation, resolvedSkillName, drillCount]);
  const pricingData = useMemo(() => getPricingData(recommendation), [recommendation]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const checkExistingDrills = useCallback(async (skillId: string) => {
    if (!skillId) return;

    setCheckingExisting(true);
    try {
      const response = await apiService.checkExistingDrills(skillId);
      if (!isMountedRef.current) return;

      if (response.success && response.data.exists) {
        console.log('✅ Found existing drill assignment:', response.data.assignment);
        setExistingAssignment(response.data.assignment);
      } else {
        setExistingAssignment(null);
      }
    } catch (err: unknown) {
      console.error('❌ Failed to check existing drills:', err);
      // Don't show error to user, just assume no existing drills
      setExistingAssignment(null);
    } finally {
      if (isMountedRef.current) {
        setCheckingExisting(false);
      }
    }
  }, []);

  const loadRecommendations = useCallback(async () => {
    if (!assessmentId) {
      setError('Missing assessment reference.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setPolicyMissing(false);

    try {
      const response = await apiService.getDrillRecommendations(assessmentId);
      if (!isMountedRef.current) return;

      if (response.success) {
        const recData = response.data as RecommendationResponse;
        setRecommendation(recData);
        setPolicyMissing(false);

        // Check if drills already exist for this skill
        if (recData.skillId) {
          await checkExistingDrills(recData.skillId);
        }
      } else {
        const message = response.message || 'Unable to fetch recommendations.';
        if (message.toLowerCase().includes('no active drill recommendation policy')) {
          setPolicyMissing(true);
          setRecommendation(null);
          showInfo('No active drill recommendation policy. Please contact your admin to activate one.');
        } else {
          setError(message);
          showError(message);
        }
      }
    } catch (err: unknown) {
      console.error('❌ Failed to load drill recommendations:', err);
      const message = err?.message || 'Failed to load recommendations. Please try again.';
      if (!isMountedRef.current) return;

      if (message.toLowerCase().includes('no active drill recommendation policy')) {
        setPolicyMissing(true);
        setRecommendation(null);
        showInfo('No active drill recommendation policy. Please contact your admin to activate one.');
      } else {
        setError(message);
        showError(message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [assessmentId, showError, showInfo, checkExistingDrills]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const { fadeIn, fadeAnim } = useAnimation();

  useEffect(() => {
    fadeIn();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleUnlockDrills = async () => {
    if (!recommendation) {
      showError('Recommendation data not available');
      return;
    }

    // If drills already exist, navigate to existing assignment
    if (existingAssignment) {
      console.log('🎯 Navigating to existing drill assignment:', existingAssignment.id);
      router.push({
        pathname: '/drillsScenarios',
        params: { assignmentId: existingAssignment.id }
      });
      return;
    }

    // Otherwise create new assignment
    try {
      const res = await apiService.createDrillAssignment({
        skillId: recommendation.skillId || '',
        source: 'DrillPack',
        recommendationId: recommendation.recommendationId || recommendation.id || assessmentId
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to create drill assignment');
      }

      const assignmentId = res.data.id;

      router.push({
        pathname: '/drillsScenarios',
        params: { assignmentId }
      });
    } catch (error: unknown) {
      console.error('Failed to unlock drills:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to unlock drills';
      showError(errorMessage);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator size="large" color={BRAND} />
          <Text style={{ marginTop: 16, color: '#4B5563' }}>Personalizing your drill path…</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#DC2626" />
          <Text style={{ marginTop: 16, color: '#B91C1C', fontWeight: '600' }}>{error}</Text>
          <TouchableOpacity
            onPress={loadRecommendations}
            style={{
              marginTop: 20,
              backgroundColor: BRAND,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (policyMissing) {
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 24 }}>
          <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#B91C1C" style={{ marginBottom: 16 }} />
          <Text style={{ color: '#B91C1C', fontWeight: '700', fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
            No active drill recommendation policy
          </Text>
          <Text style={{ color: '#B91C1C', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            Please ask your administrator to activate a drill recommendation policy, then try again.
          </Text>
          <TouchableOpacity
            onPress={loadRecommendations}
            activeOpacity={0.85}
            style={{
              borderWidth: 1,
              borderColor: '#B91C1C',
              paddingVertical: 12,
              paddingHorizontal: 28,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: '#B91C1C', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!recommendation) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <MaterialCommunityIcons name="cloud-question" size={52} color="#9CA3AF" />
          <Text style={{ marginTop: 16, color: '#4B5563', textAlign: 'center' }}>
            We couldn't generate a drill path just yet. Please try again later.
          </Text>
        </View>
      );
    }

    return (
      <View style={{ gap: SPACING.gap.lg }}>
        {existingAssignment && (
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 50 }}
          >
            <View
              style={{
                backgroundColor: '#EFF6FF',
                borderRadius: 16,
                padding: 16,
                borderLeftWidth: 4,
                borderLeftColor: BRAND,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="information-circle" size={20} color={BRAND} />
                <Text style={{ ...TYPOGRAPHY.subtitle, color: BRAND, marginLeft: 8, fontWeight: '700' }}>
                  You Already Have Drills
                </Text>
              </View>
              <Text style={{ color: '#1E40AF', fontSize: 14, lineHeight: 20 }}>
                You have {existingAssignment.total} drills for this skill ({existingAssignment.completed} completed).
                Tap "Continue Drills" to resume your practice.
              </Text>
            </View>
          </MotiView>
        )}

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 100 }}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 22,
              shadowColor: BRAND,
              shadowOpacity: 0.18,
              shadowOffset: { width: 0, height: 10 },
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs }}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={{ ...TYPOGRAPHY.overline, color: '#FFFFFF', opacity: 0.9, marginLeft: SPACING.xs }}>Your Path to Excellence</Text>
            </View>
            <Text style={{ marginTop: 12, fontSize: 28, fontWeight: '800', color: '#FFFFFF' }}>
              Amazing! You scored {resolvedScore !== undefined ? `${resolvedScore.toFixed(1)}/10` : '—'}
            </Text>
            <Text style={{ marginTop: 12, color: '#E0F2FE', lineHeight: 22, fontSize: 15 }}>
              Based on your performance, we've crafted a personalized drill plan to help you master {resolvedSkillName}.
            </Text>
          </LinearGradient>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 200 }}
        >
          <LinearGradient
            colors={['#8B5CF6', '#6C2BD9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 22, ...SHADOWS.lg }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
              <Ionicons name="bulb" size={20} color="#FFD700" />
              <Text style={{ ...TYPOGRAPHY.overline, color: '#C4B5FD', marginLeft: SPACING.xs }}>
                Personalized Recommendation
              </Text>
            </View>
            <Text style={{ marginTop: 12, fontSize: 26, fontWeight: '800', color: '#FFFFFF' }}>
              {drillCount} Practice Drill{drillCount === 1 ? '' : 's'}
            </Text>
            <Text style={{ marginTop: 8, fontSize: 16, color: '#EDE9FE', opacity: 0.9 }}>
              Designed specifically for {resolvedSkillName}
            </Text>
            {recommendation?.recommendedNextSteps?.reason && (
              <Text style={{ marginTop: 12, color: '#EDE9FE', lineHeight: 22, fontSize: 15 }}>
                💡 {recommendation.recommendedNextSteps.reason}
              </Text>
            )}
          </LinearGradient>
        </MotiView>

        {/* Pricing Card */}
        {pricingData && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 250 }}
          >
            <PricingCard
              pricing={pricingData}
              variant="expanded"
              showDetails={true}
            />
          </MotiView>
        )}

        <View style={{ gap: SPACING.gap.md }}>
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 300 }}
          >
            <Text style={{ ...TYPOGRAPHY.h2, color: COLORS.text.primary, marginBottom: SPACING.sm }}>
              What You'll Practice
            </Text>
          </MotiView>

          {drillItems.map((drill, index) => (
            <MotiView
              key={drill.id}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', delay: 400 + index * 100 }}
            >
              <View
                style={{
                  ...CARD.base,
                  padding: 20,
                  borderRadius: 20,
                  flexDirection: 'row',
                  gap: SPACING.gap.md,
                  alignItems: 'flex-start',
                }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: BRAND_LIGHT,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="target-variant" size={28} color={BRAND} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: SPACING.xs }}>{drill.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <View style={{ backgroundColor: '#EEF2FF', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 }}>
                      <Text style={{ color: '#4338CA', fontSize: 12, fontWeight: '600' }}>
                        {drill.scope || 'Global'}
                      </Text>
                    </View>
                    {drill.difficulty && (
                      <View style={{ backgroundColor: '#FDF2F8', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 }}>
                        <Text style={{ color: '#C026D3', fontSize: 12, fontWeight: '600' }}>
                          {drill.difficulty}
                        </Text>
                      </View>
                    )}
                  </View>
                  {drill.durationMinutes && (
                    <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="time-outline" size={16} color="#4B5563" />
                      <Text style={{ marginLeft: 4, color: '#4B5563', fontSize: 13 }}>
                        {drill.durationMinutes} min session
                      </Text>
                    </View>
                  )}
                  {drill.description && (
                    <Text style={{ marginTop: 8, color: '#4B5563', lineHeight: 20 }}>{drill.description}</Text>
                  )}
                </View>
              </View>
            </MotiView>
          ))}

          {drillItems.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <MaterialCommunityIcons name="clock-fast" size={48} color="#9CA3AF" />
              <Text style={{ marginTop: 16, color: '#6B7280', textAlign: 'center' }}>
                Drill scenarios load after your Pro access or drill pack purchase generates an assignment.
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" />
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={{
          fontSize: 18,
          fontWeight: '700',
          color: '#111827',
          flex: 1,
          textAlign: 'center',
          marginHorizontal: 16,
        }}>
          Your Recommended Drill Path
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

      {!isLoading && !error && !policyMissing && recommendation && (
        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 16,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          }}
        >
          {existingAssignment ? (
            <Button
              variant="gradient"
              size="large"
              onPress={handleUnlockDrills}
              icon="play-circle"
              fullWidth
              disabled={checkingExisting}
            >
              Continue Drills ({existingAssignment.completed}/{existingAssignment.total})
            </Button>
          ) : (
            <Button
              variant="gradient"
              size="large"
              onPress={handleUnlockDrills}
              icon="rocket"
              fullWidth
              disabled={checkingExisting}
            >
              Unlock All {drillCount} Drill{drillCount === 1 ? '' : 's'}
            </Button>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

export default RecommendedDrillsScreen;
