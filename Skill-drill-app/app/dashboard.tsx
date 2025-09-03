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
import DashboardSkeleton from './components/DashboardSkeleton';
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



interface DashboardStats {
  totalSkills: number;
  completedSkills: number;
  inProgressSkills: number;
  notStartedSkills: number;
  completionRate: number;
  averageScore: number;
  totalAssessments: number;
}

type CompletedAssessment = {
  id: string;
  skillId: string;
  skillName: string;
  finalScore: number;
  scoreLabel?: string;
  stars?: number;
  completedAt?: string;
};

export default function DashboardImproved() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const { showToast } = useToast();
  
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'profile'>('home');
  const [recentResults, setRecentResults] = useState<CompletedAssessment[]>([]);
  const [completedSkillIdsFromResults, setCompletedSkillIdsFromResults] = useState<Set<string>>(new Set());

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };





  // Calculate enhanced stats
  const stats = useMemo((): DashboardStats => {
    // Use union of selected skills and any skills that have completed assessments
    const selectedSkillIds = new Set(userSkills.map(s => s.skill.id));
    const completedFromResults = new Set(completedSkillIdsFromResults);
    const unionSkillIds = new Set<string>([...Array.from(selectedSkillIds), ...Array.from(completedFromResults)]);

    const totalSkills = unionSkillIds.size;
    const completedSkills = new Set<string>([
      ...userSkills.filter(s => s.assessment_status === 'COMPLETED').map(s => s.skill.id),
      ...Array.from(completedFromResults)
    ]).size;

    const inProgressSkills = userSkills.filter(skill => skill.assessment_status === 'IN_PROGRESS').length;
    const notStartedSkills = Math.max(0, totalSkills - completedSkills - inProgressSkills);
    const completionRate = totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0;

    // Average score: prefer userSkills scores; fall back to recentResults scores
    const completedSkillScores = userSkills
      .filter(s => s.assessment_status === 'COMPLETED' && s.current_score !== null && s.current_score !== undefined)
      .map(s => s.current_score as number);
    const resultScores = recentResults.map(r => r.finalScore).filter(s => typeof s === 'number') as number[];
    const scorePool = completedSkillScores.length > 0 ? completedSkillScores : resultScores;
    const averageScore = scorePool.length > 0
      ? scorePool.reduce((sum, v) => sum + v, 0) / scorePool.length
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
  }, [userSkills, completedSkillIdsFromResults]);

  // Detailed breakdown logs for Not Started/In Progress/Completed
  useEffect(() => {
    try {
      const selectedSkillIds = new Set(userSkills.map(s => s.skill.id));
      const completedFromResults = new Set(Array.from(completedSkillIdsFromResults.values()));
      const unionSkillIds = new Set<string>([...Array.from(selectedSkillIds), ...Array.from(completedFromResults)]);
      const completedFromUser = new Set(userSkills.filter(s => s.assessment_status === 'COMPLETED').map(s => s.skill.id));
      const inProgressFromUser = new Set(userSkills.filter(s => s.assessment_status === 'IN_PROGRESS').map(s => s.skill.id));
      const pendingFromUser = new Set(userSkills.filter(s => s.assessment_status === 'PENDING' || s.assessment_status === 'NOT_STARTED').map(s => s.skill.id));

      console.log('🔎 DASHBOARD BREAKDOWN');
      console.log('  selectedSkillIds:', Array.from(selectedSkillIds));
      console.log('  completedFromResults:', Array.from(completedFromResults));
      console.log('  unionSkillIds (totalSkills):', Array.from(unionSkillIds));
      console.log('  completedFromUser:', Array.from(completedFromUser));
      console.log('  inProgressFromUser:', Array.from(inProgressFromUser));
      console.log('  pending/NOT_STARTED from user:', Array.from(pendingFromUser));
      console.log('  computed stats ->', stats);
    } catch (e) {
      // no-op
    }
  }, [userSkills, completedSkillIdsFromResults, stats]);

  // Debug: log inputs and computed stats so we can correlate with UI
  useEffect(() => {
    try {
      console.log('📊 DASHBOARD DEBUG → userSkills:', userSkills.map(s => ({
        skillId: s.skill.id,
        name: s.skill.skill_name,
        status: s.assessment_status,
        score: s.current_score
      })));
      console.log('📊 DASHBOARD DEBUG → recentResults:', recentResults.map(r => ({
        assessmentId: r.id,
        skillId: r.skillId,
        skillName: r.skillName,
        finalScore: r.finalScore
      })));
      console.log('📊 DASHBOARD DEBUG → completedSkillIdsFromResults:', Array.from(completedSkillIdsFromResults.values()));
      console.log('📊 DASHBOARD DEBUG → computed stats:', stats);
    } catch (e) {
      // no-op
    }
  }, [userSkills, recentResults, completedSkillIdsFromResults, stats]);

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



  // Load completed assessments for recent results
  const loadCompletedAssessments = async () => {
    try {
      console.log('🔍 Dashboard: Loading completed assessments...');
      const response = await apiService.get('/assessment/results');
      if (response.success) {
        const list: CompletedAssessment[] = response.data || [];
        console.log('✅ Dashboard: Completed assessments loaded:', list.length);
        list.forEach((r) => console.log('  →', r.skillName, r.finalScore, r.id));
        setRecentResults(list.slice(0, 5));
        setCompletedSkillIdsFromResults(new Set(list.map(r => r.skillId)));
        
        // Update user skills with assessment scores
        setUserSkills(prevSkills => 
          prevSkills.map(skill => {
            const assessment = list.find(a => a.skillId === skill.skill.id);
            if (assessment && skill.assessment_status !== 'COMPLETED') {
              return {
                ...skill,
                assessment_status: 'COMPLETED' as const,
                current_score: assessment.finalScore
              };
            }
            return skill;
          })
        );
      } else {
        setRecentResults([]);
        setCompletedSkillIdsFromResults(new Set());
      }
    } catch (error) {
      console.error('❌ Dashboard: Error loading completed assessments:', error);
      setRecentResults([]);
      setCompletedSkillIdsFromResults(new Set());
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserSkills(), loadCompletedAssessments()]);
    setRefreshing(false);
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
      loadCompletedAssessments();
    }
  }, [authLoading]);

  // Refresh data when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        loadUserSkills();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Loading state: render shimmer skeleton (non-blocking)
  if (authLoading || loadingSkills) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <StatusBar style="dark" />
        <DashboardSkeleton />
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
            fontSize: 20,
            fontWeight: '700',
            marginTop: 4
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
                fontSize: 16,
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
                fontSize: 24,
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
                fontSize: 24,
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
                fontSize: 24,
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

        {/* Quick Actions Card */}
        <View style={{
          backgroundColor: WHITE,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          shadowColor: BRAND,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5,
          borderWidth: 1,
          borderColor: '#E6F2FF'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: '#FEF3C7',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 10
            }}>
              <Ionicons name="flash" size={20} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: DARK_GRAY
              }}>
                Quick Actions
              </Text>
              <Text style={{
                fontSize: 12,
                color: GRAY,
                marginTop: 1
              }}>
                Manage your skills and feedback
              </Text>
            </View>
          </View>

          {/* Two Button Layout */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* Add Skills Button */}
            <TouchableOpacity
              onPress={() => {
                console.log('🎯 Navigating to Add More Skills...');
                router.push({
                  pathname: '/auth/skills',
                  params: { mode: 'add-more-skills' }
                });
              }}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                paddingVertical: 14,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: BRAND,
                alignItems: 'center',
                minHeight: 50,
                justifyContent: 'center'
              }}
              activeOpacity={0.8}
            >
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="add-circle-outline" size={18} color={BRAND} style={{ marginBottom: 3 }} />
                <Text style={{
                  color: BRAND,
                  fontSize: 12,
                  fontWeight: '600',
                  letterSpacing: 0.3
                }}>
                  Add Skills
                </Text>
              </View>
            </TouchableOpacity>

            {/* Recent Feedback Button */}
            <TouchableOpacity
              onPress={() => {
                console.log('🎯 Navigating to Recent Feedback...');
                router.push('/activity');
              }}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                paddingVertical: 14,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: BRAND,
                alignItems: 'center'
              }}
            >
              <View style={{ alignItems: 'center' }}>
                <MaterialIcons name="analytics" size={18} color={BRAND} style={{ marginBottom: 3 }} />
                <Text style={{
                  color: BRAND,
                  fontSize: 12,
                  fontWeight: '600',
                  letterSpacing: 0.3
                }}>
                  Recent Feedback
                </Text>
              </View>
            </TouchableOpacity>
          </View>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#E6F2FF',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <MaterialIcons name="book" size={24} color={BRAND} />
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

            {/* Individual Skill Cards */}
            <View style={{ gap: 12 }}>
              {userSkills.map((userSkill, index) => (
                <View key={userSkill.id} style={{
                  backgroundColor: WHITE,
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 2
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: DARK_GRAY,
                        marginBottom: 8
                      }}>
                        {userSkill.skill.skill_name}
                      </Text>
                      
                      {/* Status Tag */}
                      <View style={{
                        backgroundColor: userSkill.assessment_status === 'COMPLETED' ? '#E8F5E8' : 
                                       userSkill.assessment_status === 'IN_PROGRESS' ? '#FEF3C7' : '#F3F4F6',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        alignSelf: 'flex-start'
                      }}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: userSkill.assessment_status === 'COMPLETED' ? SUCCESS : 
                                 userSkill.assessment_status === 'IN_PROGRESS' ? '#D97706' : '#6B7280'
                        }}>
                          {userSkill.assessment_status === 'COMPLETED' ? 'Completed' : 
                           userSkill.assessment_status === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Score Display for Completed Skills */}
                    {userSkill.assessment_status === 'COMPLETED' && userSkill.current_score && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialIcons name="star" size={16} color="#F59E0B" style={{ marginRight: 4 }} />
                        <Text style={{
                          fontSize: 16,
                          fontWeight: '700',
                          color: DARK_GRAY
                        }}>
                          {userSkill.current_score}/10
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Add More Skills Button */}
            <TouchableOpacity
              onPress={() => router.push('/auth/skills?mode=add-more-skills')}
              style={{
                backgroundColor: '#F3F4F6',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                marginTop: 16,
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: DARK_GRAY
              }}>
                +1 more skill
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Results */}
        {recentResults.length > 0 && (
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
                backgroundColor: '#EEF2FF',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Ionicons name="ribbon-outline" size={24} color={BRAND} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: DARK_GRAY
                }}>
                  Recent Results
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: GRAY,
                  marginTop: 2
                }}>
                  Your latest completed assessments
                </Text>
              </View>
            </View>

            {recentResults.map((r) => (
              <View key={r.id} style={{
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: '#E5E7EB'
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: DARK_GRAY }}>{r.skillName}</Text>
                    <Text style={{ fontSize: 12, color: GRAY, marginTop: 2 }}>{r.scoreLabel || 'Result'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: BRAND }}>{r.finalScore}/10</Text>
                  </View>
                </View>
              </View>
            ))}
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

          <TouchableOpacity
            onPress={() => { 
              console.log('🎯 Navigating to My Activity...');
              console.log('🎯 Current route:', router.getCurrentPath?.() || 'unknown');
              
              // Simple direct navigation
              router.push('/activity');
              console.log('✅ Navigation attempted');
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 8
            }}
          >
            <Ionicons 
              name="time-outline" 
              size={24} 
              color={activeTab === 'activity' ? BRAND : GRAY} 
            />
            <Text style={{
              fontSize: 12,
              color: GRAY,
              marginTop: 4,
              fontWeight: '400'
            }}>
              My Activity
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
