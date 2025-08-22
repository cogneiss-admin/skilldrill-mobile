// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
  AppState,
  RefreshControl
, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';

// Define constants
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
const logoSrc = require('../assets/images/logo.png');

interface UserSkill {
  id: string;
  skill: {
    id: string;
    skill_name: string;
    category: string;
    icon?: string;
  };
  assessment_status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  current_score?: number;
  last_assessed_at?: string;
}

interface AssessmentSession {
  session_id: string;
  current_skill_index: number;
  selected_skills: string[];
  is_active: boolean;
  progress?: {
    totalPrompts: number;
    completedResponses: number;
  };
}

interface DashboardStats {
  totalSkills: number;
  completedSkills: number;
  inProgressSkills: number;
  notStartedSkills: number;
  completionRate: number;
  averageScore: number;
  totalAssessments: number;
}

export default function DashboardImproved() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const { showToast } = useToast();
  
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [activeSession, setActiveSession] = useState<AssessmentSession | null>(null);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadingSession, setLoadingSession] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'profile'>('home');

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Check if assessment is completed (session or skills)
  const isAssessmentCompleted = () => {
    // Check if all user skills are completed (regardless of session status)
    const allSkillsCompleted = userSkills.length > 0 && 
                              userSkills.every(skill => skill.assessment_status === 'COMPLETED');
    
    // If no active session, only check skills completion
    if (!activeSession) {
      return allSkillsCompleted;
    }
    
    // If active session exists, check both session and skills completion
    const sessionCompleted = activeSession.completed || 
                           (activeSession.progress && activeSession.progress.status === 'COMPLETED');
    
    return sessionCompleted || allSkillsCompleted;
  };



  // Calculate enhanced stats
  const stats = useMemo((): DashboardStats => {
    const totalSkills = userSkills.length;
    const completedSkills = userSkills.filter(skill => skill.assessment_status === 'COMPLETED').length;
    const inProgressSkills = userSkills.filter(skill => skill.assessment_status === 'IN_PROGRESS').length;
    const notStartedSkills = userSkills.filter(skill => skill.assessment_status === 'NOT_STARTED').length;
    const completionRate = totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0;
    
    // Calculate average score from completed skills
    const completedSkillsWithScores = userSkills.filter(skill => 
      skill.assessment_status === 'COMPLETED' && skill.current_score !== null && skill.current_score !== undefined
    );
    const averageScore = completedSkillsWithScores.length > 0 
      ? completedSkillsWithScores.reduce((sum, skill) => sum + (skill.current_score || 0), 0) / completedSkillsWithScores.length
      : 0;
    
    return {
      totalSkills,
      completedSkills,
      inProgressSkills,
      notStartedSkills,
      completionRate,
      averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal
      totalAssessments: completedSkills + inProgressSkills
    };
  }, [userSkills]);

  // Load user skills with better error handling
  const loadUserSkills = async () => {
    try {
      console.log('🔍 Dashboard: Loading user skills...');
      const response = await apiService.get('/user/skills');
      
      if (response.success) {
        console.log('✅ Dashboard: User skills loaded:', response.data.length);
        // Log each skill's status for debugging
        response.data.forEach((skill: UserSkill) => {
          console.log(`📊 Skill: ${skill.skill.skill_name} - Status: ${skill.assessment_status} - Score: ${skill.current_score}`);
        });
        setUserSkills(response.data);
      } else {
        console.log('ℹ️ Dashboard: No skills found or error:', response.message);
        setUserSkills([]);
      }
    } catch (error) {
      console.error('❌ Dashboard: Error loading skills:', error);
      setUserSkills([]);
    } finally {
      setLoadingSkills(false);
    }
  };

  // Load active session
  const loadActiveSession = async () => {
    try {
      console.log('🔍 Dashboard: Loading active session...');
      const response = await apiService.get('/assessment/session/status');
      
      if (response.success && response.data && response.data.hasActiveSession) {
        console.log('✅ Dashboard: Active session found:', response.data);
        console.log('📊 Session ID:', response.data.sessionId);
        console.log('📊 Session data structure:', Object.keys(response.data));
        console.log('📊 Completed field:', response.data.completed);
        console.log('📊 Progress status:', response.data.progress?.status);
        setActiveSession(response.data);
      } else {
        console.log('ℹ️ Dashboard: No active session found');
        setActiveSession(null);
      }
    } catch (error) {
      console.error('❌ Dashboard: Error loading session:', error);
      setActiveSession(null);
    } finally {
      setLoadingSession(false);
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserSkills(), loadActiveSession()]);
    setRefreshing(false);
  };

  // Handle start assessment
  const handleStartAssessment = async () => {
    try {
      if (userSkills.length === 0) {
        showToast('error', 'No Skills Selected', 'Please select skills first');
        router.push('/auth/skills');
        return;
      }

      const completed = isAssessmentCompleted();
      
      if (activeSession && activeSession.sessionId && !completed) {
        // Resume existing assessment session (only if not completed)
        console.log('🔄 Resuming existing session:', activeSession.sessionId);
        router.push({
          pathname: '/assessment',
          params: { 
            sessionId: activeSession.sessionId,
            resume: 'true'
          }
        });
      } else if (completed) {
        // Assessment completed - user has used their free assessments
        console.log('📊 Assessment completed - redirecting to add more skills');
        showToast('info', 'Free Assessments Used', 'You have completed your free assessments. Add more skills to continue.');
        router.push({
          pathname: '/auth/skills',
          params: { mode: 'assessment', fromCompleted: 'true' }
        });
      } else {
        // Start new assessment - go to assessment intro
        console.log('🆕 Starting new assessment session');
        router.push('/assessment-intro');
      }
    } catch (error) {
      console.error('❌ Dashboard: Error starting assessment:', error);
      showToast('error', 'Error', 'Failed to start assessment');
    }
  };

  // Handle add more skills
  const handleAddMoreSkills = () => {
    const completed = isAssessmentCompleted();
    
    if (completed) {
      // If assessment is completed, add skills for new assessment
      console.log('📊 Assessment completed - adding skills for new assessment');
      router.push({
        pathname: '/auth/skills',
        params: { mode: 'assessment', fromCompleted: 'true' }
      });
    } else {
      // If assessment is in progress, add skills to existing session
      console.log('📊 Assessment in progress - adding skills to existing session');
      router.push({
        pathname: '/auth/skills',
        params: { mode: 'add-to-assessment' }
      });
    }
  };

  // Get user initials
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const nameParts = user.name.trim().split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else if (nameParts.length === 1) {
      return nameParts[0][0].toUpperCase();
    }
    return 'U';
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              showToast('success', 'Logged Out', 'You have been successfully logged out');
              router.replace('/auth/login');
            } catch (error) {
              console.error('❌ Logout error:', error);
              showToast('error', 'Logout Failed', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Load data on mount
  useEffect(() => {
    if (!authLoading) {
      loadUserSkills();
      loadActiveSession();
    }
  }, [authLoading]);

  // Refresh data when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        loadUserSkills();
        loadActiveSession();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Loading state
  if (authLoading || loadingSkills || loadingSession) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
        <StatusBar style="light" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <MotiView
            from={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 1000 }}
          >
            <Image source={logoSrc} style={{ width: 80, height: 80 }} resizeMode="contain" />
          </MotiView>
          <Text style={{ 
            marginTop: 20, 
            fontSize: 16, 
            color: WHITE, 
            fontWeight: '600' 
          }}>
            Loading your dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main dashboard content
  const renderHomeContent = () => (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Enhanced Header */}
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
          <TouchableOpacity onPress={handleLogout}>
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
              <Text style={{
                color: WHITE,
                fontSize: 16,
                fontWeight: '700',
                letterSpacing: 0.5
              }}>
                {getUserInitials()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Enhanced Greeting Section */}
        <View style={{ marginTop: 25 }}>
          <Text style={{
            color: WHITE,
            fontSize: 16,
            opacity: 0.9
          }}>
            {getGreeting()}! 👋
          </Text>
          <Text style={{
            color: WHITE,
            fontSize: 24,
            fontWeight: '700',
            marginTop: 5
          }}>
            Ready to grow?
          </Text>
          <Text style={{
            color: WHITE,
            fontSize: 14,
            opacity: 0.8,
            marginTop: 5
          }}>
            Continue building skills that make a difference
          </Text>
        </View>
      </LinearGradient>

      {/* Enhanced Cards Section */}
      <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
        
        {/* Enhanced Progress Card */}
        <View style={{
          backgroundColor: WHITE,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
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
              backgroundColor: '#E8F5E8',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <MaterialIcons name="trending-up" size={24} color={SUCCESS} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: DARK_GRAY
              }}>
                Your Progress
              </Text>
              <Text style={{
                fontSize: 14,
                color: GRAY,
                marginTop: 2
              }}>
                Track your skill development
              </Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{
                fontSize: 28,
                fontWeight: '800',
                color: BRAND
              }}>
                {stats.totalSkills}
              </Text>
              <Text style={{
                fontSize: 12,
                color: DARK_GRAY,
                marginTop: 4,
                fontWeight: '600'
              }}>
                Total Skills
              </Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{
                fontSize: 28,
                fontWeight: '800',
                color: SUCCESS
              }}>
                {stats.completedSkills}
              </Text>
              <Text style={{
                fontSize: 12,
                color: DARK_GRAY,
                marginTop: 4,
                fontWeight: '600'
              }}>
                Completed
              </Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{
                fontSize: 28,
                fontWeight: '800',
                color: WARNING
              }}>
                {stats.completionRate}%
              </Text>
              <Text style={{
                fontSize: 12,
                color: DARK_GRAY,
                marginTop: 4,
                fontWeight: '600'
              }}>
                Success Rate
              </Text>
            </View>
          </View>

          {/* Progress Breakdown */}
          <View style={{ 
            backgroundColor: '#F8FAFC', 
            borderRadius: 12, 
            padding: 16,
            borderWidth: 1,
            borderColor: '#E2E8F0'
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: DARK_GRAY,
              marginBottom: 12
            }}>
              Progress Breakdown
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: SUCCESS,
                  marginRight: 8
                }} />
                <Text style={{ fontSize: 12, color: DARK_GRAY }}>Completed</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: SUCCESS }}>
                {stats.completedSkills}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: WARNING,
                  marginRight: 8
                }} />
                <Text style={{ fontSize: 12, color: DARK_GRAY }}>In Progress</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: WARNING }}>
                {stats.inProgressSkills}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: GRAY,
                  marginRight: 8
                }} />
                <Text style={{ fontSize: 12, color: DARK_GRAY }}>Not Started</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: GRAY }}>
                {stats.notStartedSkills}
              </Text>
            </View>
          </View>

          {/* Average Score Display */}
          {stats.averageScore > 0 && (
            <View style={{ 
              marginTop: 16,
              backgroundColor: '#F0F9FF', 
              borderRadius: 12, 
              padding: 16,
              borderWidth: 1,
              borderColor: '#BAE6FD'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#0369A1'
                }}>
                  Average Score
                </Text>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#0369A1'
                }}>
                  {stats.averageScore}/10
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Enhanced Quick Actions Card */}
        <View style={{
          backgroundColor: WHITE,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
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
              backgroundColor: '#FEF3C7',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <Ionicons name="rocket" size={24} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: DARK_GRAY
              }}>
                Quick Actions
              </Text>
              <Text style={{
                fontSize: 14,
                color: GRAY,
                marginTop: 2
              }}>
                Continue your journey
              </Text>
            </View>
          </View>

          {(() => {
            const completed = isAssessmentCompleted();
            const hasActiveSession = activeSession && !completed;
            
            console.log('🔍 Button rendering logic:');
            console.log('  - Assessment completed:', completed);
            console.log('  - Has active session:', hasActiveSession);
            console.log('  - User skills length:', userSkills.length);
            
            // Case 1: Assessment completed - show only "Start Assessment" button
            if (completed) {
              return (
                <TouchableOpacity
                  onPress={handleAddMoreSkills}
                  style={{
                    backgroundColor: BRAND,
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                    shadowColor: BRAND,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4
                  }}
                >
                  <Text style={{
                    color: WHITE,
                    fontSize: 16,
                    fontWeight: '700'
                  }}>
                    Start Assessment
                  </Text>
                </TouchableOpacity>
              );
            }
            
            // Case 2: Active session (assessment in progress) - show "Resume Assessment" + "Add More Skills"
            if (hasActiveSession) {
              return (
                <View style={{ gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => router.push({
                      pathname: '/assessment',
                      params: { 
                        sessionId: activeSession.sessionId,
                        resume: 'true'
                      }
                    })}
                    style={{
                      backgroundColor: BRAND,
                      paddingVertical: 16,
                      borderRadius: 12,
                      alignItems: 'center',
                      shadowColor: BRAND,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4
                    }}
                  >
                    <Text style={{
                      color: WHITE,
                      fontSize: 16,
                      fontWeight: '700'
                    }}>
                      Resume Assessment
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleAddMoreSkills}
                    style={{
                      backgroundColor: 'transparent',
                      paddingVertical: 16,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: BRAND,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{
                      color: BRAND,
                      fontSize: 16,
                      fontWeight: '600'
                    }}>
                      Add More Skills
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }
            
            // Case 3: No active session, no completed assessments - show "Start Assessment"
            if (userSkills.length > 0) {
              return (
                <TouchableOpacity
                  onPress={handleStartAssessment}
                  style={{
                    backgroundColor: BRAND,
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                    shadowColor: BRAND,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4
                  }}
                >
                  <Text style={{
                    color: WHITE,
                    fontSize: 16,
                    fontWeight: '700'
                  }}>
                    Start Assessment
                  </Text>
                </TouchableOpacity>
              );
            }
            
            // Case 4: No skills selected - show "Select Skills"
            return (
              <TouchableOpacity
                onPress={handleStartAssessment}
                style={{
                  backgroundColor: BRAND,
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  shadowColor: BRAND,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4
                }}
              >
                <Text style={{
                  color: WHITE,
                  fontSize: 16,
                  fontWeight: '700'
                }}>
                  Select Skills
                </Text>
              </TouchableOpacity>
            );
          })()}
        </View>

        {/* Enhanced Skills Overview Card */}
        {userSkills.length > 0 && (
          <View style={{
            backgroundColor: WHITE,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
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
                <MaterialIcons name="star" size={24} color={BRAND} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: DARK_GRAY
                }}>
                  Your Skills
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: GRAY,
                  marginTop: 2
                }}>
                  {userSkills.length} skill{userSkills.length !== 1 ? 's' : ''} selected
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {userSkills.slice(0, 3).map((userSkill, index) => (
                <View key={userSkill.id} style={{
                  backgroundColor: userSkill.assessment_status === 'COMPLETED' ? '#E8F5E8' : 
                                   userSkill.assessment_status === 'IN_PROGRESS' ? '#FEF3C7' : '#F3F4F6',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: userSkill.assessment_status === 'COMPLETED' ? SUCCESS : 
                               userSkill.assessment_status === 'IN_PROGRESS' ? '#F59E0B' : '#D1D5DB'
                }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: userSkill.assessment_status === 'COMPLETED' ? SUCCESS : 
                           userSkill.assessment_status === 'IN_PROGRESS' ? '#F59E0B' : DARK_GRAY
                  }}>
                    {userSkill.skill.skill_name}
                  </Text>
                </View>
              ))}
              {userSkills.length > 3 && (
                <View style={{
                  backgroundColor: '#F3F4F6',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#D1D5DB'
                }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: DARK_GRAY
                  }}>
                    +{userSkills.length - 3} more
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar style="dark" />
      
      {/* Main Content */}
      {renderHomeContent()}

      {/* Bottom Navigation */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingBottom: 20,
        paddingTop: 10
      }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 20 }}>
          <TouchableOpacity
            onPress={() => setActiveTab('home')}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 8
            }}
          >
            <AntDesign 
              name="home" 
              size={24} 
              color={activeTab === 'home' ? BRAND : GRAY} 
            />
            <Text style={{
              fontSize: 12,
              color: activeTab === 'home' ? BRAND : GRAY,
              marginTop: 4,
              fontWeight: activeTab === 'home' ? '600' : '400'
            }}>
              Home
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
