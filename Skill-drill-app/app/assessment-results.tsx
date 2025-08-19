// @ts-nocheck
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button, Surface, Card } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useResponsive } from "../utils/responsive";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { useToast } from "../hooks/useToast";

const BRAND = "#0A66C2";

export default function AssessmentResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const responsive = useResponsive();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);

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
    router.replace('/dashboard');
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
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <StatusBar style="dark" />
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingHorizontal: 20, 
            paddingVertical: 20 
          }}
        >
          {/* Header */}
          <Surface style={{ 
            padding: 20, 
            borderRadius: 12,
            marginBottom: 20,
            alignItems: "center"
          }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "#0f172a", marginBottom: 8, textAlign: "center" }}>
              🎉 {results.skillName} Assessment Complete!
            </Text>
            <Text style={{ fontSize: 16, color: BRAND, textAlign: "center" }}>
              Here's your personalized feedback
            </Text>
          </Surface>

          {/* Score Card */}
          <Surface style={{ 
            padding: 20, 
            borderRadius: 12,
            marginBottom: 20
          }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a", marginBottom: 16 }}>
              Your Current Level
            </Text>
            
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              {renderStars(results.stars)}
            </View>
            
            <View style={{ alignItems: "center" }}>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: "bold", 
                color: levelColor,
                marginBottom: 8
              }}>
                {levelLabel}
              </Text>
              <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center" }}>
                {results.scoreLabel || "Based on your responses"}
              </Text>
            </View>
          </Surface>

          {/* What This Means */}
          {results.whatThisMeans && (
            <Surface style={{ 
              padding: 20, 
              borderRadius: 12,
              marginBottom: 20
            }}>
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a", marginBottom: 12 }}>
                What This Means
              </Text>
              <Text style={{ fontSize: 16, color: "#374151", lineHeight: 24 }}>
                {results.whatThisMeans}
              </Text>
            </Surface>
          )}

          {/* Recommended Next Step */}
          {results.recommendedNextStep && (
            <Surface style={{ 
              padding: 20, 
              borderRadius: 12,
              marginBottom: 20
            }}>
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a", marginBottom: 12 }}>
                Recommended Next Step
              </Text>
              <Text style={{ fontSize: 16, color: "#374151", lineHeight: 24 }}>
                {results.recommendedNextStep}
              </Text>
            </Surface>
          )}

          {/* Sub-skill Breakdown */}
          {results.subSkillScores && Object.keys(results.subSkillScores).length > 0 && (
            <Surface style={{ 
              padding: 20, 
              borderRadius: 12,
              marginBottom: 20
            }}>
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a", marginBottom: 16 }}>
                Skill Breakdown
              </Text>
              
              {Object.entries(results.subSkillScores).map(([subSkillName, data]) => (
                <View key={subSkillName} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: "500", color: "#374151" }}>
                      {subSkillName}
                    </Text>
                    <Text style={{ fontSize: 14, color: BRAND, fontWeight: "600" }}>
                      {Math.round(data.score)}%
                    </Text>
                  </View>
                  <View style={{ 
                    height: 4, 
                    backgroundColor: "#E5E7EB", 
                    borderRadius: 2,
                    overflow: "hidden"
                  }}>
                    <View style={{ 
                      height: "100%", 
                      backgroundColor: BRAND, 
                      width: `${Math.min(100, Math.max(0, data.score))}%`
                    }} />
                  </View>
                </View>
              ))}
            </Surface>
          )}

          {/* Assessment Details */}
          <Surface style={{ 
            padding: 20, 
            borderRadius: 12,
            marginBottom: 20
          }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a", marginBottom: 16 }}>
              Assessment Details
            </Text>
            
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: "#64748b" }}>Final Score</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}>
                {Math.round(results.finalScore)}%
              </Text>
            </View>
            
            {results.timeSpent && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: "#64748b" }}>Time Spent</Text>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}>
                  {Math.round(results.timeSpent / 60)} minutes
                </Text>
              </View>
            )}
            
            {results.completedAt && (
              <View>
                <Text style={{ fontSize: 14, color: "#64748b" }}>Completed</Text>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}>
                  {new Date(results.completedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </Surface>

          {/* Action Buttons */}
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Button
              mode="outlined"
              onPress={handleBackToAssessment}
              style={{ flex: 1, marginRight: 8 }}
              labelStyle={{ color: BRAND }}
            >
              Back to Assessment
            </Button>
            
            <Button
              mode="contained"
              onPress={handleBackToDashboard}
              style={{ flex: 1, backgroundColor: BRAND }}
            >
              Dashboard
            </Button>
          </View>
        </ScrollView>
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
