// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Pressable, View, Image, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput } from "react-native-paper";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { detectInputType, isValidEmail, isValidPhone, validationMessageFor } from "../../components/validators";
import { useSocialAuth } from "../../hooks/useSocialAuth";
import { StatusBar } from "expo-status-bar";
import Svg, { Path } from "react-native-svg";
import { AntDesign } from "@expo/vector-icons";

const logoSrc = require("../../assets/images/logo.png");
const BRAND = "#0A66C2";

export default function SignupScreen() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const inputType = useMemo(() => detectInputType(emailOrPhone), [emailOrPhone]);
  const [validationMessage, setValidationMessage] = useState("");
  const { signInWithGoogle, signInWithLinkedIn, isLoading: socialLoading, isProviderAvailable } = useSocialAuth();
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
        response = await authService.signupWithEmail({ 
          email: emailOrPhone.trim(),
          name: "User" // You might want to add a name input field
        });
      } else {
        response = await authService.signupWithPhone({ 
          phone_no: emailOrPhone.replace(/[^0-9+]/g, ""),
          name: "User" // You might want to add a name input field
        });
      }
      
      if (response.success) {
        const params = inputType === "email"
          ? { email: emailOrPhone.trim() }
          : { phone: emailOrPhone.replace(/[^0-9+]/g, "") };
        router.push({ pathname: "/auth/otp", params });
      } else {
        // Handle error - you might want to show an alert or error message
        console.error('Signup error:', response.message);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      // Handle error - you might want to show an alert or error message
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
      <StatusBar style="light" />

      {/* Top half - Brand section like login */}
      <View style={{ 
        height: "40%",
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

        {/* Logo */}
        <Image
          source={logoSrc}
          style={{ width: 180, height: 180, marginBottom: 10, alignSelf: "center" }}
          resizeMode="contain"
        />
      </View>

      {/* Bottom half - White form section matching login */}
      <View style={{ flex: 1, backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 }}>
        <ScrollView
          contentContainerStyle={{ paddingTop: 24, paddingHorizontal: 24, paddingBottom: 20, alignItems: "center" }}
          showsVerticalScrollIndicator={false}
        >
          {/* Heading */}
          <View style={{ width: "100%", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 }}>Create your account</Text>
            <Text style={{ fontSize: 16, color: "#666666", marginBottom: 24, textAlign: "center" }}>Verify your mobile number or email to continue</Text>
          </View>

          {/* Phone or Email input - same layout as login */}
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
                minWidth: 60,
                justifyContent: "center",
              }}>
                <Text style={{ fontSize: 20 }}>🇮🇳</Text>
              </View>

              <View style={{ flex: 1, maxWidth: 280 }}>
                <TextInput
                  mode="outlined"
                  placeholder="Enter Phone Number or Email"
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType={inputType === "phone" ? "telephoneNumber" : "emailAddress"}
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                  style={{ backgroundColor: "#ffffff", height: 50 }}
                  textColor="#333333"
                  placeholderTextColor="#999999"
                  outlineColor="#e9ecef"
                  activeOutlineColor={BRAND}
                  contentStyle={{ paddingVertical: 0, fontSize: 16, textAlign: "left" }}
                  theme={{ colors: { onSurfaceVariant: "#666666" } }}
                />
              </View>
            </View>
          </View>

          {/* Validation message */}
          {validationMessage ? (
            <View style={{ width: 348, alignSelf: "center", marginTop: -8, marginBottom: 8 }}>
              <Text style={{ color: "#E23744", fontSize: 12 }}>{validationMessage}</Text>
            </View>
          ) : null}

          {/* Continue button */}
          <View style={{ width: "100%", alignItems: "center" }}>
            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              <Pressable
                onPress={sendOtp}
                disabled={busy || !isValidInput}
                style={{
                  height: 54,
                  borderRadius: 12,
                  backgroundColor: BRAND,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 20,
                  marginBottom: 16,
                  width: 348,
                  opacity: isValidInput ? 1 : 0.5,
                  shadowColor: BRAND,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isValidInput ? 0.3 : 0,
                  shadowRadius: 12,
                  elevation: isValidInput ? 8 : 0,
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: "700", color: "#ffffff", letterSpacing: 0.5 }}>
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
            <Text style={{ marginHorizontal: 20, color: "#666666", fontSize: 14, fontWeight: "500" }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#e9ecef" }} />
          </View>

          {/* OAuth buttons - Google and LinkedIn */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 20, marginBottom: 20, width: "100%", alignItems: "center" }}>
            {isProviderAvailable('GOOGLE') && (
              <Pressable
                style={({ pressed }) => [
                  {
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    backgroundColor: "#ffffff",
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
                <Svg width={26} height={26} viewBox="0 0 18 18">
                  <Path fill="#EA4335" d="M9 3.48c1.69 0 3.22.58 4.42 1.71l3.3-3.3C14.86.5 12.11 0 9 0 5.48 0 2.44 1.64 .64 4.04l3.78 2.94C5.2 5.11 6.96 3.48 9 3.48z" />
                  <Path fill="#4285F4" d="M17.64 9.2c0-.74-.06-1.47-.18-2.16H9v4.09h4.84c-.21 1.1-.84 2.03-1.79 2.66l2.73 2.12c1.59-1.47 2.51-3.64 2.51-6.71z" />
                  <Path fill="#FBBC05" d="M3.42 10.96a5.5 5.5 0 010-3.92L-.36 4.1a9 9 0 000 9.8l3.78-2.94z" />
                  <Path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.73-2.12c-.76.51-1.74.82-3.23.82-2.47 0-4.57-1.67-5.32-3.92L-.64 13.9C1.16 16.36 4.03 18 9 18z" />
                </Svg>
              </Pressable>
            )}

            {isProviderAvailable('LINKEDIN') && (
              <Pressable
                style={({ pressed }) => [
                  {
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    backgroundColor: "#ffffff",
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
    </SafeAreaView>
  );
}

