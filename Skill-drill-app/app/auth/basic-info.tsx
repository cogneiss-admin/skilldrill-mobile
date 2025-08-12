// @ts-nocheck
import React, { useMemo, useState } from "react";
import { View, Pressable, ScrollView, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, TextInput } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { isValidEmail, isValidPhone } from "../../components/validators";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { StatusBar } from "expo-status-bar";
import { AntDesign } from "@expo/vector-icons";

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";
const logoSrc = require("../../assets/images/logo.png");

// Career details moved to separate screen

export default function BasicInfoScreen() {
  const router = useRouter();
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

      // Save the basic info locally, then go to career-role screen
      const { authService } = await import("../../services/authService");
      await authService.updateUserProfile({
        name: fullName,
        email: emailId || undefined,
        phone_no: mobile || undefined,
      });

      try { await Haptics.selectionAsync(); } catch {}
      router.push("/auth/career-role");
    } catch (error: any) {
      console.error('Profile update error:', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
      <StatusBar style="light" />
      {/* Top brand header with animated title */}
      <View style={{ height: "35%", position: "relative" }}>
        <LinearGradient
          colors={["#0A66C2", "#0E75D1", "#1285E0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
        {/* Top-left brand */}
        <MotiView
          from={{ opacity: 0, translateY: -6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
          style={{ position: "absolute", top: 16, left: 16, right: 16 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={logoSrc} style={{ width: 50, height: 50 }} resizeMode="contain" />
            <Text style={{ marginLeft: 10, color: "#ffffff", fontSize: 18, fontWeight: "900", letterSpacing: 0.4 }}>{APP_NAME}</Text>
          </View>
        </MotiView>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 700 }}>
            <Text style={{ fontSize: 26, fontWeight: "900", color: "#ffffff", letterSpacing: 0.5, textAlign: "center" }}>Tell us about you</Text>
          </MotiView>
          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 700, delay: 150 }}>
            <Text style={{ marginTop: 8, color: "#EEF6FF", fontSize: 15, textAlign: "center" }}>We’ll personalize your experience.</Text>
          </MotiView>
          {/* Removed step label per request */}
        </View>
      </View>

      {/* Bottom white content with rounded corners */}
      <View style={{ flex: 1, backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
          {/* Section header (left-aligned) */}
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 450 }}
            style={{ marginBottom: 6 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 6, height: 22, borderRadius: 3, backgroundColor: BRAND }} />
              <Text style={{ marginLeft: 10, fontSize: 18, fontWeight: "900", color: "#0f172a" }}>Basic Information</Text>
            </View>
            <Text style={{ marginTop: 6, color: "#6B7280" }}>Please fill the following details</Text>
            <View style={{ height: 1, backgroundColor: "#E5E7EB", marginTop: 10 }} />
          </MotiView>

          {/* Inputs */}
          <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 500 }}>
            <TextInput mode="outlined" label="Full Name" value={fullName} onChangeText={setFullName} style={{ backgroundColor: "#ffffff", marginTop: 12 }} />
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
              style={{ backgroundColor: "#ffffff", marginTop: 12 }}
            />
            {emailError ? <Text style={{ color: "#DC2626", marginTop: 6 }}>{emailError}</Text> : null}
          </MotiView>

          <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 500, delay: 160 }}>
            <TextInput
              mode="outlined"
              label="Mobile Number"
              keyboardType="phone-pad"
              value={mobile}
              onChangeText={setMobile}
              error={!!mobileError}
              style={{ backgroundColor: "#ffffff", marginTop: 12 }}
            />
            {mobileError ? <Text style={{ color: "#DC2626", marginTop: 6 }}>{mobileError}</Text> : null}
          </MotiView>

          {/* Next step navigates to Career & Role */}

          {/* Continue Button */}
          <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 500, delay: 420 }}>
            <View style={{ height: 20 }} />
            <Button
              mode="contained"
              onPress={handleContinue}
              loading={busy}
              disabled={!canContinue || busy}
              contentStyle={{ height: 52 }}
              style={{ borderRadius: 26, backgroundColor: BRAND, opacity: canContinue ? 1 : 0.7 }}
              labelStyle={{ fontWeight: "700" }}
            >
              Next
            </Button>
          </MotiView>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}


