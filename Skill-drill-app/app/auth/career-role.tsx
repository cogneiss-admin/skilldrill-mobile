// @ts-nocheck
import React, { useMemo, useState, useEffect } from "react";
import { View, Pressable, ScrollView, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { StatusBar } from "expo-status-bar";
import { AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../hooks/useAuth";

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";
const logoSrc = require("../../assets/images/logo.png");

type CareerStage = "ENTRY_LEVEL" | "MID_LEVEL" | "EXPERIENCED";
type RoleType = "INDIVIDUAL_CONTRIBUTOR" | "TEAM_LEADER_MANAGER" | "SENIOR_LEADER_EXECUTIVE";

const careerOptions: Array<{ key: CareerStage; label: string; sub?: string; emoji: string }> = [
  { key: "ENTRY_LEVEL", label: "Entry-Level (0-3 Years)", sub: "Starting out, learning and growing", emoji: "🌱" },
  { key: "MID_LEVEL", label: "Mid-Level (4-10 Years)", sub: "Building expertise and impact", emoji: "🚀" },
  { key: "EXPERIENCED", label: "Experienced (11+ Years)", sub: "Leading with depth and vision", emoji: "🏆" },
];

const roleOptions: Array<{ key: RoleType; label: string; sub?: string; emoji: string }> = [
  { key: "INDIVIDUAL_CONTRIBUTOR", label: "Individual Contributor", sub: "Hands-on, craft-focused", emoji: "🎯" },
  { key: "TEAM_LEADER_MANAGER", label: "Team Leader / Manager", sub: "Leads people and delivery", emoji: "🧑‍🤝‍🧑" },
  { key: "SENIOR_LEADER_EXECUTIVE", label: "Senior Leader / Executive", sub: "Owns strategy and outcomes", emoji: "👑" },
];

export default function CareerRoleScreen() {
  const router = useRouter();
  const { updateProfile, checkAuthStatus } = useAuth();
  const [careerStage, setCareerStage] = useState<CareerStage | null>(null);
  const [roleType, setRoleType] = useState<RoleType | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const canContinue = useMemo(() => !!careerStage && !!roleType, [careerStage, roleType]);

  // Check if user already has career info set
  useEffect(() => {
    const checkCareerInfo = async () => {
      try {
        const { authService } = await import("../../services/authService");
        const userData = await authService.getUserData();
        
        if (userData?.career_stage && userData?.role_type) {
          console.log('✅ Career-role: User already has career info, checking next step...');
          
          // User already has career info, but let's check what they should do next
          // If they have onboarding_step set, follow that logic
          if (userData.onboarding_step === 'CAREER_ROLE_COMPLETED' || userData.onboarding_step === 'SKILLS_SELECTED') {
            console.log('📋 Career-role: User has proper onboarding step, redirecting to skills');
            router.replace("/auth/skills");
          } else {
            console.log('🔧 Career-role: Updating onboarding step for legacy user');
            // Legacy user - update their onboarding step
            try {
              await updateProfile({
                onboarding_step: 'CAREER_ROLE_COMPLETED'
              });
              router.replace("/auth/skills");
            } catch (error) {
              console.error('❌ Failed to update onboarding step:', error);
              router.replace("/auth/skills");
            }
          }
          return;
        }
        
        // Pre-populate if partial data exists
        if (userData?.career_stage) {
          setCareerStage(userData.career_stage as CareerStage);
        }
        if (userData?.role_type) {
          setRoleType(userData.role_type as RoleType);
        }
      } catch (error) {
        console.error('Error checking career info:', error);
      } finally {
        setLoading(false);
      }
    };

    checkCareerInfo();
  }, [router, updateProfile]);

  const handleSave = async () => {
    if (!canContinue || busy) return;
    try {
      console.log('🎯 Career-role: Starting profile update...');
      console.log('📊 Career-role: Selected values:', { careerStage, roleType });
      
      setBusy(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Update profile using AuthContext with onboarding step
      console.log('🔄 Career-role: Calling updateProfile...');
      await updateProfile({
        career_stage: careerStage,
        role_type: roleType,
        onboarding_step: 'CAREER_ROLE_COMPLETED'
      });
      console.log('✅ Career-role: Profile update successful');

      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      
      // Add a small delay to ensure state updates complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force a refresh of the auth state to ensure onboarding completion is detected
      console.log('🔄 Career-role: Refreshing auth state...');
      await checkAuthStatus();
      
      console.log('🚀 Career-role: Navigating to skills selection...');
      try {
        router.replace("/auth/skills");
        console.log('✅ Career-role: Navigation to skills initiated');
      } catch (navigationError) {
        console.error('❌ Career-role: Navigation error:', navigationError);
        // Fallback navigation
        console.log('🔄 Career-role: Trying fallback navigation...');
        router.push("/auth/skills");
      }
    } catch (error) {
      console.error('❌ Career-role: Profile update error:', error);
      // You might want to show an error message to the user here
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
        <StatusBar style="light" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#ffffff", fontSize: 16 }}>Loading...</Text>
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
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 18 }}>
          <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 480 }}>
            <Text style={{ fontSize: 24, fontWeight: "900", color: "#ffffff" }}>Let’s tailor Skill Drill to you</Text>
            <Text style={{ marginTop: 8, color: "#E6F2FF", fontSize: 15 }}>Pick what matches your journey</Text>
          </MotiView>
        </View>
      </View>

      {/* Content card */}
      <View style={{ flex: 1, marginTop: -24 }}>
        <View style={{ flex: 1, backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 18, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16 }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 140, maxWidth: 560, width: '100%', alignSelf: 'center' }} showsVerticalScrollIndicator={false}>
            {/* Career Stage - vertical cards */}
            <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 420 }}>
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#0f172a", marginBottom: 10 }}>Career Stage</Text>
              {careerOptions.map((o, idx) => {
                const selected = careerStage === o.key;
                return (
                  <MotiView key={o.key} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 350, delay: idx * 60 }} style={{ marginBottom: 12 }}>
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={async () => { setCareerStage(o.key); try { await Haptics.selectionAsync(); } catch {} }}
                      style={({ pressed }) => ({
                        width: '100%',
                        paddingVertical: 16,
                        paddingHorizontal: 14,
                        borderRadius: 16,
                        backgroundColor: "#ffffff",
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? BRAND : "#E5E7EB",
                        shadowColor: "#000",
                        shadowOpacity: pressed ? 0.12 : 0.06,
                        shadowRadius: pressed ? 12 : 8,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      })}
                    >
                      {selected ? (
                        <LinearGradient colors={["#E6F2FF", "#ffffff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0, borderRadius: 16 }} />
                      ) : null}
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ fontSize: 22, marginRight: 10 }}>{o.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: "#0f172a", fontSize: 15, fontWeight: "900" }}>{o.label}</Text>
                          {o.sub ? <Text style={{ color: "#64748b", marginTop: 4 }}>{o.sub}</Text> : null}
                        </View>
                        {selected ? <AntDesign name="checkcircle" size={22} color="#16A34A" /> : null}
                      </View>
                    </Pressable>
                  </MotiView>
                );
              })}
            </MotiView>

            {/* Role Type - vertical cards */}
            <View style={{ height: 18 }} />
            <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 420, delay: 100 }}>
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#0f172a", marginBottom: 10 }}>Current Role Type</Text>
              {roleOptions.map((o, idx) => {
                const selected = roleType === o.key;
                return (
                  <MotiView key={o.key} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 340, delay: idx * 70 }} style={{ marginBottom: 12 }}>
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={async () => { setRoleType(o.key); try { await Haptics.selectionAsync(); } catch {} }}
                      style={({ pressed }) => ({
                        width: '100%',
                        paddingVertical: 16,
                        paddingHorizontal: 14,
                        borderRadius: 16,
                        backgroundColor: "#ffffff",
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? BRAND : "#E5E7EB",
                        shadowColor: "#000",
                        shadowOpacity: pressed ? 0.12 : 0.06,
                        shadowRadius: pressed ? 12 : 8,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      })}
                    >
                      {selected ? (
                        <LinearGradient colors={["#E6F2FF", "#ffffff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0, borderRadius: 16 }} />
                      ) : null}
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ fontSize: 22, marginRight: 10 }}>{o.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: "#0f172a", fontSize: 15, fontWeight: "900" }}>{o.label}</Text>
                          {o.sub ? <Text style={{ color: "#64748b", marginTop: 4 }}>{o.sub}</Text> : null}
                        </View>
                        {selected ? <AntDesign name="checkcircle" size={22} color="#16A34A" /> : null}
                      </View>
                    </Pressable>
                  </MotiView>
                );
              })}
            </MotiView>
          </ScrollView>

          {/* Sticky footer CTA */}
          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 20 }}>
            <LinearGradient colors={["#0A66C2", "#0E75D1", "#1285E0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0, opacity: 0.1 }} />
            <Button
              mode="contained"
              onPress={handleSave}
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


