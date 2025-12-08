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
          // Use backend status directly
          // null = no session (Start Assessment)
          // PENDING = session in progress (Resume Assessment)
          // COMPLETED = session done (See Results)
          const backendStatus = item.assessmentStatus;

          // Map backend status to UI status
          let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
          if (backendStatus === 'COMPLETED') {
            status = 'COMPLETED';
          } else if (backendStatus === 'PENDING') {
            status = 'IN_PROGRESS';
          } else {
            status = 'NOT_STARTED';
          }

          return {
            id: item.skill.id,
            skillName: item.skill.name,
            status: status,
            progress: backendStatus === 'PENDING' ? {
              current: item.progress.completed,
              total: item.progress.total,
              percentage: item.progress.percentage
            } : undefined,
            startedAt: item.startedAt,
            assessmentId: item.assessmentId
          };
        });

        setAssessments(mappedAssessments);
      }

      // --- DRILLS: Fetch drill assignments (purchased/active drills) ---
      const assignmentsResponse = await apiService.getDrillAssignments();

      let allDrills: ActivityCardProps['data'][] = [];

      if (assignmentsResponse.success && assignmentsResponse.data?.assignments) {
        const mappedAssignments: ActivityCardProps['data'][] = assignmentsResponse.data.assignments.map((assignment: any) => {
          // Map backend status to UI status
          // Backend: 'Unlocked', 'Pending', 'InProgress', 'Completed'
          let uiStatus: 'Unlocked' | 'Active' | 'Completed';
          if (assignment.status === 'Completed' || assignment.status === 'COMPLETED') {
            uiStatus = 'Completed';
          } else if (assignment.status === 'Unlocked') {
            uiStatus = 'Unlocked'; // New status - purchased but drills not generated yet
          } else {
            uiStatus = 'Active'; // Pending or InProgress
          }

          return {
            id: assignment.id,
            skillName: assignment.skillName,
            status: uiStatus,
            backendStatus: assignment.status, // Keep original status for generation check
            progress: {
              current: assignment.completed,
              total: assignment.total,
              percentage: assignment.completionPercentage
            },
            score: assignment.averageScore ? {
              average: assignment.averageScore
            } : undefined
          };
        });

        allDrills = [...mappedAssignments];
      }

      // --- DRILLS: Fetch recommended drills (unpurchased) ---
      const recommendationsResponse = await apiService.getUserRecommendations();

      if (recommendationsResponse.success && recommendationsResponse.data?.unpurchasedDrills) {
        const mappedRecommendations: ActivityCardProps['data'][] = recommendationsResponse.data.unpurchasedDrills
          .filter((rec: any) => rec.price && rec.currency && rec.drillCount)
          .map((rec: any) => ({
            id: rec.recommendationId,
            skillId: rec.skillId,
            skillName: rec.skillName,
            status: 'NOT_STARTED' as const,
            pricing: {
              amount: rec.price,
              currency: rec.currency
            },
            assessmentId: rec.assessmentId,
            drillCount: rec.drillCount
          }));

        allDrills = [...allDrills, ...mappedRecommendations];
      }

      setDrills(allDrills);

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

  // Drill handlers - similar to assessment but navigates to drillsScenarios
  const handleStartDrill = async (assignmentId: string, skillName: string, backendStatus?: string) => {
    setLoadingSkillName(skillName);
    setIsResuming(false);
    setShowAiLoader(true);

    try {
      // If drill is Unlocked, generate items first
      if (backendStatus === 'Unlocked') {
        console.log('🔄 Generating drill items for unlocked assignment:', assignmentId);
        const generateResponse = await apiService.generateDrillItems(assignmentId);
        if (!generateResponse.success) {
          throw new Error(generateResponse.message || 'Failed to generate drills');
        }
        console.log('✅ Drill items generated:', generateResponse.data);
      }

      // Navigate to drillsScenarios - useDrillProgress hook will handle session creation
      setShowAiLoader(false);
      router.push({
        pathname: '/drillsScenarios',
        params: { assignmentId }
      });
    } catch (error: any) {
      setShowAiLoader(false);
      showError(error.message || 'Failed to start drills');
    }
  };

  const handleResumeDrill = async (assignmentId: string, skillName: string) => {
    setLoadingSkillName(skillName);
    setIsResuming(true);
    setShowAiLoader(true);

    try {
      // Navigate to drillsScenarios - useDrillProgress hook will handle session resume
      setShowAiLoader(false);
      router.push({
        pathname: '/drillsScenarios',
        params: { assignmentId }
      });
    } catch (error: any) {
      setShowAiLoader(false);
      showError(error.message || 'Failed to resume drills');
    }
  };

  const handleAction = async (action: 'start' | 'resume' | 'view_results' | 'unlock', id: string, assessmentId?: string, skillName?: string) => {
    const skill = assessments.find(a => a.id === id);
    const drill = drills.find(d => d.id === id);
    const isDrill = !!drill;
    const derivedSkillName = skillName || skill?.skillName || drill?.skillName || 'Activity';

    switch (action) {
      case 'start':
        if (isDrill) {
          // Pass backendStatus to check if we need to generate items first
          handleStartDrill(id, derivedSkillName, (drill as any)?.backendStatus);
        } else {
          handleStartAssessment(id, derivedSkillName);
        }
        break;
      case 'resume':
        if (isDrill) {
          handleResumeDrill(id, derivedSkillName);
        } else {
          handleResumeAssessment(id, derivedSkillName);
        }
        break;
      case 'view_results':
        setLoadingResults(true);
        try {
          if (isDrill) {
            // Fetch drill aggregate data for results
            const aggregateResponse = await apiService.getDrillAggregate(id);
            if (aggregateResponse.success && aggregateResponse.data) {
              const aggregate = aggregateResponse.data;
              router.push({
                pathname: '/drillsResults',
                params: {
                  assignmentId: id,
                  percentage: String(drill?.progress?.percentage || 100),
                  averageScore: String(aggregate.averageScore || 0),
                  attemptsCount: String(aggregate.attemptsCount || 0)
                }
              });
            } else {
              showError('Failed to load drill results');
            }
          } else if (assessmentId) {
            // Fetch assessment results
            const response = await apiService.getAdaptiveResults(assessmentId);
            if (response.success) {
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
          }
        } catch (error) {
          console.error('Failed to load results:', error);
          showError('Failed to load results');
        } finally {
          setLoadingResults(false);
        }
        break;
      case 'unlock':
        if (!drill?.skillId || !drill?.pricing?.amount || !drill?.pricing?.currency || !drill?.drillCount) {
          showError('Unable to load pricing information. Please try again.');
          return;
        }
        
        // Always navigate to subscription screen - it will handle conditional rendering
        // based on subscription status (shows credits view for subscribers, purchase view for non-subscribers)
        router.push({
          pathname: '/subscriptionScreen',
          params: {
            recommendationId: id,
            skillId: drill.skillId,
            assessmentId: drill.assessmentId,
            drillCount: String(drill.drillCount),
            price: String(drill.pricing.amount),
            currency: drill.pricing.currency
          }
        });
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
                    <>
                      {assessments.map((item, index) => (
                        <ActivityCard
                          key={`assessment-${index}`}
                          type="assessment"
                          data={item}
                          onAction={handleAction}
                        />
                      ))}
                      {/* Explore More Skills Button */}
                      <TouchableOpacity
                        style={styles.exploreMoreButton}
                        activeOpacity={0.8}
                        onPress={() => router.push({ pathname: '/auth/skills', params: { returnTo: 'activity' } })}
                      >
                        <Ionicons name="add-circle-outline" size={20} color={BRAND} />
                        <Text style={styles.exploreMoreText}>Explore More Skills</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No active assessments found.</Text>
                      <TouchableOpacity onPress={() => router.push({ pathname: '/auth/skills', params: { returnTo: 'activity' } })}>
                        <Text style={styles.emptyStateLink}>Explore Skills</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.listContainer}>
                  {/* Unlocked Drills - Ready to Start */}
                  {drills.some(d => d.status === 'Unlocked') && (
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Ready to Start</Text>
                    </View>
                  )}
                  {drills.filter(d => d.status === 'Unlocked').map((item, index) => (
                    <ActivityCard
                      key={`unlocked-${index}`}
                      type="drill"
                      data={item}
                      onAction={handleAction}
                    />
                  ))}

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
            <Text style={[styles.loadingText, { color: '#FFFFFF', marginTop: SCREEN_WIDTH * 0.04 }]}>Fetching Results...</Text>
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
    paddingBottom: SCREEN_WIDTH * 0.15,
    flexGrow: 1,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: SCREEN_WIDTH * 0.05,
    paddingBottom: SCREEN_WIDTH * 0.04,
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[300],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SCREEN_WIDTH * 0.04,
  },
  headerTitle: {
    fontSize: SCREEN_WIDTH * 0.07,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.3,
  },
  notificationButton: {
    padding: SCREEN_WIDTH * 0.015,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.lg,
    padding: SCREEN_WIDTH * 0.01,
    marginTop: SCREEN_WIDTH * 0.02,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SCREEN_WIDTH * 0.03,
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
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  activeTabText: {
    fontWeight: '700',
    color: BRAND,
  },
  content: {
    flex: 1,
    paddingTop: SCREEN_WIDTH * 0.05,
  },
  listContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.06,
  },
  sectionHeader: {
    marginTop: SCREEN_WIDTH * 0.04,
    marginBottom: SCREEN_WIDTH * 0.04,
  },
  sectionTitle: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SCREEN_WIDTH * 0.06,
  },
  loadingText: {
    marginTop: SCREEN_WIDTH * 0.025,
    fontSize: SCREEN_WIDTH * 0.04,
    color: COLORS.text.tertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SCREEN_WIDTH * 0.06,
    marginTop: SCREEN_WIDTH * 0.06,
  },
  emptyStateText: {
    fontSize: SCREEN_WIDTH * 0.04,
    color: COLORS.text.tertiary,
    marginBottom: SCREEN_WIDTH * 0.025,
  },
  emptyStateLink: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '700',
    color: BRAND,
  },
  exploreMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SCREEN_WIDTH * 0.03,
    borderWidth: 1.5,
    borderColor: BRAND,
    borderStyle: 'dashed',
    paddingVertical: SCREEN_WIDTH * 0.035,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    marginTop: SCREEN_WIDTH * 0.02,
    gap: SCREEN_WIDTH * 0.02,
  },
  exploreMoreText: {
    fontSize: SCREEN_WIDTH * 0.038,
    fontWeight: '600',
    color: BRAND,
  },
  // AI Loader Styles
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  aiLoaderContent: {
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.08,
    width: '100%',
    backgroundColor: 'transparent',
  },
  aiAnimationContainer: {
    width: SCREEN_WIDTH * 0.8,
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
    fontSize: SCREEN_WIDTH * 0.06,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: SCREEN_WIDTH * 0.05,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  aiLoaderSubtitle: {
    fontSize: SCREEN_WIDTH * 0.04,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: SCREEN_WIDTH * 0.03,
    lineHeight: SCREEN_WIDTH * 0.06,
    paddingHorizontal: SCREEN_WIDTH * 0.05,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
