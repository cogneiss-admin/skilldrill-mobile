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
  AppState
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api';
import { Alert } from 'react-native';
// Define constants inline like other files
const BRAND = "#0A66C2";
const BRAND_LIGHT = "#E6F2FF";
const WHITE = "#FFFFFF";
const GRAY = "#9CA3AF";
const DARK_GRAY = "#374151";
const SUCCESS = "#22C55E";
const WARNING = "#F59E0B";
const ERROR = "#EF4444";
const APP_NAME = "Skill Drill";
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';

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
  progress_percentage?: number;
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

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const { showToast } = useToast();
  
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [activeSession, setActiveSession] = useState<AssessmentSession | null>(null);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadingSession, setLoadingSession] = useState(true);

  const [activeTab, setActiveTab] = useState<'home' | 'profile'>('home');

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalSkills = userSkills.length;
    const completedSkills = userSkills.filter(skill => skill.assessment_status === 'COMPLETED').length;
    const inProgressSkills = userSkills.filter(skill => skill.assessment_status === 'IN_PROGRESS').length;
    const completionRate = totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0;
    
    return {
      totalSkills,
      completedSkills,
      inProgressSkills,
      completionRate
    };
  }, [userSkills]);

  // Load user skills
  const loadUserSkills = async () => {
    try {
      console.log('🔍 Dashboard: Loading user skills...');
      const response = await apiService.get('/user/skills');
      
      if (response.success) {
        console.log('✅ Dashboard: User skills loaded:', response.data.length);
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
      
      console.log('📊 Session response:', response);
      
      if (response.success && response.data && response.data.hasActiveSession) {
        console.log('✅ Dashboard: Active session found:', response.data.sessionId);
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



  // Handle start assessment
  const handleStartAssessment = async () => {
    try {
      console.log('🚀 Dashboard: Starting assessment...');
      
      if (userSkills.length === 0) {
        showToast('error', 'No Skills Selected', 'Please select skills first');
        router.push('/auth/skills');
        return;
      }

      // Check if we have an active session
      if (activeSession) {
        console.log('📋 Dashboard: Resuming existing session');
        router.push({
          pathname: '/assessment',
          params: { 
            sessionId: activeSession.sessionId,
            resume: 'true'
          }
        });
      } else {
        console.log('🆕 Dashboard: Creating new assessment session');
        // Navigate to skills selection with assessment mode
        router.push({
          pathname: '/auth/skills',
          params: { mode: 'assessment' }
        });
      }
    } catch (error) {
      console.error('❌ Dashboard: Error starting assessment:', error);
      showToast('error', 'Error', 'Failed to start assessment');
    }
  };

  // Handle add more skills
  const handleAddMoreSkills = () => {
    router.push({
      pathname: '/auth/skills',
      params: { mode: 'add-to-assessment' }
    });
  };

  // Handle resume assessment
  const handleResumeAssessment = () => {
    if (activeSession) {
      router.push({
        pathname: '/assessment',
        params: { 
          sessionId: activeSession.sessionId,
          resume: 'true'
        }
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
        {
          text: 'Cancel',
          style: 'cancel'
        },
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
    >
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

        {/* Greeting Section */}
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



      {/* Beautiful Cards Section */}
      <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
        
        {/* Progress Card */}
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
              <AntDesign name="barschart" size={24} color={SUCCESS} />
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
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
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
                Skills
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
        </View>

        {/* Quick Actions Card */}
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
              <AntDesign name="rocket1" size={24} color="#F59E0B" />
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

          {activeSession ? (
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={handleResumeAssessment}
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
          ) : userSkills.length > 0 ? (
            <View style={{ gap: 12 }}>
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
          ) : (
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
          )}
        </View>

        {/* Skills Overview Card */}
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
                <AntDesign name="star" size={24} color={BRAND} />
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

  // Profile content
  const renderProfileContent = () => (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
      showsVerticalScrollIndicator={false}
    >
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
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          {/* Profile Avatar */}
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 3,
            borderColor: 'rgba(255, 255, 255, 0.3)',
            marginBottom: 16
          }}>
            <Text style={{
              color: WHITE,
              fontSize: 36,
              fontWeight: '700',
              letterSpacing: 1
            }}>
              {getUserInitials()}
            </Text>
          </View>

          {/* User Name */}
          <Text style={{
            color: WHITE,
            fontSize: 24,
            fontWeight: '700',
            marginBottom: 4
          }}>
            {user?.name || 'User'}
          </Text>

          {/* User Email */}
          <Text style={{
            color: WHITE,
            fontSize: 14,
            opacity: 0.9,
            marginBottom: 8
          }}>
            {user?.email || 'user@example.com'}
          </Text>

          {/* Member Since */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)'
          }}>
            <Text style={{
              color: WHITE,
              fontSize: 12,
              fontWeight: '500'
            }}>
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Profile Stats */}
      <View style={{
        margin: 20,
        marginTop: -15,
        backgroundColor: WHITE,
        borderRadius: 12,
        padding: 20,
        shadowColor: BRAND,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E6F2FF'
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '700',
          color: DARK_GRAY,
          marginBottom: 16
        }}>
          Your Progress
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: BRAND
            }}>
              {stats.totalSkills}
            </Text>
            <Text style={{
              fontSize: 12,
              color: DARK_GRAY,
              marginTop: 2
            }}>
              Skills Selected
            </Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: SUCCESS
            }}>
              {stats.completedSkills}
            </Text>
            <Text style={{
              fontSize: 12,
              color: DARK_GRAY,
              marginTop: 2
            }}>
              Completed
            </Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: WARNING
            }}>
              {stats.completionRate}%
            </Text>
            <Text style={{
              fontSize: 12,
              color: DARK_GRAY,
              marginTop: 2
            }}>
              Success Rate
            </Text>
          </View>
        </View>
      </View>

      {/* Personal Information */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: DARK_GRAY,
          marginBottom: 15
        }}>
          Personal Information
        </Text>

        <View style={{
          backgroundColor: WHITE,
          borderRadius: 12,
          padding: 20,
          shadowColor: BRAND,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
          borderWidth: 1,
          borderColor: '#E6F2FF'
        }}>
          {/* Career Stage */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: BRAND_LIGHT,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <AntDesign name="rocket1" size={20} color={BRAND} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 12,
                color: GRAY,
                marginBottom: 2
              }}>
                Career Stage
              </Text>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: DARK_GRAY
              }}>
                {user?.career_stage || 'Not specified'}
              </Text>
            </View>
          </View>

          {/* Role Type */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#FEF3C7',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <AntDesign name="team" size={20} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 12,
                color: GRAY,
                marginBottom: 2
              }}>
                Role Type
              </Text>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: DARK_GRAY
              }}>
                {user?.role_type || 'Not specified'}
              </Text>
            </View>
          </View>

          {/* Email */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#E0F2FE',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <AntDesign name="mail" size={20} color="#0288D1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 12,
                color: GRAY,
                marginBottom: 2
              }}>
                Email Address
              </Text>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: DARK_GRAY
              }}>
                {user?.email || 'Not specified'}
              </Text>
            </View>
          </View>

          {/* Account Status */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#E8F5E8',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <AntDesign name="checkcircle" size={20} color={SUCCESS} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 12,
                color: GRAY,
                marginBottom: 2
              }}>
                Account Status
              </Text>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: SUCCESS
              }}>
                Active
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Simple Logout Button */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <TouchableOpacity 
          onPress={handleLogout}
          style={{
            backgroundColor: '#F8FAFC',
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#E2E8F0'
          }}
        >
          <AntDesign name="logout" size={18} color={ERROR} style={{ marginRight: 8 }} />
          <Text style={{
            color: ERROR,
            fontSize: 15,
            fontWeight: '600'
          }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>

      {/* App Information */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <View style={{
          backgroundColor: WHITE,
          borderRadius: 12,
          padding: 20,
          shadowColor: BRAND,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
          borderWidth: 1,
          borderColor: '#E6F2FF'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Image source={logoSrc} style={{ width: 32, height: 32 }} resizeMode="contain" />
            <Text style={{
              marginLeft: 12,
              fontSize: 18,
              fontWeight: '700',
              color: DARK_GRAY
            }}>
              {APP_NAME}
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{
              fontSize: 12,
              color: GRAY,
              marginBottom: 2
            }}>
              Version
            </Text>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: DARK_GRAY
            }}>
              1.0.0
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{
              fontSize: 12,
              color: GRAY,
              marginBottom: 2
            }}>
              Build Date
            </Text>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: DARK_GRAY
            }}>
              {new Date().toLocaleDateString()}
            </Text>
          </View>

          <View>
            <Text style={{
              fontSize: 12,
              color: GRAY,
              marginBottom: 2
            }}>
              Support
            </Text>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: BRAND
            }}>
              support@skilldrill.com
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar style="dark" />
      
      {/* Main Content */}
      {activeTab === 'home' ? renderHomeContent() : renderProfileContent()}

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
          
          <TouchableOpacity
            onPress={() => setActiveTab('profile')}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 8
            }}
          >
            <AntDesign 
              name="user" 
              size={24} 
              color={activeTab === 'profile' ? BRAND : GRAY} 
            />
            <Text style={{
              fontSize: 12,
              color: activeTab === 'profile' ? BRAND : GRAY,
              marginTop: 4,
              fontWeight: activeTab === 'profile' ? '600' : '400'
            }}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}


