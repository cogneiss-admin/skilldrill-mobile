import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, View, Pressable, Text, KeyboardAvoidingView, Platform, TextInput } from "react-native";
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

const OtpScreen = React.memo(() => {
  const router = useRouter();
  const responsive = useResponsive();
  const params = useLocalSearchParams<{ phone?: string; email?: string; sessionId?: string }>();
  const { verifyOtp: verifyOtpFromAuth } = useAuth();

  const phone = params.phone;
  const email = params.email;
  const sessionId = params.sessionId;

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [verified, setVerified] = useState(false);
  const { remaining, reset, setTo } = useCountdown(30);
  const [focusIndex, setFocusIndex] = useState<number | undefined>(undefined);

  const refs = [
    useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null),
    useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null)
  ];

  const contactInfo = useMemo(() => phone || email || "", [phone, email]);
  const isEmail = useMemo(() => !!email, [email]);

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

      // Use explicit object params to prevent parameter swapping
      const response = sessionId
        ? await verifyOtpFromAuth({ otp: code, sessionId })
        : await verifyOtpFromAuth({ otp: code, identifier: contactInfo });

      if (response.success) {
        try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        setVerified(true);

        const userData = response.data.user;

        if (userData?.onboardingStep === 'Completed') {
          setTimeout(() => {
            router.replace("/dashboard");
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

      const isLocked = errorObj?.code === 'OTP_LOCKED';
      const isRateLimited = errorObj?.code === 'OTP_RATE_LIMIT_EXCEEDED' || errorObj?.code === 'RATE_LIMIT_EXCEEDED';

      if (isLocked || isRateLimited) {
        const retryAfter = Number(errorObj?.data?.retry_after || errorObj?.data?.retryAfter || 300);
        setTo(retryAfter);
        setErrorMessage(errorObj?.message || `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`);
      } else {
        setErrorMessage(errorObj?.message || "Incorrect OTP. Please try again.");
      }
      return false;
    } finally {
      setBusy(false);
    }
  }, [busy, code, contactInfo, email, phone, router, sessionId, setTo, verifyOtpFromAuth]);

  useEffect(() => {
    if (!verified && !busy && code.length === 6) {
      verifyOtp().then((ok) => {
        if (!ok) {
          setDigits(["", "", "", "", "", ""]);
          setFocusIndex(0);
        }
      });
    }
  }, [code, verified, busy, verifyOtp]);

  const resend = useCallback(async () => {
    if (remaining > 0 || resending) return;

    try {
      setResending(true);
      setErrorMessage("");
      await Haptics.selectionAsync();

      const { authService } = await import("../../services/authService");

      const response = await authService.resendOtp(
        sessionId ? { sessionId } : { identifier: contactInfo }
      );

      if (response.success) {
        reset();
        setErrorMessage("");
      } else {
        const isLocked = response?.code === 'OTP_LOCKED';
        const isRateLimited = response?.code === 'OTP_RATE_LIMIT_EXCEEDED' || response?.code === 'RATE_LIMIT_EXCEEDED';

        if (isLocked || isRateLimited) {
          const retryAfter = Number(response?.data?.retry_after || response?.data?.retryAfter || 300);
          setTo(retryAfter);
          setErrorMessage(`Too many OTP requests. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`);
        } else {
          setErrorMessage(response.message || "Failed to resend OTP");
        }
      }
    } catch (error: unknown) {
      const errorObj = error as { code?: string; message?: string; data?: { retry_after?: number; retryAfter?: number } } | undefined;

      const isLocked = errorObj?.code === 'OTP_LOCKED';
      const isRateLimited = errorObj?.code === 'OTP_RATE_LIMIT_EXCEEDED' || errorObj?.code === 'RATE_LIMIT_EXCEEDED';

      if (isLocked || isRateLimited) {
        const retryAfter = Number(errorObj?.data?.retry_after || errorObj?.data?.retryAfter || 300);
        setTo(retryAfter);
        setErrorMessage(`Too many OTP requests. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`);
      } else {
        setErrorMessage(errorObj?.message || "Failed to resend OTP");
      }
    } finally {
      setResending(false);
    }
  }, [remaining, resending, contactInfo, sessionId, reset, setTo]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: SCREEN_BACKGROUND }}>
      <StatusBar barStyle="dark-content" />

      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: responsive.padding.xs, paddingVertical: responsive.padding.sm }}>
        <Pressable
          onPress={() => {
            try {
              router.back();
            } catch (error) {
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
          <View style={{ alignItems: "center", marginTop: responsive.margin.lg }}>
            <Text style={{ fontSize: responsive.typography.body1, color: COLORS.text.secondary, textAlign: "center" }}>
              We have sent a verification code to
            </Text>
            <Text style={{ marginTop: responsive.margin.xs, fontSize: responsive.typography.h4, fontWeight: "800", color: COLORS.gray[900] }}>{masked}</Text>
          </View>

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

          <View style={{ alignItems: "center", marginTop: responsive.margin.lg }}>
            <Text style={{ fontSize: responsive.typography.body2, color: COLORS.text.tertiary, fontWeight: '700' }}>
              Didn&apos;t get the OTP?{" "}
              <Text
                onPress={resend}
                style={{
                  color: (remaining > 0 || resending) ? COLORS.text.disabled : BRAND,
                  fontWeight: "700"
                }}
              >
                {resending
                  ? `Sending...`
                  : remaining > 0
                    ? `Resend ${isEmail ? 'email' : 'SMS'} in ${
                        Math.floor(remaining / 60) > 0
                          ? `${Math.floor(remaining / 60)}m ${String(remaining % 60).padStart(2, '0')}s`
                          : `${remaining}s`
                      }`
                    : `Resend ${isEmail ? 'email' : 'SMS'}`}
              </Text>
            </Text>
          </View>

        </View>

        <Pressable onPress={() => router.replace("/auth/login")} style={{ alignItems: "center", paddingVertical: responsive.padding.lg }}>
          <Text style={{ color: COLORS.error, fontSize: responsive.typography.body2, fontWeight: "700" }}>Go back to login methods</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
});

OtpScreen.displayName = 'OtpScreen';

export default OtpScreen;

