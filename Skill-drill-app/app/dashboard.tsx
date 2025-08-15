// @ts-nocheck
import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button } from "react-native-paper";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "expo-router";
import { useResponsive } from "../utils/responsive";

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";
const logoSrc = require("../assets/images/logo.png");

export default function DashboardWelcome() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const responsive = useResponsive();

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
      <View style={{ 
        paddingHorizontal: responsive.padding.lg, 
        paddingTop: responsive.padding.sm, 
        paddingBottom: responsive.padding.xs, 
        borderBottomWidth: 1, 
        borderBottomColor: "#E5E7EB" 
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={logoSrc} style={{ width: responsive.size(40), height: responsive.size(40) }} resizeMode="contain" />
            <Text style={{ 
              marginLeft: responsive.spacing(10), 
              color: "#0f172a", 
              fontSize: responsive.typography.h5, 
              fontWeight: "900", 
              letterSpacing: 0.4 
            }}>{APP_NAME}</Text>
          </View>
          
          {/* Logout button */}
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: "#fef2f2",
              paddingHorizontal: responsive.padding.md,
              paddingVertical: responsive.padding.xs,
              borderRadius: responsive.size(20),
              borderWidth: 1,
              borderColor: "#fecaca"
            }}
          >
            <Text style={{ 
              color: "#dc2626", 
              fontSize: responsive.typography.body2, 
              fontWeight: "600" 
            }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Center content */}
      <View style={{ 
        flex: 1, 
        alignItems: "center", 
        justifyContent: "center", 
        paddingHorizontal: responsive.padding.lg,
        maxWidth: responsive.maxWidth.card,
        alignSelf: 'center',
        width: '100%'
      }}>
        <Text style={{ 
          fontSize: responsive.typography.h2, 
          fontWeight: "900", 
          color: BRAND, 
          textAlign: "center" 
        }}>Welcome to Dashboard</Text>
        <Text style={{ 
          marginTop: responsive.spacing(10), 
          fontSize: responsive.typography.subtitle, 
          color: "#64748b", 
          textAlign: "center" 
        }}>We'll build this next.</Text>
        
        {/* User info */}
        {user && (
          <View style={{ 
            marginTop: responsive.spacing(30), 
            padding: responsive.padding.lg, 
            backgroundColor: "#f8fafc", 
            borderRadius: responsive.card.borderRadius, 
            width: "100%", 
            maxWidth: responsive.size(300) 
          }}>
            <Text style={{ 
              fontSize: responsive.typography.body1, 
              fontWeight: "700", 
              color: "#0f172a", 
              marginBottom: responsive.spacing(8) 
            }}>User Information</Text>
            <Text style={{ 
              fontSize: responsive.typography.body2, 
              color: "#64748b", 
              marginBottom: responsive.spacing(4) 
            }}>Name: {user.name}</Text>
            <Text style={{ 
              fontSize: responsive.typography.body2, 
              color: "#64748b", 
              marginBottom: responsive.spacing(4) 
            }}>Email: {user.email}</Text>
            <Text style={{ 
              fontSize: responsive.typography.body2, 
              color: "#64748b", 
              marginBottom: responsive.spacing(4) 
            }}>Career Stage: {user.career_stage}</Text>
            <Text style={{ 
              fontSize: responsive.typography.body2, 
              color: "#64748b" 
            }}>Role Type: {user.role_type}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}


