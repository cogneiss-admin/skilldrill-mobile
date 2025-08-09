// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, TextInput, IconButton } from "react-native-paper";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { AntDesign } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn, FadeOut } from "react-native-reanimated";

const BRAND = "#0A66C2";

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const sendOtp = async () => {
    if (busy) return;
    const value = phone.replace(/\s|-/g, "");
    if (!/^\+?\d{8,15}$/.test(value)) return;
    try {
      setBusy(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({ pathname: "/auth/otp", params: { phone: value } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0B0F14" }}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Animated.View entering={FadeIn.duration(300)}>
            <Text variant="headlineLarge" style={{ fontWeight: "800", color: "#fff", letterSpacing: 0.3 }}>
              Log In
            </Text>
            <Text style={{ marginTop: 6, color: "#cbd5e1" }}>
              Log in to your Skill Drill account
            </Text>
          </Animated.View>

          <View style={{ height: 24 }} />

          <Animated.View entering={FadeInDown.duration(350)}>
            <TextInput
              mode="outlined"
              label="Mobile Number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              left={<TextInput.Affix text="📱" />}
              style={{ backgroundColor: "#0f1620" }}
              textColor="#e2e8f0"
            />
          </Animated.View>

          <View style={{ height: 18 }} />

          <Button
            mode="contained"
            onPress={sendOtp}
            loading={busy}
            disabled={busy}
            contentStyle={{ height: 52 }}
            style={{ borderRadius: 26 }}
          >
            Send OTP
          </Button>

          <View style={{ height: 26 }} />
          <View style={{ alignItems: "center", flexDirection: "row" }}>
            <View style={{ flex: 1, height: 1, backgroundColor: "#223042" }} />
            <Text style={{ marginHorizontal: 10, color: "#9aa7b4" }}>or continue with</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#223042" }} />
          </View>

          <View style={{ height: 14 }} />
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 16 }}>
            <IconButton
              mode="contained-tonal"
              icon={(props) => <AntDesign name="apple1" size={22} color="#fff" />}
              containerColor="#1f2937"
              onPress={() => {}}
            />
            <IconButton
              mode="contained-tonal"
              icon={(props) => <AntDesign name="google" size={22} color="#fff" />}
              containerColor="#1f2937"
              onPress={() => {}}
            />
            <IconButton
              mode="contained-tonal"
              icon={(props) => <AntDesign name="linkedin-square" size={22} color="#fff" />}
              containerColor={BRAND}
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Pressable onPress={() => router.push("/auth/signup")}> 
            <Text style={{ color: "#9aa7b4", textAlign: "center" }}>
              New to Skill Drill? <Text style={{ color: BRAND, fontWeight: "700" }}>Sign up</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}


