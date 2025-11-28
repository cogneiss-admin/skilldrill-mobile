import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, View, Pressable, Text, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CodeBoxes from "../../components/CodeBoxes";

import { useAuth } from "../../hooks/useAuth";
import { useResponsive } from "../../utils/responsive";
import { BRAND, SCREEN_BACKGROUND, COLORS, BORDER_RADIUS, SPACING } from "../components/Brand";

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
  const responsive = useResponsive();
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

  const handleKeyPress = (index: number, e: import('../../types/common').KeyboardEvent) => {
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
    } catch (error: unknown) {
      const errorObj = error as { code?: string; message?: string; data?: { retry_after?: number; retryAfter?: number } } | undefined;
      const isOtpRateLimited = errorObj?.code === 'OTP_RATE_LIMIT_EXCEEDED' || /Too many OTP requests/i.test(errorObj?.message || '');
      if (isOtpRateLimited) {
        const retryAfter = Number(errorObj?.data?.retry_after || errorObj?.data?.retryAfter || 300);
        setTo(retryAfter);
        setErrorMessage(`Too many OTP requests. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`);
      } else {
        setErrorMessage(errorObj?.message || "Incorrect OTP. Please try again.");
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
    } catch (error: unknown) {
      console.error('Resend OTP error:', error);
      const errorObj = error as { code?: string; message?: string; data?: { retry_after?: number; retryAfter?: number } } | undefined;
      const isOtpRateLimited = errorObj?.code === 'OTP_RATE_LIMIT_EXCEEDED' || /Too many OTP requests/i.test(errorObj?.message || '');
      if (isOtpRateLimited) {
        const retryAfter = Number(errorObj?.data?.retry_after || errorObj?.data?.retryAfter || 300);
        setTo(retryAfter);
        Alert.alert("Please wait", `Too many OTP requests. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`);
      } else {
        Alert.alert("Error", error.message || "Failed to resend OTP");
      }
    }
  }, [remaining, contactInfo, isEmail, reset, setTo]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: SCREEN_BACKGROUND }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: responsive.padding.xs, paddingVertical: responsive.padding.sm }}>
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
            padding: responsive.padding.xs,
            marginRight: responsive.margin.sm,
            backgroundColor: pressed ? COLORS.gray[200] : COLORS.gray[100],
            borderRadius: BORDER_RADIUS.md,
            opacity: pressed ? 0.7 : 1
          })}
        >
          <Ionicons name="chevron-back" size={responsive.size(22)} color={COLORS.gray[900]} />
        </Pressable>
        <Text style={{ fontSize: responsive.typography.h3, fontWeight: "700", color: COLORS.gray[900], marginLeft: responsive.margin.xs }}>OTP Verification</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: responsive.padding.lg }}>
          {/* Info */}
          <View style={{ alignItems: "center", marginTop: responsive.margin.lg }}>
            <Text style={{ fontSize: responsive.typography.body1, color: COLORS.text.secondary, textAlign: "center" }}>
              We have sent a verification code to
            </Text>
            <Text style={{ marginTop: responsive.margin.xs, fontSize: responsive.typography.h4, fontWeight: "800", color: COLORS.gray[900] }}>{masked}</Text>
          </View>

          {/* OTP boxes */}
          <View style={{ marginTop: responsive.margin.xl }}>
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
              color={verified ? COLORS.successDark : BRAND}
              error={!!errorMessage}
              focusIndex={focusIndex}
            />
            {errorMessage ? (
              <Text style={{ color: COLORS.errorDark, marginTop: responsive.spacing(10), textAlign: "center", fontWeight: "700" }}>{errorMessage}</Text>
            ) : verified ? (
              <Text style={{ color: COLORS.successDark, marginTop: responsive.spacing(10), textAlign: "center", fontWeight: "700" }}>OTP verified! Redirecting…</Text>
            ) : null}
          </View>

          {/* Resend */}
          <View style={{ alignItems: "center", marginTop: responsive.margin.lg }}>
            <Text style={{ fontSize: responsive.typography.body2, color: COLORS.text.tertiary, fontWeight: '700' }}>
              Didn&apos;t get the OTP?{" "}
              <Text
                onPress={resend}
                style={{ color: remaining > 0 ? COLORS.text.disabled : BRAND, fontWeight: "700" }}
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
        <Pressable onPress={() => router.replace("/auth/login")} style={{ alignItems: "center", paddingVertical: responsive.padding.lg }}>
          <Text style={{ color: COLORS.error, fontSize: responsive.typography.body2, fontWeight: "700" }}>Go back to login methods</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

