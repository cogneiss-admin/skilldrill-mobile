// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, View, Pressable, Text, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { StatusBar } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import CodeBoxes from "../../components/CodeBoxes";

import { useAuth } from "../../hooks/useAuth";

const BRAND = "#0A66C2";

function useCountdown(initialSeconds: number) {
  const [remaining, setRemaining] = useState(initialSeconds);
  useEffect(() => {
    if (remaining <= 0) return;
    const t = setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);
  const reset = () => setRemaining(initialSeconds);
  const setTo = (seconds: number) => setRemaining(seconds);
  return { remaining, reset, setTo } as const;
}

export default function OtpScreen() {
  console.log('🎯 OTP Screen loaded!');
  const router = useRouter();
  const { phone, email } = useLocalSearchParams<{ phone?: string; email?: string }>();
  const { verifyOtp: verifyOtpFromAuth } = useAuth();
  
  console.log('📱 OTP Screen params:', { phone, email });

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [verified, setVerified] = useState(false);
  const { remaining, reset, setTo } = useCountdown(30);
  const [focusIndex, setFocusIndex] = useState<number | undefined>(undefined);

  const refs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  const contactInfo = phone || email || "";
  const isEmail = !!email;
  
  console.log('📧 Contact info:', contactInfo, 'Is email:', isEmail);

  const masked = useMemo(() => {
    if (!contactInfo) return "";
    if (isEmail) {
      const [username, domain] = String(contactInfo).split("@");
      if (!domain) return contactInfo;
      if (username.length <= 2) return contactInfo;
      const maskedUsername = username[0] + "•••" + username.slice(-1);
      return `${maskedUsername}@${domain}`;
    }
    const clean = String(contactInfo).replace(/\D/g, "");
    if (clean.length < 4) return contactInfo;
    return `+${clean.slice(0, -4).replace(/\d/g, "•")} ${clean.slice(-4)}`;
  }, [contactInfo, isEmail]);

  const code = digits.join("");

  const handleChange = (index: number, value: string) => {
    const numeric = value.replace(/\D/g, "");
    // If user pasted full code into the first field
    if (index === 0 && numeric.length > 1) {
      const next = new Array(6).fill("");
      numeric.slice(0, 6).split("").forEach((d, i) => (next[i] = d));
      setDigits(next);
      const lastFilled = Math.min(numeric.length, 6) - 1;
      refs[lastFilled]?.current?.focus?.();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = numeric.slice(-1);
    setDigits(newDigits);
    if (numeric && index < 5) refs[index + 1]?.current?.focus?.();
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      refs[index - 1]?.current?.focus?.();
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
    }
  };

  const verifyOtp = useCallback(async () => {
    if (busy) return false;
    if (!/^\d{6}$/.test(code)) {
      setErrorMessage("Enter valid OTP");
      return false;
    }
    try {
      setBusy(true);
      setErrorMessage("");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await verifyOtpFromAuth(contactInfo, code);

      if (response.success) {
        try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        setVerified(true);

        const userData = response.data.user;
        
        if (userData?.onboardingStep === 'Completed') {
          setTimeout(() => {
            router.replace("/session-loading");
          }, 700);
        } else {
          setTimeout(() => {
            router.replace({ pathname: "/auth/careerRole", params: { phone, email } });
          }, 700);
        }
        return true;
      } else {
        setErrorMessage(response.message || "Incorrect OTP. Please try again.");
        return false;
      }
    } catch (error: any) {
      const isOtpRateLimited = error?.code === 'OTP_RATE_LIMIT_EXCEEDED' || /Too many OTP requests/i.test(error?.message || '');
      if (isOtpRateLimited) {
        const retryAfter = Number(error?.data?.retry_after || error?.data?.retryAfter || 300);
        setTo(retryAfter);
        setErrorMessage(`Too many OTP requests. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`);
      } else {
        setErrorMessage(error.message || "Incorrect OTP. Please try again.");
      }
      return false;
    } finally {
      setBusy(false);
    }
  }, [busy, code, contactInfo, email, phone, router, setTo, verifyOtpFromAuth]);

  // Auto-verify as soon as 6 digits are entered
  useEffect(() => {
    // Only attempt verification when all 6 digits are entered and not already verifying
    if (!verified && !busy && code.length === 6) {
      verifyOtp().then((ok) => {
        if (!ok) {
          // Reset code on failure so user can re-enter quickly
          setDigits(["", "", "", "", "", ""]);
          setFocusIndex(0);
        }
      });
    }
  }, [code, verified, busy, verifyOtp]);

  const resend = useCallback(async () => {
    if (remaining > 0) return;
    
    try {
      await Haptics.selectionAsync();
      
      // Import auth service dynamically to avoid circular dependencies
      const { authService } = await import("../../services/authService");
      
      const response = await authService.resendOtp({
        identifier: contactInfo
      });
      
      if (response.success) {
        reset();
        Alert.alert("OTP Sent", `We have re-sent the OTP to your ${isEmail ? "email" : "mobile number"}.`);
      } else {
        // If server blocks due to rate limit, respect it with a 5-minute lockout (or provided retry time)
        const isOtpRateLimited = response?.code === 'OTP_RATE_LIMIT_EXCEEDED' || /Too many OTP requests/i.test(response?.message || '');
        if (isOtpRateLimited) {
          const retryAfter = Number(response?.data?.retry_after || response?.data?.retryAfter || 300);
          setTo(retryAfter);
          Alert.alert("Please wait", `Too many OTP requests. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`);
        } else {
          Alert.alert("Error", response.message || "Failed to resend OTP");
        }
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      const isOtpRateLimited = error?.code === 'OTP_RATE_LIMIT_EXCEEDED' || /Too many OTP requests/i.test(error?.message || '');
      if (isOtpRateLimited) {
        const retryAfter = Number(error?.data?.retry_after || error?.data?.retryAfter || 300);
        setTo(retryAfter);
        Alert.alert("Please wait", `Too many OTP requests. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`);
      } else {
        Alert.alert("Error", error.message || "Failed to resend OTP");
      }
    }
  }, [remaining, contactInfo, isEmail, reset, setTo]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 12 }}>
        <Pressable 
          onPress={() => {
            console.log('🔙 Back button pressed, attempting to go back...');
            try {
              // Try to go back first
              router.back();
              console.log('✅ Back navigation initiated');
            } catch (error) {
              console.error('❌ Back navigation failed:', error);
              // Fallback: go to login screen
              console.log('🔄 Falling back to login screen...');
              router.replace('/auth/login');
            }
          }} 
          hitSlop={12} 
          style={({ pressed }) => ({
            padding: 8, 
            marginRight: 12,
            backgroundColor: pressed ? '#e5e7eb' : '#f3f4f6',
            borderRadius: 8,
            opacity: pressed ? 0.7 : 1
          })}
        >
          <AntDesign name="left" size={22} color="#111827" />
        </Pressable>
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#111827", marginLeft: 8 }}>OTP Verification</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          {/* Info */}
          <View style={{ alignItems: "center", marginTop: 24 }}>
            <Text style={{ fontSize: 16, color: "#374151", textAlign: "center" }}>
              We have sent a verification code to
            </Text>
            <Text style={{ marginTop: 8, fontSize: 18, fontWeight: "800", color: "#111827" }}>{masked}</Text>
          </View>

          {/* OTP boxes */}
          <View style={{ marginTop: 28 }}>
            <CodeBoxes
              length={6}
              value={digits}
              onChange={(v) => {
                if (!verified) {
                  setDigits(v);
                  if (focusIndex !== undefined) setFocusIndex(undefined);
                  if (errorMessage) setErrorMessage("");
                }
              }}
              color={verified ? "#16A34A" : "#0A66C2"}
              error={!!errorMessage}
              focusIndex={focusIndex}
            />
            {errorMessage ? (
              <Text style={{ color: "#DC2626", marginTop: 10, textAlign: "center", fontWeight: "700" }}>{errorMessage}</Text>
            ) : verified ? (
              <Text style={{ color: "#16A34A", marginTop: 10, textAlign: "center", fontWeight: "700" }}>OTP verified! Redirecting…</Text>
            ) : null}
          </View>

          {/* Resend */}
          <View style={{ alignItems: "center", marginTop: 24 }}>
            <Text style={{ fontSize: 15, color: "#6B7280", fontWeight: '700' }}>
              Didn&apos;t get the OTP?{" "}
              <Text
                onPress={resend}
                style={{ color: remaining > 0 ? "#9CA3AF" : BRAND, fontWeight: "700" }}
              >
                {remaining > 0
                  ? `Resend ${isEmail ? 'email' : 'SMS'} in ${
                      Math.floor(remaining / 60) > 0
                        ? `${Math.floor(remaining / 60)}m ${String(remaining % 60).padStart(2, '0')}s`
                        : `${remaining}s`
                    }`
                  : `Resend ${isEmail ? 'email' : 'SMS'}`}
              </Text>
            </Text>
          </View>

          {/* No verify button needed; auto-verifies on 6th digit */}
        </View>

        {/* Bottom link */}
        <Pressable onPress={() => router.replace("/auth/login")} style={{ alignItems: "center", paddingVertical: 24 }}>
          <Text style={{ color: "#E23744", fontSize: 15, fontWeight: "700" }}>Go back to login methods</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

