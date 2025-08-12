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
import { StatusBar } from "expo-status-bar";

const logoSrc = require("../../assets/images/logo.png");

const BRAND = "#0A66C2";
const COUNTRY_CODE = "+91";
import { detectInputType, isValidEmail, isValidPhone, validationMessageFor } from "../../components/validators";
import { useSocialAuth } from "../../hooks/useSocialAuth";

export default function LoginScreen() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const { signInWithGoogle, signInWithLinkedIn, isLoading: socialLoading, isProviderAvailable } = useSocialAuth();

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
      
      // Import auth service dynamically to avoid circular dependencies
      const { authService } = await import("../../services/authService");
      
      let response;
      if (inputType === "email") {
        response = await authService.loginWithEmail({ email: emailOrPhone.trim() });
      } else {
        const raw = emailOrPhone;
        const hasPlus = raw.includes("+");
        const digits = raw.replace(/[^0-9]/g, "");
        const phone_no = hasPlus ? `+${digits}` : `${COUNTRY_CODE}${digits}`;
        response = await authService.loginWithPhone({ phone_no });
      }
      
      if (response.success) {
        // Pass both email and phone, backend will determine which to use
        const params = inputType === "email" 
          ? { email: emailOrPhone.trim() }
          : (() => { const raw = emailOrPhone; const hasPlus = raw.includes("+"); const digits = raw.replace(/[^0-9]/g, ""); return { phone: hasPlus ? `+${digits}` : `${COUNTRY_CODE}${digits}` }; })();
          
        router.push({ pathname: "/auth/otp", params });
      } else {
        // If backend tells us user not found during login, show inline CTA to sign up
        setValidationMessage(response.code === 'USER_NOT_FOUND' ? 'User does not exist. Please sign up.' : (response.message || 'Cannot send OTP'));
      }
    } catch (error: any) {
      let message = error?.message || 'Cannot send OTP';
      if (error?.code === 'USER_NOT_FOUND') message = 'User does not exist. Please sign up.';
      if (error?.code === 'NETWORK_ERROR') message = 'Cannot connect to server. Please check your internet and try again.';
      if (error?.code === 'TIMEOUT') message = 'Request timeout. Please try again.';
      setValidationMessage(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
      <StatusBar style="light" />
      
      {/* Top half - Colorful section like Zomato */}
      <View style={{ 
        minHeight: 220,
        backgroundColor: "#E23744", // Zomato red color for reference, we'll use our brand
        paddingHorizontal: 20,
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
            width: 180,
            height: 180,
            marginBottom: 10,
            alignSelf: "center",
          }}
          resizeMode="contain"
        />
      </View>

      {/* Bottom half - White section with form */}
      <View style={{ 
        flex: 1,
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -20,
      }}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: 24,
            paddingHorizontal: 24,
            paddingBottom: 20,
            alignItems: "center",
          }}
          showsVerticalScrollIndicator={false}
        >
        


        {/* Login heading */}
        <View style={{ width: "100%", alignItems: "center", marginBottom: 8 }}>
          <Text style={{
            fontSize: 28,
            fontWeight: "700",
            color: "#1a1a1a",
            marginBottom: 8,
          }}>
            Welcome Back!
          </Text>
          <Text style={{
            fontSize: 16,
            color: "#666666",
            marginBottom: 24,
            textAlign: "center",
          }}>
            Log in or sign up to continue
          </Text>
        </View>

        {/* Phone number input - Centered like Mindvalley */}
        <View style={{ width: "100%", marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
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
            
            <View style={{ flex: 1, maxWidth: 280 }}>
              <TextInput
                mode="outlined"
                  placeholder="Mobile number or email"
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                multiline={false}
                textContentType={inputType === "phone" ? "telephoneNumber" : "emailAddress"}
                value={emailOrPhone}
                maxLength={50}
                onChangeText={(t) => {
                  // If typing digits only, enforce 10-digit cap
                  const onlyDigits = /^\+?\d*$/.test(t);
                  if (onlyDigits) {
                    const digits = t.replace(/\D/g, '').slice(0, 10);
                    setEmailOrPhone(digits);
                  } else {
                    // Allow email input too (fallback)
                    setEmailOrPhone(t);
                  }
                }}
                style={{ 
                  backgroundColor: "#ffffff",
                  height: 50,
                }}
                textColor="#333333"
                placeholderTextColor="#999999"
                outlineColor="#e9ecef"
                activeOutlineColor={BRAND}
                contentStyle={{
                  paddingVertical: 0,
                  fontSize: 16,
                  textAlign: "left",
                }}
                theme={{
                  colors: {
                    onSurfaceVariant: "#666666",
                  }
                }}
              />
            </View>
          </View>
        </View>


        {/* Validation / auth message with CTA */}
        {validationMessage ? (
          <View style={{ width: 348, alignSelf: "center", marginTop: -4, marginBottom: 10 }}>
            <ErrorBanner
              message={validationMessage}
              tone="error"
              ctaText={/sign up/i.test(validationMessage) ? 'Sign up' : undefined}
              onCtaPress={/sign up/i.test(validationMessage) ? () => router.replace('/onboarding') : undefined}
            />
          </View>
        ) : null}



        <View style={{ width: "100%", alignItems: "center" }}>
          <View style={{ flexDirection: "row", justifyContent: "center", width: '100%' }}>
            <Pressable
              onPress={sendOtp}
              disabled={busy || !isValidInput}
              style={{
                height: 54,
                borderRadius: 12,
                backgroundColor: BRAND, // Using brand blue color
                alignItems: "center",
                justifyContent: "center",
                marginTop: 20,
                marginBottom: 16,
                width: '100%',
                maxWidth: 420,
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
                fontSize: 17,
                fontWeight: "700",
                color: "#ffffff",
                letterSpacing: 0.5,
              }}>
                {busy ? "Please wait..." : "Send OTP"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Divider */}
        <View style={{ 
          alignItems: "center", 
          flexDirection: "row", 
          marginTop: 20,
          marginBottom: 20, 
          width: "100%",
          maxWidth: 350,
        }}>
          <View style={{ flex: 1, height: 1, backgroundColor: "#e9ecef" }} />
          <Text style={{ 
            marginHorizontal: 20, 
            color: "#666666", 
            fontSize: 14,
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
            gap: 20, 
            marginBottom: 20,
            width: "100%",
            alignItems: "center",
          }}>
            {/* Google Sign-in */}
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
                disabled={socialLoading}
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
                disabled={socialLoading}
              >
                <AntDesign name="linkedin-square" size={26} color="#0e76a8" />
              </Pressable>
            )}
          </View>


        </ScrollView>
        
        {/* Footer - Terms and signup link */}
        <View style={{
          paddingHorizontal: 24,
          paddingBottom: 20,
          paddingTop: 10,
          backgroundColor: "#ffffff",
        }}>
          {/* Terms and privacy */}
          <Text style={{
            fontSize: 12,
            color: "#999999",
            textAlign: "center",
            lineHeight: 18,
            marginBottom: 12,
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
            onPress={() => router.push("/onboarding")}
            style={({ pressed }) => [
              { 
                transform: [{ scale: pressed ? 0.98 : 1 }],
                paddingVertical: 8,
                alignItems: "center",
              }
            ]}
          > 
            <Text style={{ 
              color: "#666666", 
              textAlign: "center",
              fontSize: 14,
              lineHeight: 20,
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


