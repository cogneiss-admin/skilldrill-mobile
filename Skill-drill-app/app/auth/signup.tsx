// @ts-nocheck
import React, { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, TextInput } from "react-native-paper";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

const BRAND = "#0A66C2";

export default function SignupScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const sendOtp = async () => {
    if (busy) return;
    const value = phone.replace(/\s|-/g, "");
    if (!/^\+?\d{8,15}$/.test(value)) return;
    try {
      setBusy(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({ pathname: "/auth/otp", params: { phone: value } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0B0F14" }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 28 }}>
        <Text variant="headlineLarge" style={{ fontWeight: "800", color: "#fff", letterSpacing: 0.3 }}>
          Sign Up
        </Text>
        <Text style={{ marginTop: 6, color: "#cbd5e1" }}>
          Create your Skill Drill account
        </Text>

        <View style={{ height: 24 }} />
        <TextInput
          mode="outlined"
          label="Mobile Number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          style={{ backgroundColor: "#0f1620" }}
          textColor="#e2e8f0"
        />

        <View style={{ height: 18 }} />
        <Button
          mode="contained"
          onPress={sendOtp}
          loading={busy}
          disabled={busy}
          contentStyle={{ height: 52 }}
          style={{ borderRadius: 26 }}
        >
          Send OTP
        </Button>
      </View>
    </SafeAreaView>
  );
}


