// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, TextInput } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) return;
    const t = setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);
  const reset = () => setRemaining(seconds);
  return { remaining, reset } as const;
}

export default function OtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const { remaining, reset } = useCountdown(30);

  const masked = useMemo(() => {
    if (!phone) return "";
    const clean = String(phone).replace(/\D/g, "");
    if (clean.length < 4) return phone as string;
    const tail = clean.slice(-4);
    return `••• ••${tail}`;
  }, [phone]);

  const verifyOtp = async () => {
    if (busy) return;
    if (!/^\d{4,6}$/.test(otp)) {
      Alert.alert("Invalid OTP", "Enter the 4-6 digit code sent to your phone.");
      return;
    }
    try {
      setBusy(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Call backend to verify OTP. On success, proceed to collect basic info.
      router.replace("/home");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (remaining > 0) return;
    await Haptics.selectionAsync();
    reset();
    Alert.alert("OTP Sent", "We have re-sent the OTP to your phone.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0B0F14" }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 28 }}>
        <Text variant="headlineLarge" style={{ fontWeight: "800", color: "#fff" }}>
          OTP Verification
        </Text>
        <Text style={{ marginTop: 6, color: "#cbd5e1" }}>
          Enter the code sent to {masked}
        </Text>

        <View style={{ height: 24 }} />
        <TextInput
          mode="outlined"
          label="One-Time Password"
          keyboardType="number-pad"
          value={otp}
          onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 6))}
          style={{ backgroundColor: "#0f1620" }}
          textColor="#e2e8f0"
        />

        <View style={{ height: 18 }} />
        <Button
          mode="contained"
          onPress={verifyOtp}
          loading={busy}
          disabled={busy}
          contentStyle={{ height: 52 }}
          style={{ borderRadius: 26 }}
        >
          Verify & Continue
        </Button>

        <View style={{ height: 16 }} />
        <Button
          mode="text"
          onPress={resend}
          disabled={remaining > 0}
        >
          Resend OTP {remaining > 0 ? `in ${remaining}s` : ""}
        </Button>
      </View>
    </SafeAreaView>
  );
}


