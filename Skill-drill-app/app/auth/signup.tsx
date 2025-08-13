// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, View, Image, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, TextInput } from "react-native-paper";
import ErrorBanner from "../../components/ErrorBanner";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { isValidEmail, isValidPhone } from "../../components/validators";
import { useSocialAuth } from "../../hooks/useSocialAuth";
import { StatusBar } from "expo-status-bar";
import { AntDesign } from "@expo/vector-icons";
import GoogleGIcon from "../../components/GoogleGIcon";
import CodeBoxes from "../../components/CodeBoxes";

const logoSrc = require("../../assets/images/logo.png");
const BRAND = "#0A66C2";
const COUNTRY_CODE = "+91";

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSheetVisible, setOtpSheetVisible] = useState(false);
  const [otpMode, setOtpMode] = useState<"email" | "phone">("email");
  const [otpTarget, setOtpTarget] = useState<string>("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [bulkVerifyMode, setBulkVerifyMode] = useState<'both' | 'email' | 'phone'>('both');
  const [otpSentEmail, setOtpSentEmail] = useState(false);
  const [otpSentPhone, setOtpSentPhone] = useState(false);
  const [resendRemaining, setResendRemaining] = useState(0);
  const { signInWithGoogle, signInWithLinkedIn, isLoading: socialLoading, isProviderAvailable } = useSocialAuth();
  const nameOk = useMemo(() => name.trim().length >= 2, [name]);
  const emailOk = useMemo(() => (email.trim() ? isValidEmail(email.trim()) : false), [email]);
  const phoneOk = useMemo(() => (phone.trim() ? isValidPhone(phone.trim()) : false), [phone]);
  const verifiedOk = emailVerified || phoneVerified; // verifying either is sufficient
  const canContinue = useMemo(() => nameOk && (emailOk || phoneOk), [nameOk, emailOk, phoneOk]);

  const handleContinue = async () => {
    if (!canContinue || busy) return;
    try {
      setBusy(true);
      setErrorMessage("");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // If not verified yet, trigger verification flow
      if (!verifiedOk) {
        await handleVerifyAll();
        return;
      }

      const { authService } = await import("../../services/authService");

      const digits = phone.replace(/\D/g, "");
      const fullPhone = phoneOk && digits ? `${COUNTRY_CODE}${digits}` : undefined;

      // Save locally and check if career info is needed
      await authService.updateUserProfile({
        name: name.trim(),
        email: emailOk ? email.trim() : undefined,
        phone_no: fullPhone,
      });

      // Check if user already has career info
      const userData = await authService.getUserData();
      if (userData?.career_stage && userData?.role_type) {
        // User already has career info, go directly to dashboard
        try { await Haptics.selectionAsync(); } catch {}
        router.replace("/dashboard");
      } else {
        // User needs to complete career info
        try { await Haptics.selectionAsync(); } catch {}
        router.push("/auth/career-role");
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Helpers to show masked contact info
  const maskEmail = (value: string) => {
    const [user, domain] = String(value).split('@');
    if (!domain || user.length <= 2) return value;
    return `${user[0]}•••${user.slice(-1)}@${domain}`;
  };
  const maskPhone = (value: string) => {
    const clean = String(value).replace(/\D/g, '');
    if (clean.length < 4) return value;
    return `+${clean.slice(0, -4).replace(/\d/g, '•')} ${clean.slice(-4)}`;
  };
  const buildOtpSentMessage = () => {
    const parts: string[] = [];
    if (phoneOk) parts.push(`phone number ${maskPhone(phone)}`);
    if (emailOk) parts.push(`email ${maskEmail(email.trim())}`);
    if (parts.length === 0) return '';
    return `We have sent OTP to your ${parts.join(' and ')}.`;
  };

  // Resend cooldown ticker
  useEffect(() => {
    if (resendRemaining <= 0) return;
    const t = setTimeout(() => setResendRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendRemaining]);

  const openOtpSheet = async (mode: "email" | "phone") => {
    if (mode === "email" && !emailOk) return;
    if (mode === "phone" && !phoneOk) return;
    
    const digits = phone.replace(/\D/g, "");
    const fullPhone = phoneOk && digits ? `${COUNTRY_CODE}${digits}` : undefined;
    const target = mode === "email" ? email.trim() : String(fullPhone || "");
    
    try {
      const { authService } = await import("../../services/authService");
      
      if (mode === "email") {
        try {
          // Call signup endpoint directly for email
          const resSignup = await authService.signupWithEmail({ 
            email: target, 
            name: name.trim(), 
            phone_no: fullPhone 
          });
          if (resSignup?.success) { 
            // Success - open OTP sheet
            setOtpMode(mode);
            setOtpDigits(["", "", "", "", "", ""]);
            setOtpError("");
            setOtpVerified(false);
            setOtpTarget(target);
            setOtpSheetVisible(true);
            setOtpSentEmail(true); 
            setResendRemaining(30); 
          }
        } catch (signupError: any) {
          if (signupError?.code === 'USER_EXISTS' || signupError?.code === 'USER_PENDING_VERIFICATION') {
            // User already exists - show error and redirect to login
            setErrorMessage(authService.handleAuthError(signupError));
            // Redirect to login after a short delay
            setTimeout(() => {
              router.push("/auth/login");
            }, 2000);
          } else {
            const friendly = authService.handleAuthError?.(signupError) || signupError?.message;
            setErrorMessage(friendly || 'Failed to send OTP');
          }
        }
      } else {
        try {
          // Call signup endpoint directly for phone
          const resSignup = await authService.signupWithPhone({ 
            phone_no: target, 
            name: name.trim(), 
            email: emailOk ? email.trim() : undefined 
          });
          if (resSignup?.success) { 
            // Success - open OTP sheet
            setOtpMode(mode);
            setOtpDigits(["", "", "", "", "", ""]);
            setOtpError("");
            setOtpVerified(false);
            setOtpTarget(target);
            setOtpSheetVisible(true);
            setOtpSentPhone(true); 
            setResendRemaining(30); 
          }
        } catch (signupError: any) {
          if (signupError?.code === 'USER_EXISTS' || signupError?.code === 'USER_PENDING_VERIFICATION') {
            // User already exists - show error and redirect to login
            setErrorMessage(authService.handleAuthError(signupError));
            // Redirect to login after a short delay
            setTimeout(() => {
              router.push("/auth/login");
            }, 2000);
          } else {
            const friendly = authService.handleAuthError?.(signupError) || signupError?.message;
            setErrorMessage(friendly || 'Failed to send OTP');
          }
        }
      }
    } catch (error: any) {
      const friendly = authService.handleAuthError?.(error) || error?.message;
      setErrorMessage(friendly || 'Failed to send OTP');
    }
  };

  // Bulk verify: send OTP to both email and phone if available; open sheet prioritizing phone
  const handleVerifyAll = async () => {
    if (!(emailOk || phoneOk)) return;
    try {
      setBulkVerifyMode('both');
      setErrorMessage("");
      const { authService } = await import("../../services/authService");
      const digits = phone.replace(/\D/g, "");
      const fullPhone = phoneOk && digits ? `${COUNTRY_CODE}${digits}` : undefined;
      
      // Try signup first for both email and phone
      let signupSuccess = false;
      let signupError = null;

      // Try email signup first
      if (emailOk) {
        try {
          const resSignupE = await authService.signupWithEmail({ email: email.trim(), name: name.trim(), phone_no: fullPhone });
          if (resSignupE?.success) { 
            signupSuccess = true;
            // Open sheet for email OTP
            setOtpMode('email');
            setOtpTarget(email.trim());
            setOtpDigits(["", "", "", "", "", ""]);
            setOtpError("");
            setOtpVerified(false);
            setOtpSheetVisible(true);
            setOtpSentEmail(true);
            setResendRemaining(30);
          }
        } catch (signupError: any) {
          if (signupError?.code === 'USER_EXISTS' || signupError?.code === 'USER_PENDING_VERIFICATION') {
            // User already exists - show error and redirect to login
            setErrorMessage(authService.handleAuthError(signupError));
            setOtpSheetVisible(false);
            // Redirect to login after a short delay
            setTimeout(() => {
              router.push("/auth/login");
            }, 2000);
            return;
          } else {
            // Other signup error - try phone signup if available
            signupError = signupError;
          }
        }
      }

      // If email signup failed, try phone signup
      if (!signupSuccess && fullPhone) {
        try {
          const resSignupP = await authService.signupWithPhone({ phone_no: fullPhone, name: name.trim(), email: emailOk ? email.trim() : undefined });
          if (resSignupP?.success) { 
            signupSuccess = true;
            // Open sheet for phone OTP
            setOtpMode('phone');
            setOtpTarget(String(fullPhone));
            setOtpDigits(["", "", "", "", "", ""]);
            setOtpError("");
            setOtpVerified(false);
            setOtpSheetVisible(true);
            setOtpSentPhone(true);
            setResendRemaining(30);
          }
        } catch (phoneSignupError: any) {
          if (phoneSignupError?.code === 'USER_EXISTS' || phoneSignupError?.code === 'USER_PENDING_VERIFICATION') {
            // User already exists - show error and redirect to login
            setErrorMessage(authService.handleAuthError(phoneSignupError));
            setOtpSheetVisible(false);
            // Redirect to login after a short delay
            setTimeout(() => {
              router.push("/auth/login");
            }, 2000);
            return;
          } else {
            // Other error - show the error
            setOtpError(authService.handleAuthError(phoneSignupError) || phoneSignupError?.message || 'Failed to send OTP');
          }
        }
      }

      // If both signup attempts failed and it's not due to existing user, show error
      if (!signupSuccess && signupError) {
        setOtpError(authService.handleAuthError(signupError) || signupError?.message || 'Failed to send OTP');
      }

    } catch (err: any) {
      setOtpError(err?.message || 'Failed to send OTP');
    }
  };

  // Resend handler
  const handleResend = async () => {
    if (otpBusy || resendRemaining > 0) return;
    try {
      const { authService } = await import("../../services/authService");
      const digits = phone.replace(/\D/g, "");
      const fullPhone = phoneOk && digits ? `${COUNTRY_CODE}${digits}` : undefined;
      const tasks: Promise<any>[] = [];

      // If both are available, resend to both; else fallback to current otpTarget
      if (emailOk) tasks.push(authService.resendOtp({ identifier: email.trim() }));
      if (fullPhone) tasks.push(authService.resendOtp({ identifier: fullPhone }));
      if (tasks.length === 0 && otpTarget) tasks.push(authService.resendOtp({ identifier: otpTarget }));

      const results = await Promise.allSettled(tasks);
      let anySuccess = false;
      let retryAfter = 30;
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value?.success) anySuccess = true;
        if (r.status === 'fulfilled' && (r.value?.data?.retry_after || r.value?.data?.retryAfter)) {
          retryAfter = Number(r.value?.data?.retry_after || r.value?.data?.retryAfter || retryAfter);
        }
        if (r.status === 'rejected' && (r.reason?.data?.retry_after || r.reason?.data?.retryAfter)) {
          retryAfter = Number(r.reason?.data?.retry_after || r.reason?.data?.retryAfter || retryAfter);
        }
      }
      setResendRemaining(retryAfter);
      setOtpError(anySuccess ? '' : 'Please wait before requesting a new code.');
    } catch (err: any) {
      const retry = Number(err?.data?.retry_after || err?.data?.retryAfter || 30);
      if (err?.code === 'OTP_RATE_LIMIT_EXCEEDED' || err?.status === 429) {
        setResendRemaining(retry);
        setOtpError('Too many requests. Please wait a bit and try again.');
      } else {
        setOtpError(err?.message || 'Failed to resend code');
      }
    }
  };

  const verifyOtpCode = async () => {
    if (otpBusy) return;
    const code = otpDigits.join("");
    if (!/^\d{6}$/.test(code)) return;
    try {
      setOtpBusy(true);
      setOtpError("");
      const { authService } = await import("../../services/authService");
      const res = await authService.verifyOtp({ identifier: otpTarget, otp: code });
      if (res.success) {
        try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        setOtpVerified(true);
        if (otpMode === "email") setEmailVerified(true);
        if (otpMode === "phone") setPhoneVerified(true);
        
        // Check if user already has career info
        const userData = res.data.user;
        if (userData?.career_stage && userData?.role_type) {
          // User already has career info, go directly to dashboard
          setTimeout(() => {
            setOtpSheetVisible(false);
            router.replace("/dashboard");
          }, 800);
        } else {
          // User needs to complete career info
          setTimeout(() => {
            setOtpSheetVisible(false);
            router.replace("/auth/career-role");
          }, 800);
        }
      } else {
        setOtpError(res.message || "Incorrect OTP");
      }
    } catch (err: any) {
      try {
        const { authService } = await import("../../services/authService");
        const friendly = authService.handleAuthError?.(err);
        if (friendly) {
          setOtpError(friendly);
        } else if (err?.code === 'INVALID_OTP') {
          setOtpError('Incorrect OTP');
        } else if (err?.code === 'OTP_EXPIRED') {
          setOtpError('OTP expired. Please request a new one.');
        } else if (err?.code === 'OTP_RATE_LIMIT_EXCEEDED' || err?.status === 429) {
          setOtpError('Too many attempts. Please wait a few minutes and try again.');
        } else {
          setOtpError(err?.message || 'Incorrect OTP');
        }
      } catch {
        setOtpError(err?.message || 'Incorrect OTP');
      }
    } finally {
      setOtpBusy(false);
    }
  };

  useEffect(() => {
    const code = otpDigits.join("");
    if (code.length === 6) {
      verifyOtpCode();
    } else if (otpError) {
      setOtpError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpDigits.join("")]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
      <StatusBar style="light" />

      {/* Header with back button */}
      <View style={{ 
        flexDirection: "row", 
        alignItems: "center", 
        paddingHorizontal: 16, 
        paddingVertical: 12,
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10
      }}>
        <Pressable 
          onPress={() => {
            console.log('🔙 Back button pressed from signup, going to login...');
            router.replace("/auth/login");
          }} 
          hitSlop={12} 
          style={({ pressed }) => ({
            padding: 8, 
            marginRight: 4,
            backgroundColor: pressed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
            borderRadius: 8,
            opacity: pressed ? 0.7 : 1
          })}
        >
          <AntDesign name="arrowleft" size={22} color="#ffffff" />
        </Pressable>
      </View>

      {/* Top half - Brand section like login (reduced height) */}
      <View style={{ 
        minHeight: 200,
        backgroundColor: BRAND,
        paddingHorizontal: 20,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}>
        {/* Decorative bubbles similar to login */}
        <View style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: BRAND,
        }}>
          <View style={{ position: "absolute", top: 50, right: 30, width: 40, height: 40, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20 }} />
          <View style={{ position: "absolute", top: 120, left: 40, width: 25, height: 25, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12.5 }} />
          <View style={{ position: "absolute", bottom: 100, right: 60, width: 30, height: 30, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 15 }} />
        </View>

        {/* Logo (slightly smaller) */}
        <Image
          source={logoSrc}
          style={{ width: 150, height: 150, marginBottom: 6, alignSelf: "center" }}
          resizeMode="contain"
        />
      </View>

      {/* Bottom half - White form section matching login (more space) */}
      <View style={{ flex: 1, backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 }}>
        <ScrollView
          contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 24, paddingBottom: 20, alignItems: "center", maxWidth: 560, width: '100%', alignSelf: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          {/* Heading */}
          <View style={{ width: "100%", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 }}>Create your account</Text>
            <Text style={{ fontSize: 16, color: "#666666", marginBottom: 24, textAlign: "center" }}>Enter your name and email or phone number</Text>
          </View>

          {/* Name */}
          <View style={{ width: "100%", marginBottom: 12 }}>
            <TextInput
              mode="outlined"
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              style={{ backgroundColor: "#ffffff" }}
              textColor="#333333"
              outlineColor="#e9ecef"
              activeOutlineColor={BRAND}
              contentStyle={{ fontSize: 16 }}
            />
          </View>

          {/* Email */}
          <View style={{ width: "100%", marginBottom: 12 }}>
            <TextInput
              mode="outlined"
              label="Email"
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              style={{ backgroundColor: "#ffffff" }}
              textColor="#333333"
              outlineColor="#e9ecef"
              activeOutlineColor={BRAND}
              contentStyle={{ fontSize: 16 }}
              right={undefined}
            />
          </View>

          {/* Phone */}
          <View style={{ width: "100%", marginBottom: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f8f9fa",
                borderWidth: 1,
                borderColor: "#e9ecef",
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 14,
                marginRight: 8,
                minWidth: 80,
                justifyContent: "center",
                gap: 6,
              }}>
                <Text style={{ fontSize: 20 }}>🇮🇳</Text>
                <Text style={{ fontSize: 16, color: "#111827", fontWeight: "700" }}>{COUNTRY_CODE}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  mode="outlined"
                  label="Mobile number"
                  placeholder="Enter mobile number"
                  keyboardType="number-pad"
                  textContentType="telephoneNumber"
                  value={phone}
                  maxLength={10}
                  onChangeText={(t) => {
                    const digits = String(t || '').replace(/\D/g, '').slice(0, 10);
                    setPhone(digits);
                  }}
                  style={{ backgroundColor: "#ffffff", height: 50 }}
                  textColor="#333333"
                  placeholderTextColor="#999999"
                  outlineColor="#e9ecef"
                  activeOutlineColor={BRAND}
                  contentStyle={{ paddingVertical: 0, fontSize: 16 }}
                  right={undefined}
                  theme={{ colors: { onSurfaceVariant: "#666666" } }}
                />
              </View>
            </View>
          </View>

          {/* Contact method validation message */}
          {!emailOk && !phoneOk && (email.trim() || phone.trim()) && (
            <View style={{ width: "100%", marginBottom: 8 }}>
              <Text style={{ color: "#DC2626", fontSize: 12, marginTop: 4 }}>
                Please provide a valid email address or phone number
              </Text>
            </View>
          )}



          {/* Continue */}
          <View style={{ width: "100%", marginTop: 8 }}>
            {errorMessage ? (
              <ErrorBanner message={errorMessage} tone="error" />
            ) : null}

            <Button
              mode="contained"
              onPress={handleContinue}
              loading={busy}
              disabled={!canContinue || busy}
              contentStyle={{ height: 50 }}
              style={{ borderRadius: 26, backgroundColor: BRAND, opacity: canContinue ? 1 : 0.7 }}
              labelStyle={{ fontWeight: "700" }}
            >
              {verifiedOk ? 'Continue' : 'Verify & Continue'}
            </Button>
          </View>

          {/* Inline verify links handle OTP; no extra buttons needed */}

          {/* Divider (reduced vertical spacing) */}
          <View style={{ 
            alignItems: "center", 
            flexDirection: "row", 
            marginTop: 14,
            marginBottom: 14, 
            width: "100%",
            maxWidth: 360,
          }}>
            <View style={{ flex: 1, height: 1, backgroundColor: "#e9ecef" }} />
            <Text style={{ marginHorizontal: 20, color: "#666666", fontSize: 14, fontWeight: "500" }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#e9ecef" }} />
          </View>

          {/* OAuth buttons - placed earlier and with tighter spacing */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 20, marginBottom: 12, width: "100%", alignItems: "center" }}>
            {isProviderAvailable('GOOGLE') && (
              <Pressable
                style={({ pressed }) => [
                  {
                    width: 56,
                    height: 56,
                    borderRadius: 9999,
                    backgroundColor: "transparent",
                    borderWidth: 2,
                    borderColor: "#d1d5db",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.12,
                    shadowRadius: 10,
                    elevation: 5,
                    opacity: socialLoading ? 0.6 : 1,
                  }
                ]}
                onPress={signInWithGoogle}
                disabled={socialLoading || busy}
              >
                <GoogleGIcon size={26} />
              </Pressable>
            )}

            {isProviderAvailable('LINKEDIN') && (
              <Pressable
                style={({ pressed }) => [
                  {
                    width: 56,
                    height: 56,
                    borderRadius: 9999,
                    backgroundColor: "transparent",
                    borderWidth: 2,
                    borderColor: "#d1d5db",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.12,
                    shadowRadius: 10,
                  elevation: 5,
                    opacity: socialLoading ? 0.6 : 1,
                  }
                ]}
                onPress={signInWithLinkedIn}
                disabled={socialLoading || busy}
              >
                <AntDesign name="linkedin-square" size={26} color="#0e76a8" />
              </Pressable>
            )}
          </View>
        </ScrollView>

        {/* OTP Bottom Sheet moved outside white card */}

        {/* Footer - Terms and login link */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 20, paddingTop: 10, backgroundColor: "#ffffff" }}>
          <Text style={{ fontSize: 12, color: "#999999", textAlign: "center", lineHeight: 18, marginBottom: 12 }}>
            By continuing, you agree to our{"\n"}
            <Text style={{ color: "#666666", textDecorationLine: "underline" }}>Terms of Service</Text>{" "}
            <Text style={{ color: "#666666", textDecorationLine: "underline" }}>Privacy Policy</Text>{" "}
            <Text style={{ color: "#666666", textDecorationLine: "underline" }}>Content Policy</Text>
          </Text>

          <Pressable 
            onPress={() => router.replace("/auth/login")}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }], paddingVertical: 8, alignItems: "center" }]}
          > 
            <Text style={{ color: "#666666", textAlign: "center", fontSize: 14, lineHeight: 20 }}>
              Already have an account? {" "}
              <Text style={{ color: BRAND, fontWeight: "600" }}>Log in</Text>
            </Text>
          </Pressable>
        </View>
      </View>

      {/* OTP Bottom Sheet overlay (renders over entire screen) */}
      {otpSheetVisible && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'flex-end' }}>
          <Pressable
            onPress={() => { if (!otpBusy) setOtpSheetVisible(false); }}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }}
          />
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', marginBottom: 12 }} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>Verify your contact</Text>
            <Text style={{ marginTop: 6, color: '#64748b' }}>{buildOtpSentMessage()}</Text>

            <View style={{ marginTop: 16, paddingBottom: 28 }}>
              <CodeBoxes
                length={6}
                value={otpDigits}
                onChange={(v) => { if (!otpVerified) setOtpDigits(v); }}
                color={otpError ? '#DC2626' : otpVerified ? '#16A34A' : BRAND}
              />
              <View style={{ minHeight: 24, justifyContent: 'center' }}>
                {otpError ? (
                  <Text style={{ color: '#DC2626', marginTop: 10, textAlign: 'center', fontWeight: '700' }}>{otpError}</Text>
                ) : otpVerified ? (
                  <Text style={{ color: '#16A34A', marginTop: 10, textAlign: 'center', fontWeight: '800' }}>Verified! Redirecting…</Text>
                ) : null}
              </View>
              {/* Resend */}
              <View style={{ alignItems: 'center', marginTop: 6 }}>
                <Text style={{ color: '#6B7280' }}>
                  Code not received?{' '}
                  <Text onPress={handleResend} style={{ color: resendRemaining > 0 ? '#9CA3AF' : BRAND, fontWeight: '800', textDecorationLine: 'underline' }}>
                    {resendRemaining > 0 ? `Resend in ${resendRemaining}s` : 'Resend'}
                  </Text>
                </Text>
              </View>
            </View>

            {/* No submit button; auto-verifies on 6th digit */}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// OTP Bottom Sheet portal rendered after SafeAreaView to avoid overlap with card footer
// Keeping it here for clarity – if needed we can lift this to a global portal later.
export function OtpSheetPortal() {
  return null;
}

