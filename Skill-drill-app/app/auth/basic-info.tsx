import React, { useMemo, useState } from "react";
import { View, Pressable, ScrollView, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput } from "react-native-paper";
import Button from "../../components/Button";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { isValidEmail, isValidPhone } from "../components/validators";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { StatusBar } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { useResponsive } from "../../utils/responsive";
import { BRAND, GRADIENTS, LOGO_SRC, SCREEN_BACKGROUND, COLORS, BORDER_RADIUS, SPACING } from "../components/Brand";
const APP_NAME = "Skill Drill";
const logoSrc = LOGO_SRC;

export default function BasicInfoScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const { updateProfile } = useAuth();
  const { phone, email } = useLocalSearchParams<{ phone?: string; email?: string }>();

  const [fullName, setFullName] = useState("");
  const [emailId, setEmailId] = useState(String(email || ""));
  const [mobile, setMobile] = useState(String(phone || ""));
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const emailError = useMemo(() => {
    if (!emailId) return "";
    return isValidEmail(emailId) ? "" : "Enter a valid email";
  }, [emailId]);

  const mobileError = useMemo(() => {
    if (!mobile) return "";
    return isValidPhone(mobile) ? "" : "Enter a valid mobile number";
  }, [mobile]);

  const canContinue = useMemo(() => {
    const hasName = fullName.trim().length >= 2;
    const emailOk = emailId ? isValidEmail(emailId) : true;
    const phoneOk = mobile ? isValidPhone(mobile) : true;
    return hasName && emailOk && phoneOk;
  }, [fullName, emailId, mobile]);

  const handleContinue = async () => {
    if (!canContinue || busy) return;
    try {
      setBusy(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Save the basic info using AuthContext
      await updateProfile({
        name: fullName,
        email: emailId || undefined,
        phoneNo: mobile || undefined,
      });

      // Check if user already has career info
      const { authService } = await import("../../services/authService");
      const userData = await authService.getUserData();
      if (userData?.careerLevelId && userData?.roleTypeId) {
        // User already has career info, go directly to dashboard
        try { await Haptics.selectionAsync(); } catch {}
        router.replace("/dashboard");
      } else {
        // User needs to complete career info
        try { await Haptics.selectionAsync(); } catch {}
        router.push("/auth/careerRole");
      }
    } catch (error: unknown) {
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
      <StatusBar barStyle="light-content" />
      {/* Top brand header with animated title */}
      <View style={{ height: "35%", position: "relative" }}>
        <LinearGradient
          colors={GRADIENTS.onboarding}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
        {/* Top-left brand */}
        <MotiView
          from={{ opacity: 0, translateY: -6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
          style={{ position: "absolute", top: responsive.padding.md, left: responsive.padding.md, right: responsive.padding.md }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={logoSrc} style={{ width: responsive.size(50), height: responsive.size(50) }} resizeMode="contain" />
            <Text style={{ marginLeft: responsive.margin.sm, color: COLORS.white, fontSize: responsive.typography.h4, fontWeight: "900", letterSpacing: 0.4 }}>{APP_NAME}</Text>
          </View>
        </MotiView>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 700 }}>
            <Text style={{ fontSize: responsive.typography.h2, fontWeight: "900", color: COLORS.white, letterSpacing: 0.5, textAlign: "center" }}>Tell us about you</Text>
          </MotiView>
          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 700, delay: 150 }}>
            <Text style={{ marginTop: responsive.margin.xs, color: COLORS.text.inverse, fontSize: responsive.typography.body2, textAlign: "center" }}>We'll personalize your experience.</Text>
          </MotiView>
        </View>
      </View>

      {/* Bottom content with rounded corners */}
      <View style={{ flex: 1, backgroundColor: SCREEN_BACKGROUND, borderTopLeftRadius: BORDER_RADIUS['3xl'], borderTopRightRadius: BORDER_RADIUS['3xl'], marginTop: -20 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: responsive.padding.lg, paddingTop: responsive.padding.md, paddingBottom: responsive.padding.xl }} showsVerticalScrollIndicator={false}>
          {/* Section header (left-aligned) */}
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 450 }}
            style={{ marginBottom: responsive.margin.xs }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 6, height: 22, borderRadius: BORDER_RADIUS.sm, backgroundColor: BRAND }} />
              <Text style={{ marginLeft: responsive.margin.sm, fontSize: responsive.typography.h4, fontWeight: "900", color: COLORS.gray[900] }}>Basic Information</Text>
            </View>
            <Text style={{ marginTop: responsive.margin.xs, color: COLORS.text.tertiary }}>Please fill the following details</Text>
            <View style={{ height: 1, backgroundColor: COLORS.border.light, marginTop: responsive.margin.sm }} />
          </MotiView>

          {/* Inputs */}
          <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 500 }}>
            <TextInput mode="outlined" label="Full Name" value={fullName} onChangeText={setFullName} style={{ backgroundColor: COLORS.white, marginTop: responsive.margin.sm }} outlineColor={COLORS.border.light} activeOutlineColor={BRAND} theme={{ roundness: BORDER_RADIUS.lg }} />
          </MotiView>

          <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 500, delay: 80 }}>
            <TextInput
              mode="outlined"
              label="Email ID"
              autoCapitalize="none"
              keyboardType="email-address"
              value={emailId}
              onChangeText={setEmailId}
              error={!!emailError}
              style={{ backgroundColor: COLORS.white, marginTop: responsive.margin.sm }}
              outlineColor={COLORS.border.light}
              activeOutlineColor={BRAND}
              theme={{ roundness: BORDER_RADIUS.lg }}
            />
            {emailError ? <Text style={{ color: COLORS.errorDark, marginTop: responsive.margin.xs }}>{emailError}</Text> : null}
          </MotiView>

          <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 500, delay: 160 }}>
            <TextInput
              mode="outlined"
              label="Mobile Number"
              keyboardType="phone-pad"
              value={mobile}
              onChangeText={setMobile}
              error={!!mobileError}
              style={{ backgroundColor: COLORS.white, marginTop: responsive.margin.sm }}
              outlineColor={COLORS.border.light}
              activeOutlineColor={BRAND}
              theme={{ roundness: BORDER_RADIUS.lg }}
            />
            {mobileError ? <Text style={{ color: COLORS.errorDark, marginTop: responsive.margin.xs }}>{mobileError}</Text> : null}
          </MotiView>

          {/* Continue Button */}
          <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 500, delay: 420 }}>
            <View style={{ height: responsive.spacing(20) }} />
            <Button
              variant="primary"
              onPress={handleContinue}
              loading={busy}
              disabled={!canContinue || busy}
              size="large"
              style={{ borderRadius: BORDER_RADIUS['2xl'], backgroundColor: BRAND, opacity: canContinue ? 1 : 0.7 }}
            >
              Next
            </Button>
          </MotiView>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}


