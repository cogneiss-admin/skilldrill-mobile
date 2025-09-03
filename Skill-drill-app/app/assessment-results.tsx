// @ts-nocheck
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, BackHandler, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button, Surface, Chip } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { useRouter, useLocalSearchParams } from "expo-router";
import { apiService } from "../services/api";
import { AntDesign, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import HeroHeader from "./components/HeroHeader";
import StickyFooterButton from "./components/StickyFooterButton";
import { useToast } from "../hooks/useToast";

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const logoSrc = require("../assets/images/logo.png");

export default function AssessmentResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
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
      console.log('📊 Params received:', params);
      
      // Try to get results with retry mechanism
      let response = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`📊 Attempt ${retryCount + 1} to load assessment results...`);
          response = await apiService.get(`/assessment/results/${assessmentId}`);
          console.log('📊 API Response:', response);
          
          if (response.success) {
            break; // Success, exit retry loop
          } else {
            console.log(`❌ Attempt ${retryCount + 1} failed:`, response.message);
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`⏳ Waiting 2 seconds before retry...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        } catch (error) {
          console.error(`❌ Attempt ${retryCount + 1} error:`, error);
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`⏳ Waiting 2 seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (response.success) {
        console.log('✅ Assessment results loaded:', response.data);
        setResults(response.data);
      } else {
        console.log('❌ API Error:', response.message);
        
        // Check if this is a "not found" error, which might mean the assessment is still processing
        if (response.message && response.message.includes('not found')) {
          setError('Assessment results are still being processed. Please wait a moment and try again.');
        } else {
          setError(response.message || 'Failed to load assessment results');
        }
      }
    } catch (error) {
      console.error('❌ Load assessment results error:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
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

  const handleRetakeAssessment = () => {
    router.replace({
      pathname: '/assessment-intro',
      params: { skillId: results?.skillId }
    });
  };

  const handleShareResults = () => {
    showToast('Results sharing coming soon!', 'info');
  };

  const renderScoreCircle = (score, size = 120) => {
    // Visual fill uses percentage based on 0–10 scale
    const percentage = Math.min(100, Math.max(0, (score || 0) * 10));
    const strokeWidth = size * 0.08;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'relative', width: size, height: size }}>
          {/* Background circle */}
          <View style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#F3F4F6',
            borderWidth: strokeWidth,
            borderColor: '#E5E7EB'
          }} />
          
          {/* Progress circle */}
          <View style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: getScoreColor(score),
            borderRightColor: percentage > 25 ? getScoreColor(score) : 'transparent',
            borderBottomColor: percentage > 50 ? getScoreColor(score) : 'transparent',
            borderLeftColor: percentage > 75 ? getScoreColor(score) : 'transparent',
            transform: [{ rotate: '-90deg' }]
          }} />
          
          {/* Score text */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Text style={{
              fontSize: size * 0.25,
              fontWeight: '700',
              color: '#1F2937'
            }}>
              {(Math.round(((score || 0) + Number.EPSILON) * 10) / 10).toFixed(1)}/10
            </Text>
            <Text style={{
              fontSize: size * 0.12,
              color: '#6B7280',
              fontWeight: '500'
            }}>
              Score
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderStars = (stars) => {
    const totalStars = 5;
    const filledStars = Math.round(stars || 0);
    
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        {[...Array(totalStars)].map((_, index) => (
          <AntDesign 
            key={index} 
            name={index < filledStars ? "star" : "staro"} 
            size={20} 
            color={index < filledStars ? '#FFD700' : '#E5E7EB'} 
            style={{ marginHorizontal: 2 }}
          />
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

  const getScoreColor = (score) => {
    // Score is 0–10; convert to 0–100 for thresholds
    const p = (score || 0) * 10;
    if (p >= 90) return "#16A34A";
    if (p >= 80) return "#059669";
    if (p >= 70) return "#0D9488";
    if (p >= 60) return "#DC2626";
    return "#991B1B";
  };

  const getLevelIcon = (stars) => {
    if (stars >= 4.5) return "trophy";
    if (stars >= 3.5) return "star";
    if (stars >= 2.5) return "check-circle";
    if (stars >= 1.5) return "info-circle";
    return "exclamation-triangle";
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: BRAND + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <AntDesign name="loading1" size={40} color={BRAND} />
            </View>
          </MotiView>
          <Text style={{ fontSize: 18, color: BRAND, marginBottom: 16, fontWeight: '600' }}>
            Analyzing Your Results
          </Text>
          <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center", maxWidth: 250 }}>
            We're processing your assessment responses and generating personalized insights
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
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#FEE2E2',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <AntDesign name="exclamationcircleo" size={40} color="#DC2626" />
            </View>
          </MotiView>
          <Text style={{ fontSize: 18, color: "#DC2626", marginBottom: 16, textAlign: "center", fontWeight: '600' }}>
            Unable to Load Results
          </Text>
          <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 24, lineHeight: 20 }}>
            {error}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button
              mode="outlined"
              onPress={loadAssessmentResults}
              style={{ borderColor: BRAND }}
              labelStyle={{ color: BRAND }}
            >
              Try Again
            </Button>
            <Button
              mode="contained"
              onPress={handleBackToDashboard}
              style={{ backgroundColor: BRAND }}
            >
              Back to Dashboard
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show results
  if (results) {
    const levelLabel = getLevelLabel(results.stars);
    const levelColor = getLevelColor(results.stars);
    const levelIcon = getLevelIcon(results.stars);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
        <StatusBar style="light" />
        
        {/* Back Button Warning Overlay */}
        {showBackWarning && (
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
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
              color: '#ffffff',
              fontSize: 14,
              fontWeight: '500',
              textAlign: 'center'
            }}>
              Press back again to exit results
            </Text>
          </MotiView>
        )}

        <HeroHeader
          brand={BRAND}
          appName={APP_NAME}
          title="Assessment Complete!"
          subtitle={`🎉 ${results.skillName} Results`}
        />

        {/* Content card */}
        <View style={{ flex: 1, marginTop: -24 }}>
          <View style={{ 
            flex: 1, 
            backgroundColor: "#ffffff", 
            borderTopLeftRadius: 24, 
            borderTopRightRadius: 24, 
            paddingTop: 24, 
                  shadowColor: "#000",
            shadowOpacity: 0.12, 
            shadowRadius: 16 
          }}>
            <ScrollView 
              contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100, maxWidth: 560, width: '100%', alignSelf: 'center' }}
              showsVerticalScrollIndicator={false}
            >
              {/* Holistic Analysis View - NEW FORMAT */}
              <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 600, delay: 150 }}>
                <Surface style={{ padding: 24, borderRadius: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 3, alignItems: 'center', backgroundColor: '#FAFAFA' }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 16 }}>Your Performance Score</Text>
                  {renderScoreCircle(results.finalScore, 140)}

                  {/* Show AI-generated level and stars */}
                  <View style={{ alignItems: 'center', marginTop: 20 }}>
                    {results.currentLevel && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: levelColor + '20', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 12 }}>
                        <FontAwesome5 name={levelIcon} size={16} color={levelColor} style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 18, fontWeight: '700', color: levelColor }}>
                          {results.levelLabel || levelLabel}
                        </Text>
                      </View>
                    )}

                    {/* Show AI-generated star rating */}
                    {results.currentLevel ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginRight: 12 }}>
                          {results.currentLevel}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#6B7280' }}>
                          Current Level
                        </Text>
                      </View>
                    ) : (
                      renderStars(results.stars)
                    )}
                  </View>
                </Surface>
              </MotiView>

              {/* Holistic Analysis: Communication Style */}
              {results.identifiedStyle && (
                <Surface style={{ padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, backgroundColor: '#FEF3C7' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F59E0B' + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <AntDesign name="user" size={18} color="#F59E0B" />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#92400E' }}>Your Communication Style</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#92400E', marginBottom: 8 }}>
                    {results.identifiedStyle}
                  </Text>
                  {results.whatThisMeans && (
                    <Text style={{ fontSize: 16, color: '#92400E', lineHeight: 24 }}>
                      {results.whatThisMeans}
                    </Text>
                  )}
                </Surface>
              )}

              {/* Holistic Analysis: Identified Flaws */}
              {results.identifiedFlaws && results.identifiedFlaws.length > 0 && (
                <Surface style={{ padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, backgroundColor: '#FEF2F2' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#DC2626' + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <AntDesign name="warning" size={18} color="#DC2626" />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#991B1B' }}>Areas for Improvement</Text>
                  </View>
                  {results.identifiedFlaws.map((flaw, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                      <Text style={{ fontSize: 16, color: '#DC2626', marginRight: 8, fontWeight: 'bold' }}>•</Text>
                      <Text style={{ fontSize: 16, color: '#991B1B', lineHeight: 24, flex: 1 }}>
                        {flaw}
                      </Text>
                    </View>
                  ))}
                </Surface>
              )}

              {/* Holistic Analysis: Strengths */}
              {results.strengths && (
                <Surface style={{ padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, backgroundColor: '#F0FDF4' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#16A34A' + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <AntDesign name="checkcircle" size={18} color="#16A34A" />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#166534' }}>Your Strengths</Text>
                  </View>
                  <Text style={{ fontSize: 16, color: '#166534', lineHeight: 24 }}>
                    {results.strengths}
                  </Text>
                </Surface>
              )}

              {/* Holistic Analysis: What This Means (Legacy Summary) */}
              {results.whatThisMeans && !results.identifiedStyle && (
                <Surface style={{ padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, backgroundColor: '#F0F9FF' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: BRAND + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <AntDesign name="bulb1" size={18} color={BRAND} />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937' }}>Analysis Summary</Text>
                  </View>
                  <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>{results.whatThisMeans}</Text>
                </Surface>
              )}

              {results.subSkillScores && Object.keys(results.subSkillScores).length > 0 && (
                <Surface style={{ padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: BRAND + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <AntDesign name="barschart" size={18} color={BRAND} />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937' }}>Skill Breakdown</Text>
                  </View>
                    {Object.entries(results.subSkillScores).map(([subSkillName, data], index) => (
                    <View key={subSkillName} style={{ marginBottom: 16 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', flex: 1 }}>{subSkillName}</Text>
                        <Text style={{ fontSize: 16, color: getScoreColor(data.score), fontWeight: '700' }}>{(Math.round((data.score + Number.EPSILON) * 10) / 10).toFixed(1)}/10</Text>
                        </View>
                      <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                        <MotiView from={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, (data.score || 0) * 10))}%` }} transition={{ type: 'timing', duration: 1000, delay: 200 + (index * 100) }} style={{ height: '100%', backgroundColor: getScoreColor(data.score), borderRadius: 4 }} />
                        </View>
                      {data.evidence && (
                        <Text style={{ fontSize: 14, color: '#6B7280', fontStyle: 'italic', lineHeight: 18, marginTop: 6 }}>
                          "{data.evidence}"
                        </Text>
                      )}
                      </View>
                    ))}
                  </Surface>
              )}

              {/* Holistic Analysis: Improvement Feedback */}
              {results.improvementFeedback && (
                <Surface style={{ padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, backgroundColor: '#FEF3C7' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F59E0B' + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <AntDesign name="aim" size={18} color="#F59E0B" />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#92400E' }}>Improvement Plan</Text>
                  </View>
                  <Text style={{ fontSize: 16, color: '#92400E', lineHeight: 24, fontWeight: '500', marginBottom: 16 }}>
                    {results.improvementFeedback}
                  </Text>

                  {/* Recommended Action */}
                  {results.recommendedAction && (
                    <View style={{ backgroundColor: '#F59E0B' + '15', padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <AntDesign name="arrowright" size={16} color="#F59E0B" style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#92400E' }}>Next Action Step</Text>
                      </View>
                      <Text style={{ fontSize: 16, color: '#92400E', lineHeight: 24 }}>
                        {results.recommendedAction}
                      </Text>
                    </View>
                  )}
                </Surface>
              )}

              {/* Legacy Individual Responses - Only show if no holistic analysis available */}
              {(!results.identifiedStyle && !results.improvementFeedback) && results.responses && results.responses.length > 0 && (
                <Surface style={{ padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: BRAND + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <AntDesign name="message1" size={18} color={BRAND} />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937' }}>Detailed Feedback</Text>
                  </View>
                    {results.responses.map((r, idx) => (
                    <View key={r.id || idx} style={{ marginBottom: 16, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: BRAND }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 0, fontWeight: '600' }}>Scenario {idx + 1}</Text>
                        {typeof r.aiScore === 'number' && (
                          <View style={{ marginLeft: 'auto', backgroundColor: getScoreColor(r.aiScore * 10) + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                            <Text style={{ fontSize: 12, color: getScoreColor(r.aiScore * 10), fontWeight: '700' }}>{r.aiScore}/10</Text>
                          </View>
                        )}
                      </View>
                      {r.prompt && (
                        <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8, fontStyle: 'italic', lineHeight: 18 }}>
                          "{r.prompt}"
                        </Text>
                        )}
                        {r.aiFeedback && (
                        <Text style={{ fontSize: 15, color: '#374151', lineHeight: 22 }}>{r.aiFeedback}</Text>
                        )}
                      </View>
                    ))}
                  </Surface>
              )}

              {/* Assessment details */}
              <Surface style={{ padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#6B7280' + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <AntDesign name="infocirlceo" size={18} color="#6B7280" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937' }}>Assessment Details</Text>
                </View>
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>Final Score</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#374151' }}>{(Math.round((results.finalScore + Number.EPSILON) * 10) / 10).toFixed(1)}/10</Text>
                </View>
                  {results.timeSpent && (
                    <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>Time Spent</Text>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151' }}>{Math.round(results.timeSpent / 60)} minutes</Text>
                    </View>
                  )}
                  {results.completedAt && (
                  <View>
                    <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>Completed</Text>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151' }}>{new Date(results.completedAt).toLocaleDateString()}</Text>
                    </View>
                  )}
                </Surface>
            </ScrollView>

            {/* Action Buttons */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', paddingHorizontal: 18, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', gap: 12 }}>
              <Button mode="outlined" onPress={handleRetakeAssessment} style={{ flex: 1, borderColor: BRAND, borderRadius: 12 }} labelStyle={{ color: BRAND, fontWeight: '600' }} icon="refresh">Retake</Button>
              <Button mode="outlined" onPress={handleShareResults} style={{ flex: 1, borderColor: '#6B7280', borderRadius: 12 }} labelStyle={{ color: '#6B7280', fontWeight: '600' }} icon="share">Share</Button>
              <Button mode="contained" onPress={handleBackToDashboard} style={{ flex: 1, backgroundColor: BRAND, borderRadius: 12 }} labelStyle={{ color: '#FFFFFF', fontWeight: '600' }} icon="home">Dashboard</Button>
            </View>
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

