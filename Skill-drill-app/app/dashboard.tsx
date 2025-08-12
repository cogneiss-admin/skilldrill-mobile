// @ts-nocheck
import React from "react";
import { View, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";
const logoSrc = require("../assets/images/logo.png");

export default function DashboardWelcome() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" />

      {/* Top brand header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image source={logoSrc} style={{ width: 40, height: 40 }} resizeMode="contain" />
          <Text style={{ marginLeft: 10, color: "#0f172a", fontSize: 18, fontWeight: "900", letterSpacing: 0.4 }}>{APP_NAME}</Text>
        </View>
      </View>

      {/* Center content */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: BRAND, textAlign: "center" }}>Welcome to Dashboard</Text>
        <Text style={{ marginTop: 10, fontSize: 15, color: "#64748b", textAlign: "center" }}>We’ll build this next.</Text>
      </View>
    </SafeAreaView>
  );
}


