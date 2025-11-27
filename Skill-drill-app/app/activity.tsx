import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import { SCREEN_BACKGROUND, SCREEN_CONTAINER_BACKGROUND, COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, BRAND } from './components/Brand';
import BottomNavigation from '../components/BottomNavigation';
import ActivityCard, { ActivityCardProps } from './components/ActivityCard';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const AI_LOADING_ANIMATION = require('../assets/lottie/AiLoadingAnime.json');
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Activity() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<'assessments' | 'drills'>('assessments');

  // Set active tab from params when navigating from discover
  useEffect(() => {
    if (params.tab === 'assessments' || params.tab === 'drills') {
      setActiveTab(params.tab);
    }
  }, [params.tab]);
  const [assessments, setAssessments] = useState<ActivityCardProps['data'][]>([]);
  const [drills, setDrills] = useState<ActivityCardProps['data'][]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAiLoader, setShowAiLoader] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [loadingSkillName, setLoadingSkillName] = useState<string>('');
  const [isResuming, setIsResuming] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { showToast, showError } = useToast();

  useFocusEffect(
    useCallback(() => {
      setLoadingResults(false);
    }, [])
  );

  const loadActivityData = async () => {
    try {
      setLoading(true);

      // --- ASSESSMENTS: Fetch user's selected skills with progress ---
      const userSkillsResponse = await apiService.get('/user/skills');

      if (userSkillsResponse.success && userSkillsResponse.data) {
        const mappedAssessments: ActivityCardProps['data'][] = userSkillsResponse.data.map((item: any) => {
          // Determine UI status from backend data
          let uiStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

          if (item.assessmentStatus === 'COMPLETED') {
            uiStatus = 'COMPLETED';
          } else if (item.progress?.hasResponses) {
            uiStatus = 'IN_PROGRESS';
          } else {
            uiStatus = 'NOT_STARTED';
          }

          return {
            id: item.skill.id,
            skillName: item.skill.name,
            status: uiStatus,
            progress: uiStatus === 'IN_PROGRESS' ? {
              current: item.progress.completed,
              total: item.progress.total,
              percentage: item.progress.percentage
            } : undefined,
            startedAt: item.startedAt,
            assessmentId: item.assessmentId // For navigating to results
          };
        });

        setAssessments(mappedAssessments);
      }

      // --- DRILLS: Fetch drill assignments ---
      const assignmentsResponse = await apiService.getDrillAssignments();

      if (assignmentsResponse.success && assignmentsResponse.data?.assignments) {
        const mappedDrills: ActivityCardProps['data'][] = assignmentsResponse.data.assignments.map((assignment: any) => ({
          id: assignment.id,
          skillName: assignment.skillName,
          status: assignment.status === 'COMPLETED' ? 'Completed' : 'Active',
          progress: {
            current: assignment.completed,
            total: assignment.total,
            percentage: assignment.completionPercentage
          },
          score: assignment.averageScore ? {
            average: assignment.averageScore
          } : undefined
        }));

        setDrills(mappedDrills);
      }

    } catch (error) {
      console.error('Error loading activity data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadActivityData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadActivityData().finally(() => setRefreshing(false));
  }, []);

  const handleStartAssessment = async (skillId: string, skillName: string) => {
    setLoadingSkillName(skillName);
    setIsResuming(false);
    setShowAiLoader(true);

    try {
      const response = await apiService.startAssessment(skillId);

      if (response.success && response.data) {
        setShowAiLoader(false);
        router.push({
          pathname: '/assessmentScenarios',
          params: {
            skillId,
            sessionId: response.data.sessionId,
            skillName: response.data.skillName,
            question: JSON.stringify(response.data.question),
            progress: JSON.stringify(response.data.progress)
          }
        });
      } else {
        throw new Error(response.message || 'Failed to start assessment');
      }
    } catch (error: any) {
      setShowAiLoader(false);
      showError(error.message || 'Failed to start assessment');
    }
  };

  const handleResumeAssessment = async (skillId: string, skillName: string) => {
    setLoadingSkillName(skillName);
    setIsResuming(true);
    setShowAiLoader(true);

    try {
      const response = await apiService.resumeAssessment(skillId);

      if (response.success && response.data) {
        setShowAiLoader(false);
        router.push({
          pathname: '/assessmentScenarios',
          params: {
            skillId,
            sessionId: response.data.sessionId,
            skillName: response.data.skillName,
            question: JSON.stringify(response.data.question),
            progress: JSON.stringify(response.data.progress)
          }
        });
      } else {
        throw new Error(response.message || 'Failed to resume assessment');
      }
    } catch (error: any) {
      setShowAiLoader(false);
      showError(error.message || 'Failed to resume assessment');
    }
  };

  const handleAction = async (action: 'start' | 'resume' | 'view_results' | 'unlock', id: string, assessmentId?: string, skillName?: string) => {
    const skill = assessments.find(a => a.id === id);
    const derivedSkillName = skillName || skill?.skillName || 'Assessment';

    switch (action) {
      case 'start':
        handleStartAssessment(id, derivedSkillName);
        break;
      case 'resume':
        handleResumeAssessment(id, derivedSkillName);
        break;
      case 'view_results':
        setLoadingResults(true);
        try {
          if (assessmentId) {
            // Fetch assessment results
            const response = await apiService.getAdaptiveResults(assessmentId);
            if (response.success) {
              // Navigate to assessment results with fetched data
              router.push({
                pathname: '/assessmentResults',
                params: {
                  results: JSON.stringify({
                    ...response.data,
                    assessmentId: assessmentId,
                    skillName: derivedSkillName,
                  }),
                  skillName: derivedSkillName,
                  assessmentId: assessmentId
                }
              });
            } else {
              showError('Failed to load results');
            }
          } else {
            // Navigate to drill results (drills seem to handle their own loading or use different params)
            // For now, keeping existing behavior for drills but with delay if needed, or just push
            // If drills need fetching, we should do it here too, but based on DrillsScreen it takes params directly.
            // Assuming drillsResults route handles it or we need to fetch drill results here too?
            // DrillsResultsRoute takes percentage, averageScore etc.
            // But here we only have assignmentId.
            // Let's just push for now as the user specifically mentioned "See Results" which usually implies Assessment.
            router.push({ pathname: '/drillsResults', params: { assignmentId: id } });
          }
        } catch (error) {
          console.error('Failed to load results:', error);
          showError('Failed to load results');
        } finally {
          setLoadingResults(false);
        }
        break;
      case 'unlock':
        router.push({ pathname: '/subscriptionScreen', params: { recommendationId: id } });
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>My Activity</Text>
            <TouchableOpacity
              style={styles.notificationButton}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'assessments' && styles.activeTabButton]}
              onPress={() => setActiveTab('assessments')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'assessments' && styles.activeTabText]}>Assessments</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'drills' && styles.activeTabButton]}
              onPress={() => setActiveTab('drills')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'drills' && styles.activeTabText]}>Drills</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BRAND} />
              <Text style={styles.loadingText}>Loading activity...</Text>
            </View>
          ) : (
            <>
              {activeTab === 'assessments' ? (
                <View style={styles.listContainer}>
                  {assessments.length > 0 ? (
                    assessments.map((item, index) => (
                      <ActivityCard
                        key={`assessment-${index}`}
                        type="assessment"
                        data={item}
                        onAction={handleAction}
                      />
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No active assessments found.</Text>
                      <TouchableOpacity onPress={() => router.push('/discover')}>
                        <Text style={styles.emptyStateLink}>Discover Skills</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.listContainer}>
                  {/* Active Drills */}
                  {drills.some(d => d.status === 'Active') && (
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Active Drills</Text>
                    </View>
                  )}
                  {drills.filter(d => d.status === 'Active').map((item, index) => (
                    <ActivityCard
                      key={`active-${index}`}
                      type="drill"
                      data={item}
                      onAction={handleAction}
                    />
                  ))}

                  {/* Completed Drills */}
                  {drills.some(d => d.status === 'Completed') && (
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Completed Drills</Text>
                    </View>
                  )}
                  {drills.filter(d => d.status === 'Completed').map((item, index) => (
                    <ActivityCard
                      key={`completed-${index}`}
                      type="drill"
                      data={item}
                      onAction={handleAction}
                    />
                  ))}

                  {/* Recommended Drills */}
                  {drills.some(d => d.status === 'NOT_STARTED') && (
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Recommended For You</Text>
                    </View>
                  )}
                  {drills.filter(d => d.status === 'NOT_STARTED').map((item, index) => (
                    <ActivityCard
                      key={`recommended-${index}`}
                      type="drill"
                      data={item}
                      onAction={handleAction}
                    />
                  ))}

                  {drills.length === 0 && (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No drills found.</Text>
                      <TouchableOpacity onPress={() => router.push('/discover')}>
                        <Text style={styles.emptyStateLink}>Explore Drills</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <BottomNavigation activeTab="activity" />

      {/* AI Loader Modal with Blur Backdrop */}
      <Modal
        visible={showAiLoader}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <BlurView intensity={100} tint="dark" style={styles.blurContainer}>
          <View style={styles.aiLoaderContent}>
            <View style={styles.aiAnimationContainer}>
              <LottieView
                source={AI_LOADING_ANIMATION}
                autoPlay
                loop
                style={styles.aiAnimation}
              />
            </View>
            <Text style={styles.aiLoaderTitle}>
              {isResuming ? 'Resuming Your Assessment' : 'Preparing Your Assessment'}
            </Text>
            <Text style={styles.aiLoaderSubtitle}>
              {isResuming
                ? `Resuming your ${loadingSkillName} assessment`
                : `Crafting personalized questions for ${loadingSkillName}`
              }
            </Text>
          </View>
        </BlurView>
      </Modal>
      {/* Simple Loader for Results */}
      <Modal
        visible={loadingResults}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.blurContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={[styles.loadingText, { color: '#FFFFFF', marginTop: 16 }]}>Fetching Results...</Text>
          </View>
        </View>
      </Modal>
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
    flexGrow: 1,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: SPACING.padding.lg,
    paddingBottom: SPACING.padding.md,
    paddingHorizontal: SPACING.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#D0D0D0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.padding.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.3,
  },
  notificationButton: {
    padding: SPACING.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9', // Light gray background for the tab container
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    marginTop: SPACING.padding.xs,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SPACING.padding.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  activeTabButton: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  activeTabText: {
    fontWeight: '700',
    color: BRAND,
  },
  content: {
    flex: 1,
    paddingTop: SPACING.padding.lg,
  },
  listContainer: {
    paddingHorizontal: SPACING.padding.lg,
  },
  sectionHeader: {
    marginTop: SPACING.padding.md,
    marginBottom: SPACING.padding.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.padding.xl,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.tertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.padding.xl,
    marginTop: SPACING.padding.xl,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.tertiary,
    marginBottom: SPACING.sm,
  },
  emptyStateLink: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    color: BRAND,
  },
  // AI Loader Styles
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)', // Darker overlay to hide background content
  },
  aiLoaderContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
    backgroundColor: 'transparent',
  },
  aiAnimationContainer: {
    width: SCREEN_WIDTH * 0.8, // Enlarged loader
    height: SCREEN_WIDTH * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  aiAnimation: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  aiLoaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  aiLoaderSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
