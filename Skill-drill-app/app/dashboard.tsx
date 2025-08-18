// @ts-nocheck
import React, { useState } from "react";
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
  const [assessmentLoading, setAssessmentLoading] = useState(false);

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

  const handleStartAssessment = async () => {
    try {
      setAssessmentLoading(true);
      console.log('🎯 Starting assessment skill selection...');
      
      // Navigate to unified skills screen in assessment mode
      router.push({
        pathname: '/auth/skills',
        params: { mode: 'assessment' }
      });
      
    } catch (error) {
      console.error('❌ Assessment error:', error);
      alert('Failed to start assessment. Please try again.');
    } finally {
      setAssessmentLoading(false);
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
        }}>Your skills are ready! Take an assessment when you are ready.</Text>
        
        {/* Assessment Status */}
        <View style={{ 
          marginTop: responsive.spacing(16), 
          padding: responsive.padding.md, 
          backgroundColor: "#f0f9ff", 
          borderRadius: responsive.size(12), 
          borderWidth: 1,
          borderColor: "#bae6fd",
          width: "100%", 
          maxWidth: responsive.size(300) 
        }}>
          <Text style={{ 
            fontSize: responsive.typography.body2, 
            color: "#0369a1", 
            textAlign: "center",
            fontWeight: "600"
          }}>
            📊 Assessment Status: Not Started
          </Text>
          <Text style={{ 
            fontSize: responsive.typography.body2, 
            color: "#64748b", 
            textAlign: "center",
            marginTop: responsive.spacing(4)
          }}>
            Complete the assessment to get personalized skill insights
          </Text>
        </View>
        
        {/* Assessment Button */}
        <View style={{ 
          marginTop: responsive.spacing(20), 
          width: "100%", 
          maxWidth: responsive.size(300) 
        }}>
          <Button
            mode="contained"
            onPress={handleStartAssessment}
            loading={assessmentLoading}
            disabled={assessmentLoading}
            contentStyle={{ height: responsive.button.height }}
            style={{ 
              borderRadius: responsive.button.borderRadius, 
              backgroundColor: BRAND, 
              marginBottom: responsive.spacing(16),
              width: '100%'
            }}
            labelStyle={{ 
              fontWeight: "800", 
              letterSpacing: 0.3,
              fontSize: responsive.button.fontSize
            }}
                      >
              {assessmentLoading ? "Loading..." : "Start Assessment"}
            </Button>
          
          <Text style={{ 
            fontSize: responsive.typography.body2, 
            color: "#64748b", 
            textAlign: "center",
            fontStyle: "italic"
          }}>
            Assess your skills and get personalized recommendations
          </Text>
        </View>

        {/* User info */}
        {user && (
          <View style={{ 
            marginTop: responsive.spacing(20), 
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


