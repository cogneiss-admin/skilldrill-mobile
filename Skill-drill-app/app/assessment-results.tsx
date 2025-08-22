// @ts-nocheck
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button, Surface } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { useRouter, useLocalSearchParams } from "expo-router";
import { apiService } from "../services/api";
import { AntDesign } from '@expo/vector-icons';
import HeroHeader from "./components/HeroHeader";
import StickyFooterButton from "./components/StickyFooterButton";

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";
const logoSrc = require("../assets/images/logo.png");

export default function AssessmentResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  
  // Back button double-tap state
  const [backButtonPressed, setBackButtonPressed] = useState(false);
  const [showBackWarning, setShowBackWarning] = useState(false);

  // Hardware back button handler
  useEffect(() => {
    const backAction = () => {
      handleBackToDashboard();
      return true; // Prevent default back behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [backButtonPressed, showBackWarning]);

  useEffect(() => {
    loadAssessmentResults();
  }, []);

  const loadAssessmentResults = async () => {
    try {
      setLoading(true);
      const assessmentId = params.assessmentId;
      
      if (!assessmentId) {
        setError('Assessment ID not provided');
        return;
      }

      console.log('📊 Loading assessment results for:', assessmentId);
      
      const response = await apiService.get(`/assessment/results/${assessmentId}`);
      
      if (response.success) {
        console.log('✅ Assessment results loaded:', response.data);
        setResults(response.data);
      } else {
        setError(response.message || 'Failed to load assessment results');
      }
    } catch (error) {
      console.error('❌ Load assessment results error:', error);
      setError('Failed to load assessment results');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToAssessment = () => {
    router.back();
  };

  const handleBackToDashboard = () => {
    if (!backButtonPressed) {
      // First press - show warning
      setBackButtonPressed(true);
      setShowBackWarning(true);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setBackButtonPressed(false);
        setShowBackWarning(false);
      }, 2000);
    } else {
      // Second press - navigate to dashboard
      setBackButtonPressed(false);
      setShowBackWarning(false);
      router.replace('/dashboard');
    }
  };

  const renderStars = (stars) => {
    const totalStars = 5;
    const filledStars = Math.round(stars || 0);
    
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {[...Array(totalStars)].map((_, index) => (
          <Text key={index} style={{ fontSize: 24, color: index < filledStars ? '#FFD700' : '#E5E7EB' }}>
            ★
          </Text>
        ))}
        <Text style={{ marginLeft: 8, fontSize: 16, color: '#374151', fontWeight: '600' }}>
          {stars ? `${stars.toFixed(1)}/5` : '0/5'}
        </Text>
      </View>
    );
  };

  const getLevelLabel = (stars) => {
    if (stars >= 4.5) return "Expert";
    if (stars >= 3.5) return "Advanced";
    if (stars >= 2.5) return "Intermediate";
    if (stars >= 1.5) return "Beginner";
    return "Needs Improvement";
  };

  const getLevelColor = (stars) => {
    if (stars >= 4.5) return "#16A34A";
    if (stars >= 3.5) return "#059669";
    if (stars >= 2.5) return "#0D9488";
    if (stars >= 1.5) return "#DC2626";
    return "#991B1B";
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 18, color: BRAND, marginBottom: 16 }}>
            Loading Results...
          </Text>
          <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center" }}>
            Analyzing your assessment
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 18, color: "#DC2626", marginBottom: 16, textAlign: "center" }}>
            Error Loading Results
          </Text>
          <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 24 }}>
            {error}
          </Text>
          <Button
            mode="contained"
            onPress={handleBackToDashboard}
            style={{ backgroundColor: BRAND }}
          >
            Back to Dashboard
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Show results
  if (results) {
    const levelLabel = getLevelLabel(results.stars);
    const levelColor = getLevelColor(results.stars);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
        <StatusBar style="light" />
        
        {/* Back Button Warning Overlay */}
        {showBackWarning && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            paddingVertical: 12,
            paddingHorizontal: 20,
            alignItems: 'center'
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 14,
              fontWeight: '500',
              textAlign: 'center'
            }}>
              Press back again to exit results
            </Text>
          </View>
        )}

        <HeroHeader
          brand={BRAND}
          appName={APP_NAME}
          title="Assessment Complete!"
          subtitle={`🎉 ${results.skillName} Results`}
        />

        {/* Content card */}
        <View style={{ flex: 1, marginTop: -24 }}>
          <View style={{ flex: 1, backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 24, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100, maxWidth: 560, width: '100%', alignSelf: 'center' }} showsVerticalScrollIndicator={false}>

              {/* Header */}
              <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 420, delay: 100 }}>
                <Surface style={{
                  padding: 20,
                  borderRadius: 16,
                  marginBottom: 20,
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                  alignItems: "center"
                }}>
                  <Text style={{ fontSize: 20, fontWeight: "600", color: "#0f172a", textAlign: "center", marginBottom: 4 }}>
                    📊 Assessment Results
                  </Text>
                  <Text style={{ fontSize: 16, color: BRAND, textAlign: "center" }}>
                    Here's your personalized feedback
                  </Text>
                </Surface>
              </MotiView>

              {/* Score Card */}
              <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 420, delay: 200 }}>
                <Surface style={{
                  padding: 24,
                  borderRadius: 16,
                  marginBottom: 20,
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                  alignItems: "center"
                }}>
                  <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a", marginBottom: 20 }}>
                    🏆 Your Current Level
                  </Text>

                  <View style={{ alignItems: "center", marginBottom: 20 }}>
                    {renderStars(results.stars)}
                  </View>

                  <View style={{ alignItems: "center", marginBottom: 12 }}>
                    <Text style={{
                      fontSize: 24,
                      fontWeight: "700",
                      color: levelColor,
                      marginBottom: 8
                    }}>
                      {levelLabel}
                    </Text>
                    <Text style={{ fontSize: 16, color: "#64748b", textAlign: "center" }}>
                      {results.scoreLabel || "Based on your responses"}
                    </Text>
                  </View>

                  <View style={{
                    backgroundColor: BRAND + "10",
                    borderRadius: 12,
                    padding: 12,
                    width: "100%"
                  }}>
                    <Text style={{ fontSize: 14, color: BRAND, textAlign: "center", fontWeight: "500" }}>
                      📈 Final Score: {Math.round(results.finalScore)}%
                    </Text>
                  </View>
                </Surface>
              </MotiView>

              {/* What This Means */}
              {results.whatThisMeans && (
                <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 420, delay: 300 }}>
                  <Surface style={{
                    padding: 20,
                    borderRadius: 16,
                    marginBottom: 20,
                    shadowColor: "#000",
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2
                  }}>
                    <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a", marginBottom: 12 }}>
                      💡 What This Means
                    </Text>
                    <Text style={{ fontSize: 16, color: "#374151", lineHeight: 24 }}>
                      {results.whatThisMeans}
                    </Text>
                  </Surface>
                </MotiView>
              )}

              {/* Recommended Next Step */}
              {results.recommendedNextStep && (
                <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 420, delay: 400 }}>
                  <Surface style={{
                    padding: 20,
                    borderRadius: 16,
                    marginBottom: 20,
                    shadowColor: "#000",
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2
                  }}>
                    <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a", marginBottom: 12 }}>
                      🎯 Recommended Next Step
                    </Text>
                    <Text style={{ fontSize: 16, color: "#374151", lineHeight: 24 }}>
                      {results.recommendedNextStep}
                    </Text>
                  </Surface>
                </MotiView>
              )}

              {/* Sub-skill Breakdown */}
              {results.subSkillScores && Object.keys(results.subSkillScores).length > 0 && (
                <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 420, delay: 500 }}>
                  <Surface style={{
                    padding: 20,
                    borderRadius: 16,
                    marginBottom: 20,
                    shadowColor: "#000",
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2
                  }}>
                    <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a", marginBottom: 16 }}>
                      📈 Skill Breakdown
                    </Text>

                    {Object.entries(results.subSkillScores).map(([subSkillName, data], index) => (
                      <View key={subSkillName} style={{ marginBottom: 12 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <Text style={{ fontSize: 14, fontWeight: "500", color: "#374151" }}>
                            {subSkillName}
                          </Text>
                          <Text style={{ fontSize: 14, color: BRAND, fontWeight: "600" }}>
                            {Math.round(data.score)}%
                          </Text>
                        </View>
                        <View style={{
                          height: 6,
                          backgroundColor: "#E5E7EB",
                          borderRadius: 3,
                          overflow: "hidden"
                        }}>
                          <View style={{
                            height: "100%",
                            backgroundColor: BRAND,
                            width: `${Math.min(100, Math.max(0, data.score))}%`,
                            borderRadius: 3
                          }} />
                        </View>
                      </View>
                    ))}
                  </Surface>
                </MotiView>
              )}

              {/* Assessment Details */}
              <MotiView
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 420, delay: 600 }}
              >
                <Surface
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    marginBottom: 20,
                    shadowColor: "#000",
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#0f172a",
                      marginBottom: 16
                    }}
                  >
                    📋 Assessment Details
                  </Text>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 2 }}>
                      Final Score
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}>
                      {Math.round(results.finalScore)}%
                    </Text>
                  </View>

                  {results.timeSpent && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 2 }}>
                        Time Spent
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}>
                        {Math.round(results.timeSpent / 60)} minutes
                      </Text>
                    </View>
                  )}

                  {results.completedAt && (
                    <View style={{ marginBottom: 0 }}>
                      <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 2 }}>
                        Completed
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}>
                        {new Date(results.completedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </Surface>
              </MotiView>

            </ScrollView>

            <StickyFooterButton
              brand={BRAND}
              label="Back to Dashboard"
              onPress={handleBackToDashboard}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Default fallback
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, color: BRAND }}>
          Assessment Results
        </Text>
        <Button
          mode="contained"
          onPress={handleBackToDashboard}
          style={{ backgroundColor: BRAND, marginTop: 20 }}
        >
          Back to Dashboard
        </Button>
      </View>
    </SafeAreaView>
  );
}

