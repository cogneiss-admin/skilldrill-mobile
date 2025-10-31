// @ts-nocheck
import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { apiService } from "../services/api";
import { MotiView } from "moti";
import { AntDesign } from '@expo/vector-icons';
import SessionManager from "../utils/sessionManager";

const BRAND = "#0A66C2";

export default function SessionLoadingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Checking your session...");

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      setStatus("Loading your profile...");
      
      // Check if user has skills selected
      const skillsResponse = await apiService.get('/user/skills');
      const hasSkills = skillsResponse.success && skillsResponse.data && skillsResponse.data.length > 0;
      
      if (!hasSkills) {
        setStatus("Redirecting to skills selection...");
        setTimeout(() => {
          router.replace('/auth/skills');
        }, 1000);
        return;
      }

      // Store skills data for dashboard
      const skillsData = skillsResponse.data;

      setStatus("Checking assessment status...");
      
      // Check if user has active assessment session
      const sessionResponse = await apiService.get('/assessment/session/status');
      const hasActiveSession = sessionResponse.success && sessionResponse.data.hasActiveSession;
      const sessionId = sessionResponse.success ? sessionResponse.data.sessionId : null;
      
      if (hasActiveSession) {
        setStatus("Found incomplete assessment...");
        setTimeout(() => {
          router.replace({
            pathname: '/dashboard',
            params: { 
              userSkills: JSON.stringify(skillsData),
              hasActiveSession: 'true',
              sessionId: sessionId,
              incompleteAssessment: 'true'
            }
          });
        }, 1000);
        return;
      }

      setStatus("Checking assessment completion...");
      
      // Compute completion from user skills (no separate endpoint required)
      const hasCompletedAssessments = Array.isArray(skillsData) && skillsData.length > 0
        ? skillsData.every((s: any) => s.assessmentStatus === 'COMPLETED')
        : false;
      
      // User has skills but no active session - go to dashboard
      setStatus("Loading dashboard...");
      setTimeout(() => {
        router.replace({
          pathname: '/dashboard',
          params: { 
            userSkills: JSON.stringify(skillsData),
            hasActiveSession: 'false',
            hasCompletedAssessments: hasCompletedAssessments ? 'true' : 'false',
            assessmentCompleted: hasCompletedAssessments ? 'true' : 'false'
          }
        });
      }, 1000);

    } catch (error) {
      console.error('Session loading error:', error);
      
      // Check if this is an authentication error (401 or specific error codes)
      // But only if user is not currently logging out
      const isAuthError = !SessionManager.isCurrentlyLoggingOut() && 
                         (error?.status === 401 || 
                         error?.code === 'INVALID_TOKEN' ||
                         error?.code === 'INVALID_REFRESH_TOKEN' ||
                         error?.code === 'UNAUTHORIZED' ||
                         error?.message?.includes('Unauthorized') ||
                         error?.message?.includes('session expired') ||
                         error?.message?.includes('login again'));
      
      if (isAuthError) {
        setStatus("Session expired. Redirecting to login...");
        setTimeout(() => {
          router.replace('/auth/login');
        }, 1000);
      } else {
        setStatus("Error loading session...");
        setTimeout(() => {
          router.replace({
            pathname: '/dashboard',
            params: { error: 'true' }
          });
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
      <StatusBar barStyle="light-content" />
      
      <View style={{ 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center",
        paddingHorizontal: 40
      }}>
        {/* Logo */}
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 800 }}
          style={{ marginBottom: 40 }}
        >
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#ffffff',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 5
          }}>
            <AntDesign name="user" size={40} color={BRAND} />
          </View>
        </MotiView>

        {/* Loading Animation */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 300 }}
          style={{ marginBottom: 30 }}
        >
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 3,
            borderColor: '#ffffff',
            borderTopColor: 'transparent',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <MotiView
              from={{ rotate: '0deg' }}
              animate={{ rotate: '360deg' }}
              transition={{
                type: 'timing',
                duration: 1000,
                loop: true
              }}
              style={{ width: 40, height: 40 }}
            />
          </View>
        </MotiView>

        {/* Status Text */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 600 }}
        >
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: 12
          }}>
            Loading...
          </Text>
          
          <Text style={{
            fontSize: 14,
            color: '#e2e8f0',
            textAlign: 'center',
            lineHeight: 20
          }}>
            {status}
          </Text>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}
