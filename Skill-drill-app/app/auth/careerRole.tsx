import React, { useMemo, useState, useEffect, useRef } from "react";
import { View, Pressable, ScrollView, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/Button";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { StatusBar } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/api";
import CareerSkeleton from "../components/CareerSkeleton";
import ErrorBanner from "../../components/ErrorBanner";

import { BRAND, LOGO_SRC } from '../components/Brand';
const APP_NAME = "Skill Drill";
const logoSrc = LOGO_SRC;
const { width } = Dimensions.get("window");

type CareerLevel = { id: string; name: string; description?: string; order: number };
type RoleType = { id: string; name: string; description?: string; order: number };

export default function CareerRoleScreen() {
  const router = useRouter();
  const { updateProfile, checkAuthStatus } = useAuth();
  const [careerLevels, setCareerLevels] = useState<CareerLevel[]>([]);
  const [selectedCareerLevel, setSelectedCareerLevel] = useState<CareerLevel | null>(null);
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([]);
  const [selectedRoleType, setSelectedRoleType] = useState<RoleType | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const hasCheckedCareerInfo = useRef(false);
  const hasUpdatedProfile = useRef(false);

  const fetchCareerLevels = async (): Promise<CareerLevel[]> => {
    const res = await apiService.get<CareerLevel[]>(`/career-levels`);
    return (res?.data as unknown as CareerLevel[]) || [];
  };

  const fetchRoleTypes = async (): Promise<RoleType[]> => {
    // Check if apiService has fetchRoleTypes method (it might not exist)
    const apiServiceWithRoleTypes = apiService as typeof apiService & { fetchRoleTypes?: () => Promise<{ data?: RoleType[] }> };
    if (apiServiceWithRoleTypes.fetchRoleTypes) {
      const res = await apiServiceWithRoleTypes.fetchRoleTypes();
      return (res?.data as RoleType[]) || [];
    }
    const res = await apiService.get<RoleType[]>(`/role-types`);
    return (res?.data as unknown as RoleType[]) || [];
  };

  const canContinue = useMemo(() => !!selectedCareerLevel && !!selectedRoleType, [selectedCareerLevel, selectedRoleType]);

  useEffect(() => {
    (async () => {
      try {
        setErrorMessage("");
        const [levels, types] = await Promise.all([fetchCareerLevels(), fetchRoleTypes()]);
        setCareerLevels(levels);
        setRoleTypes(types);
      } catch (e: unknown) {
        setErrorMessage(e?.message || 'Failed to load career information. Please try again.');
      }
    })();
  }, []);

  useEffect(() => {
    const checkCareerInfo = async () => {
      if (hasCheckedCareerInfo.current) return;
      hasCheckedCareerInfo.current = true;
      try {
        const { authService } = await import("../../services/authService");
        const userData = await authService.getUserData();
        if (userData?.careerLevelId && userData?.roleTypeId) {
          if (userData.onboardingStep === 'Completed') {
            router.replace("/auth/skills");
          } else if (!hasUpdatedProfile.current) {
            hasUpdatedProfile.current = true;
            try { await updateProfile({ onboardingStep: 'Pending' }); } catch {}
            router.replace("/auth/skills");
          }
          return;
        }
        if (userData?.onboardingStep && userData?.careerLevel) setSelectedCareerLevel(userData.careerLevel);
        if (userData?.onboardingStep && userData?.roleType) setSelectedRoleType(userData.roleType);
      } catch {}
      finally { setLoading(false); }
    };
    checkCareerInfo();
  }, []);

  const handleSave = async () => {
    if (!canContinue || busy || hasUpdatedProfile.current) return;
    hasUpdatedProfile.current = true;
    try {
      setBusy(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateProfile({
        careerLevelId: selectedCareerLevel?.id,
        roleType: selectedRoleType?.id,
        onboardingStep: 'Pending'
      });
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      await new Promise(r => setTimeout(r, 1000));
      await checkAuthStatus();
      router.replace("/auth/skills");
    } catch (e) {
      hasUpdatedProfile.current = false;
    } finally {
      setBusy(false);
    }
  };

  const careerStageOptions = useMemo(() => careerLevels.map(l => ({ id: l.id, title: l.name, subtitle: l.description || "" })), [careerLevels]);
  const roleOptions = useMemo(() => roleTypes.map(r => ({ id: r.id, title: r.name, subtitle: r.description || "" })), [roleTypes]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <StatusBar barStyle="dark-content" />
        <CareerSkeleton />
      </SafeAreaView>
    );
  }

  const renderOption = (item: { id: string; title: string; subtitle: string }, selectedId: string | null, onSelect: (id: string) => void) => (
    <TouchableOpacity
      style={[styles.optionContainer, selectedId === item.id && styles.optionSelected]}
      onPress={() => onSelect(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.optionTextContainer}>
        <Text style={styles.optionTitle}>{item.title}</Text>
        {!!item.subtitle && <Text style={styles.optionSubtitle}>{item.subtitle}</Text>}
      </View>
      <View style={[styles.radioOuter, selectedId === item.id && styles.radioOuterActive]}>
        {selectedId === item.id && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Onboarding</Text>
        </View>

        {/* Body wrapper with themed background */}
        <View style={styles.body}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {errorMessage ? (
            <View style={{ marginBottom: 12 }}>
              <ErrorBanner message={errorMessage} tone="error" />
            </View>
          ) : null}

          <Text style={styles.heading}>Let's tailor Skill Drill to you</Text>
          <Text style={styles.subHeading}>Pick what matches your journey</Text>

          <Text style={styles.sectionTitle}>Career Stage</Text>
          <View>
            {careerStageOptions.map((item) => (
              <View key={item.id}>
                {renderOption(item, selectedCareerLevel?.id || null, (id) => {
                  const found = careerLevels.find(l => l.id === id) || null;
                  setSelectedCareerLevel(found);
                })}
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Current Role Type</Text>
          <View>
            {roleOptions.map((item) => (
              <View key={item.id}>
                {renderOption(item, selectedRoleType?.id || null, (id) => {
                  const found = roleTypes.find(r => r.id === id) || null;
                  setSelectedRoleType(found);
                })}
              </View>
            ))}
          </View>

          {/* Spacer so content doesn't hide behind footer */}
          <View style={{ height: 96 }} />
        </ScrollView>
        {/* Sticky footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, !(selectedCareerLevel && selectedRoleType) && styles.continueDisabled]}
            disabled={!(selectedCareerLevel && selectedRoleType) || busy}
            onPress={handleSave}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, paddingHorizontal: width * 0.06 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: 'center', paddingVertical: 16, paddingHorizontal: width * 0.06, marginHorizontal: -(width * 0.06), borderBottomWidth: 1.5, borderBottomColor: "#D1D5DB" },
  headerTitle: { fontSize: width * 0.048, fontWeight: "700", color: "#0F172A", textAlign: 'center' },
  sectionBar: { height: 14, backgroundColor: '#F2F3F5', borderTopWidth: 1.5, borderTopColor: '#C5C9CF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginHorizontal: -(width * 0.06) },
  body: { flex: 1, backgroundColor: '#F3F4F6', marginHorizontal: -(width * 0.06), paddingHorizontal: width * 0.06 },
  scrollContent: { paddingTop: 16, paddingBottom: 24 },
  heading: { fontSize: width * 0.044, fontWeight: "700", color: "#1A1A1A", marginBottom: 2 },
  subHeading: { fontSize: width * 0.034, color: "#555", marginBottom: 16 },
  sectionTitle: { fontSize: width * 0.038, fontWeight: "600", color: "#0F172A", marginTop: 10, marginBottom: 8 },
  optionContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 10, borderWidth: 1, borderColor: "#D1D5DB", paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8, justifyContent: "space-between" },
  optionSelected: { borderColor: "#3B82F6", backgroundColor: "#EFF6FF" },
  optionTextContainer: { flex: 1, marginRight: 10 },
  optionTitle: { fontSize: width * 0.04, fontWeight: "500", color: "#111827" },
  optionSubtitle: { fontSize: width * 0.03, color: "#4B5563", marginTop: 2 },
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#6B7280", alignItems: "center", justifyContent: "center" },
  radioOuterActive: { borderColor: "#2563EB" },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2563EB" },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: width * 0.06, paddingVertical: 12, backgroundColor: '#FFFFFF', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#D1D5DB' },
  continueButton: { backgroundColor: BRAND, borderRadius: 22, alignItems: "center", justifyContent: "center", paddingVertical: 12, marginHorizontal: 6 },
  continueDisabled: { opacity: 0.6 },
  continueText: { color: "#fff", fontSize: width * 0.038, fontWeight: "600" },
});


