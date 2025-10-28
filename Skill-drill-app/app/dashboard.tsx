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
  RefreshControl,
  Alert,
  StyleSheet,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api';
import SessionManager from '../utils/sessionManager';
import DashboardSkeleton from './components/DashboardSkeleton';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BRAND, GRADIENTS, BORDER_RADIUS, SHADOWS, PADDING } from './components/Brand';
import { useResponsive } from '../utils/responsive';
import BottomNavigation from '../components/BottomNavigation';

// Define constants
const BRAND_LIGHT = "#E6F2FF";
const WHITE = "#FFFFFF";
const GRAY = "#9CA3AF";
const DARK_GRAY = "#374151";
const SUCCESS = "#22C55E";
const WARNING = "#F59E0B";
const ERROR = "#EF4444";
const APP_NAME = "Skill Drill";

// Typography System
const TYPOGRAPHY = {
  // Headers - Plain black for better readability
  h1: { fontSize: 24, fontWeight: '700', color: '#000000', letterSpacing: 0.1 },
  h2: { fontSize: 20, fontWeight: '600', color: '#000000', letterSpacing: 0.1 },
  h3: { fontSize: 18, fontWeight: '600', color: '#000000', letterSpacing: 0.1 },
  h4: { fontSize: 16, fontWeight: '600', color: '#000000', letterSpacing: 0.1 },
  
  // Body Text
  bodyLarge: { fontSize: 16, fontWeight: '500', color: DARK_GRAY, lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: '500', color: DARK_GRAY, lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '500', color: DARK_GRAY, lineHeight: 18 },
  
  // Labels and Captions
  labelLarge: { fontSize: 14, fontWeight: '600', color: '#000000', letterSpacing: 0.1 },
  labelMedium: { fontSize: 12, fontWeight: '600', color: '#000000', letterSpacing: 0.1 },
  labelSmall: { fontSize: 10, fontWeight: '600', color: '#000000', letterSpacing: 0.1 },
  
  // Secondary Text
  secondaryLarge: { fontSize: 14, fontWeight: '500', color: GRAY, lineHeight: 20 },
  secondaryMedium: { fontSize: 12, fontWeight: '500', color: GRAY, lineHeight: 18 },
  secondarySmall: { fontSize: 10, fontWeight: '500', color: GRAY, lineHeight: 16 },
  
  // Button Text
  buttonLarge: { fontSize: 16, fontWeight: '600', letterSpacing: 0.1 },
  buttonMedium: { fontSize: 14, fontWeight: '600', letterSpacing: 0.1 },
  buttonSmall: { fontSize: 12, fontWeight: '600', letterSpacing: 0.1 },
  
  // Special Text
  brand: { fontSize: 18, fontWeight: '900', color: WHITE, letterSpacing: 0.5 },
  score: { fontSize: 20, fontWeight: '700', color: BRAND, letterSpacing: 0.2 },
  success: { fontSize: 12, fontWeight: '600', color: SUCCESS, letterSpacing: 0.1 },
  warning: { fontSize: 12, fontWeight: '600', color: WARNING, letterSpacing: 0.1 },
};

// Import logo
const logoSrc = require('../assets/images/logo.png');

interface UserSkill {
  id: string;
  skill: {
    id: string;
    name: string; // Updated from skill_name
    category: string;
    icon?: string;
  };
  assessmentStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  currentScore?: number;
  lastAssessedAt?: string;
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
  const responsive = useResponsive();
  
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentResults, setRecentResults] = useState<CompletedAssessment[]>([]);
  const [completedSkillIdsFromResults, setCompletedSkillIdsFromResults] = useState<Set<string>>(new Set());

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Tab navigation is now handled by BottomNavigation component





  // Calculate enhanced stats
  const stats = useMemo((): DashboardStats => {
    // Use union of selected skills and any skills that have completed assessments
    const selectedSkillIds = new Set(userSkills.map(s => s.skill.id));
    const completedFromResults = new Set(completedSkillIdsFromResults);
    const unionSkillIds = new Set<string>([...Array.from(selectedSkillIds), ...Array.from(completedFromResults)]);

    const totalSkills = unionSkillIds.size;
    const completedSkills = new Set<string>([
      ...userSkills.filter(s => s.assessmentStatus === 'COMPLETED').map(s => s.skill.id),
      ...Array.from(completedFromResults)
    ]).size;

    const inProgressSkills = userSkills.filter(skill => skill.assessmentStatus === 'IN_PROGRESS').length;
    const notStartedSkills = Math.max(0, totalSkills - completedSkills - inProgressSkills);
    const completionRate = totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0;

    // Average score: prefer userSkills scores; fall back to recentResults scores
    const completedSkillScores = userSkills
      .filter(s => s.assessmentStatus === 'COMPLETED' && s.currentScore !== null && s.currentScore !== undefined)
      .map(s => s.currentScore as number);
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


  // Load user skills with better error handling
  const loadUserSkills = async () => {
    // Don't load skills if user is not authenticated or is logging out
    if (!user || SessionManager.isCurrentlyLoggingOut()) {
      setLoadingSkills(false);
      return;
    }

    try {
      const response = await apiService.get('/user/skills');
      
      if (response.success) {
        setUserSkills(response.data);
      } else {
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
    // Don't load assessments if user is not authenticated or is logging out
    if (!user || SessionManager.isCurrentlyLoggingOut()) {
      return;
    }

    try {
      const response = await apiService.get('/assessment/results');
      if (response.success) {
        const list: CompletedAssessment[] = response.data || [];
        setRecentResults(list.slice(0, 5));
        setCompletedSkillIdsFromResults(new Set(list.map(r => r.skillId)));
        
        // Update user skills with assessment scores
        setUserSkills(prevSkills => 
          prevSkills.map(skill => {
            const assessment = list.find(a => a.skillId === skill.skill.id);
            if (assessment && skill.assessmentStatus !== 'COMPLETED') {
              return {
                ...skill,
                assessmentStatus: 'COMPLETED' as const,
                currentScore: assessment.finalScore
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
    // Don't refresh if user is not authenticated or is logging out
    if (!user || SessionManager.isCurrentlyLoggingOut()) {
      return;
    }

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
    const performLogout = async () => {
      try {
        await logout();
        showToast('success', 'Logged Out', 'You have been successfully logged out');
        router.replace('/auth/login');
      } catch (error) {
        console.error('❌ Logout error:', error);
        showToast('error', 'Logout Failed', 'Failed to logout. Please try again.');
      }
    };

    // Use window.confirm for web, Alert.alert for mobile
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: performLogout
          }
        ]
      );
    }
  };

  // Load data on mount
  useEffect(() => {
    if (!authLoading && user) {
      loadUserSkills();
      loadCompletedAssessments();
    }
  }, [authLoading, user]);

  // Refresh data when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && user && !SessionManager.isCurrentlyLoggingOut()) {
        loadUserSkills();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user]);

  // Loading state: render shimmer skeleton (non-blocking)
  if (authLoading || loadingSkills) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  // Main dashboard content
  const renderHomeContent = () => (
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Clean Header - Minimal Design */}
      <View style={styles.cleanHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.appNameOnly}>Dashboard</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.profileButton}>
            <View style={styles.profileCircle}>
              <Text style={styles.profileText}>
                {getUserInitials()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Greeting Section in Main Content */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingText}>
          {getGreeting()}! 👋
        </Text>
        <Text style={styles.welcomeText}>
          Ready to grow your skills?
        </Text>
      </View>

      {/* Enhanced Cards Section */}
      <View style={styles.cardsContainer}>
        
        {/* Enhanced Progress Card */}
        <View style={styles.progressCard}>
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
              <Text style={TYPOGRAPHY.h4}>
                Your Progress
              </Text>
              <Text style={[TYPOGRAPHY.secondaryMedium, { marginTop: 2 }]}>
                Track your skill development
              </Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={[TYPOGRAPHY.h1, { color: BRAND }]}>
                {stats.totalSkills}
              </Text>
              <Text style={[TYPOGRAPHY.labelMedium, { marginTop: 4 }]}>
                Total Skills
              </Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={[TYPOGRAPHY.h1, { color: SUCCESS }]}>
                {stats.completedSkills}
              </Text>
              <Text style={[TYPOGRAPHY.labelMedium, { marginTop: 4 }]}>
                Completed
              </Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={[TYPOGRAPHY.h1, { color: WARNING }]}>
                {stats.completionRate}%
              </Text>
              <Text style={[TYPOGRAPHY.labelMedium, { marginTop: 4 }]}>
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
            <Text style={[TYPOGRAPHY.labelLarge, { marginBottom: 12 }]}>
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
                <Text style={TYPOGRAPHY.bodySmall}>Completed</Text>
              </View>
              <Text style={[TYPOGRAPHY.labelSmall, { color: SUCCESS }]}>
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
                <Text style={TYPOGRAPHY.bodySmall}>In Progress</Text>
              </View>
              <Text style={[TYPOGRAPHY.labelSmall, { color: WARNING }]}>
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
                <Text style={TYPOGRAPHY.bodySmall}>Not Started</Text>
              </View>
              <Text style={[TYPOGRAPHY.labelSmall, { color: GRAY }]}>
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
                <Text style={[TYPOGRAPHY.labelLarge, { color: '#0369A1' }]}>
                  Average Score
                </Text>
                <Text style={[TYPOGRAPHY.score, { color: '#0369A1' }]}>
                  {stats.averageScore}/10
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions Card */}
        <View style={{
          backgroundColor: WHITE,
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          shadowColor: BRAND,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
          borderWidth: 1,
          borderColor: '#F0F4FF'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: '#F0F9FF',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
              borderWidth: 1,
              borderColor: '#E0F2FE'
            }}>
              <Ionicons name="rocket-outline" size={24} color={BRAND} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={TYPOGRAPHY.h3}>
                Quick Actions
              </Text>
              <Text style={[TYPOGRAPHY.secondaryMedium, { marginTop: 2 }]}>
                Jump into your learning journey
              </Text>
            </View>
          </View>

          {/* Enhanced Button Layout */}
          <View style={{ gap: 12 }}>
            {/* Primary Action - Take Assessment */}
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: '/auth/skills',
                  params: { mode: 'assessment' }
                });
              }}
              style={{
                backgroundColor: BRAND,
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: BRAND,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
                borderWidth: 1,
                borderColor: '#3B82F6'
              }}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <MaterialIcons name="psychology" size={18} color={WHITE} />
                </View>
                <View style={{ alignItems: 'flex-start' }}>
                  <Text style={[TYPOGRAPHY.buttonLarge, { color: WHITE }]}>
                    Take Assessment
                  </Text>
                  <Text style={[TYPOGRAPHY.secondarySmall, { color: 'rgba(255, 255, 255, 0.8)', marginTop: 1 }]}>
                    Test your skills now
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Secondary Actions Row */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Add Skills Button */}
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: '/auth/skills',
                    params: { mode: 'add-more-skills' }
                  });
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#F8FAFC',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2
                }}
                activeOpacity={0.8}
              >
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  backgroundColor: '#E0F2FE',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <Ionicons name="add-circle" size={16} color={BRAND} />
                </View>
                <Text style={[TYPOGRAPHY.buttonSmall, { textAlign: 'center' }]}>
                  Add Skills
                </Text>
                <Text style={[TYPOGRAPHY.secondarySmall, { marginTop: 2, textAlign: 'center' }]}>
                  Expand your toolkit
                </Text>
              </TouchableOpacity>

              {/* View Feedback Button */}
              <TouchableOpacity
                onPress={() => {
                  router.push('/activity');
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#F8FAFC',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2
                }}
                activeOpacity={0.8}
              >
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  backgroundColor: '#F0FDF4',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <MaterialIcons name="analytics" size={16} color={SUCCESS} />
                </View>
                <Text style={[TYPOGRAPHY.buttonSmall, { textAlign: 'center' }]}>
                  View Feedback
                </Text>
                <Text style={[TYPOGRAPHY.secondarySmall, { marginTop: 2, textAlign: 'center' }]}>
                  Track progress
                </Text>
              </TouchableOpacity>
            </View>
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
                <Text style={TYPOGRAPHY.h3}>
                  Your Skills
                </Text>
                <Text style={[TYPOGRAPHY.secondaryMedium, { marginTop: 2 }]}>
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
                      <Text style={[TYPOGRAPHY.h4, { marginBottom: 8 }]}>
                        {userSkill.skill.name}
                      </Text>
                      
                      {/* Status Tag */}
                      <View style={{
                        backgroundColor: userSkill.assessmentStatus === 'COMPLETED' ? '#E8F5E8' : 
                                       userSkill.assessmentStatus === 'IN_PROGRESS' ? '#FEF3C7' : '#F3F4F6',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        alignSelf: 'flex-start'
                      }}>
                        <Text style={[
                          TYPOGRAPHY.labelSmall,
                          { color: userSkill.assessmentStatus === 'COMPLETED' ? SUCCESS : 
                                   userSkill.assessmentStatus === 'IN_PROGRESS' ? '#D97706' : '#6B7280' }
                        ]}>
                          {userSkill.assessmentStatus === 'COMPLETED' ? 'Completed' : 
                           userSkill.assessmentStatus === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Score Display for Completed Skills */}
                    {userSkill.assessmentStatus === 'COMPLETED' && userSkill.currentScore && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialIcons name="star" size={16} color="#F59E0B" style={{ marginRight: 4 }} />
                        <Text style={[TYPOGRAPHY.score, { color: DARK_GRAY }]}>
                          {userSkill.currentScore}/10
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
              <Text style={TYPOGRAPHY.buttonMedium}>
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
                <Text style={TYPOGRAPHY.h4}>
                  Recent Results
                </Text>
                <Text style={[TYPOGRAPHY.secondaryMedium, { marginTop: 2 }]}>
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
                    <Text style={TYPOGRAPHY.h4}>{r.skillName}</Text>
                    <Text style={[TYPOGRAPHY.secondarySmall, { marginTop: 2 }]}>{r.scoreLabel || 'Result'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[TYPOGRAPHY.score, { color: BRAND }]}>{r.finalScore}/10</Text>
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Main Content */}
      {renderHomeContent()}



      {/* Bottom Navigation */}
      <BottomNavigation activeTab="home" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollContent: {
    paddingBottom: 100,
    paddingTop: 5
  },
  cleanHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: PADDING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  appNameOnly: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  profileButton: {
    padding: 4,
  },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  profileText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  greetingSection: {
    paddingHorizontal: PADDING.md,
    paddingTop: 10,
    paddingBottom: 5,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
  },
        cardsContainer: {
        paddingHorizontal: PADDING.md,
        marginTop: 15
      },
        progressCard: {
        backgroundColor: WHITE,
        borderRadius: BORDER_RADIUS.lg,
        padding: PADDING.md,
        marginBottom: PADDING.md,
        ...SHADOWS.md,
        borderWidth: 1,
        borderColor: '#E6F2FF'
      },
  // Footer styles moved to BottomNavigation component
});
