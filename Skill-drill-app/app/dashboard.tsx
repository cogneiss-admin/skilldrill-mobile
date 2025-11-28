import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  AppState,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useAuth } from '../hooks/useAuth';
import DashboardShimmer from './components/DashboardShimmer';
import BottomNavigation from '../components/BottomNavigation';
import { SCREEN_BACKGROUND, SCREEN_CONTAINER_BACKGROUND, TYPOGRAPHY, COLORS, SPACING, BORDER_RADIUS, SHADOWS, BRAND, BRAND_LIGHT } from './components/Brand';
import { apiService } from '../services/api';

const DASH_ANIME_LOTTIE = require('../assets/lottie/DashAnime.json');

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasDrills, setHasDrills] = useState<boolean>(false);
  const [recentAssessments, setRecentAssessments] = useState<any[]>([]);
  const [overallProgress, setOverallProgress] = useState<{
    averageScore: number | string;
    completedSkills: number | string;
    totalSkills: number;
    completionPercentage: number | string;
  } | null>(null);

  // Track retry timeouts
  const retryTimeoutsRef = React.useRef<{
    assessments?: ReturnType<typeof setTimeout>;
    drills?: ReturnType<typeof setTimeout>;
  }>({});

  const RETRY_DELAY = 3000; // 3 seconds

  const loadUserSkills = async (): Promise<{ data: any[]; success: boolean }> => {
    try {
      const response = await apiService.get('/user/skills');
      return {
        data: response.success ? (response.data || []) : [],
        success: response.success,
      };
    } catch (error) {
      return { data: [], success: false };
    }
  };

  const loadAssessments = async (): Promise<{ data: any[]; success: boolean }> => {
    try {
      const response = await apiService.get('/assessment/results');
    return {
        data: response.success ? (response.data || []) : [],
        success: response.success,
      };
    } catch (error) {
      return { data: [], success: false };
    }
  };

  const loadDrillAssignments = async (): Promise<{ data: any[]; success: boolean }> => {
    try {
      const response = await apiService.getDrillAssignments({ limit: 50 });
      return {
        data: response.success ? (response.data?.data || []) : [],
        success: response.success,
      };
    } catch (error) {
      return { data: [], success: false };
    }
  };

  const checkDrillsExistence = async (): Promise<void> => {
    if (!user) {
      setHasDrills(false);
      return;
    }

    try {
      // Check for purchased/assigned drills
      const assignmentsResponse = await apiService.getDrillAssignments({ limit: 1 });
      const hasAssignments = assignmentsResponse.success &&
        assignmentsResponse.data?.assignments &&
        Array.isArray(assignmentsResponse.data.assignments) &&
        assignmentsResponse.data.assignments.length > 0;

      if (hasAssignments) {
        setHasDrills(true);
        return;
      }

      // Also check for recommended drills (unpurchased)
      const recommendationsResponse = await apiService.getUserRecommendations();
      const hasRecommendations = recommendationsResponse.success &&
        recommendationsResponse.data?.unpurchasedDrills &&
        Array.isArray(recommendationsResponse.data.unpurchasedDrills) &&
        recommendationsResponse.data.unpurchasedDrills.length > 0;

      setHasDrills(hasRecommendations);
    } catch (error) {
      setHasDrills(false);
    }
  };

  const loadDrillAggregates = async (completedDrillAssignments: any[]): Promise<number[]> => {
    const drillAggregatePromises = completedDrillAssignments.map(
      async (assignment: { id: string }) => {
        try {
          const aggregateResponse = await apiService.getDrillAggregate(assignment.id);
          if (aggregateResponse.success && aggregateResponse.data?.averageScore !== null) {
            return aggregateResponse.data.averageScore;
          }
          return 0;
        } catch (error) {
          return 0;
        }
      }
    );

    const drillAggregateScores = await Promise.all(drillAggregatePromises);
    return drillAggregateScores.filter(
      (score: number): score is number => 
        typeof score === 'number' && !isNaN(score) && score > 0
    );
  };

  const calculateProgress = (
    userSkills: any[],
    assessmentsData: { data: any[]; success: boolean },
    drillsData: { data: any[]; success: boolean },
    drillScores: number[]
  ) => {
    const totalSkills = userSkills.length;

    // Get skills completed via assessments
    const skillsCompletedViaAssessments = new Set(
      userSkills
        .filter((skill: { assessmentStatus?: string }) => skill.assessmentStatus === 'COMPLETED')
        .map((skill: { skill?: { id?: string }; skillId?: string }) => skill.skill?.id || skill.skillId)
    );

    // Get skills completed via drills
    const completedDrillAssignments = drillsData.success
      ? drillsData.data.filter((assignment: { status?: string }) => assignment.status === 'Completed')
      : [];

    const skillsCompletedViaDrills = new Set(
      completedDrillAssignments.map(
        (assignment: { skillId?: string }) => assignment.skillId
      ).filter((id: string | undefined): id is string => !!id)
    );

    // Combine both sets to get all completed skills
    const allCompletedSkillIds = new Set([
      ...Array.from(skillsCompletedViaAssessments),
      ...Array.from(skillsCompletedViaDrills),
    ]);

    const completedSkills = allCompletedSkillIds.size;

    // Calculate average score
    const assessmentScores = assessmentsData.success
      ? assessmentsData.data
          .map((assessment: { finalScore?: number }) => assessment.finalScore)
          .filter((score: number | undefined): score is number => 
            typeof score === 'number' && !isNaN(score) && score >= 0
          )
      : [];

    const allScores = [...assessmentScores, ...drillScores];
    const averageScore = allScores.length > 0
      ? Math.round((allScores.reduce((sum: number, score: number) => sum + score, 0) / allScores.length) * 10) / 10
      : null;

    const completionPercentage = totalSkills > 0
      ? Math.round((completedSkills / totalSkills) * 100)
      : null;

    return {
      averageScore: averageScore !== null ? averageScore : '-',
      completedSkills: assessmentsData.success || drillsData.success ? completedSkills : '-',
      totalSkills,
      completionPercentage: completionPercentage !== null ? completionPercentage : '-',
    };
  };

  // Reusable function to refetch all dashboard data
  const refetchDashboardData = async (isRetry = false): Promise<void> => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Clear existing retry timeouts
    if (retryTimeoutsRef.current.assessments) {
      clearTimeout(retryTimeoutsRef.current.assessments);
    }
    if (retryTimeoutsRef.current.drills) {
      clearTimeout(retryTimeoutsRef.current.drills);
    }

    try {
      // Load user skills first (required)
      const userSkillsData = await loadUserSkills();
      
      if (!userSkillsData.success) {
        setLoading(false);
        return;
      }

      // Check if drills exist for the user (separate check for button state)
      await checkDrillsExistence();

      // Load assessments and drills independently
      const [assessmentsData, drillsData] = await Promise.all([
        loadAssessments(),
        loadDrillAssignments(),
      ]);

      // Load drill aggregates if drills were successful
      let drillScores: number[] = [];
      if (drillsData.success) {
        const completedDrillAssignments = drillsData.data.filter(
          (assignment: { status?: string }) => assignment.status === 'Completed'
        );
        drillScores = await loadDrillAggregates(completedDrillAssignments);
      }

      // Calculate progress with available data
      const progress = calculateProgress(
        userSkillsData.data,
        assessmentsData,
        drillsData,
        drillScores
      );

      setOverallProgress(progress);

      // Store recent assessments for Recent Activity section
      if (assessmentsData.success && assessmentsData.data) {
        // Sort by completedAt (most recent first) and take latest 5
        const sortedAssessments = [...assessmentsData.data]
          .sort((a: any, b: any) => {
            const dateA = new Date(a.completedAt || 0).getTime();
            const dateB = new Date(b.completedAt || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 5);
        setRecentAssessments(sortedAssessments);
      } else {
        setRecentAssessments([]);
      }

      // Retry failed requests after delay
      if (!assessmentsData.success && !isRetry) {
        retryTimeoutsRef.current.assessments = setTimeout(() => {
          refetchDashboardData(true);
        }, RETRY_DELAY);
      }

      if (!drillsData.success && !isRetry) {
        retryTimeoutsRef.current.drills = setTimeout(() => {
          refetchDashboardData(true);
        }, RETRY_DELAY);
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  // Alias for backward compatibility
  const loadDashboardData = refetchDashboardData;

  const onRefresh = async () => {
    if (!user) {
      return;
    }

    setRefreshing(true);
    await refetchDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadDashboardData();
    }
  }, [authLoading, user]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && user) {
        loadDashboardData();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove();
      // Cleanup retry timeouts
      if (retryTimeoutsRef.current.assessments) {
        clearTimeout(retryTimeoutsRef.current.assessments);
      }
      if (retryTimeoutsRef.current.drills) {
        clearTimeout(retryTimeoutsRef.current.drills);
      }
    };
  }, [user]);

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <DashboardShimmer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
        <View style={styles.headerContent}>
              <Text style={styles.greetingEmoji}>👋</Text>
        <Text style={styles.greetingText}>
                Welcome back, <Text style={styles.userNameText}>{user?.name?.trim() || 'User'}</Text>!
              </Text>
            </View>
          </View>
          
          {/* Overall Progress Card */}
          <View style={styles.progressCard}>
            <LottieView
              source={DASH_ANIME_LOTTIE}
              style={styles.animatedLottie}
              autoPlay
              loop
              resizeMode="contain"
            />
            {overallProgress && (
              <View style={styles.progressContent}>
                <Text style={styles.progressTitle}>Overall Progress</Text>
                <View style={styles.progressStats}>
                  <View style={styles.progressStatItem}>
                    <Text style={styles.progressStatValue}>
                      {typeof overallProgress.averageScore === 'number' 
                        ? overallProgress.averageScore.toFixed(1) 
                        : overallProgress.averageScore}
              </Text>
                    <Text style={styles.progressStatLabel}>Avg Score</Text>
            </View>
                  <View style={styles.progressStatItem}>
                    <Text style={styles.progressStatValue}>
                      {typeof overallProgress.completedSkills === 'number'
                        ? `${overallProgress.completedSkills}/${overallProgress.totalSkills}`
                        : overallProgress.completedSkills}
              </Text>
                    <Text style={styles.progressStatLabel}>Skills Completed</Text>
            </View>
                  <View style={styles.progressStatItem}>
                    <Text style={styles.progressStatValue}>
                      {typeof overallProgress.completionPercentage === 'number'
                        ? `${overallProgress.completionPercentage}%`
                        : overallProgress.completionPercentage}
              </Text>
                    <Text style={styles.progressStatLabel}>Complete</Text>
            </View>
          </View>
              </View>
            )}
          </View>

          {/* Quick Actions Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionButton}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/activity', params: { tab: 'assessments' } })}
            >
              <Ionicons name="document-text" size={24} color={COLORS.white} style={styles.quickActionIcon} />
              <Text style={styles.quickActionButtonText} numberOfLines={2}>New Assessment</Text>
            </TouchableOpacity>
            {hasDrills ? (
              <TouchableOpacity
                style={styles.quickActionButton}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/activity', params: { tab: 'drills' } })}
              >
                <Ionicons
                  name="sparkles"
                  size={24}
                  color={COLORS.white}
                  style={styles.quickActionIcon}
                />
                <Text
                  style={styles.quickActionButtonText}
                  numberOfLines={2}
                >
                  Practice Drills
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.quickActionButtonDisabled}
                activeOpacity={1}
                disabled={true}
              >
                <Ionicons 
                  name="lock-closed" 
                  size={24} 
                  color={COLORS.warning} 
                  style={styles.quickActionIcon} 
                />
                <Text 
                  style={styles.quickActionButtonTextDisabled} 
                  numberOfLines={2}
                >
                  Practice Drills
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Recent Activity Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>

          {recentAssessments.length > 0 ? (
            <View style={styles.recentActivityList}>
              {recentAssessments.map((assessment: any) => {
                const skillName = assessment.skillName;
                const initials = skillName
                  .split(' ')
                  .map((word: string) => word[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                const score = assessment.finalScore !== null && assessment.finalScore !== undefined
                  ? Math.round(assessment.finalScore * 10)
                  : 0;
                
                // Format date
                const formatDate = (dateString: string | Date) => {
                  if (!dateString) return '';
                  const date = new Date(dateString);
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
                };
                
                return (
                  <View key={assessment.id} style={styles.activityCard}>
                    <View style={styles.activityAvatar}>
                      <Text style={styles.activityAvatarText}>{initials}</Text>
              </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activitySkillName} numberOfLines={1}>
                        {skillName}
                      </Text>
                      {assessment.completedAt && (
                        <Text style={styles.activityDate}>
                          {formatDate(assessment.completedAt)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.activityScore}>
                      <Text style={styles.activityScoreText}>
                        {score > 0 ? `${score}%` : '-'}
                      </Text>
                      <Text style={styles.activityScoreLabel}>
                        {score > 0 ? 'Score' : 'Progress'}
                        </Text>
                      </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.recentActivityCard}>
              <Ionicons 
                name="time-outline" 
                size={48} 
                color={COLORS.gray[400]} 
                style={styles.recentActivityIcon}
              />
              <Text style={styles.recentActivityTitle}>No Recent Activity</Text>
              <Text style={styles.recentActivitySubtitle}>
                Your completed assessments will appear here.
              </Text>
              <TouchableOpacity
                style={styles.recentActivityButton}
                activeOpacity={0.8}
              >
                <Text style={styles.recentActivityButtonText}>Start Your First Assessment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>

      <BottomNavigation activeTab="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCREEN_CONTAINER_BACKGROUND,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: SCREEN_BACKGROUND,
  },
  scrollContent: {
    paddingBottom: 60,
    paddingTop: 5,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.padding.lg,
    paddingTop: SPACING.padding.lg,
    paddingBottom: SPACING.padding.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingEmoji: {
    fontSize: 28,
    marginRight: SPACING.padding.sm,
  },
  greetingText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    lineHeight: 32,
    flex: 1,
  },
  userNameText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
    lineHeight: 32,
  },
  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.padding.lg,
    marginBottom: SPACING.padding.md,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  animatedLottie: {
    width: '100%',
    height: 200,
  },
  progressContent: {
    paddingTop: SPACING.padding.sm,
    paddingHorizontal: SPACING.padding.md,
    paddingBottom: SPACING.padding.md,
  },
  progressTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
    marginBottom: SPACING.padding.sm,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressStatValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  progressStatLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.tertiary,
    fontWeight: '500' as const,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.padding.lg,
    paddingTop: SPACING.padding.lg,
    paddingBottom: SPACING.padding.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.padding.lg,
    paddingBottom: SPACING.padding.md,
    gap: SPACING.padding.md,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: BRAND,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.padding.md,
    paddingHorizontal: SPACING.padding.sm,
    alignItems: 'center',
    justifyContent: 'center',
    height: 90,
    ...SHADOWS.sm,
  },
  quickActionButtonDisabled: {
    flex: 1,
    backgroundColor: COLORS.gray[300],
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.padding.md,
    paddingHorizontal: SPACING.padding.sm,
    alignItems: 'center',
    justifyContent: 'center',
    height: 90,
  },
  quickActionIcon: {
    marginBottom: SPACING.xs,
  },
  quickActionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  quickActionButtonTextDisabled: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600' as const,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  recentActivityList: {
    paddingHorizontal: SPACING.padding.lg,
    paddingBottom: SPACING.padding.md,
  },
  activityCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.padding.sm,
    paddingVertical: SPACING.padding.md,
    paddingHorizontal: SPACING.padding.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  activityAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BRAND_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.padding.md,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  activityAvatarText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700' as const,
    color: BRAND,
  },
  activityContent: {
    flex: 1,
    marginRight: SPACING.padding.sm,
  },
  activitySkillName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  activityDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.tertiary,
  },
  activityScore: {
    alignItems: 'flex-end',
  },
  activityScoreText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  activityScoreLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.tertiary,
  },
  recentActivityCard: {
    backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.padding.lg,
    marginBottom: SPACING.padding.md,
    paddingVertical: SPACING.padding.xl,
    paddingHorizontal: SPACING.padding.lg,
    alignItems: 'center',
        ...SHADOWS.md,
  },
  recentActivityIcon: {
    marginBottom: SPACING.padding.md,
  },
  recentActivityTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  recentActivitySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginBottom: SPACING.padding.lg,
  },
  recentActivityButton: {
    backgroundColor: BRAND,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.padding.md,
    paddingHorizontal: SPACING.padding.lg,
    width: '100%',
    alignItems: 'center',
  },
  recentActivityButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
