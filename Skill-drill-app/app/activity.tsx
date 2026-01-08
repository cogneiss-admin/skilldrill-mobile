import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, RefreshControl, Modal, Dimensions } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
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
import { useAllScoringPolling } from '../hooks/useAllScoringPolling';
import { logError, parseApiError, formatErrorMessage } from '../utils/errorHandler';

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

  // Progress and error states for job creation
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);
  const [loadingType, setLoadingType] = useState<'assessment' | 'drill'>('assessment');
  const [currentSkillId, setCurrentSkillId] = useState<string>('');

  // Scoring retry state for assessments
  const [assessmentIdForRetry, setAssessmentIdForRetry] = useState<string>('');
  const [isWaitingForScoring, setIsWaitingForScoring] = useState(false);
  const [scoringProgressMessage, setScoringProgressMessage] = useState<string>('');

  const { user } = useAuth();
  const router = useRouter();

  // Helper function to handle errors consistently
  const handleError = useCallback((error: any, context: string) => {
    // Log technical error to console for debugging
    logError(error, context);
    console.error(`[Activity] ${context}:`, error);

    // Show clean user-friendly error dialog
    setShowAiLoader(false);
    setProgressMessage('');

    // Use backend error message if available, otherwise show generic message
    const errorMsg = error?.message || error?.data?.message || 'Something went wrong. Please try again.';
    setErrorMessage(errorMsg);
    setShowErrorDialog(true);
  }, []);

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
          // null = no session or job failed (Start Assessment)
          // GENERATING = job is actively running (show generating state with backend message)
          // InProgress = questions ready, can resume (Resume Assessment)
          // COMPLETED = session done (See Results)
          const backendStatus = item.assessmentStatus;

          // Map backend status to UI status
          let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'GENERATING';
          if (backendStatus === 'COMPLETED') {
            status = 'COMPLETED';
          } else if (backendStatus === 'InProgress') {
            status = 'IN_PROGRESS';
          } else if (backendStatus === 'GENERATING') {
            status = 'GENERATING';
          } else {
            status = 'NOT_STARTED';
          }

          return {
            id: item.skill.id,
            skillName: item.skill.name,
            status: status,
            progress: backendStatus === 'InProgress' && item.progress ? {
              current: item.progress.completed,
              total: item.progress.total,
              percentage: item.progress.percentage
            } : undefined,
            startedAt: item.startedAt,
            assessmentId: item.assessmentId,
            jobProgressMessage: item.jobProgressMessage
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
          // Unlocked = purchased, ready to start
          // Pending = questions generating
          // InProgress = questions ready, can practice
          // Completed = all drills done
          let uiStatus: 'Unlocked' | 'Pending' | 'Active' | 'Completed';
          if (assignment.status === 'Completed' || assignment.status === 'COMPLETED') {
            uiStatus = 'Completed';
          } else if (assignment.status === 'Unlocked') {
            uiStatus = 'Unlocked';
          } else if (assignment.status === 'Pending') {
            uiStatus = 'Pending'; // Questions generating
          } else {
            uiStatus = 'Active'; // InProgress
          }

          return {
            id: assignment.id,
            skillName: assignment.skillName,
            status: uiStatus,
            progress: assignment.status === 'InProgress' || assignment.status === 'Completed' ? {
              current: assignment.completed,
              total: assignment.total,
              percentage: assignment.completionPercentage
            } : undefined,
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
    // Store for retry
    setCurrentSkillId(skillId);
    setLoadingSkillName(skillName);
    setLoadingType('assessment');
    setIsResuming(false);
    setProgressMessage(''); // Initially empty - will be updated from backend
    setShowAiLoader(true);

    const retryFn = () => handleStartAssessment(skillId, skillName);
    setRetryAction(() => retryFn);

    try {
      // Step 1: Call backend to create job
      const response = await apiService.startAssessment(skillId);

      if (response.success && response.data) {
        // Check if questions are ready or still being generated
        if (response.data.status === 'PENDING') {
          // Update progress message from backend (no fallback - backend provides all messages)
          if (response.data.message) {
            setProgressMessage(response.data.message);
          }

          // Poll until ready or failed
          await pollForAssessmentReady(skillId, skillName, response.data.assessmentId);
        } else if (response.data.sessionId && response.data.question) {
          // Questions already ready, navigate to assessment
          setShowAiLoader(false);
          setProgressMessage('');
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
          throw new Error(response.message);
        }
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      handleError(error, 'Start Assessment');
      // Retry action already set at the beginning of function
    }
  };

  // Poll for assessment questions to be ready
  // No timeout - backend controls lifecycle via job status (completed/failed)
  const pollForAssessmentReady = async (skillId: string, skillName: string, assessmentId: string) => {
    const pollInterval = 2000; // 2 seconds
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5; // Only stop on repeated network failures

    while (true) {
      try {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const response = await apiService.startAssessment(skillId);
        consecutiveErrors = 0; // Reset on successful API call

        if (response.success && response.data) {
          // Update progress message from backend
          if (response.data.message) {
            setProgressMessage(response.data.message);
          }

          // Check job status for failure - backend controls when to stop
          if (response.data.jobStatus === 'failed') {
            throw new Error(response.data.message || 'Generation failed. Please try again.');
          }

          if (response.data.status === 'PENDING') {
            // Still generating, continue polling - backend will eventually return ready or failed
            continue;
          } else if (response.data.sessionId && response.data.question) {
            // Questions ready, navigate to assessment
            setShowAiLoader(false);
            setProgressMessage('');
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
            return;
          }
        } else {
          // API returned error - check if it's a job failure
          throw new Error(response.message || 'Failed to check status');
        }
      } catch (error: any) {
        consecutiveErrors++;

        // Only show error for job failures or after multiple network failures
        if (error.message && !error.message.includes('network') && !error.message.includes('timeout')) {
          // This is a job failure from backend - log and show error
          handleError(error, 'Poll Status - Job Failed');
          return;
        }

        // Network error - retry unless too many consecutive failures
        if (consecutiveErrors >= maxConsecutiveErrors) {
          logError(error, 'Poll Status - Network Error');
          setShowAiLoader(false);
          setProgressMessage('');
          setErrorMessage('Connection lost. Please check your internet and try again.');
          setShowErrorDialog(true);
          return;
        }

        // Continue polling after network error
        continue;
      }
    }
  };

  const handleResumeAssessment = async (skillId: string, skillName: string) => {
    setLoadingSkillName(skillName);
    setIsResuming(true);
    setShowAiLoader(true);

    try {
      const response = await apiService.resumeAssessment(skillId);

      if (response.success && response.data) {
        const { state } = response.data;

        switch (state) {
          case 'SCORING_FAILED':
            // Show error dialog with retry option
            setShowAiLoader(false);
            setIsResuming(false);
            setAssessmentIdForRetry(response.data.assessmentId);
            setErrorMessage(response.data.errorMessage || 'Unable to analyze some responses. Please try again.');
            setRetryAction(() => () => handleRetryScoring(response.data.assessmentId));
            setShowErrorDialog(true);
            break;

          case 'SCORING_IN_PROGRESS':
            // Show scoring progress loader and poll
            setIsResuming(false);
            setIsWaitingForScoring(true);
            setScoringProgressMessage(response.data.progress?.message || 'Processing responses...');
            setAssessmentIdForRetry(response.data.assessmentId);
            startAllScoringPolling(response.data.assessmentId);
            break;

          case 'FEEDBACK_PENDING':
            // Scoring done, need to generate final feedback
            setLoadingSkillName(skillName);
            setShowAiLoader(true);
            setIsResuming(false);
            try {
              await apiService.generateFinalFeedback(response.data.assessmentId);
              // Navigate to results - polling handled there
              router.push({
                pathname: '/assessmentResults',
                params: {
                  assessmentId: response.data.assessmentId,
                  skillName: response.data.skillName
                }
              });
            } catch (error) {
              setShowAiLoader(false);
              handleError(error, 'Generate Final Feedback');
            }
            break;

          case 'COMPLETED':
            // Already complete - go to results
            setShowAiLoader(false);
            router.push({
              pathname: '/assessmentResults',
              params: {
                assessmentId: response.data.assessmentId,
                skillName: response.data.skillName
              }
            });
            break;

          case 'IN_PROGRESS':
          default:
            // Normal resume - navigate to questions
            setShowAiLoader(false);
            router.push({
              pathname: '/assessmentScenarios',
              params: {
                skillId,
                sessionId: response.data.assessmentId,
                skillName: response.data.skillName,
                question: JSON.stringify(response.data.question),
                progress: JSON.stringify(response.data.progress)
              }
            });
            break;
        }
      } else {
        throw new Error(response.message || 'Failed to resume assessment');
      }
    } catch (error: any) {
      setShowAiLoader(false);
      setIsResuming(false);
      handleError(error, 'Resume Assessment');
    }
  };

  // Handle retry scoring for assessments
  const handleRetryScoring = async (assessmentId: string) => {
    setShowErrorDialog(false);
    setIsWaitingForScoring(true);
    setScoringProgressMessage('Retrying...');

    try {
      await apiService.retryResponseScoring(assessmentId);
      // Start polling for completion
      startAllScoringPolling(assessmentId);
    } catch (error: any) {
      setIsWaitingForScoring(false);
      handleError(error, 'Retry Scoring');
    }
  };

  // Scoring polling hook
  const { startPolling: startAllScoringPolling, progress: scoringProgress } = useAllScoringPolling({
    onComplete: async () => {
      // All scoring completed - trigger final feedback and navigate
      setIsWaitingForScoring(false);
      if (assessmentIdForRetry) {
        setShowAiLoader(true);
        try {
          await apiService.generateFinalFeedback(assessmentIdForRetry);
          router.push({
            pathname: '/assessmentResults',
            params: {
              assessmentId: assessmentIdForRetry,
              skillName: loadingSkillName
            }
          });
        } catch (error) {
          setShowAiLoader(false);
          handleError(error, 'Generate Final Feedback');
        }
      }
    },
    onError: (errorMessage) => {
      // Scoring failed again - show error dialog
      setIsWaitingForScoring(false);
      setErrorMessage(errorMessage);
      setRetryAction(() => () => handleRetryScoring(assessmentIdForRetry));
      setShowErrorDialog(true);
    },
  });

  // Drill handlers - similar to assessment but navigates to drillsScenarios
  const handleStartDrill = async (assignmentId: string, skillName: string, backendStatus?: string) => {
    // Store for retry
    setLoadingSkillName(skillName);
    setLoadingType('drill');
    setIsResuming(false);
    setProgressMessage(''); // Initially empty - will be updated from backend
    setShowAiLoader(true);

    const retryFn = () => handleStartDrill(assignmentId, skillName, backendStatus);
    setRetryAction(() => retryFn);

    try {
      // Use session/start endpoint which handles all status transitions
      const response = await apiService.startDrillSession(assignmentId);

      if (response.success && response.data) {
        // Check if drills are ready or still being generated
        if (response.data.status === 'Pending') {
          // Update progress message from backend (no fallback)
          if (response.data.message) {
            setProgressMessage(response.data.message);
          }

          // Poll until ready or failed
          await pollForDrillReady(assignmentId, skillName);
        } else if (response.data.sessionId && response.data.currentDrill) {
          // Drills already ready, navigate to drill screen
          setShowAiLoader(false);
          setProgressMessage('');
          router.push({
            pathname: '/drillsScenarios',
            params: { assignmentId }
          });
        } else {
          throw new Error(response.message);
        }
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      handleError(error, 'Start Drill');
      // Retry action already set at the beginning of function
    }
  };

  // Poll for drill questions to be ready
  // No timeout - backend controls lifecycle via job status (completed/failed)
  const pollForDrillReady = async (assignmentId: string, skillName: string) => {
    const pollInterval = 2000; // 2 seconds
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5; // Only stop on repeated network failures

    while (true) {
      try {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const response = await apiService.startDrillSession(assignmentId);
        consecutiveErrors = 0; // Reset on successful API call

        if (response.success && response.data) {
          // Update progress message from backend
          if (response.data.message) {
            setProgressMessage(response.data.message);
          }

          // Check job status for failure - backend controls when to stop
          if (response.data.jobStatus === 'failed') {
            throw new Error(response.data.message || 'Generation failed. Please try again.');
          }

          if (response.data.status === 'Pending') {
            // Still generating, continue polling - backend will eventually return ready or failed
            continue;
          } else if (response.data.sessionId && response.data.currentDrill) {
            // Drills ready, navigate to drill screen
            setShowAiLoader(false);
            setProgressMessage('');
            router.push({
              pathname: '/drillsScenarios',
              params: { assignmentId }
            });
            return;
          }
        } else {
          // API returned error - check if it's a job failure
          throw new Error(response.message || 'Failed to check status');
        }
      } catch (error: any) {
        consecutiveErrors++;

        // Only show error for job failures or after multiple network failures
        if (error.message && !error.message.includes('network') && !error.message.includes('timeout')) {
          // This is a job failure from backend - log and show error
          handleError(error, 'Poll Status - Job Failed');
          return;
        }

        // Network error - retry unless too many consecutive failures
        if (consecutiveErrors >= maxConsecutiveErrors) {
          logError(error, 'Poll Status - Network Error');
          setShowAiLoader(false);
          setProgressMessage('');
          setErrorMessage('Connection lost. Please check your internet and try again.');
          setShowErrorDialog(true);
          return;
        }

        // Continue polling after network error
        continue;
      }
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
    }
  };

  const handleAction = async (action: 'start' | 'resume' | 'view_results' | 'unlock', id: string, assessmentId?: string, skillName?: string) => {
    const skill = assessments.find(a => a.id === id);
    const drill = drills.find(d => d.id === id);
    const isDrill = !!drill;
    const derivedSkillName = skillName || skill?.skillName || drill?.skillName;
    if (!derivedSkillName) {
      return;
    }

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
            // Fetch drill results (overall feedback) for completed drills
            const resultsResponse = await apiService.getDrillResults(id);
            if (resultsResponse.success && resultsResponse.data) {
              const results = resultsResponse.data;
              if (results.status === 'ready') {
                if (!results.stats || results.stats.averageScore === undefined || results.stats.attemptsCount === undefined) {
                  return;
                }

                if (!results.skillName) {
                  return;
                }

                router.push({
                  pathname: '/drillsResults',
                  params: {
                    assignmentId: id,
                    averageScore: String(results.stats.averageScore),
                    attemptsCount: String(results.stats.attemptsCount),
                    overall: JSON.stringify({
                      finalScore: results.finalScore,
                      feedbackGood: results.feedbackGood,
                      feedbackImprove: results.feedbackImprove,
                      feedbackSummary: results.feedbackSummary,
                      skillName: results.skillName
                    })
                  }
                });
              } else if (results.status === 'processing') {
                // Results still processing
              } else {
                // Failed to load drill results
              }
            } else {
              // Failed to load drill results
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
              // Failed to load results
            }
          }
        } catch (error) {
          // Failed to load results
        } finally {
          setLoadingResults(false);
        }
        break;
      case 'unlock':
        if (!drill?.skillId || !drill?.pricing?.amount || !drill?.pricing?.currency || !drill?.drillCount) {
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
                  {/* Pending Drills - Generating Questions */}
                  {drills.some(d => d.status === 'Pending') && (
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Generating</Text>
                    </View>
                  )}
                  {drills.filter(d => d.status === 'Pending').map((item, index) => (
                    <ActivityCard
                      key={`pending-${index}`}
                      type="drill"
                      data={item}
                      onAction={handleAction}
                    />
                  ))}

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
        {isResuming ? (
          /* Clean loader for resume actions */
          <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
            <View style={styles.resumeLoaderContainer}>
              <ActivityIndicator size={40} color={BRAND} />
            </View>
          </BlurView>
        ) : (
          /* Lottie animation for generation actions - original styling */
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
              <Text style={styles.aiLoaderTitle}>Generating...</Text>
              {/* Dynamic progress message from backend */}
              {progressMessage ? (
                <Text style={styles.aiLoaderSubtitle}>{progressMessage}</Text>
              ) : null}
            </View>
          </BlurView>
        )}
      </Modal>

      {/* Error Dialog */}
      <Modal
        visible={showErrorDialog}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.errorDialogBackdrop}>
          <View style={styles.errorDialogContainer}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
            </View>
            <Text style={styles.errorDialogTitle}>Something went wrong</Text>
            <Text style={styles.errorDialogMessage}>{errorMessage}</Text>
            <View style={styles.errorDialogButtons}>
              <TouchableOpacity
                style={styles.errorDialogCancelButton}
                onPress={() => {
                  setShowErrorDialog(false);
                  setErrorMessage('');
                  loadActivityData(); // Refresh to show current state
                }}
              >
                <Text style={styles.errorDialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.errorDialogRetryButton}
                onPress={() => {
                  setShowErrorDialog(false);
                  setErrorMessage('');
                  if (retryAction) {
                    retryAction();
                  }
                }}
              >
                <Text style={styles.errorDialogRetryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Simple Loader for Results */}
      <Modal
        visible={loadingResults}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
          <View style={styles.resumeLoaderContainer}>
            <ActivityIndicator size={40} color={BRAND} />
          </View>
        </BlurView>
      </Modal>

      {/* Scoring Progress Modal - Simple loader for retry/scoring */}
      <Modal
        visible={isWaitingForScoring}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
          <View style={styles.resumeLoaderContainer}>
            <ActivityIndicator size={40} color={BRAND} />
            <Text style={{ marginTop: 16, fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
              {scoringProgress?.message || scoringProgressMessage || 'Processing...'}
            </Text>
          </View>
        </BlurView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  resumeLoaderContainer: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
  // Error Dialog Styles
  errorDialogBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SCREEN_WIDTH * 0.06,
  },
  errorDialogContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SCREEN_WIDTH * 0.06,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  errorIconContainer: {
    marginBottom: SCREEN_WIDTH * 0.04,
  },
  errorDialogTitle: {
    fontSize: SCREEN_WIDTH * 0.05,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SCREEN_WIDTH * 0.02,
  },
  errorDialogMessage: {
    fontSize: SCREEN_WIDTH * 0.038,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SCREEN_WIDTH * 0.06,
    lineHeight: SCREEN_WIDTH * 0.055,
  },
  errorDialogButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: SCREEN_WIDTH * 0.03,
  },
  errorDialogCancelButton: {
    flex: 1,
    paddingVertical: SCREEN_WIDTH * 0.035,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorDialogCancelText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  errorDialogRetryButton: {
    flex: 1,
    paddingVertical: SCREEN_WIDTH * 0.035,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorDialogRetryText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '600',
    color: COLORS.white,
  },
});
