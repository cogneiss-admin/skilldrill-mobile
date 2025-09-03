// @ts-nocheck
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, BackHandler, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button, Surface, Chip } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useToast } from "../hooks/useToast";
import { apiService } from "../services/api";
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import AIGenerationLoader from './components/AIGenerationLoader';

const BRAND = "#0A66C2";
const BRAND_LIGHT = "#E6F2FF";
const WHITE = "#FFFFFF";
const GRAY = "#9CA3AF";
const DARK_GRAY = "#374151";
const SUCCESS = "#22C55E";
const WARNING = "#F59E0B";
const ERROR = "#EF4444";
const APP_NAME = "Skill Drill";

// Import logo
const logoSrc = require("../assets/images/logo.png");

export default function AssessmentIntroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [creatingAssessment, setCreatingAssessment] = useState(false);
  const [showAILoader, setShowAILoader] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [error, setError] = useState("");
  
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

  // Load user skills from backend
  const loadUserSkills = async () => {
    try {
      setLoadingSkills(true);
      const response = await apiService.get('/user/skills');
      
      if (response.success && response.data) {
        console.log('📊 User skills from backend:', response.data);
        setUserSkills(response.data);
        // Extract skill IDs for assessment - use the skill.id field from the nested skill object
        const skillIds = response.data.map(userSkill => userSkill.skill.id);
        console.log('📊 Extracted skill IDs:', skillIds);
        setSelectedSkills(skillIds);
      }
    } catch (error) {
      console.error('Error loading user skills:', error);
      showToast('error', 'Error', 'Failed to load your skills');
    } finally {
      setLoadingSkills(false);
    }
  };

  // Check for active session and load skills
  React.useEffect(() => {
    const checkActiveSession = async () => {
      try {
        // First check if there's an active session
        const sessionResponse = await apiService.get('/assessment/session/status');

        if (sessionResponse.success && sessionResponse.data && sessionResponse.data.hasActiveSession) {
          if (sessionResponse.data.completed) {
            console.log('✅ Found completed session, allowing new assessment creation');
            // Session is completed, allow creating new assessment
          } else {
            console.log('🔄 Found active session, redirecting to assessment:', sessionResponse.data.sessionId);
            // Redirect to assessment with existing session
            router.replace({
              pathname: '/assessment',
              params: {
                sessionId: sessionResponse.data.sessionId,
                resume: 'true'
              }
            });
            return;
          }
        }

        // Handle skillId parameter (from activity screen)
        if (params.skillId) {
          console.log('🎯 Specific skill selected:', params.skillId);
          setSelectedSkills([params.skillId]);
          setLoadingSkills(false);
          return;
        }

        // No active session, proceed with normal flow
        if (params.selectedSkills) {
          // Skills passed as params (from skills selection)
          try {
            const parsed = JSON.parse(params.selectedSkills);
            setSelectedSkills(Array.isArray(parsed) ? parsed : []);
            setLoadingSkills(false);
          } catch (error) {
            console.error('Error parsing skills:', error);
            setSelectedSkills([]);
            setLoadingSkills(false);
          }
        } else {
          // No params - load user skills from backend
          loadUserSkills();
        }
      } catch (error) {
        console.error('Error checking active session:', error);
        // Handle skillId parameter even in error case
        if (params.skillId) {
          console.log('🎯 Specific skill selected (fallback):', params.skillId);
          setSelectedSkills([params.skillId]);
          setLoadingSkills(false);
          return;
        }
        // Fallback to normal flow
        if (params.selectedSkills) {
          try {
            const parsed = JSON.parse(params.selectedSkills);
            setSelectedSkills(Array.isArray(parsed) ? parsed : []);
            setLoadingSkills(false);
          } catch (error) {
            console.error('Error parsing skills:', error);
            setSelectedSkills([]);
            setLoadingSkills(false);
          }
        } else {
          loadUserSkills();
        }
      }
    };

    checkActiveSession();
  }, [params.selectedSkills, params.skillId]);

  const handleCreateAssessment = async () => {
    try {
      setCreatingAssessment(true);
      setShowAILoader(true);
      setAiProgress(0);
      // Simulate progress while waiting for backend
      const steps = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.95];
      let idx = 0;
      const progressInterval = setInterval(() => {
        if (idx < steps.length) {
          setAiProgress(steps[idx]);
          idx += 1;
        }
      }, 1200);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      
      console.log('🚀 Creating assessment with skills:', selectedSkills);
      
      // Validate that we have skills to assess
      if (!selectedSkills || selectedSkills.length === 0) {
        showToast('error', 'No Skills', 'Please select skills before starting assessment');
        return;
      }
      
      // Validate skill IDs format
      const validSkillIds = selectedSkills.filter(id => id && typeof id === 'string' && id.length > 10);
      if (validSkillIds.length !== selectedSkills.length) {
        console.warn('⚠️ Some skill IDs appear invalid:', selectedSkills);
        showToast('error', 'Invalid Skills', 'Some selected skills are invalid. Please try again.');
        return;
      }
      
      console.log('✅ Valid skill IDs for assessment:', validSkillIds);
      
      // Create assessment session with extended timeout for AI generation
      const response = await apiService.post('/assessment/session/start', {
        skillIds: validSkillIds
      }, { timeout: 150000 }); // 150s timeout for AI generation
      
      if (response.success && response.data.sessionId) {
        console.log('✅ Assessment created successfully:', response.data);
        showToast('success', 'Assessment Created', 'Your assessment is ready!');
        
        // Complete progress and navigate
        setAiProgress(1.0);
        clearInterval(progressInterval);
        setShowAILoader(false);
        // Navigate to assessment screen with session ID
        router.replace({
          pathname: '/assessment',
          params: {
            sessionId: response.data.sessionId,
            resume: 'true'
          }
        });

        // The activity screen will be refreshed when user navigates back
      } else {
        throw new Error(response.message || 'Failed to create assessment');
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
      
      // Show specific error message if available
      let errorMessage = 'Failed to create assessment. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.data && error.data.message) {
        errorMessage = error.data.message;
      }
      
      // Set error state for UI display
      setError(errorMessage);
      showToast('error', 'Error', errorMessage);
    } finally {
      setCreatingAssessment(false);
      setShowAILoader(false);
    }
  };

  const handleRetry = () => {
    setError("");
    handleCreateAssessment();
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

  // Calculate estimated time (3 scenarios per skill, ~5 minutes each)
  const estimatedMinutes = selectedSkills.length * 3 * 5;

  // Show loading state while skills are being loaded
  if (loadingSkills) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: WHITE }}>
        <StatusBar style="dark" />
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          paddingHorizontal: 20
        }}>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 500 }}
          >
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: BRAND_LIGHT,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <AntDesign name="loading1" size={30} color={BRAND} />
            </View>
            <Text style={{ 
              fontSize: 18, 
              color: BRAND, 
              fontWeight: '600',
              textAlign: 'center'
            }}>
              Loading your skills...
            </Text>
          </MotiView>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: WHITE }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a", textAlign: "center", marginBottom: 8 }}>
              Assessment Creation Failed
            </Text>
            <Text style={{ fontSize: 16, color: "#64748b", textAlign: "center", lineHeight: 24 }}>
              {error}
            </Text>
          </View>
          
          <View style={{ width: "100%", gap: 12 }}>
            <Button
              mode="contained"
              onPress={handleRetry}
              style={{ 
                backgroundColor: BRAND,
                height: 48
              }}
              contentStyle={{ height: 48 }}
              labelStyle={{ fontWeight: "600", fontSize: 16 }}
            >
              Retry Assessment Creation
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleBackToDashboard}
              style={{ 
                borderColor: BRAND,
                borderWidth: 2,
                height: 48
              }}
              contentStyle={{ height: 48 }}
              labelStyle={{ color: BRAND, fontWeight: "600", fontSize: 16 }}
            >
              Back to Dashboard
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: WHITE }}>
      <StatusBar style="dark" />
      
      {/* Back Button Warning Overlay */}
      {showBackWarning && (
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            paddingVertical: 12,
            paddingHorizontal: 20,
            alignItems: 'center'
          }}
        >
          <Text style={{
            color: WHITE,
            fontSize: 14,
            fontWeight: '500',
            textAlign: 'center'
          }}>
            Press back again to return to dashboard
          </Text>
        </MotiView>
      )}
      
      {/* Header */}
      <LinearGradient
        colors={[BRAND, '#1E40AF', '#3B82F6']}
        style={{
          paddingTop: 20,
          paddingBottom: 30,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 25,
          borderBottomRightRadius: 25
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={logoSrc} style={{ width: 32, height: 32 }} resizeMode="contain" />
            <Text style={{
              marginLeft: 10,
              color: WHITE,
              fontSize: 18,
              fontWeight: '900',
              letterSpacing: 0.5
            }}>{APP_NAME}</Text>
          </View>
          <TouchableOpacity onPress={handleBackToDashboard}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)'
            }}>
              <AntDesign name="arrowleft" size={20} color={WHITE} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Header Content */}
        <View style={{ marginTop: 25 }}>
          <Text style={{
            color: WHITE,
            fontSize: 16,
            opacity: 0.9
          }}>
            Ready to assess! 🎯
          </Text>
          <Text style={{
            color: WHITE,
            fontSize: 28,
            fontWeight: '700',
            marginTop: 5
          }}>
            Ready for Your Assessment?
          </Text>
          <Text style={{
            color: WHITE,
            fontSize: 16,
            opacity: 0.9,
            marginTop: 8,
            lineHeight: 22
          }}>
            Let's evaluate your skills with personalized scenarios
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingHorizontal: 20,
          paddingVertical: 30
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected Skills Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 200 }}
          style={{ marginBottom: 24 }}
        >
          <Surface style={{ 
            padding: 24, 
            borderRadius: 16,
            backgroundColor: WHITE,
            shadowColor: BRAND,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
            borderWidth: 1,
            borderColor: '#E6F2FF'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: BRAND_LIGHT,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <MaterialIcons name="psychology" size={24} color={BRAND} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 20, 
                  fontWeight: '600', 
                  color: DARK_GRAY,
                  marginBottom: 4
                }}>
                  Selected Skills
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: GRAY 
                }}>
                  {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} ready for assessment
                </Text>
              </View>

            </View>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {selectedSkills.map((skillId, index) => {
                // Find skill name from userSkills or use fallback
                const userSkill = userSkills.find(us => us.skill.id === skillId);
                const skillName = userSkill?.skill?.skill_name || userSkill?.skill?.name || `Skill ${index + 1}`;
                
                return (
                  <Chip
                    key={skillId}
                    mode="outlined"
                    style={{ 
                      backgroundColor: BRAND_LIGHT,
                      borderColor: BRAND
                    }}
                    textStyle={{ color: BRAND, fontWeight: '500' }}
                  >
                    {skillName}
                  </Chip>
                );
              })}
            </View>
          </Surface>
        </MotiView>

        {/* How It Works Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 400 }}
          style={{ marginBottom: 24 }}
        >
          <Surface style={{ 
            padding: 24, 
            borderRadius: 16,
            backgroundColor: WHITE,
            shadowColor: BRAND,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
            borderWidth: 1,
            borderColor: '#E6F2FF'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#E8F5E8',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <MaterialIcons name="info-outline" size={24} color={SUCCESS} />
              </View>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '600', 
                color: DARK_GRAY
              }}>
                How It Works
              </Text>
            </View>
            
            <View style={{ gap: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 16, 
                  backgroundColor: BRAND,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  marginTop: 2
                }}>
                  <Text style={{ color: WHITE, fontSize: 14, fontWeight: '600' }}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: DARK_GRAY,
                    marginBottom: 6
                  }}>
                    AI-Generated Scenarios
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: GRAY,
                    lineHeight: 20
                  }}>
                    We'll create personalized workplace scenarios based on your career level and role
                  </Text>
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 16, 
                  backgroundColor: BRAND,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  marginTop: 2
                }}>
                  <Text style={{ color: WHITE, fontSize: 14, fontWeight: '600' }}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: DARK_GRAY,
                    marginBottom: 6
                  }}>
                    Text-Based Responses
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: GRAY,
                    lineHeight: 20
                  }}>
                    Answer 3 scenarios per skill with detailed written responses (no audio required)
                  </Text>
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 16, 
                  backgroundColor: BRAND,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  marginTop: 2
                }}>
                  <Text style={{ color: WHITE, fontSize: 14, fontWeight: '600' }}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: DARK_GRAY,
                    marginBottom: 6
                  }}>
                    AI-Powered Scoring
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: GRAY,
                    lineHeight: 20
                  }}>
                    Get detailed feedback and scores for each skill with improvement suggestions
                  </Text>
                </View>
              </View>
            </View>
          </Surface>
        </MotiView>

        {/* Estimated Time Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 600 }}
          style={{ marginBottom: 32 }}
        >
          <Surface style={{ 
            padding: 20, 
            borderRadius: 16,
            backgroundColor: BRAND_LIGHT,
            borderWidth: 1,
            borderColor: BRAND
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: BRAND,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Ionicons name="time-outline" size={20} color={WHITE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: BRAND,
                  marginBottom: 2
                }}>
                  Estimated Time
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: DARK_GRAY
                }}>
                  {estimatedMinutes} minutes ({Math.ceil(estimatedMinutes / 60)} hour{Math.ceil(estimatedMinutes / 60) !== 1 ? 's' : ''})
                </Text>
              </View>
            </View>
          </Surface>
        </MotiView>

        {/* Create Assessment Button */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 800 }}
        >
          <TouchableOpacity
            onPress={handleCreateAssessment}
            disabled={creatingAssessment || selectedSkills.length === 0}
            style={{
              backgroundColor: creatingAssessment ? GRAY : BRAND,
              borderRadius: 16,
              paddingVertical: 18,
              paddingHorizontal: 24,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              shadowColor: BRAND,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5
            }}
          >
            {creatingAssessment ? (
              <>
                <AntDesign name="loading1" size={20} color={WHITE} style={{ marginRight: 8 }} />
                <Text style={{
                  color: WHITE,
                  fontSize: 18,
                  fontWeight: '600'
                }}>
                  Creating Assessment...
                </Text>
              </>
            ) : (
              <>
                <AntDesign name="play" size={20} color={WHITE} style={{ marginRight: 8 }} />
                <Text style={{
                  color: WHITE,
                  fontSize: 18,
                  fontWeight: '600'
                }}>
                  Start Assessment
                </Text>
              </>
            )}
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
      {/* AI Generation Loader Overlay */}
      <AIGenerationLoader visible={showAILoader} progress={aiProgress} onComplete={() => setShowAILoader(false)} />
    </SafeAreaView>
  );
}
