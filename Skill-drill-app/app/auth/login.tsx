// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Pressable, View, Image, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput } from "react-native-paper";
import ErrorBanner from "../../components/ErrorBanner";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import GoogleGIcon from "../../components/GoogleGIcon";
import LinkedInIcon from "../../components/LinkedInIcon";
import { StatusBar } from "expo-status-bar";
import { useToast } from "../../hooks/useToast";
import { parseApiError, formatErrorMessage } from "../../utils/errorHandler";
import { detectInputType, isValidEmail, isValidPhone, validationMessageFor } from "../components/validators";
import { useSocialAuth } from "../../hooks/useSocialAuth";
import { useResponsive } from "../../utils/responsive";
import { BRAND } from "../components/Brand";
import PhoneInput from 'react-native-international-phone-number';

const logoSrc = require("../../assets/images/logo.png");

export default function LoginScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<any>({
    cca2: 'IN',
    callingCode: ['91'],
    name: 'India'
  });
  const [phoneCountryCode, setPhoneCountryCode] = useState('IN');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [busy, setBusy] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [showSignupSuggestion, setShowSignupSuggestion] = useState(false);
  const { signInWithGoogle, signInWithLinkedIn, isLoading: socialLoading, isProviderAvailable } = useSocialAuth();
  const { showError, showSuccess } = useToast();

  // Detect if input is email or phone number (simple, user-friendly heuristic)
  const inputType = useMemo(() => detectInputType(emailOrPhone), [emailOrPhone]);
  
  // Get international phone number if it's a phone input
  const internationalPhone = useMemo(() => {
    return emailOrPhone.trim();
  }, [emailOrPhone]);

  const isValidInput = useMemo(() => {
    if (!emailOrPhone.trim()) {
      setValidationMessage("");
      return false;
    }
    
    if (showPhoneInput) {
      // Phone mode - validate as phone
      const isValid = isValidPhone(emailOrPhone);
      setValidationMessage(isValid ? "" : "Enter a valid phone number");
      return isValid;
    } else {
      // Email mode - validate as email
      const isValid = isValidEmail(emailOrPhone);
      setValidationMessage(isValid ? "" : "Enter a valid email address");
      return isValid;
    }
  }, [emailOrPhone, showPhoneInput]);

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
        const phone_no = internationalPhone;
        console.log('📱 Sending phone login request with:', phone_no);
        response = await authService.loginWithPhone({ phoneNo: phone_no });
        console.log('📱 Phone login response:', response);
      }
      
      if (response.success) {
        console.log('✅ OTP sent successfully, navigating to OTP screen...');
        // Pass the identifier to the OTP screen
        const params = inputType === "email" 
          ? { email: emailOrPhone.trim() }
          : { phone: internationalPhone };
          
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
            Sign In
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

        {/* Smart input field - email or phone */}
        <View style={{ width: "100%", marginBottom: responsive.spacing(16) }}>
          <View style={{ 
            maxWidth: responsive.maxWidth.form,
            alignSelf: 'center',
            width: '100%'
          }}>
            {!showPhoneInput ? (
              // Default email/phone input
              <View>
                <TextInput
                  mode="outlined"
                  placeholder="Enter email or phone number"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline={false}
                  textContentType="emailAddress"
                  autoComplete="email"
                  value={emailOrPhone}
                  maxLength={50}
                  onChangeText={setEmailOrPhone}
                  style={{ 
                    backgroundColor: "#f8f9fa",
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
                    },
                    roundness: 12,
                  }}
                  left={<TextInput.Icon icon="email-outline" size={responsive.size(20)} />}
                />
                <Pressable 
                  onPress={() => setShowPhoneInput(true)}
                  style={{ alignSelf: 'center', marginTop: 8 }}
                >
                  <Text style={{ color: BRAND, fontSize: 14, fontWeight: "600" }}>
                    Use phone number instead
                  </Text>
                </Pressable>
              </View>
            ) : (
              // International phone input
              <View>
                <PhoneInput
                  value={emailOrPhone}
                  onChangePhoneNumber={(phoneNumber: string) => {
                    setEmailOrPhone(phoneNumber);
                  }}
                  selectedCountry={selectedCountry}
                  onChangeSelectedCountry={(country: any) => {
                    setSelectedCountry(country);
                    setPhoneCountryCode(country.cca2);
                  }}
                  defaultCountry="IN"
                  placeholder="Enter phone number"
                  phoneInputStyles={{
                    container: {
                      backgroundColor: "#f8f9fa",
                      borderWidth: 1,
                      borderColor: "#e9ecef",
                      borderRadius: 12,
                      minHeight: responsive.input.height
                    },
                    input: {
                      fontSize: responsive.input.fontSize,
                      color: "#333333"
                    }
                  }}
                  modalStyles={{
                    modal: {
                      backgroundColor: "white"
                    }
                  }}
                />
                <Pressable 
                  onPress={() => setShowPhoneInput(false)}
                  style={{ alignSelf: 'center', marginTop: 8 }}
                >
                  <Text style={{ color: BRAND, fontSize: 14, fontWeight: "600" }}>
                    Use email instead
                  </Text>
                </Pressable>
              </View>
            )}
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
                    <ErrorBanner
          message={validationMessage}
          tone="error"
          compact={true}
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


