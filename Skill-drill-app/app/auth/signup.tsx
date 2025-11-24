import React, { useEffect, useMemo, useState } from "react";
import { Pressable, View, Image, ScrollView, Text, BackHandler } from "react-native";
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput } from "react-native-paper";
import Button from "../../components/Button";
import ErrorBanner from "../../components/ErrorBanner";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { isValidEmail } from "../components/validators";
import { useSocialAuth } from "../../hooks/useSocialAuth";
import { StatusBar } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import GoogleGIcon from "../../components/GoogleGIcon";
import LinkedInIcon from "../../components/LinkedInIcon";
import CodeBoxes from "../../components/CodeBoxes";
import { BRAND, LOGO_SRC } from "../components/Brand";
import { useResponsive } from "../../utils/responsive";
import CountryPickerModal from "../components/CountryPickerModal";
import { useCountries, getConvertedFlagUrl } from "../../hooks/useCountries";
const logoSrc = LOGO_SRC;

export default function SignupScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState("IN");
  const [selectedResidenceCountry, setSelectedResidenceCountry] = useState("IN");
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [residencePickerVisible, setResidencePickerVisible] = useState(false);
  // search handled inside CountryPickerModal
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
  const [emailSignupToken, setEmailSignupToken] = useState<string | null>(null);
  const [phoneSignupToken, setPhoneSignupToken] = useState<string | null>(null);
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
      flag: null 
    };
  }, [countries, selectedCountryCode]);


  const selectedResidenceCountryData = useMemo(() => {
    return countries.find(c => c.code === selectedResidenceCountry);
  }, [countries, selectedResidenceCountry]);

  // Country-code search handled inside CountryPickerModal

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
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setErrorMessage(errorMessage);
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
            phoneCountryCode: phoneOk ? (selectedPhoneCountry?.phoneCode || '').replace(/\s/g, '') : undefined,
            countryCode: phoneOk ? selectedPhoneCountry?.code : undefined,
            countryName: phoneOk ? selectedPhoneCountry?.name : undefined,
            residenceCountryCode: selectedResidenceCountry,
            residenceCountryName: selectedResidenceCountryData?.name,
            region: selectedResidenceCountryData?.region,
              });
          if (resSignup?.success) { 
            setEmailSignupToken((resSignup.data as { signupToken?: string })?.signupToken || null);
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
        } catch (signupError: unknown) {
          const errorObj = signupError as { code?: string; message?: string } | undefined;
          if (errorObj?.code === 'USER_EXISTS' || errorObj?.code === 'USER_PENDING_VERIFICATION') {
            // User already exists - show error and redirect to login
            setErrorMessage(authService.handleAuthError(signupError as Error));
            // Redirect to login after a short delay
            setTimeout(() => {
              router.push("/auth/login");
            }, 2000);
          } else {
            const friendly = authService.handleAuthError?.(signupError as Error) || errorObj?.message;
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
            phoneCountryCode: (selectedPhoneCountry?.phoneCode || '').replace(/\s/g, ''),
            countryCode: selectedPhoneCountry?.code,
            countryName: selectedPhoneCountry?.name,
            residenceCountryCode: selectedResidenceCountry,
            residenceCountryName: selectedResidenceCountryData?.name,
            region: selectedResidenceCountryData?.region,
              });
          if (resSignup?.success) { 
            setPhoneSignupToken((resSignup.data as { signupToken?: string })?.signupToken || null);
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
        } catch (signupError: unknown) {
          const errorObj = signupError as { code?: string; message?: string } | undefined;
          if (errorObj?.code === 'USER_EXISTS' || errorObj?.code === 'USER_PENDING_VERIFICATION') {
            // User already exists - show error and redirect to login
            setErrorMessage(authService.handleAuthError(signupError as Error));
            // Redirect to login after a short delay
            setTimeout(() => {
              router.push("/auth/login");
            }, 2000);
          } else {
            const friendly = authService.handleAuthError?.(signupError as Error) || errorObj?.message;
            setErrorMessage(friendly || 'Failed to send OTP');
          }
        }
      }
    } catch (error: unknown) {
      const friendly = authService.handleAuthError?.(error) || error?.message;
      setErrorMessage(friendly || 'Failed to send OTP');
    }
  };

  // Android hardware back: close open pickers/sheets first
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (countryPickerVisible) { setCountryPickerVisible(false); return true; }
      if (residencePickerVisible) { setResidencePickerVisible(false); return true; }
      if (otpSheetVisible && !otpBusy) { setOtpSheetVisible(false); return true; }
      return false;
    });
    return () => sub.remove();
  }, [countryPickerVisible, residencePickerVisible, otpSheetVisible, otpBusy]);

  // Bulk verify: send OTP to both email and phone if available; open sheet prioritizing phone
  const handleVerifyAll = async () => {
    if (!(emailOk || phoneOk)) return;
    try {
      setBulkVerifyMode('both');
      setErrorMessage("");
      const { authService } = await import("../../services/authService");
      
      // Send OTPs to both email and phone if both provided
      if (emailOk && phoneOk) {
        const tasks = [
          authService.signupWithEmail({ 
            email: email.trim(), 
            name: name.trim(), 
            phoneNo: internationalPhone,
            phoneCountryCode: (selectedPhoneCountry?.phoneCode || '').replace(/\s/g, ''),
            countryCode: selectedPhoneCountry?.code,
            countryName: selectedPhoneCountry?.name,
            residenceCountryCode: selectedResidenceCountry,
            residenceCountryName: selectedResidenceCountryData?.name,
            region: selectedResidenceCountryData?.region,
          }),
          authService.signupWithPhone({ 
            phoneNo: internationalPhone, 
            name: name.trim(), 
            email: email.trim(),
            phoneCountryCode: (selectedPhoneCountry?.phoneCode || '').replace(/\s/g, ''),
            countryCode: selectedPhoneCountry?.code,
            countryName: selectedPhoneCountry?.name,
            residenceCountryCode: selectedResidenceCountry,
            residenceCountryName: selectedResidenceCountryData?.name,
            region: selectedResidenceCountryData?.region,
          })
        ];

        const [emailRes, phoneRes] = await Promise.allSettled(tasks);

        let anySuccess = false;

        if (emailRes.status === 'fulfilled' && emailRes.value?.success) {
          anySuccess = true;
          setEmailSignupToken((emailRes.value.data as { signupToken?: string })?.signupToken || null);
          setOtpSentEmail(true);
        }
        if (phoneRes.status === 'fulfilled' && phoneRes.value?.success) {
          anySuccess = true;
          setPhoneSignupToken((phoneRes.value.data as { signupToken?: string })?.signupToken || null);
          setOtpSentPhone(true);
        }

        if (!anySuccess) {
          const firstErr = emailRes.status === 'rejected' ? emailRes.reason : phoneRes.status === 'rejected' ? phoneRes.reason : null;
          setOtpError(authService.handleAuthError?.(firstErr) || firstErr?.message || 'Failed to send OTP');
          return;
        }

        // Prefer phone OTP sheet if available
        if (phoneRes.status === 'fulfilled' && phoneRes.value?.success) {
          setOtpMode('phone');
          setOtpTarget(internationalPhone);
        } else {
          setOtpMode('email');
          setOtpTarget(email.trim());
        }
        setOtpDigits(["", "", "", "", "", ""]);
        setOtpError("");
        setOtpVerified(false);
        setOtpSheetVisible(true);
        setResendRemaining(30);

      } else if (emailOk) {
        // Only email provided
        try {
          const resSignupE = await authService.signupWithEmail({ 
            email: email.trim(), 
            name: name.trim(), 
            phoneNo: undefined,
            residenceCountryCode: selectedResidenceCountry,
            residenceCountryName: selectedResidenceCountryData?.name,
            region: selectedResidenceCountryData?.region,
              });
          if (resSignupE?.success) { 
            setEmailSignupToken((resSignupE.data as { signupToken?: string })?.signupToken || null);
            setOtpMode('email');
            setOtpTarget(email.trim());
            setOtpDigits(["", "", "", "", "", ""]);
            setOtpError("");
            setOtpVerified(false);
            setOtpSheetVisible(true);
            setOtpSentEmail(true);
            setResendRemaining(30);
          }
        } catch (e: unknown) {
          const errorObj = e as { message?: string } | undefined;
          setOtpError(authService.handleAuthError?.(e as Error) || errorObj?.message || 'Failed to send OTP');
            return;
        }
      } else if (phoneOk) {
        // Only phone provided
        try {
          const resSignupP = await authService.signupWithPhone({ 
            phoneNo: internationalPhone, 
            name: name.trim(), 
            email: undefined,
            phoneCountryCode: (selectedPhoneCountry?.phoneCode || '').replace(/\s/g, ''),
            countryCode: selectedPhoneCountry?.code,
            countryName: selectedPhoneCountry?.name,
            residenceCountryCode: selectedResidenceCountry,
            residenceCountryName: selectedResidenceCountryData?.name,
            region: selectedResidenceCountryData?.region,
              });
          if (resSignupP?.success) { 
            setPhoneSignupToken((resSignupP.data as { signupToken?: string })?.signupToken || null);
            setOtpMode('phone');
            setOtpTarget(internationalPhone);
            setOtpDigits(["", "", "", "", "", ""]);
            setOtpError("");
            setOtpVerified(false);
            setOtpSheetVisible(true);
            setOtpSentPhone(true);
            setResendRemaining(30);
          }
        } catch (e: unknown) {
          const errorObj = e as { message?: string } | undefined;
          setOtpError(authService.handleAuthError?.(e as Error) || errorObj?.message || 'Failed to send OTP');
            return;
        }
      }

    } catch (err: unknown) {
      const errorObj = err as { message?: string } | undefined;
      setOtpError(errorObj?.message || 'Failed to send OTP');
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
    } catch (err: unknown) {
      const errorObj = err as { code?: string; status?: number; data?: { retry_after?: number; retryAfter?: number } } | undefined;
      const retry = Number(errorObj?.data?.retry_after || errorObj?.data?.retryAfter || 30);
      if (errorObj?.code === 'OTP_RATE_LIMIT_EXCEEDED' || errorObj?.status === 429) {
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
      const res = await authService.verifyOtp({ identifier: otpTarget, otp: code, signupToken: otpMode === 'phone' ? (phoneSignupToken || undefined) : (emailSignupToken || undefined) });
      if (res.success) {
        try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        setOtpVerified(true);
        if (otpMode === "email") setEmailVerified(true);
        if (otpMode === "phone") setPhoneVerified(true);
        
        // Check if user already has career info
        const userData = res.data.user;
        if (userData?.careerLevelId && userData?.roleTypeId) {
          // User already has career info, go directly to dashboard
          setTimeout(() => {
            setOtpSheetVisible(false);
            router.replace("/dashboard");
          }, 800);
        } else {
          // User needs to complete career info
          setTimeout(() => {
            setOtpSheetVisible(false);
            router.replace("/auth/careerRole");
          }, 800);
        }
      } else {
        setOtpError(res.message || "Incorrect OTP");
      }
    } catch (err: unknown) {
      try {
        const { authService } = await import("../../services/authService");
        const errorObj = err as { code?: string; message?: string } | undefined;
        const friendly = authService.handleAuthError?.(err as Error);
        if (friendly) {
          setOtpError(friendly);
        } else if (errorObj?.code === 'INVALID_OTP') {
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
      <StatusBar barStyle="light-content" />

      {/* Removed header back button for signup screen */}

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

      {/* Bottom half - White form section with square top edges */}
      <View style={{ flex: 1, backgroundColor: "#ffffff", borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: -20 }}>
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
              style={{ backgroundColor: "#f8f9fa", height: responsive.input.height }}
              textColor="#333333"
              placeholderTextColor="#999999"
              outlineColor="#e9ecef"
              activeOutlineColor={BRAND}
              contentStyle={{ fontSize: responsive.input.fontSize, fontWeight: '700', paddingVertical: 0 }}
              theme={{ colors: { onSurfaceVariant: '#666666' }, roundness: 12 }}
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
              style={{ backgroundColor: "#f8f9fa", height: responsive.input.height }}
              textColor="#333333"
              placeholderTextColor="#999999"
              outlineColor="#e9ecef"
              activeOutlineColor={BRAND}
              contentStyle={{ fontSize: responsive.input.fontSize, fontWeight: '700', paddingVertical: 0 }}
              theme={{ colors: { onSurfaceVariant: '#666666' }, roundness: 12 }}
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
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable 
                onPress={() => setCountryPickerVisible(true)}
                style={{ width: 60 }}
              >
                <View style={{
                  backgroundColor: '#f8f9fa',
                  borderWidth: 1,
                  borderColor: '#e9ecef',
                  borderRadius: 12,
                  height: responsive.input.height,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 8
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {selectedPhoneCountry.flag ? (
                      <Image 
                        source={{ uri: getConvertedFlagUrl(selectedPhoneCountry.flag) }}
                        style={{ width: 18, height: 12, marginRight: 6 }}
                      />
                    ) : (
                      <View style={{ width: 20, height: 14, marginRight: 6, backgroundColor: '#e9ecef', borderRadius: 2 }} />
                    )}
                    <AntDesign name="down" size={12} color="#6B7280" />
                  </View>
                </View>
              </Pressable>

              <TextInput
                mode="outlined"
                placeholder="Enter Phone Number"
                value={formattedPhoneNumber}
                onChangeText={setFormattedPhoneNumber}
                keyboardType="phone-pad"
                maxLength={15}
                style={{
                  backgroundColor: '#f8f9fa',
                  height: responsive.input.height,
                  flex: 1
                }}
                textColor="#333333"
                placeholderTextColor="#999999"
                outlineColor="#e9ecef"
                activeOutlineColor={BRAND}
                contentStyle={{
                  paddingVertical: 0,
                  fontSize: responsive.input.fontSize,
                  fontWeight: '700',
                  textAlignVertical: 'center'
                }}
                theme={{
                  colors: { onSurfaceVariant: '#666666' },
                  roundness: 12,
                }}
                left={<TextInput.Icon icon={() => (
                  <Text style={{ color: '#111827', fontWeight: '700', fontSize: responsive.input.fontSize }}>
                    {`${selectedPhoneCountry.phoneCode} `}
                  </Text>
                )} />}
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
            <View style={{ width: "100%", marginTop: 2, marginBottom: 8 }}>
              <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: '700' }}>
                * Please provide a valid email address or phone number
              </Text>
            </View>
          )}



          {/* Continue */}
          <View style={{ width: "100%", marginTop: 8 }}>
            {errorMessage ? (
              <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '700', marginBottom: 8 }}>
                * {errorMessage}
              </Text>
            ) : null}

            <Button
              variant="primary"
              onPress={handleContinue}
              loading={busy}
              disabled={!canContinue || busy}
              size="large"
              style={{ borderRadius: 26, backgroundColor: BRAND, opacity: canContinue ? 1 : 0.7 }}
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
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 40}>
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
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Country Code Picker Modal */}
      <CountryPickerModal
        visible={countryPickerVisible}
        onClose={() => setCountryPickerVisible(false)}
        onSelect={(country) => {
                    setSelectedCountryCode(country.code);
        }}
      />

      {/* Country of Residence Picker Modal via reusable component */}
      <CountryPickerModal
        visible={residencePickerVisible}
        title="Select Country of Residence"
        showPhoneCode={false}
        onClose={() => setResidencePickerVisible(false)}
        onSelect={(country) => {
                    setSelectedResidenceCountry(country.code);
                    setResidencePickerVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

// OTP Bottom Sheet portal rendered after SafeAreaView to avoid overlap with card footer
// Keeping it here for clarity – if needed we can lift this to a global portal later.
export function OtpSheetPortal() {
  return null;
}

