// @ts-nocheck
import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button } from "react-native-paper";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "expo-router";

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";
const logoSrc = require("../assets/images/logo.png");

export default function DashboardWelcome() {
  const { logout, user } = useAuth();
  const router = useRouter();

  console.log('🎯 Dashboard: Component loaded');
  console.log('📊 Dashboard: User data:', user ? {
    id: user.id,
    name: user.name,
    career_stage: user.career_stage,
    role_type: user.role_type
  } : null);

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...');
      await logout();
      console.log('✅ Logout successful, navigating to login...');
      // Explicitly navigate to login screen after logout
      router.replace('/auth/login');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" />

      {/* Top brand header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={logoSrc} style={{ width: 40, height: 40 }} resizeMode="contain" />
            <Text style={{ marginLeft: 10, color: "#0f172a", fontSize: 18, fontWeight: "900", letterSpacing: 0.4 }}>{APP_NAME}</Text>
          </View>
          
          {/* Logout button */}
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: "#fef2f2",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#fecaca"
            }}
          >
            <Text style={{ color: "#dc2626", fontSize: 14, fontWeight: "600" }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Center content */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: BRAND, textAlign: "center" }}>Welcome to Dashboard</Text>
        <Text style={{ marginTop: 10, fontSize: 15, color: "#64748b", textAlign: "center" }}>We'll build this next.</Text>
        
        {/* User info */}
        {user && (
          <View style={{ marginTop: 30, padding: 20, backgroundColor: "#f8fafc", borderRadius: 12, width: "100%", maxWidth: 300 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 8 }}>User Information</Text>
            <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Name: {user.name}</Text>
            <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Email: {user.email}</Text>
            <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Career Stage: {user.career_stage}</Text>
            <Text style={{ fontSize: 14, color: "#64748b" }}>Role Type: {user.role_type}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}


