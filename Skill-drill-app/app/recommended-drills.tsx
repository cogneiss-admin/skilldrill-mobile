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
import { BRAND, BRAND_LIGHT, BRAND_ACCENT, TYPOGRAPHY, CARD, SPACING, COLORS, BORDER_RADIUS, SHADOWS, GRADIENTS } from "./components/Brand";

type RecommendationResponse = {
  id?: string; // Recommendation ID
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

const formatPrice = (pricing?: RecommendationResponse["recommendedNextSteps"]["packagePricing"]): string | null => {
  if (!pricing) return null;
  const { basePrice, currency } = pricing;
  if (basePrice === undefined || basePrice === null) return null;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(basePrice);
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
  const priceLabel = useMemo(() => formatPrice(recommendation?.recommendedNextSteps?.packagePricing), [recommendation?.recommendedNextSteps?.packagePricing]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
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
        setRecommendation(response.data as RecommendationResponse);
        setPolicyMissing(false);
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
    } catch (err: any) {
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
  }, [assessmentId, showError, showInfo]);

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

  const handleUnlockDrills = () => {
    if (!recommendation) {
      showError('Recommendation data not available');
      return;
    }

    // Navigate to subscription screen with all necessary parameters
    router.push({
      pathname: '/subscriptionScreen',
      params: {
        skillId: recommendation.skillId || '',
        assessmentId: recommendation.assessmentId,
        recommendationId: recommendation.id || recommendation.assessmentId,
        drillCount: drillCount.toString()
      }
    });
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
            {priceLabel && (
              <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.2)' }}>
                <Ionicons name="pricetag" size={18} color="#C4B5FD" />
                <Text style={{ marginLeft: SPACING.xs, color: '#C4B5FD', fontWeight: '700', fontSize: 16 }}>
                  {priceLabel}
                </Text>
                <Text style={{ marginLeft: SPACING.xs, color: '#EDE9FE', opacity: 0.8 }}>
                  • {drillCount} drills included
                </Text>
              </View>
            )}
          </LinearGradient>
        </MotiView>

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
          <Button
            variant="gradient"
            size="large"
            onPress={handleUnlockDrills}
            icon="rocket"
            fullWidth
          >
            Unlock All {drillCount} Drill{drillCount === 1 ? '' : 's'}
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
};

export default RecommendedDrillsScreen;
