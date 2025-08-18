// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Pressable, View, Image, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput } from "react-native-paper";
import CompactErrorBanner from "../../components/CompactErrorBanner";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import GoogleGIcon from "../../components/GoogleGIcon";
import LinkedInIcon from "../../components/LinkedInIcon";
import { StatusBar } from "expo-status-bar";
import { useToast } from "../../hooks/useToast";
import { parseApiError, formatErrorMessage } from "../../utils/errorHandler";

const logoSrc = require("../../assets/images/logo.png");

const BRAND = "#0A66C2";
const COUNTRY_CODE = "+91";
import { detectInputType, isValidEmail, isValidPhone, validationMessageFor } from "../../components/validators";
import { useSocialAuth } from "../../hooks/useSocialAuth";
import { useResponsive } from "../../utils/responsive";

export default function LoginScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [showSignupSuggestion, setShowSignupSuggestion] = useState(false);
  const { signInWithGoogle, signInWithLinkedIn, isLoading: socialLoading, isProviderAvailable } = useSocialAuth();
  const { showError, showSuccess } = useToast();

  // Detect if input is email or phone number (simple, user-friendly heuristic)
  const inputType = useMemo(() => detectInputType(emailOrPhone), [emailOrPhone]);

  const isValidInput = useMemo(() => {
    const msg = validationMessageFor(emailOrPhone);
    setValidationMessage(msg);
    if (!emailOrPhone.trim()) return false;
    if (inputType === "email") return isValidEmail(emailOrPhone);
    if (inputType === "phone") return isValidPhone(emailOrPhone);
    return false;
  }, [emailOrPhone, inputType]);

  const sendOtp = async () => {
    if (busy || !isValidInput) return;
    
    try {
      setBusy(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('🔍 Send OTP - Input:', emailOrPhone, 'Type:', inputType);
      
      // Import auth service dynamically to avoid circular dependencies
      const { authService } = await import("../../services/authService");
      
      let response;
      if (inputType === "email") {
        console.log('📧 Sending email login request...');
        response = await authService.loginWithEmail({ email: emailOrPhone.trim() });
        console.log('📧 Email login response:', response);
      } else {
        const raw = emailOrPhone;
        const hasPlus = raw.includes("+");
        const digits = raw.replace(/[^0-9]/g, "");
        const phone_no = hasPlus ? `+${digits}` : `${COUNTRY_CODE}${digits}`;
        console.log('📱 Sending phone login request with:', phone_no);
        response = await authService.loginWithPhone({ phone_no });
        console.log('📱 Phone login response:', response);
      }
      
      if (response.success) {
        console.log('✅ OTP sent successfully, navigating to OTP screen...');
        // Pass the identifier to the OTP screen
        const params = inputType === "email" 
          ? { email: emailOrPhone.trim() }
          : { phone: (() => { const raw = emailOrPhone; const hasPlus = raw.includes("+"); const digits = raw.replace(/[^0-9]/g, ""); return hasPlus ? `+${digits}` : `${COUNTRY_CODE}${digits}`; })() };
          
        console.log('🚀 Navigating to OTP with params:', params);
        try {
          await router.replace({ pathname: "/auth/otp", params });
          console.log('✅ Navigation to OTP completed');
        } catch (navError) {
          console.error('❌ Navigation error:', navError);
          // Fallback: try simple navigation
          try {
            console.log('🔄 Trying fallback navigation...');
            await router.replace("/auth/otp");
            console.log('✅ Fallback navigation completed');
          } catch (fallbackError) {
            console.error('❌ Fallback navigation also failed:', fallbackError);
          }
        }
      } else {
        // Handle different error cases
        if (response.code === 'USER_NOT_FOUND') {
          setValidationMessage('No account found with this email. Please sign up to create a new account.');
          setShowSignupSuggestion(true);
        } else if (response.code === 'ACCOUNT_PENDING_VERIFICATION') {
          setValidationMessage('Your account is pending verification. Please complete the signup process.');
          setShowSignupSuggestion(false);
        } else if (response.code === 'ACCOUNT_SUSPENDED') {
          setValidationMessage('Your account has been suspended. Please contact support.');
          setShowSignupSuggestion(false);
        } else if (response.code === 'ACCOUNT_INACTIVE') {
          setValidationMessage('Your account is not active. Please contact support.');
          setShowSignupSuggestion(false);
        } else {
          setValidationMessage(response.message || 'Cannot send OTP');
          setShowSignupSuggestion(false);
        }
      }
    } catch (error: any) {
      console.error('❌ Send OTP error:', error);
      const apiError = parseApiError(error);
      const message = formatErrorMessage(apiError);
      
      // Show toast notification
      showError(message);
      
      // Set validation message for banner
      setValidationMessage(message);
      
      // Handle specific error codes for UI state
      if (apiError.code === 'USER_NOT_FOUND') {
        setShowSignupSuggestion(true);
      } else {
        setShowSignupSuggestion(false);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
      <StatusBar style="light" />
      
      {/* Top half - Colorful section like Zomato */}
      <View style={{ 
        minHeight: responsive.height(25), // 25% of screen height
        backgroundColor: "#E23744", // Zomato red color for reference, we'll use our brand
        paddingHorizontal: responsive.padding.lg,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}>
        {/* Background pattern/illustrations similar to Zomato */}
        <View style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: BRAND, // Our brand blue
        }}>
          {/* Decorative elements */}
          <View style={{
            position: "absolute",
            top: 50,
            right: 30,
            width: 40,
            height: 40,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 20,
          }} />
          <View style={{
            position: "absolute",
            top: 120,
            left: 40,
            width: 25,
            height: 25,
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 12.5,
          }} />
          <View style={{
            position: "absolute",
            bottom: 100,
            right: 60,
            width: 30,
            height: 30,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 15,
          }} />
        </View>
        
        {/* Logo (larger) */}
        <Image
          source={logoSrc}
          style={{
            width: responsive.size(180),
            height: responsive.size(180),
            marginBottom: responsive.spacing(10),
            alignSelf: "center",
          }}
          resizeMode="contain"
        />
      </View>

      {/* Bottom half - White section with form */}
      <View style={{ 
        flex: 1,
        backgroundColor: "#ffffff",
        borderTopLeftRadius: responsive.size(24),
        borderTopRightRadius: responsive.size(24),
        marginTop: responsive.spacing(-20),
      }}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: responsive.padding.lg,
            paddingHorizontal: responsive.padding.lg,
            paddingBottom: responsive.padding.lg,
            alignItems: "center",
            maxWidth: responsive.maxWidth.form,
            alignSelf: 'center',
            width: '100%'
          }}
          showsVerticalScrollIndicator={false}
        >
        


        {/* Login heading */}
        <View style={{ width: "100%", alignItems: "center", marginBottom: responsive.spacing(8) }}>
          <Text style={{
            fontSize: responsive.typography.h2,
            fontWeight: "700",
            color: "#1a1a1a",
            marginBottom: responsive.spacing(8),
          }}>
            Welcome Back!
          </Text>
          <Text style={{
            fontSize: responsive.typography.body1,
            color: "#666666",
            marginBottom: responsive.spacing(24),
            textAlign: "center",
          }}>
            Log in or sign up to continue
          </Text>
        </View>

        {/* Clean input field for email or phone */}
        <View style={{ width: "100%", marginBottom: responsive.spacing(16) }}>
          <View style={{ 
            flexDirection: inputType === "phone" ? "row" : "column",
            alignItems: inputType === "phone" ? "center" : "stretch",
            justifyContent: "center",
            maxWidth: responsive.maxWidth.form,
            alignSelf: 'center',
            width: '100%'
          }}>
            {/* Country code (only visible for phone input) */}
            {inputType === "phone" && (
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f8f9fa",
                borderWidth: 1,
                borderColor: "#e9ecef",
                borderRadius: responsive.size(8),
                paddingHorizontal: responsive.padding.sm,
                paddingVertical: responsive.padding.sm,
                marginRight: responsive.spacing(8),
                minWidth: responsive.size(80),
                justifyContent: "center",
                gap: responsive.spacing(4),
              }}>
                <Text style={{ fontSize: responsive.fontSize(18) }}>🇮🇳</Text>
                <Text style={{ 
                  fontSize: responsive.typography.body2, 
                  color: "#111827", 
                  fontWeight: "700" 
                }}>
                  {COUNTRY_CODE}
                </Text>
              </View>
            )}
            
            {/* Input field */}
            <View style={{ flex: inputType === "phone" ? 1 : 0, width: inputType === "phone" ? undefined : '100%' }}>
              <TextInput
                mode="outlined"
                placeholder="Enter email or phone number"
                keyboardType={inputType === "phone" ? "number-pad" : "email-address"}
                autoCapitalize="none"
                autoCorrect={false}
                multiline={false}
                textContentType={inputType === "phone" ? "telephoneNumber" : "emailAddress"}
                autoComplete={inputType === "phone" ? "tel" : "email"}
                value={emailOrPhone}
                maxLength={50}
                onChangeText={(t) => {
                  // Smart input handling - auto-detect phone vs email
                  const isOnlyDigits = /^\d*$/.test(t);
                  
                  if (isOnlyDigits && t.length <= 10) {
                    // Likely phone number - limit to 10 digits
                    setEmailOrPhone(t);
                  } else if (!isOnlyDigits) {
                    // Contains non-digits, allow full email input
                    setEmailOrPhone(t);
                  }
                }}
                style={{ 
                  backgroundColor: "#ffffff",
                  height: responsive.input.height,
                }}
                textColor="#333333"
                placeholderTextColor="#999999"
                outlineColor="#e9ecef"
                activeOutlineColor={BRAND}
                contentStyle={{
                  paddingVertical: 0,
                  fontSize: responsive.input.fontSize,
                  textAlign: "left",
                }}
                theme={{
                  colors: {
                    onSurfaceVariant: "#666666",
                  }
                }}
                left={inputType === "email" ? 
                  <TextInput.Icon icon="email-outline" size={responsive.size(20)} /> : 
                  <TextInput.Icon icon="phone-outline" size={responsive.size(20)} />
                }
              />
            </View>
          </View>
        </View>


        {/* Validation / auth message with CTA */}
        {validationMessage ? (
          <View style={{ 
            maxWidth: responsive.maxWidth.form,
            alignSelf: "center", 
            marginTop: responsive.spacing(-4), 
            marginBottom: responsive.spacing(10),
            width: '100%'
          }}>
                    <CompactErrorBanner
          message={validationMessage}
          tone="error"
          dismissible={true}
          onDismiss={() => setValidationMessage("")}
          animated={true}
          showIcon={true}
        />
          </View>
        ) : null}



        <View style={{ 
          width: "100%", 
          alignItems: "center",
          maxWidth: responsive.maxWidth.form,
          alignSelf: 'center'
        }}>
          <Pressable
            onPress={sendOtp}
            disabled={busy || !isValidInput}
            style={{
              height: responsive.button.height,
              borderRadius: responsive.button.borderRadius,
              backgroundColor: BRAND,
              alignItems: "center",
              justifyContent: "center",
              marginTop: responsive.spacing(20),
              marginBottom: responsive.spacing(16),
              width: '100%',
              paddingHorizontal: responsive.button.paddingHorizontal,
              opacity: isValidInput ? 1 : 0.5,
              shadowColor: BRAND,
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: isValidInput ? 0.3 : 0,
              shadowRadius: 12,
              elevation: isValidInput ? 8 : 0,
            }}
          >
            <Text style={{
              fontSize: responsive.button.fontSize,
              fontWeight: "700",
              color: "#ffffff",
              letterSpacing: 0.5,
            }}>
              {busy ? "Please wait..." : "Send OTP"}
            </Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={{ 
          alignItems: "center", 
          flexDirection: "row", 
          marginTop: responsive.spacing(20),
          marginBottom: responsive.spacing(20), 
          width: "100%",
          maxWidth: responsive.maxWidth.form,
          alignSelf: 'center'
        }}>
          <View style={{ flex: 1, height: 1, backgroundColor: "#e9ecef" }} />
          <Text style={{ 
            marginHorizontal: responsive.spacing(20), 
            color: "#666666", 
            fontSize: responsive.typography.body2,
            fontWeight: "500",
          }}>
            or
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: "#e9ecef" }} />
        </View>

                  {/* OAuth buttons - Google and LinkedIn only */}
          <View style={{ 
            flexDirection: "row", 
            justifyContent: "center", 
            gap: responsive.spacing(20), 
            marginBottom: responsive.spacing(20),
            width: "100%",
            alignItems: "center",
            maxWidth: responsive.maxWidth.form,
            alignSelf: 'center'
          }}>
            {/* Google Sign-in */}
            {isProviderAvailable('GOOGLE') && (
              <Pressable
                style={({ pressed }) => [
                  {
                    width: responsive.size(56),
                    height: responsive.size(56),
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
                disabled={socialLoading}
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
                disabled={socialLoading}
              >
                <LinkedInIcon size={responsive.size(26)} />
              </Pressable>
            )}
          </View>


        </ScrollView>
        
        {/* Footer - Terms and signup link */}
        <View style={{
          paddingHorizontal: responsive.padding.lg,
          paddingBottom: responsive.padding.lg,
          paddingTop: responsive.padding.sm,
          backgroundColor: "#ffffff",
          maxWidth: responsive.maxWidth.form,
          alignSelf: 'center',
          width: '100%'
        }}>
          {/* Terms and privacy */}
          <Text style={{
            fontSize: responsive.typography.caption,
            color: "#999999",
            textAlign: "center",
            lineHeight: responsive.fontSize(18),
            marginBottom: responsive.spacing(12),
          }}>
            By continuing, you agree to our{"\n"}
            <Text style={{ color: "#666666", textDecorationLine: "underline" }}>Terms of Service</Text>
            {" "}
            <Text style={{ color: "#666666", textDecorationLine: "underline" }}>Privacy Policy</Text>
            {" "}
            <Text style={{ color: "#666666", textDecorationLine: "underline" }}>Content Policy</Text>
          </Text>

          {/* Bottom signup link */}
          <Pressable 
            onPress={() => {
              console.log('📝 Navigating to signup screen...');
              router.push("/auth/signup");
            }}
            style={({ pressed }) => [
              { 
                transform: [{ scale: pressed ? 0.98 : 1 }],
                paddingVertical: responsive.padding.xs,
                alignItems: "center",
              }
            ]}
          > 
            <Text style={{ 
              color: "#666666", 
              textAlign: "center",
              fontSize: responsive.typography.body2,
              lineHeight: responsive.fontSize(20),
            }}>
              New to Skill Drill? {" "}
              <Text style={{ 
                color: BRAND,
                fontWeight: "600", 
              }}>
                Sign up
              </Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}


