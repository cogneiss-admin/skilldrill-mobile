// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, View, Image, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, TextInput } from "react-native-paper";
import ErrorBanner from "../../components/ErrorBanner";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { isValidEmail } from "../components/validators";
import { useSocialAuth } from "../../hooks/useSocialAuth";
import { StatusBar } from "expo-status-bar";
import { AntDesign } from "@expo/vector-icons";
import GoogleGIcon from "../../components/GoogleGIcon";
import LinkedInIcon from "../../components/LinkedInIcon";
import CodeBoxes from "../../components/CodeBoxes";
import { BRAND } from "../components/Brand";
import { useCountries } from "../../hooks/useCountries";
const logoSrc = require("../../assets/images/logo.png");

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState("IN");
  const [selectedResidenceCountry, setSelectedResidenceCountry] = useState("IN");
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [residencePickerVisible, setResidencePickerVisible] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [residenceSearchQuery, setResidenceSearchQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const { countries, loading: countriesLoading } = useCountries();
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
  
  // Updated validation with country support
  const nameOk = useMemo(() => name.trim().length >= 2, [name]);
  const emailOk = useMemo(() => (email.trim() ? isValidEmail(email.trim()) : false), [email]);
  const phoneOk = useMemo(() => {
    if (!formattedPhoneNumber.trim()) return false;
    // Basic phone validation - at least 5 digits, max 15 digits
    const digitsOnly = formattedPhoneNumber.trim().replace(/[^0-9+]/g, "");
    return digitsOnly.length >= 7 && digitsOnly.length <= 17;
  }, [formattedPhoneNumber]);
  const verifiedOk = emailVerified || phoneVerified; // verifying either is sufficient
  const canContinue = useMemo(() => nameOk && (emailOk || phoneOk), [nameOk, emailOk, phoneOk]);
  
  // Get international phone number
  const internationalPhone = useMemo(() => {
    if (!formattedPhoneNumber.trim()) return "";
    const selectedCountry = countries.find(c => c.code === selectedCountryCode);
    const phoneCode = selectedCountry?.phoneCode || "+91";
    return `${phoneCode}${formattedPhoneNumber.trim()}`;
  }, [formattedPhoneNumber, selectedCountryCode, countries]);

  // Get selected country data
  const selectedPhoneCountry = useMemo(() => {
    return countries.find(c => c.code === selectedCountryCode) || { 
      code: "IN", 
      name: "India", 
      phoneCode: "+91", 
      flag: "https://flagcdn.com/w320/in.png" 
    };
  }, [countries, selectedCountryCode]);

  const selectedResidenceCountryData = useMemo(() => {
    return countries.find(c => c.code === selectedResidenceCountry);
  }, [countries, selectedResidenceCountry]);

  // Filter countries based on search queries
  const filteredPhoneCountries = useMemo(() => {
    if (!countrySearchQuery.trim()) return countries;
    const query = countrySearchQuery.toLowerCase().trim();
    return countries.filter(country => 
      country.name.toLowerCase().includes(query) || 
      country.phoneCode.includes(query) ||
      country.code.toLowerCase().includes(query)
    );
  }, [countries, countrySearchQuery]);

  const filteredResidenceCountries = useMemo(() => {
    if (!residenceSearchQuery.trim()) return countries;
    const query = residenceSearchQuery.toLowerCase().trim();
    return countries.filter(country => 
      country.name.toLowerCase().includes(query) || 
      country.code.toLowerCase().includes(query)
    );
  }, [countries, residenceSearchQuery]);

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

      // Save locally and check if career info is needed
      await authService.updateUserProfile({
        name: name.trim(),
        email: emailOk ? email.trim() : undefined,
        phoneNo: phoneOk ? internationalPhone : undefined,
        residenceCountryCode: selectedResidenceCountry,
        residenceCountryName: selectedResidenceCountryData?.name,
        region: selectedResidenceCountryData?.region,
      });

      // Check if user already has career info
      const userData = await authService.getUserData();
      if (userData?.careerLevelId && userData?.role_type) {
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
    return `${clean.slice(0, -4).replace(/\d/g, '•')}${clean.slice(-4)}`;
  };
  const buildOtpSentMessage = () => {
    const parts: string[] = [];
    if (phoneOk) parts.push(`phone number ${maskPhone(formattedPhoneNumber)}`);
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
    
    const target = mode === "email" ? email.trim() : internationalPhone;
    
    try {
      const { authService } = await import("../../services/authService");
      
      if (mode === "email") {
        try {
          // Call signup endpoint directly for email
          const resSignup = await authService.signupWithEmail({ 
            email: target, 
            name: name.trim(), 
            phoneNo: phoneOk ? internationalPhone : undefined,
            residenceCountryCode: selectedResidenceCountry,
            residenceCountryName: selectedResidenceCountryData?.name,
            region: selectedResidenceCountryData?.region,
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
            phoneNo: target, 
            name: name.trim(), 
            email: emailOk ? email.trim() : undefined,
            residenceCountryCode: selectedResidenceCountry,
            residenceCountryName: selectedResidenceCountryData?.name,
            region: selectedResidenceCountryData?.region,
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
      
      // Try signup first for both email and phone
      let signupSuccess = false;
      let signupError = null;

      // Try email signup first
      if (emailOk) {
        try {
          const resSignupE = await authService.signupWithEmail({ 
            email: email.trim(), 
            name: name.trim(), 
            phoneNo: phoneOk ? internationalPhone : undefined,
            residenceCountryCode: selectedResidenceCountry,
            residenceCountryName: selectedResidenceCountryData?.name,
            region: selectedResidenceCountryData?.region,
              });
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
        } catch (signupErrorCaught: any) {
          if (signupErrorCaught?.code === 'USER_EXISTS' || signupErrorCaught?.code === 'USER_PENDING_VERIFICATION') {
            // User already exists - show error and redirect to login
            setErrorMessage(authService.handleAuthError(signupErrorCaught));
            setOtpSheetVisible(false);
            // Redirect to login after a short delay
            setTimeout(() => {
              router.push("/auth/login");
            }, 2000);
            return;
          } else {
            // Other signup error - try phone signup if available
            signupError = signupErrorCaught;
          }
        }
      }

      // If email signup failed, try phone signup
      if (!signupSuccess && phoneOk) {
        try {
          const resSignupP = await authService.signupWithPhone({ 
            phoneNo: internationalPhone, 
            name: name.trim(), 
            email: emailOk ? email.trim() : undefined,
            residenceCountryCode: selectedResidenceCountry,
            residenceCountryName: selectedResidenceCountryData?.name,
            region: selectedResidenceCountryData?.region,
              });
          if (resSignupP?.success) { 
            signupSuccess = true;
            // Open sheet for phone OTP
            setOtpMode('phone');
            setOtpTarget(internationalPhone);
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
      const tasks: Promise<any>[] = [];

      // If both are available, resend to both; else fallback to current otpTarget
      if (emailOk) tasks.push(authService.resendOtp({ identifier: email.trim() }));
      if (phoneOk) tasks.push(authService.resendOtp({ identifier: internationalPhone }));
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
        if (userData?.careerLevelId && userData?.role_type) {
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
              style={{ backgroundColor: "#f8f9fa" }}
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
              style={{ backgroundColor: "#f8f9fa" }}
              textColor="#333333"
              outlineColor="#e9ecef"
              activeOutlineColor={BRAND}
              contentStyle={{ fontSize: 16 }}
              right={undefined}
            />
          </View>

          {/* Phone Number with International Picker */}
          <View style={{ width: "100%", marginBottom: 12 }}>
            <Text style={{ 
              fontSize: 14, 
              color: "#666666", 
              marginBottom: 8,
              fontWeight: "500"
            }}>
              Phone Number
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable 
                style={{ width: 100 }}
                onPress={() => setCountryPickerVisible(true)}
              >
                <View style={{
                  backgroundColor: "#f8f9fa",
                  borderWidth: 1,
                  borderColor: "#e9ecef",
                  borderRadius: 12,
                  minHeight: 56,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 8
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {selectedPhoneCountry.flag ? (
                      <Image 
                        source={{ uri: selectedPhoneCountry.flag }}
                        style={{ width: 16, height: 12, marginRight: 4 }}
                      />
                    ) : (
                      <View style={{ width: 16, height: 12, marginRight: 4, backgroundColor: '#f0f0f0' }} />
                    )}
                    <Text style={{
                      fontSize: 14,
                      color: "#333333"
                    }}>
                      {selectedPhoneCountry.phoneCode}
                    </Text>
                  </View>
                </View>
              </Pressable>
              <TextInput
                style={{
                  backgroundColor: "#f8f9fa",
                  borderWidth: 1,
                  borderColor: "#e9ecef", 
                  borderRadius: 12,
                  minHeight: 56,
                  fontSize: 16,
                  color: "#333333",
                  paddingHorizontal: 16,
                  flex: 1
                }}
                placeholder="Enter phone number"
                value={formattedPhoneNumber}
                onChangeText={setFormattedPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Country of Residence */}
          <View style={{ width: "100%", marginBottom: 12 }}>
            <Text style={{ 
              fontSize: 14, 
              color: "#666666", 
              marginBottom: 8,
              fontWeight: "500"
            }}>
              Country of Residence
            </Text>
            <Pressable 
              style={{
                backgroundColor: "#f8f9fa",
                borderWidth: 1,
                borderColor: "#e9ecef",
                borderRadius: 12,
                minHeight: 56,
                justifyContent: 'center',
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onPress={() => setResidencePickerVisible(true)}
            >
              <Text style={{
                fontSize: 16,
                color: "#333333"
              }}>
                {selectedResidenceCountryData?.name || "Select Country"}
              </Text>
              <Text style={{ fontSize: 12, color: "#999999" }}>▼</Text>
            </Pressable>
          </View>

          {/* Contact method validation message */}
          {!emailOk && !phoneOk && (email.trim() || formattedPhoneNumber.trim()) && (
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
                <LinkedInIcon size={26} />
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

      {/* Country Code Picker Modal */}
      {countryPickerVisible && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'flex-end' }}>
          <Pressable
            onPress={() => {
              setCountryPickerVisible(false);
              setCountrySearchQuery("");
            }}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }}
          />
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, maxHeight: '70%' }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', marginBottom: 12 }} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 16 }}>Select Country Code</Text>
            
            {/* Search Input */}
            <TextInput
              mode="outlined"
              placeholder="Search country..."
              value={countrySearchQuery}
              onChangeText={setCountrySearchQuery}
              style={{ 
                backgroundColor: "#f8f9fa",
                marginBottom: 12,
              }}
              textColor="#333333"
              placeholderTextColor="#999999"
              outlineColor="#e9ecef"
              activeOutlineColor={BRAND}
              contentStyle={{
                fontSize: 14,
              }}
              theme={{
                colors: {
                  onSurfaceVariant: "#666666",
                },
                roundness: 8,
              }}
              left={<TextInput.Icon icon="magnify" size={20} />}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
              {countriesLoading ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#666666' }}>Loading countries...</Text>
                </View>
              ) : filteredPhoneCountries.length > 0 ? (
                filteredPhoneCountries.map((country) => (
                <Pressable
                  key={country.code}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: pressed ? '#f3f4f6' : 'transparent',
                    borderRadius: 8
                  })}
                  onPress={() => {
                    setSelectedCountryCode(country.code);
                    setCountryPickerVisible(false);
                    setCountrySearchQuery("");
                  }}
                >
                  <Image 
                    source={{ uri: country.flag }}
                    style={{ width: 24, height: 18, marginRight: 12 }}
                  />
                  <Text style={{ fontSize: 16, color: '#333333', flex: 1 }}>{country.name}</Text>
                  <Text style={{ fontSize: 16, color: '#666666' }}>{country.phoneCode}</Text>
                </Pressable>
              ))) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#666666' }}>No countries found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Country of Residence Picker Modal */}
      {residencePickerVisible && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'flex-end' }}>
          <Pressable
            onPress={() => {
              setResidencePickerVisible(false);
              setResidenceSearchQuery("");
            }}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }}
          />
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, maxHeight: '70%' }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', marginBottom: 12 }} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 16 }}>Select Country of Residence</Text>
            
            {/* Search Input */}
            <TextInput
              mode="outlined"
              placeholder="Search country..."
              value={residenceSearchQuery}
              onChangeText={setResidenceSearchQuery}
              style={{ 
                backgroundColor: "#f8f9fa",
                marginBottom: 12,
              }}
              textColor="#333333"
              placeholderTextColor="#999999"
              outlineColor="#e9ecef"
              activeOutlineColor={BRAND}
              contentStyle={{
                fontSize: 14,
              }}
              theme={{
                colors: {
                  onSurfaceVariant: "#666666",
                },
                roundness: 8,
              }}
              left={<TextInput.Icon icon="magnify" size={20} />}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
              {countriesLoading ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#666666' }}>Loading countries...</Text>
                </View>
              ) : filteredResidenceCountries.length > 0 ? (
                filteredResidenceCountries.map((country) => (
                <Pressable
                  key={country.code}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: pressed ? '#f3f4f6' : 'transparent',
                    borderRadius: 8
                  })}
                  onPress={() => {
                    setSelectedResidenceCountry(country.code);
                    setResidencePickerVisible(false);
                    setResidenceSearchQuery("");
                  }}
                >
                  <Text style={{ fontSize: 16, color: '#333333' }}>{country.name}</Text>
                </Pressable>
              ))) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#666666' }}>No countries found</Text>
                </View>
              )}
            </ScrollView>
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

