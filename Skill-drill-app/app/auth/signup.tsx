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
import { Ionicons } from "@expo/vector-icons";
import GoogleGIcon from "../../components/GoogleGIcon";
import LinkedInIcon from "../../components/LinkedInIcon";
import CodeBoxes from "../../components/CodeBoxes";
import { BRAND, LOGO_SRC, SCREEN_BACKGROUND, COLORS, BORDER_RADIUS, SPACING } from "../components/Brand";
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
  const [emailSessionId, setEmailSessionId] = useState<string | null>(null);
  const [phoneSessionId, setPhoneSessionId] = useState<string | null>(null);
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
  const phoneOk = useMemo(() => {
    if (!formattedPhoneNumber.trim()) return false;
    const digitsOnly = formattedPhoneNumber.trim().replace(/[^0-9+]/g, "");
    return digitsOnly.length >= 7 && digitsOnly.length <= 17;
  }, [formattedPhoneNumber]);
  const verifiedOk = emailVerified || phoneVerified;
  const canContinue = useMemo(() => nameOk && (emailOk || phoneOk), [nameOk, emailOk, phoneOk]);
  
  const internationalPhone = useMemo(() => {
    if (!formattedPhoneNumber.trim()) return "";
    const selectedCountry = countries.find(c => c.code === selectedCountryCode);
    const phoneCode = selectedCountry?.phoneCode || "+91";
    return `${phoneCode}${formattedPhoneNumber.trim()}`;
  }, [formattedPhoneNumber, selectedCountryCode, countries]);

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

      if (!verifiedOk) {
        await handleVerifyAll();
        return;
      }

      const { authService } = await import("../../services/authService");

      await authService.updateUserProfile({
        name: name.trim(),
        email: emailOk ? email.trim() : undefined,
        phoneNo: phoneOk ? internationalPhone : undefined,
        residenceCountryCode: selectedResidenceCountry,
        residenceCountryName: selectedResidenceCountryData?.name,
        region: selectedResidenceCountryData?.region,
      });

      const userData = await authService.getUserData();
      if (userData?.careerLevelId && userData?.roleTypeId) {
        try { await Haptics.selectionAsync(); } catch {}
        router.replace("/dashboard");
      } else {
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
            setEmailSessionId((resSignup.data as { sessionId?: string })?.sessionId || null);
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
            setErrorMessage(authService.handleAuthError(signupError as Error));
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
            setPhoneSessionId((resSignup.data as { sessionId?: string })?.sessionId || null);
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
            setErrorMessage(authService.handleAuthError(signupError as Error));
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
      const { default: authService } = await import("../../services/authService");
      const errorObj = error as { message?: string } | undefined;
      const friendly = authService.handleAuthError?.(error as Error) || errorObj?.message;
      setErrorMessage(friendly || 'Failed to send OTP');
    }
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (countryPickerVisible) { setCountryPickerVisible(false); return true; }
      if (residencePickerVisible) { setResidencePickerVisible(false); return true; }
      if (otpSheetVisible && !otpBusy) { setOtpSheetVisible(false); return true; }
      return false;
    });
    return () => sub.remove();
  }, [countryPickerVisible, residencePickerVisible, otpSheetVisible, otpBusy]);

  const handleVerifyAll = async () => {
    if (!(emailOk || phoneOk)) return;
    try {
      setBulkVerifyMode('both');
      setErrorMessage("");
      const { authService } = await import("../../services/authService");
      
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
          setEmailSessionId((emailRes.value.data as { sessionId?: string })?.sessionId || null);
          setOtpSentEmail(true);
        }
        if (phoneRes.status === 'fulfilled' && phoneRes.value?.success) {
          anySuccess = true;
          setPhoneSessionId((phoneRes.value.data as { sessionId?: string })?.sessionId || null);
          setOtpSentPhone(true);
        }

        if (!anySuccess) {
          const firstErr = emailRes.status === 'rejected' ? emailRes.reason : phoneRes.status === 'rejected' ? phoneRes.reason : null;
          setOtpError(authService.handleAuthError?.(firstErr) || firstErr?.message || 'Failed to send OTP');
          return;
        }

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
            setEmailSessionId((resSignupE.data as { sessionId?: string })?.sessionId || null);
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
            setPhoneSessionId((resSignupP.data as { sessionId?: string })?.sessionId || null);
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

  const handleResend = async () => {
    if (otpBusy || resendRemaining > 0) return;
    try {
      const { authService } = await import("../../services/authService");
      const tasks: Promise<any>[] = [];

      if (emailSessionId) tasks.push(authService.resendOtp({ sessionId: emailSessionId }));
      if (phoneSessionId) tasks.push(authService.resendOtp({ sessionId: phoneSessionId }));

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
      const errorObj = err as { code?: string; status?: number; data?: { retry_after?: number; retryAfter?: number }; message?: string } | undefined;
      const retry = Number(errorObj?.data?.retry_after || errorObj?.data?.retryAfter || 30);
      if (errorObj?.code === 'OTP_LOCKED' || errorObj?.code === 'OTP_RATE_LIMIT_EXCEEDED' || errorObj?.status === 429) {
        setResendRemaining(retry);
        setOtpError(errorObj?.message || `Too many requests. Please wait ${Math.ceil(retry / 60)} minute(s) and try again.`);
      } else {
        setOtpError(errorObj?.message || 'Failed to resend code');
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
      const sessionId = otpMode === 'phone' ? phoneSessionId : emailSessionId;
      const res = await authService.verifyOtp({ otp: code, sessionId: sessionId || undefined });
      if (res.success) {
        try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        setOtpVerified(true);
        if (otpMode === "email") setEmailVerified(true);
        if (otpMode === "phone") setPhoneVerified(true);
        
        const userData = res.data.user;
        if (userData?.careerLevelId && userData?.roleTypeId) {
          setTimeout(() => {
            setOtpSheetVisible(false);
            router.replace("/dashboard");
          }, 800);
        } else {
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
        const errorObj = err as { code?: string; message?: string; data?: { retry_after?: number; retryAfter?: number } } | undefined;
        const friendly = authService.handleAuthError?.(err as Error);
        if (friendly) {
          setOtpError(friendly);
        } else if (errorObj?.code === 'OTP_LOCKED') {
          const retryAfter = Number(errorObj?.data?.retry_after || errorObj?.data?.retryAfter || 300);
          setResendRemaining(retryAfter);
          setOtpError(errorObj?.message || `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`);
        } else if (errorObj?.code === 'INVALID_OTP') {
          setOtpError('Incorrect OTP');
        } else if (errorObj?.code === 'OTP_EXPIRED') {
          setOtpError('OTP expired. Please request a new one.');
        } else if (errorObj?.code === 'OTP_RATE_LIMIT_EXCEEDED') {
          setOtpError('Too many attempts. Please wait a few minutes and try again.');
        } else {
          setOtpError(errorObj?.message || 'Incorrect OTP');
        }
      } catch {
        setOtpError('Incorrect OTP');
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


      <View style={{ 
        minHeight: 200,
        backgroundColor: BRAND,
        paddingHorizontal: 20,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}>
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

        <Image
          source={logoSrc}
          style={{ width: 150, height: 150, marginBottom: 6, alignSelf: "center" }}
          resizeMode="contain"
        />
      </View>

      <View style={{ flex: 1, backgroundColor: SCREEN_BACKGROUND, borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: -20 }}>
        <ScrollView
          contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 24, paddingBottom: 20, alignItems: "center", maxWidth: 560, width: '100%', alignSelf: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: "100%", alignItems: "center", marginBottom: responsive.spacing(8) }}>
            <Text style={{ fontSize: responsive.typography.h2, fontWeight: "700", color: COLORS.text.primary, marginBottom: responsive.spacing(8) }}>Create your account</Text>
            <Text style={{ fontSize: responsive.typography.body1, color: COLORS.text.tertiary, marginBottom: responsive.spacing(24), textAlign: "center" }}>Enter your name and email or phone number</Text>
          </View>

          <View style={{ width: "100%", marginBottom: responsive.spacing(12) }}>
            <TextInput
              mode="outlined"
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              style={{ backgroundColor: COLORS.white, height: responsive.input.height }}
              textColor={COLORS.text.secondary}
              placeholderTextColor={COLORS.text.disabled}
              outlineColor={COLORS.border.light}
              activeOutlineColor={BRAND}
              contentStyle={{ fontSize: responsive.input.fontSize, fontWeight: '700', paddingVertical: 0 }}
              theme={{ colors: { onSurfaceVariant: COLORS.text.tertiary }, roundness: BORDER_RADIUS.lg }}
            />
          </View>

          <View style={{ width: "100%", marginBottom: responsive.spacing(12) }}>
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
              style={{ backgroundColor: COLORS.white, height: responsive.input.height }}
              textColor={COLORS.text.secondary}
              placeholderTextColor={COLORS.text.disabled}
              outlineColor={COLORS.border.light}
              activeOutlineColor={BRAND}
              contentStyle={{ fontSize: responsive.input.fontSize, fontWeight: '700', paddingVertical: 0 }}
              theme={{ colors: { onSurfaceVariant: COLORS.text.tertiary }, roundness: BORDER_RADIUS.lg }}
              right={undefined}
            />
          </View>

          <View style={{ width: "100%", marginBottom: responsive.spacing(12) }}>
            <Text style={{
              fontSize: responsive.typography.body2,
              color: COLORS.text.tertiary,
              marginBottom: responsive.spacing(8),
              fontWeight: "500"
            }}>
              Phone Number
            </Text>
            <View style={{ flexDirection: 'row', gap: responsive.spacing(12) }}>
              <Pressable
                onPress={() => setCountryPickerVisible(true)}
                style={{ width: 60 }}
              >
                <View style={{
                  backgroundColor: COLORS.white,
                  borderWidth: 1,
                  borderColor: COLORS.border.light,
                  borderRadius: BORDER_RADIUS.lg,
                  height: responsive.input.height,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: SPACING.xs
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {selectedPhoneCountry.flag ? (
                      <Image
                        source={{ uri: getConvertedFlagUrl(selectedPhoneCountry.flag) }}
                        style={{ width: 18, height: 12, marginRight: SPACING.xs }}
                      />
                    ) : (
                      <View style={{ width: 20, height: 14, marginRight: SPACING.xs, backgroundColor: COLORS.border.light, borderRadius: BORDER_RADIUS.sm }} />
                    )}
                    <Ionicons name="chevron-down" size={12} color={COLORS.text.tertiary} />
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
                  backgroundColor: COLORS.white,
                  height: responsive.input.height,
                  flex: 1
                }}
                textColor={COLORS.text.secondary}
                placeholderTextColor={COLORS.text.disabled}
                outlineColor={COLORS.border.light}
                activeOutlineColor={BRAND}
                contentStyle={{
                  paddingVertical: 0,
                  fontSize: responsive.input.fontSize,
                  fontWeight: '700',
                  textAlignVertical: 'center'
                }}
                theme={{
                  colors: { onSurfaceVariant: COLORS.text.tertiary },
                  roundness: BORDER_RADIUS.lg,
                }}
                left={<TextInput.Icon icon={() => (
                  <Text style={{ color: COLORS.gray[900], fontWeight: '700', fontSize: responsive.input.fontSize }}>
                    {`${selectedPhoneCountry.phoneCode} `}
                  </Text>
                )} />}
              />
            </View>
          </View>

          <View style={{ width: "100%", marginBottom: responsive.spacing(12) }}>
            <Text style={{
              fontSize: responsive.typography.body2,
              color: COLORS.text.tertiary,
              marginBottom: responsive.spacing(8),
              fontWeight: "500"
            }}>
              Country of Residence
            </Text>
            <Pressable
              style={{
                backgroundColor: COLORS.white,
                borderWidth: 1,
                borderColor: COLORS.border.light,
                borderRadius: BORDER_RADIUS.lg,
                minHeight: responsive.input.height,
                paddingHorizontal: responsive.padding.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onPress={() => setResidencePickerVisible(true)}
            >
              <Text style={{
                fontSize: responsive.typography.body1,
                color: COLORS.text.secondary
              }}>
                {selectedResidenceCountryData?.name || "Select Country"}
              </Text>
              <Text style={{ fontSize: responsive.typography.caption, color: COLORS.text.disabled }}>▼</Text>
            </Pressable>
          </View>

          {!emailOk && !phoneOk && (email.trim() || formattedPhoneNumber.trim()) && (
            <View style={{ width: "100%", marginTop: 2, marginBottom: responsive.spacing(8) }}>
              <Text style={{ color: COLORS.errorDark, fontSize: responsive.typography.caption, fontWeight: '700' }}>
                * Please provide a valid email address or phone number
              </Text>
            </View>
          )}



          <View style={{ width: "100%", marginTop: responsive.spacing(8) }}>
            {errorMessage ? (
              <Text style={{ color: COLORS.errorDark, fontSize: responsive.typography.caption, fontWeight: '700', marginBottom: responsive.spacing(8) }}>
                * {errorMessage}
              </Text>
            ) : null}

            <Button
              variant="primary"
              onPress={handleContinue}
              loading={busy}
              disabled={!canContinue || busy}
              size="large"
              style={{ borderRadius: BORDER_RADIUS['2xl'], backgroundColor: BRAND, opacity: canContinue ? 1 : 0.7 }}
            >
              {verifiedOk ? 'Continue' : 'Verify & Continue'}
            </Button>
          </View>


          <View style={{
            alignItems: "center",
            flexDirection: "row",
            marginTop: responsive.spacing(14),
            marginBottom: responsive.spacing(14),
            width: "100%",
            maxWidth: responsive.maxWidth.form,
          }}>
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border.light }} />
            <Text style={{ marginHorizontal: responsive.spacing(20), color: COLORS.text.tertiary, fontSize: responsive.typography.body2, fontWeight: "500" }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border.light }} />
          </View>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: responsive.spacing(20), marginBottom: responsive.spacing(12), width: "100%", alignItems: "center" }}>
            {isProviderAvailable('GOOGLE') && (
              <Pressable
                style={({ pressed }) => [
                  {
                    width: responsive.size(56),
                    height: responsive.size(56),
                    borderRadius: BORDER_RADIUS.full,
                    backgroundColor: "transparent",
                    borderWidth: 2,
                    borderColor: COLORS.border.medium,
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    shadowColor: COLORS.black,
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
                <GoogleGIcon size={responsive.size(26)} />
              </Pressable>
            )}

            {isProviderAvailable('LINKEDIN') && (
              <Pressable
                style={({ pressed }) => [
                  {
                    width: responsive.size(56),
                    height: responsive.size(56),
                    borderRadius: BORDER_RADIUS.full,
                    backgroundColor: "transparent",
                    borderWidth: 2,
                    borderColor: COLORS.border.medium,
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    shadowColor: COLORS.black,
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
                <LinkedInIcon size={responsive.size(26)} />
              </Pressable>
            )}
          </View>
        </ScrollView>


        <View style={{ paddingHorizontal: responsive.padding.lg, paddingBottom: responsive.padding.lg, paddingTop: responsive.padding.sm, backgroundColor: SCREEN_BACKGROUND }}>
          <Text style={{ fontSize: responsive.typography.caption, color: COLORS.text.disabled, textAlign: "center", lineHeight: responsive.fontSize(18), marginBottom: responsive.spacing(12) }}>
            By continuing, you agree to our{"\n"}
            <Text style={{ color: COLORS.text.tertiary, textDecorationLine: "underline" }}>Terms of Service</Text>{" "}
            <Text style={{ color: COLORS.text.tertiary, textDecorationLine: "underline" }}>Privacy Policy</Text>{" "}
            <Text style={{ color: COLORS.text.tertiary, textDecorationLine: "underline" }}>Content Policy</Text>
          </Text>

          <Pressable
            onPress={() => router.replace("/auth/login")}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }], paddingVertical: responsive.padding.xs, alignItems: "center" }]}
          >
            <Text style={{ color: COLORS.text.tertiary, textAlign: "center", fontSize: responsive.typography.body2, lineHeight: responsive.fontSize(20) }}>
              Already have an account? {" "}
              <Text style={{ color: BRAND, fontWeight: "600" }}>Log in</Text>
            </Text>
          </Pressable>
        </View>
      </View>

      {otpSheetVisible && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'flex-end' }}>
          <View
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: COLORS.background.overlay }}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
          <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: BORDER_RADIUS['2xl'], borderTopRightRadius: BORDER_RADIUS['2xl'], paddingHorizontal: responsive.padding.lg, paddingTop: responsive.padding.md, paddingBottom: responsive.padding.lg, shadowColor: COLORS.black, shadowOpacity: 0.2, shadowRadius: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 40, height: 4, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.gray[200], marginBottom: responsive.spacing(12) }} />
            </View>
            <Text style={{ fontSize: responsive.typography.h4, fontWeight: '900', color: COLORS.gray[900] }}>Verify your contact</Text>
            <Text style={{ marginTop: responsive.spacing(6), color: COLORS.text.tertiary }}>{buildOtpSentMessage()}</Text>

            <View style={{ marginTop: responsive.spacing(16), paddingBottom: responsive.spacing(28) }}>
              <CodeBoxes
                length={6}
                value={otpDigits}
                onChange={(v) => { if (!otpVerified) setOtpDigits(v); }}
                color={otpError ? COLORS.errorDark : otpVerified ? COLORS.successDark : BRAND}
              />
              <View style={{ minHeight: 24, justifyContent: 'center' }}>
                {otpError ? (
                  <Text style={{ color: COLORS.errorDark, marginTop: responsive.spacing(10), textAlign: 'center', fontWeight: '700' }}>{otpError}</Text>
                ) : otpVerified ? (
                  <Text style={{ color: COLORS.successDark, marginTop: responsive.spacing(10), textAlign: 'center', fontWeight: '800' }}>Verified! Redirecting…</Text>
                ) : null}
              </View>
              <View style={{ alignItems: 'center', marginTop: responsive.spacing(6) }}>
                <Text style={{ color: COLORS.text.tertiary }}>
                  Code not received?{' '}
                  <Text onPress={handleResend} style={{ color: resendRemaining > 0 ? COLORS.text.disabled : BRAND, fontWeight: '800', textDecorationLine: 'underline' }}>
                    {resendRemaining > 0 ? `Resend in ${resendRemaining}s` : 'Resend'}
                  </Text>
                </Text>
              </View>
            </View>

          </View>
          </KeyboardAvoidingView>
        </View>
      )}

      <CountryPickerModal
        visible={countryPickerVisible}
        onClose={() => setCountryPickerVisible(false)}
        onSelect={(country) => {
                    setSelectedCountryCode(country.code);
        }}
      />

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

export function OtpSheetPortal() {
  return null;
}

