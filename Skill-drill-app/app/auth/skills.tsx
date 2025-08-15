// @ts-nocheck
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Image, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useResponsive } from "../../utils/responsive";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/api";

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";
const logoSrc = require("../../assets/images/logo.png");

// Types for SkillSphere API responses
type Skill = {
  id: string;
  skill_id: string;
  name: string;
  description?: string;
  tier?: string;
  sub_skills_count?: number;
};

type SkillGroup = {
  title: string;
  skills: Skill[];
};

export default function SkillsScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const { updateOnboardingStep } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [error, setError] = useState("");

  const canContinue = useMemo(() => selected.length > 0, [selected]);

  // Load skills from backend and check if user already has skills
  const loadSkillsAndCheckProgress = useCallback(async () => {
      try {
        // Debug: Log API configuration
        console.log('🔍 Skills: API Configuration:', {
          platform: Platform.OS,
          apiBaseUrl: Constants.expoConfig?.extra?.API_BASE_URL || 'http://10.0.2.2:3000/api',
          isDev: __DEV__,
          constants: Constants.expoConfig?.extra
        });

        // First, test connection to backend
        try {
          console.log('🔍 Skills: Testing backend connection...');
          const healthResponse = await apiService.healthCheck();
          console.log('✅ Skills: Backend connection successful:', healthResponse);
        } catch (healthError: any) {
          console.error('❌ Skills: Backend connection failed:', healthError);
          setError('Cannot connect to server. Please check your internet connection and try again.');
          setLoading(false);
          return;
        }

        // First, check if user already has skills selected
        try {
          const userSkillsResponse = await apiService.get('/user/skills');
          if (userSkillsResponse.success && userSkillsResponse.data.length > 0) {
            console.log('✅ Skills: User already has skills selected, redirecting to dashboard');
            
            // Update onboarding step if needed
            try {
              await updateOnboardingStep('SKILLS_SELECTED');
            } catch (error) {
              console.error('❌ Failed to update onboarding step:', error);
            }
            
            // Redirect to dashboard
            router.replace("/dashboard");
            return;
          }
        } catch (userSkillsError: any) {
          // Check if this is an authentication error (401) or a network error
          if (userSkillsError.status === 401) {
            console.log('ℹ️ Skills: User not authenticated, proceeding with skill selection');
          } else if (userSkillsError.status === 404) {
            console.log('ℹ️ Skills: User has no skills selected yet, proceeding with skill selection');
          } else {
            console.log('ℹ️ Skills: Error checking user skills, proceeding with skill selection:', userSkillsError.message);
          }
        }
        
        // Load available skills for selection
        console.log('🔍 Skills: Loading skills from categories endpoint...');
        const response = await apiService.get('/skills/categories');
        
        console.log('🔍 Skills: Raw API response:', response);
        
        if (response.success) {
          console.log('✅ Skills: Successfully loaded', response.data.length, 'skill groups');
          
          // Validate that the data is in the expected format
          if (Array.isArray(response.data)) {
            setSkillGroups(response.data);
          } else {
            console.error('❌ Skills: Invalid data format received:', response.data);
            setError('Invalid data format received from server');
          }
        } else {
          console.error('❌ Skills: API returned error:', response.message);
          setError(response.message || 'Failed to load skills');
        }
      } catch (error: any) {
        console.error('Load skills error:', error);
        
        // Provide more specific error messages based on the error type
        if (error.status === 0) {
          // Network error
          setError('Cannot connect to server. Please check your internet connection and try again.');
        } else if (error.status === 500) {
          // Server error
          setError('Server error. Please try again later.');
        } else if (error.status === 404) {
          // Not found
          setError('Skills not found. Please try again later.');
        } else if (error.status === 401) {
          // Unauthorized
          setError('Authentication required. Please login again.');
        } else if (error.status === 403) {
          // Forbidden
          setError('Access denied. Please check your permissions.');
        } else if (error.code === 'TIMEOUT') {
          // Timeout
          setError('Request timeout. Please check your connection and try again.');
        } else {
          // Other errors
          setError(error.message || 'Failed to load skills. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }, [updateOnboardingStep, router]);

  // Handle retry action
  const handleRetry = useCallback(() => {
    setError("");
    setLoading(true);
    loadSkillsAndCheckProgress();
  }, [loadSkillsAndCheckProgress]);

  // Load skills on component mount
  useEffect(() => {
    loadSkillsAndCheckProgress();
  }, [loadSkillsAndCheckProgress]);

  const toggleSkill = async (skillId: string) => {
    try { await Haptics.selectionAsync(); } catch {}
    setSelected((prev) => {
      const has = prev.includes(skillId);
      if (has) return prev.filter((s) => s !== skillId);
      return [...prev, skillId];
    });
  };

  const handleContinue = async () => {
    if (!canContinue || busy) return;
    setBusy(true);
    try {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
      
      // Save selected skills to backend
      const response = await apiService.post('/user/skills', {
        skill_ids: selected
      });
      
      if (response.success) {
        console.log('✅ Skills saved successfully');
        
        // Update onboarding step to indicate skills have been selected
        try {
          await updateOnboardingStep('SKILLS_SELECTED');
          console.log('✅ Onboarding step updated to SKILLS_SELECTED');
        } catch (error) {
          console.error('❌ Failed to update onboarding step:', error);
          // Continue anyway, skills were saved successfully
        }
        
        // Redirect to dashboard (assessment is now optional)
        router.replace("/dashboard");
      } else {
        setError(response.message || 'Failed to save skills');
      }
    } catch (error) {
      console.error('Save skills error:', error);
      setError('Failed to save skills. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
        <StatusBar style="light" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: responsive.padding.lg }}>
          <Text style={{ color: "#ffffff", fontSize: responsive.typography.body1, marginBottom: responsive.spacing(16) }}>
            Loading skills...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
      <StatusBar style="light" />

      {/* Hero header */}
      <View style={{ minHeight: responsive.height(22), position: "relative" }}>
        <LinearGradient colors={["#0A66C2", "#0E75D1", "#1285E0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0 }} />
        <View style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          justifyContent: "flex-start", 
          paddingHorizontal: responsive.padding.lg, 
          paddingTop: responsive.padding.sm 
        }}>
          <Image source={logoSrc} style={{ width: responsive.size(48), height: responsive.size(48) }} resizeMode="contain" />
          <Text style={{ 
            marginLeft: responsive.spacing(10), 
            color: "#ffffff", 
            fontSize: responsive.typography.h4, 
            fontWeight: "900", 
            letterSpacing: 0.8 
          }}>{APP_NAME}</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: responsive.padding.lg }}>
          <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 480 }}>
            <Text style={{ 
              fontSize: responsive.typography.h3, 
              fontWeight: "900", 
              color: "#ffffff" 
            }}>Select your key skills</Text>
            <Text style={{ 
              marginTop: responsive.spacing(8), 
              color: "#E6F2FF", 
              fontSize: responsive.typography.body2 
            }}>Pick one or more skills to continue</Text>
          </MotiView>
        </View>
      </View>

      {/* Content card */}
      <View style={{ flex: 1, marginTop: responsive.spacing(-20) }}>
        <View style={{ 
          flex: 1, 
          backgroundColor: "#ffffff", 
          borderTopLeftRadius: responsive.size(24), 
          borderTopRightRadius: responsive.size(24), 
          paddingTop: responsive.padding.md 
        }}>
          <ScrollView 
            contentContainerStyle={{ 
              paddingHorizontal: responsive.padding.lg, 
              paddingBottom: responsive.spacing(140), 
              maxWidth: responsive.maxWidth.card, 
              width: "100%", 
              alignSelf: "center" 
            }} 
            showsVerticalScrollIndicator={false}
          >
            {/* Error message */}
            {error ? (
              <View style={{ 
                backgroundColor: "#fef2f2", 
                borderColor: "#fca5a5", 
                borderWidth: 1, 
                borderRadius: responsive.size(12), 
                padding: responsive.padding.md, 
                marginBottom: responsive.spacing(16) 
              }}>
                <Text style={{ color: "#dc2626", fontSize: responsive.typography.body2, fontWeight: "600", marginBottom: responsive.spacing(8) }}>
                  {error}
                </Text>
                <Pressable
                  onPress={handleRetry}
                  style={({ pressed }) => ({
                    backgroundColor: "#dc2626",
                    paddingVertical: responsive.padding.sm,
                    paddingHorizontal: responsive.padding.md,
                    borderRadius: responsive.size(8),
                    alignSelf: "flex-start",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ color: "#ffffff", fontSize: responsive.typography.body2, fontWeight: "600" }}>
                    Retry
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* Selected count */}
            {selected.length > 0 ? (
              <MotiView 
                from={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ type: "timing", duration: 300 }} 
                style={{ 
                  marginBottom: responsive.spacing(16),
                  backgroundColor: "#f0f9ff",
                  borderRadius: responsive.size(12),
                  padding: responsive.padding.md,
                  alignItems: "center"
                }}
              >
                <Text style={{ 
                  color: BRAND, 
                  fontSize: responsive.typography.body1, 
                  fontWeight: "700" 
                }}>
                  {selected.length} skill{selected.length !== 1 ? 's' : ''} selected
                </Text>
              </MotiView>
            ) : null}

            {/* Skill groups */}
            {skillGroups.map((group, gIdx) => (
              <MotiView 
                key={group.title} 
                from={{ opacity: 0, translateY: 8 }} 
                animate={{ opacity: 1, translateY: 0 }} 
                transition={{ type: "timing", duration: 420, delay: gIdx * 60 }} 
                style={{ marginBottom: responsive.spacing(20) }}
              >
                <Text style={{ 
                  fontSize: responsive.typography.h5, 
                  fontWeight: "900", 
                  color: "#0f172a", 
                  marginBottom: responsive.spacing(12) 
                }}>{group.title}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {group.skills.map((skill) => {
                    const isSelected = selected.includes(skill.id);
                    return (
                      <Pressable
                        key={skill.id}
                        onPress={() => toggleSkill(skill.id)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        style={({ pressed }) => ({
                          paddingVertical: responsive.padding.sm,
                          paddingHorizontal: responsive.padding.md,
                          borderRadius: responsive.size(18),
                          borderWidth: isSelected ? 2 : 1,
                          borderColor: isSelected ? BRAND : "#E5E7EB",
                          backgroundColor: isSelected ? "#F0F7FF" : "#ffffff",
                          marginRight: responsive.spacing(10),
                          marginBottom: responsive.spacing(10),
                          shadowColor: "#000",
                          shadowOpacity: pressed ? 0.12 : 0.06,
                          shadowRadius: pressed ? 10 : 6,
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                        })}
                      >
                        <Text style={{ 
                          color: "#0f172a", 
                          fontWeight: "700",
                          fontSize: responsive.typography.body2
                        }}>{skill.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </MotiView>
            ))}
          </ScrollView>

          {/* Sticky footer CTA */}
          <View style={{ 
            position: "absolute", 
            left: 0, 
            right: 0, 
            bottom: 0, 
            paddingHorizontal: responsive.padding.lg, 
            paddingTop: responsive.padding.sm, 
            paddingBottom: responsive.padding.lg 
          }}>
            <LinearGradient 
              colors={["#0A66C2", "#0E75D1", "#1285E0"]} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 1 }} 
              style={{ position: "absolute", inset: 0, opacity: 0.1 }} 
            />
            <Button
              mode="contained"
              onPress={handleContinue}
              loading={busy}
              disabled={!canContinue || busy}
              contentStyle={{ height: responsive.button.height }}
              style={{ 
                borderRadius: responsive.button.borderRadius, 
                backgroundColor: BRAND, 
                opacity: canContinue ? 1 : 0.7,
                maxWidth: responsive.maxWidth.form,
                alignSelf: 'center',
                width: '100%'
              }}
              labelStyle={{ 
                fontWeight: "800", 
                letterSpacing: 0.3,
                fontSize: responsive.button.fontSize
              }}
            >
              {busy ? "Saving..." : "Continue to Dashboard"}
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}


