// @ts-nocheck
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button, Surface, Chip } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useResponsive } from "../utils/responsive";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { AntDesign } from '@expo/vector-icons';

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";

export default function AssessmentIntroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const responsive = useResponsive();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  
  // Back button double-tap state
  const [backButtonPressed, setBackButtonPressed] = useState(false);
  const [showBackWarning, setShowBackWarning] = useState(false);

  // Hardware back button handler
  useEffect(() => {
    const backAction = () => {
      handleBackToSkills();
      return true; // Prevent default back behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [backButtonPressed, showBackWarning]);

  // Parse selected skills from params
  React.useEffect(() => {
    if (params.selectedSkills) {
      try {
        const parsed = JSON.parse(params.selectedSkills);
        setSelectedSkills(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error('Error parsing skills:', error);
        setSelectedSkills([]);
      }
    }
  }, [params.selectedSkills]);

  const handleCreateAssessment = async () => {
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      
      // Navigate to assessment screen with skills
      router.push({
        pathname: '/assessment',
        params: { 
          selectedSkills: JSON.stringify(selectedSkills)
        }
      });
    } catch (error) {
      console.error('Error creating assessment:', error);
      showToast('error', 'Error', 'Failed to create assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSkills = () => {
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
      // Second press - navigate to skills
      setBackButtonPressed(false);
      setShowBackWarning(false);
      router.push({
        pathname: '/auth/skills',
        params: { mode: 'assessment' }
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" />
      
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
            Press back again to return to skills
          </Text>
        </View>
      )}
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingHorizontal: 20,
          paddingVertical: 20,
          minHeight: '100%'
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          style={{ marginBottom: 30 }}
        >
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ 
              fontSize: 28, 
              fontWeight: '700', 
              color: BRAND,
              textAlign: 'center',
              marginBottom: 8
            }}>
              Ready for Your Assessment?
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: '#64748b',
              textAlign: 'center',
              lineHeight: 24
            }}>
              Let's evaluate your skills with personalized scenarios
            </Text>
          </View>
        </MotiView>

        {/* Selected Skills */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 200 }}
          style={{ marginBottom: 30 }}
        >
          <Surface style={{ 
            padding: 20, 
            borderRadius: 16,
            backgroundColor: '#f8fafc',
            borderWidth: 1,
            borderColor: '#e2e8f0'
          }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: BRAND,
              marginBottom: 16
            }}>
              Selected Skills ({selectedSkills.length})
            </Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {selectedSkills.map((skillId, index) => (
                <Chip
                  key={skillId}
                  mode="outlined"
                  style={{ 
                    backgroundColor: '#ffffff',
                    borderColor: BRAND
                  }}
                  textStyle={{ color: BRAND }}
                >
                  Skill {index + 1}
                </Chip>
              ))}
            </View>
            
            <Button
              mode="text"
              onPress={handleBackToSkills}
              style={{ marginTop: 16 }}
              labelStyle={{ color: BRAND }}
            >
              Change Skills
            </Button>
          </Surface>
        </MotiView>

        {/* Assessment Info */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 400 }}
          style={{ marginBottom: 30 }}
        >
          <Surface style={{ 
            padding: 20, 
            borderRadius: 16,
            backgroundColor: '#ffffff',
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2
          }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: '600', 
              color: '#1e293b',
              marginBottom: 16
            }}>
              How It Works
            </Text>
            
            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ 
                  width: 24, 
                  height: 24, 
                  borderRadius: 12, 
                  backgroundColor: BRAND,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  marginTop: 2
                }}>
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '500', 
                    color: '#1e293b',
                    marginBottom: 4
                  }}>
                    AI-Generated Scenarios
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: '#64748b',
                    lineHeight: 20
                  }}>
                    We'll create personalized workplace scenarios based on your career level and role
                  </Text>
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ 
                  width: 24, 
                  height: 24, 
                  borderRadius: 12, 
                  backgroundColor: BRAND,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  marginTop: 2
                }}>
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '500', 
                    color: '#1e293b',
                    marginBottom: 4
                  }}>
                    Text-Based Responses
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: '#64748b',
                    lineHeight: 20
                  }}>
                    Answer 3 scenarios per skill with detailed written responses (no audio required)
                  </Text>
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ 
                  width: 24, 
                  height: 24, 
                  borderRadius: 12, 
                  backgroundColor: BRAND,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  marginTop: 2
                }}>
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '500', 
                    color: '#1e293b',
                    marginBottom: 4
                  }}>
                    AI-Powered Scoring
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: '#64748b',
                    lineHeight: 20
                  }}>
                    Get detailed feedback and scores for each skill with improvement suggestions
                  </Text>
                </View>
              </View>
            </View>
          </Surface>
        </MotiView>

        {/* Time Estimate */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 600 }}
          style={{ marginBottom: 30 }}
        >
          <Surface style={{ 
            padding: 16, 
            borderRadius: 12,
            backgroundColor: '#f0f9ff',
            borderWidth: 1,
            borderColor: '#0ea5e9'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AntDesign name="clockcircle" size={20} color="#0ea5e9" style={{ marginRight: 8 }} />
              <Text style={{ 
                fontSize: 14, 
                color: '#0ea5e9',
                fontWeight: '500'
              }}>
                Estimated time: {selectedSkills.length * 5}-{selectedSkills.length * 7} minutes
              </Text>
            </View>
          </Surface>
        </MotiView>

        {/* Action Buttons */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 800 }}
          style={{ marginTop: 'auto', paddingTop: 20 }}
        >
          <Button
            mode="contained"
            onPress={handleCreateAssessment}
            loading={loading}
            disabled={loading || selectedSkills.length === 0}
            style={{
              backgroundColor: BRAND,
              borderRadius: 12,
              marginBottom: 12
            }}
            contentStyle={{ height: 52 }}
            labelStyle={{ fontWeight: "600", fontSize: 16 }}
            icon={() => <AntDesign name="play" size={16} color="#ffffff" />}
          >
            Create Assessment
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleBackToSkills}
            style={{
              borderColor: BRAND,
              borderRadius: 12
            }}
            contentStyle={{ height: 52 }}
            labelStyle={{ color: BRAND, fontWeight: "600" }}
          >
            Back to Skills
          </Button>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}
