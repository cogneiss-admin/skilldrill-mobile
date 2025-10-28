// @ts-nocheck
import React, { useMemo, useState, useEffect, useRef } from "react";
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
import { apiService } from "../../services/api";
import CareerSkeleton from "../components/CareerSkeleton";

// Use centralized API service (avoids base URL mismatches)

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";
const logoSrc = require("../../assets/images/logo.png");

type CareerLevel = {
  id: string;
  name: string;
  description?: string;
  order: number;
};

type RoleType = {
  id: string;
  name: string;
  description?: string;
  order: number;
};

const defaultCareerOptions = [
  { name: "Entry Level", description: "0-2 years experience", sub: "Starting out, learning and growing" },
  { name: "Mid Level", description: "2-5 years experience", sub: "Building expertise and impact" },
  { name: "Senior Level", description: "5+ years experience", sub: "Leading with depth and vision" },
];

const defaultRoleOptions = [
  { name: "Individual Contributor", description: "Hands-on, craft-focused" },
  { name: "Team Leader / Manager", description: "Leads people and delivery" },
  { name: "Senior Leader / Executive", description: "Owns strategy and outcomes" },
];

export default function CareerRoleScreen() {
  const router = useRouter();
  const { updateProfile, checkAuthStatus } = useAuth();
  const [careerLevels, setCareerLevels] = useState<CareerLevel[]>([]);
  const [selectedCareerLevel, setSelectedCareerLevel] = useState<CareerLevel | null>(null);
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([]);
  const [selectedRoleType, setSelectedRoleType] = useState<RoleType | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add refs to prevent multiple calls
  const hasCheckedCareerInfo = useRef(false);
  const hasUpdatedProfile = useRef(false);

// Fetch career levels via centralized API client
const fetchCareerLevels = async (): Promise<CareerLevel[]> => {
  try {
    const res = await apiService.get<CareerLevel[]>(`/career-levels`);
    return (res?.data as unknown as CareerLevel[]) || [];
  } catch (error) {
    console.warn('Failed to fetch career levels, using defaults:', (error as any)?.message || error);
  }
  // Fallback defaults
  return defaultCareerOptions.map((option, index) => ({
    id: `default-${index}`,
    name: option.name,
    description: option.description,
    order: index + 1
  }));
};

// Fetch role types via centralized API client
const fetchRoleTypes = async (): Promise<RoleType[]> => {
  try {
    if ((apiService as any).fetchRoleTypes) {
      const res = await (apiService as any).fetchRoleTypes();
      return (res?.data as unknown as RoleType[]) || [];
    }
    const res = await apiService.get<RoleType[]>(`/role-types`);
    return (res?.data as unknown as RoleType[]) || [];
  } catch (error) {
    console.warn('Failed to fetch role types, using defaults:', (error as any)?.message || error);
  }
  // Fallback defaults
  return defaultRoleOptions.map((option, index) => ({
    id: `default-${index}`,
    name: option.name,
    description: option.description,
    order: index + 1
  }));
};

  const canContinue = useMemo(() => !!selectedCareerLevel && !!selectedRoleType, [selectedCareerLevel, selectedRoleType]);

  // Fetch career levels and role types on component mount
  useEffect(() => {
    const loadData = async () => {
      const [levels, types] = await Promise.all([
        fetchCareerLevels(),
        fetchRoleTypes()
      ]);
      setCareerLevels(levels);
      setRoleTypes(types);
    };
    loadData();
  }, []);

  // Check if user already has career info set
  useEffect(() => {
    const checkCareerInfo = async () => {
      // Prevent multiple calls
      if (hasCheckedCareerInfo.current) {
        return;
      }
      hasCheckedCareerInfo.current = true;

      try {
        const { authService } = await import("../../services/authService");
        const userData = await authService.getUserData();
        
        if (userData?.careerLevelId && userData?.roleTypeId) {
          console.log('✅ Career-role: User already has career info, checking next step...');
          
          // User already has career info, but let's check what they should do next
          // If they have onboardingStep set, follow that logic
          if (userData.onboardingStep === 'Completed') {
            console.log('📋 Career-role: User has proper onboarding step, redirecting to skills');
            router.replace("/auth/skills");
          } else {
            console.log('🔧 Career-role: Updating onboarding step for legacy user');
            // Legacy user - update their onboarding step
            if (!hasUpdatedProfile.current) {
              hasUpdatedProfile.current = true;
              try {
                await updateProfile({
                  onboardingStep: 'Pending'
                });
                router.replace("/auth/skills");
              } catch (error) {
                console.error('❌ Failed to update onboarding step:', error);
                router.replace("/auth/skills");
              }
            }
          }
          return;
        }
        
        // Only pre-populate if user has completed onboarding and has career info
        // For new users, don't pre-populate anything
        if (userData?.onboardingStep && userData?.careerLevel) {
          setSelectedCareerLevel(userData.careerLevel);
        }
        if (userData?.onboardingStep && userData?.roleType) {
          setSelectedRoleType(userData.roleType);
        }
      } catch (error) {
        console.error('Error checking career info:', error);
      } finally {
        setLoading(false);
      }
    };

    checkCareerInfo();
  }, []); // Remove dependencies to prevent infinite loops

  const handleSave = async () => {
    if (!canContinue || busy) return;
    
    // Prevent multiple calls
    if (hasUpdatedProfile.current) {
      return;
    }
    hasUpdatedProfile.current = true;
    
    try {
      console.log('🎯 Career-role: Starting profile update...');
      console.log('📊 Career-role: Selected values:', { selectedCareerLevel: selectedCareerLevel?.name, selectedRoleType: selectedRoleType?.name });
      
      setBusy(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Update profile using AuthContext with onboarding step
      console.log('🔄 Career-role: Calling updateProfile...');
      await updateProfile({
        careerLevelId: selectedCareerLevel?.id,
        roleType: selectedRoleType?.id,
        onboardingStep: 'Pending'
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
      // Reset the flag on error to allow retry
      hasUpdatedProfile.current = false;
      // You might want to show an error message to the user here
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
        <StatusBar style="light" />
        <CareerSkeleton />
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
              {careerLevels.map((level, idx) => {
                const defaultOption = defaultCareerOptions.find(opt => opt.name === level.name) || { sub: level.description || "" };
                const selected = selectedCareerLevel?.id === level.id;
                return (
                  <MotiView key={level.id} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 350, delay: idx * 60 }} style={{ marginBottom: 12 }}>
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={async () => { setSelectedCareerLevel(level); try { await Haptics.selectionAsync(); } catch {} }}
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
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: "#0f172a", fontSize: 15, fontWeight: "900" }}>{level.name}</Text>
                          {(level?.description || defaultOption?.sub) ? <Text style={{ color: "#64748b", marginTop: 4 }}>{level?.description || defaultOption?.sub}</Text> : null}
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
              {roleTypes.map((role, idx) => {
                const selected = selectedRoleType?.id === role.id;
                return (
                  <MotiView key={role.id} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 340, delay: idx * 70 }} style={{ marginBottom: 12 }}>
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={async () => { setSelectedRoleType(role); try { await Haptics.selectionAsync(); } catch {} }}
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
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: "#0f172a", fontSize: 15, fontWeight: "900" }}>{role.name}</Text>
                          {role?.description ? <Text style={{ color: "#64748b", marginTop: 4 }}>{role.description}</Text> : null}
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


