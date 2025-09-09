// @ts-nocheck
import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  StatusBar,
  Dimensions,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { AntDesign, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { apiService } from "../services/api";
import { useToast } from "../hooks/useToast";
import ActivitySkillCard from "./components/ActivitySkillCard";
import ActivitySkillCardSkeleton from "./components/ActivitySkillCardSkeleton";
import FeedbackDisplay from "./components/FeedbackDisplay";
import { BRAND, GRADIENTS, BORDER_RADIUS, SHADOWS, PADDING } from "./components/Brand";
import BottomNavigation from "../components/BottomNavigation";
const GRAY = "#6B7280";
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UserSkill {
  id: string;
  skill: {
    id: string;
    skill_name: string;
    category: string;
    description: string;
    icon?: string;
  };
  assessment_status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING';
  current_score?: number;
  last_assessed_at?: string;
  assessment_count?: number;
  progression_layer?: string;
  self_rating?: number;
}

interface CompletedAssessment {
  id: string;
  skillId: string;
  skillName: string;
  finalScore?: number;
  scoreLabel?: string;
  stars?: number;
  completedAt?: string;
  identifiedStyle?: string;
  improvementFeedback?: string;
  summary?: string;
}

interface AssessmentSession {
  sessionId: string;
  currentSkillIndex: number;
  selectedSkills: string[];
  isActive: boolean;
  progress?: {
    totalPrompts: number;
    completedResponses: number;
    status: string;
  };
  currentSkill?: {
    id: string;
    skill_name: string;
  };
}

interface AssessmentTemplate {
  skill_id: string;
  template_id: string;
  template_name: string;
  total_questions: number;
  created_at: string;
}

export default function MyActivity() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [completedAssessments, setCompletedAssessments] = useState<CompletedAssessment[]>([]);
  const [activeSession, setActiveSession] = useState<AssessmentSession | null>(null);
  const [assessmentTemplates, setAssessmentTemplates] = useState<AssessmentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Add refresh functionality
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivityData();
    setRefreshing(false);
  };
  const [generatingAssessment, setGeneratingAssessment] = useState<string | null>(null); // skillId being generated

  useEffect(() => {
    loadActivityData();
  }, []);

  const loadActivityData = async () => {
    try {
      setLoading(true);
      
      // First sync assessment status to ensure consistency
      try {
        await apiService.post('/user/skills/sync-status');
      } catch (syncError) {
        console.warn('⚠️ Assessment status sync failed:', syncError.message);
      }
      
      const [skillsResponse, assessmentsResponse, sessionResponse] = await Promise.all([
        apiService.get('/user/skills'),
        apiService.get('/assessment/results'),
        apiService.get('/assessment/session/status')
      ]);
      
      if (skillsResponse.success) {
        setUserSkills(skillsResponse.data);

        // Check assessment templates for these skills
        if (skillsResponse.data.length > 0) {
          const skillIds = skillsResponse.data.map(skill => skill.skill.id);
          await checkAssessmentTemplates(skillIds);
        }
      }
      if (assessmentsResponse.success) {
        console.log('📊 Raw assessments response:', assessmentsResponse.data);
        setCompletedAssessments(assessmentsResponse.data || []);
      }
      if (sessionResponse.success && sessionResponse.data.hasActiveSession) {
        setActiveSession(sessionResponse.data);

        // If there's an active session, refresh user skills to get updated assessment status
        if (skillsResponse.success && skillsResponse.data.length > 0) {
          const updatedSkillsResponse = await apiService.get('/user/skills');
          if (updatedSkillsResponse.success) {
            setUserSkills(updatedSkillsResponse.data);
          }
        }
      } else {
        setActiveSession(null);
      }
      
    } catch (error) {
      console.error('❌ Error loading activity data:', error);
      showToast('error', 'Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  // Check which skills have assessment templates
  const checkAssessmentTemplates = async (skillIds: string[]) => {
    try {
      const response = await apiService.post('/assessment/check-assessment-templates', { skillIds });
      if (response.success) {
        setAssessmentTemplates(response.data.skillsWithTemplates || []);
      }
    } catch (error) {
      console.error('❌ Error checking assessment templates:', error);
    }
  };

  // Generate assessment template for a skill
  const generateAssessmentTemplate = async (skillId: string, skillName: string) => {
    try {
      setGeneratingAssessment(skillId);
      showToast('success', 'Starting Assessment', `Launching sequential assessment for ${skillName}...`);
      
      // Navigate directly to assessment since sequential mode generates questions on-demand
      router.push({
        pathname: '/adaptive-assessment',
        params: { skillId }
      });
    } catch (error) {
      console.error('❌ Error starting assessment:', error);
      showToast('error', 'Start Failed', 'Failed to start assessment. Please try again.');
    } finally {
      setGeneratingAssessment(null);
    }
  };

  // Check if a skill has an assessment template
  const hasAssessmentTemplate = (skillId: string): boolean => {
    return assessmentTemplates.some(template => template.skill_id === skillId);
  };

  // Backend-only: return identifiedStyle or empty
  const getAITag = (skill: UserSkill, assessment?: CompletedAssessment) => {
    return assessment?.identifiedStyle || '';
  };

  // Backend-only: prefer improvementFeedback; fallback to summary; else empty
  const getAIInsights = (skill: UserSkill, assessment?: CompletedAssessment) => {
    if (assessment?.improvementFeedback) return assessment.improvementFeedback;
    if (assessment?.summary) return assessment.summary;
    return '';
  };

  const getScore = (assessment?: CompletedAssessment) => {
    return typeof assessment?.finalScore === 'number' ? assessment.finalScore : undefined;
  };

  // Get assessment progress for a specific skill
  const getSkillProgress = (skillId: string) => {
    // Check if this skill is part of the active session
    if (activeSession && activeSession.selectedSkills.includes(skillId)) {
      return activeSession.progress || { totalPrompts: 3, completedResponses: 0, status: 'PENDING' };
    }

    // Default progress for skills not in active session
    return { totalPrompts: 3, completedResponses: 0, status: 'PENDING' };
  };

  // Handle viewing detailed feedback for an assessment
  const handleViewFeedback = async (assessmentId: string) => {
    try {
      console.log('🔍 DEBUG: handleViewFeedback called with assessmentId:', assessmentId);
      setFeedbackLoading(true);

      console.log('🔍 DEBUG: Making API call to /assessment/results/' + assessmentId);
      const response = await apiService.get(`/assessment/results/${assessmentId}`);
      console.log('🔍 DEBUG: API response:', response);

      if (response.success) {
        console.log('✅ DEBUG: Setting feedback data:', response.data);
        setSelectedFeedback(response.data);
      } else {
        console.error('❌ DEBUG: API call failed:', response.message);
        console.error('❌ Failed to load feedback:', response.message);
        showToast('error', 'Failed to load feedback', response.message || 'Unable to load detailed feedback');
      }
    } catch (error) {
      console.error('❌ DEBUG: Exception in handleViewFeedback:', error);
      console.error('❌ Error loading feedback:', error);
      showToast('error', 'Error', 'Failed to load feedback details');
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Handle closing feedback view
  const handleCloseFeedback = () => {
    setSelectedFeedback(null);
  };

  const renderSkillCards = () => {
    return userSkills.map((skill, index) => {
      const completedAssessment = completedAssessments.find(a => a.skillId === skill.skill.id);
      
      // Check if we have completed assessment data
      if (skill.assessment_status === 'COMPLETED' && !completedAssessment) {
        console.log('⚠️ COMPLETED skill without assessment data:', skill.skill.skill_name);
      }
      
      const aiTag = getAITag(skill, completedAssessment);
      const aiInsights = getAIInsights(skill, completedAssessment);
      const score = getScore(completedAssessment);
      
      // Get assessment progress for this skill
      const skillProgress = getSkillProgress(skill.skill.id);
      const totalPrompts = skillProgress.totalPrompts;
      const completedResponses = skillProgress.completedResponses;

      // Check if assessment template exists
      const templateExists = hasAssessmentTemplate(skill.skill.id);

      // Pass data to ActivitySkillCard

      return (
        <ActivitySkillCard
          key={skill.id}
          id={skill.id}
          skillName={skill.skill.skill_name}
          assessmentStatus={skill.assessment_status}
          aiInsights={aiInsights}
          aiTag={aiTag}
          score={score}
          index={index}
          skillId={skill.skill.id}
          // Pass progress data directly
          progressData={{
            totalPrompts,
            completedResponses,
            status: skillProgress.status
          }}
          // Pass template existence and generation state
          templateExists={templateExists}
          isGenerating={generatingAssessment === skill.skill.id}
          onGenerateAssessment={() => generateAssessmentTemplate(skill.skill.id, skill.skill.skill_name)}
          onViewFeedback={completedAssessment ? () => handleViewFeedback(completedAssessment.id) : undefined}
        />
      );
    });
  };

  // Remove full-screen spinner; show skeletons in place instead

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar style="dark" />
      
      {/* Enhanced Header - Clean Design */}
      <View style={{
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
      }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{
            fontSize: 22,
            fontWeight: '800',
            color: '#0F172A',
            letterSpacing: 0.8,
            textShadowColor: 'rgba(0, 0, 0, 0.1)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>My Activity</Text>
        </View>
      </View>
      
      {selectedFeedback ? (
        // Show detailed feedback
        <View style={{ flex: 1 }}>
          <FeedbackDisplay
            feedback={selectedFeedback}
            onClose={handleCloseFeedback}
            showCloseButton={true}
          />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadActivityData} />} showsVerticalScrollIndicator={false}>
          {loading ? (
            // Shimmer skeletons while data loads
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <ActivitySkillCardSkeleton key={`skeleton-${i}`} index={i} />
              ))}
            </>
          ) : userSkills.length === 0 ? (
            <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 600 }} style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24 }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#1F2937', marginBottom: 40, textAlign: 'center' }}>My Skills</Text>
              {/* Empty-state illustration/CTA intentionally omitted here for brevity */}
            </MotiView>
          ) : (
            renderSkillCards()
          )}
        </ScrollView>
      )}

      <BottomNavigation />
    </SafeAreaView>
  );
}


