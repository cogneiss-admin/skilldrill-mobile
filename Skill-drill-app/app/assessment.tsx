// @ts-nocheck
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, Alert, Modal, Image, BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button, Surface, Portal } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { useToast } from "../hooks/useToast";
import { useResponsive } from "../utils/responsive";
import { AntDesign } from '@expo/vector-icons';
import AIGenerationLoader from './components/AIGenerationLoader';

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";
const logoSrc = require("../assets/images/logo.png");

// Shimmer loading component for questions layout
const ShimmerLoader = () => {
  const shimmerAnimation = {
    from: { opacity: 0.3 },
    animate: { opacity: 0.7 },
    transition: { type: 'timing', duration: 1000, loop: true }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
      <StatusBar style="light" />
      
      {/* Blue Header with Shimmer */}
      <View style={{ 
        paddingHorizontal: 16, 
        paddingTop: 8, 
        paddingBottom: 16,
        backgroundColor: BRAND
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MotiView {...shimmerAnimation}>
              <View style={{ width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 8 }} />
            </MotiView>
            <MotiView {...shimmerAnimation}>
              <View style={{ marginLeft: 10, width: 80, height: 16, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4 }} />
            </MotiView>
          </View>
          
          {/* Progress indicator shimmer */}
          <MotiView {...shimmerAnimation}>
            <View style={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 12,
              width: 60,
              height: 24
            }} />
          </MotiView>
        </View>
        
        {/* Assessment title shimmer */}
        <MotiView {...shimmerAnimation}>
          <View style={{ 
            width: 200, 
            height: 20, 
            backgroundColor: 'rgba(255,255,255,0.3)', 
            borderRadius: 4,
            marginTop: 12
          }} />
        </MotiView>
        
        {/* Progress text shimmer */}
        <MotiView {...shimmerAnimation}>
          <View style={{ 
            width: 150, 
            height: 14, 
            backgroundColor: 'rgba(255,255,255,0.3)', 
            borderRadius: 4,
            marginTop: 4
          }} />
        </MotiView>
      </View>
      
      {/* Content shimmer */}
      <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 100 }}>
          
          {/* Scenario card shimmer */}
          <MotiView {...shimmerAnimation}>
            <View style={{
              backgroundColor: "#ffffff",
              padding: 20,
              borderRadius: 16,
              marginBottom: 20,
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
              borderWidth: 1,
              borderColor: "#f1f5f9"
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View style={{ width: 20, height: 20, backgroundColor: '#e5e7eb', borderRadius: 10 }} />
                <View style={{ marginLeft: 8, width: 100, height: 16, backgroundColor: '#e5e7eb', borderRadius: 4 }} />
              </View>
              
              {/* Scenario text shimmer lines */}
              <View style={{ marginBottom: 12 }}>
                <View style={{ width: '100%', height: 12, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
                <View style={{ width: '90%', height: 12, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
                <View style={{ width: '95%', height: 12, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
                <View style={{ width: '85%', height: 12, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
                <View style={{ width: '70%', height: 12, backgroundColor: '#e5e7eb', borderRadius: 4 }} />
              </View>
            </View>
          </MotiView>
          
          {/* Response card shimmer */}
          <MotiView {...shimmerAnimation}>
            <View style={{
              backgroundColor: "#ffffff",
              padding: 20,
              borderRadius: 16,
              marginBottom: 20,
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
              borderWidth: 1,
              borderColor: "#f1f5f9"
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View style={{ width: 20, height: 20, backgroundColor: '#e5e7eb', borderRadius: 10 }} />
                <View style={{ marginLeft: 8, width: 120, height: 16, backgroundColor: '#e5e7eb', borderRadius: 4 }} />
                <View style={{ marginLeft: 'auto', width: 80, height: 16, backgroundColor: '#e5e7eb', borderRadius: 4 }} />
              </View>
              
              {/* Response input shimmer */}
              <View style={{
                backgroundColor: "#f9fafb",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 12,
                padding: 16,
                minHeight: 120,
                marginBottom: 16
              }}>
                <View style={{ width: '100%', height: 12, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
                <View style={{ width: '90%', height: 12, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
                <View style={{ width: '80%', height: 12, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
                <View style={{ width: '60%', height: 12, backgroundColor: '#e5e7eb', borderRadius: 4 }} />
              </View>
              
              {/* Word count shimmer */}
              <View style={{ alignItems: 'flex-end' }}>
                <View style={{ width: 60, height: 12, backgroundColor: '#e5e7eb', borderRadius: 4 }} />
              </View>
            </View>
          </MotiView>
          
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default function AssessmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const responsive = useResponsive();
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  
  // Assessment session state
  const [sessionId, setSessionId] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [totalSkills, setTotalSkills] = useState(0);
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentView, setCurrentView] = useState(() => {
    // If resuming, start with 'scenario' view instead of 'start' view
    if (params.resume === 'true' && (params.skillId || params.sessionId)) {
      console.log('🔄 Resume mode detected - initializing with scenario view');
      return 'scenario';
    }
    return 'start';
  }); // 'start', 'scenario', 'skill-complete', 'complete'
  
  // Scenario state management
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [userResponses, setUserResponses] = useState({});
  const [currentResponse, setCurrentResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Modal state
  const [showSkillCompleteModal, setShowSkillCompleteModal] = useState(false);
  const [completedSkillName, setCompletedSkillName] = useState("");
  const [aiAnalysisFailed, setAiAnalysisFailed] = useState(false);
  
  // AI Generation Animation state
  const [showAILoader, setShowAILoader] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [creatingAssessment, setCreatingAssessment] = useState(false);
  
  // Prevent infinite initialization loop
  const [hasInitialized, setHasInitialized] = useState(false);
  const [lastSessionCheck, setLastSessionCheck] = useState(0);
  
  // Back button double-tap state
  const [backButtonPressed, setBackButtonPressed] = useState(false);
  const [showBackWarning, setShowBackWarning] = useState(false);
  const [realProgress, setRealProgress] = useState(null);
  
  // Double-tap to exit functionality
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [lastBackPress, setLastBackPress] = useState(0);
  
  // Shimmer loading state for resume cases
  const [showShimmer, setShowShimmer] = useState(false);

  // Hardware back button handler
  useEffect(() => {
    const backAction = () => {
      handleBackToDashboard();
      return true; // Prevent default back behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [backButtonPressed, showBackWarning]);



  // Parse skills or session data safely
  useEffect(() => {
    try {
      // Check if this is a resume session
      if (params.resume === 'true' && params.sessionId) {
        setSessionId(params.sessionId);
        // Don't set skills here - we'll get them from the session
        setLoading(false);
        return;
      }

      // Handle resume for specific skill (from activity card)
      if (params.resume === 'true' && params.skillId) {
        setSelectedSkills([params.skillId]);
        setTotalSkills(1);
        // Show shimmer while loading assessment data
        setShowShimmer(true);
        setLoading(false);
        return;
      }

      // Handle new assessment with selected skills
      if (params.selectedSkills) {
        let parsed;
        try {
          parsed = JSON.parse(params.selectedSkills);
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          // Try to handle as string array
          if (typeof params.selectedSkills === 'string') {
            parsed = [params.selectedSkills];
          } else {
            throw parseError;
          }
        }
        
        console.log('📊 Parsed skills:', parsed);
        console.log('📊 Parsed skills type:', typeof parsed);
        console.log('📊 Is array?', Array.isArray(parsed));

        if (Array.isArray(parsed)) {
          // Validate that all skills are valid IDs (strings or numbers)
          const validSkills = parsed.filter(skillId => {
            const isValid = skillId && (typeof skillId === 'string' || typeof skillId === 'number');
            if (!isValid) {
              console.warn('⚠️ Invalid skill ID found:', skillId, typeof skillId);
            }
            return isValid;
          });

          console.log('📊 Valid skills:', validSkills);
          console.log('📊 Skills length:', validSkills?.length || 0);
          setSelectedSkills(validSkills || []);
          setTotalSkills(validSkills?.length || 0);
          
          // If we have valid skills, trigger initialization
          if (validSkills && validSkills.length > 0) {
            console.log('✅ Skills parsed successfully, will initialize assessment');
          }
        } else {
          console.error('❌ Parsed skills is not an array:', parsed);
          setSelectedSkills([]);
          setTotalSkills(0);
          setError('Invalid skills format - expected array');
        }
      } else {
        // No skills provided - this might be a direct redirect from AuthMiddleware
        // We'll need to get skills from the user's profile
        console.log('📝 No skills provided in params - will fetch from user profile');
        setSelectedSkills([]);
        setTotalSkills(0);
        // Don't set error yet, we'll try to fetch skills
      }
    } catch (error) {
      console.error('❌ Error parsing skills:', error);
      setSelectedSkills([]);
      setTotalSkills(0);
      setError('Invalid skills data format');
      
      // Hide shimmer on error
      setShowShimmer(false);
    } finally {
      setLoading(false);
      
      // Hide shimmer if not resuming
      if (!(params.resume === 'true' && (params.skillId || params.sessionId))) {
        setShowShimmer(false);
      }
    }
  }, [params.selectedSkills, params.resume, params.sessionId, params.skillId]);

  // Auto-initialize assessment when component is ready
  useEffect(() => {
    let isMounted = true;
    
    // Wait for authentication to be ready before initializing
    if (authLoading) {
      return;
    }
    
    // Initialize if we have skills, or if we're resuming a session
    const shouldInitialize = !loading && !hasInitialized && (
      (selectedSkills && selectedSkills.length > 0) || 
      (sessionId && params.resume === 'true') ||
      (params.skillId && params.resume === 'true')
    );
    
    if (shouldInitialize) {
      setHasInitialized(true);
      if (isMounted) {
        initializeAssessment();
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, [loading, selectedSkills, sessionId, params.resume, hasInitialized, authLoading]);

  // Initialize assessment session with AI animation
  const initializeAssessment = async () => {
    // Check if this is a resume operation - if so, skip AI loader
    if (params.resume === 'true' && (params.skillId || params.sessionId)) {
      try {
        await performAssessmentInitialization();
        // For resume, we don't need to show/hide AI loader
        setCreatingAssessment(false);
      } catch (error) {
        setCreatingAssessment(false);
        
        // Hide shimmer on error
        setShowShimmer(false);
        
        setError(error.message || 'Failed to resume assessment');
        setHasInitialized(false);
      }
      return;
    }

    // Original AI loader logic for new assessments
    try {
      setShowAILoader(true);
      setAiProgress(0);
      
      // Simulate AI progress steps
      const progressSteps = [0.15, 0.4, 0.7, 0.9, 1.0];
      let currentStepIndex = 0;
      
      const progressInterval = setInterval(() => {
        if (currentStepIndex < progressSteps.length) {
          setAiProgress(progressSteps[currentStepIndex]);
          currentStepIndex++;
        }
      }, 1000); // Update progress every 1 second
      
      // Add timeout for assessment creation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Assessment creation timeout')), 30000); // 30 seconds
      });
      
      const assessmentPromise = performAssessmentInitialization();
      
      await Promise.race([assessmentPromise, timeoutPromise]);
      
      // Clear progress simulation
      clearInterval(progressInterval);
      setAiProgress(1.0);
      
      // Wait for animation to complete
      setTimeout(() => {
        setShowAILoader(false);
        setCreatingAssessment(false);
      }, 1000);
      
    } catch (error) {
      setShowAILoader(false);
      setCreatingAssessment(false);
      
      // Hide shimmer on error
      setShowShimmer(false);
      
      if (error.message === 'Assessment creation timeout') {
        setError('Assessment creation is taking too long. Please try again.');
      } else {
        setError(error.message || 'Failed to initialize assessment');
      }
      // Reset initialization flag on error so user can retry
      setHasInitialized(false);
    }
  };

    const performAssessmentInitialization = async () => {
    // Handle resume session
    if (sessionId && params.resume === 'true') {
      console.log('🔄 Resuming existing session:', sessionId);
      
      try {
        // Prevent rapid API calls - only check once every 5 seconds
        const now = Date.now();
        if (now - lastSessionCheck < 5000) {
          console.log('⏱️ Skipping session check - too soon since last check');
          return;
        }
        setLastSessionCheck(now);
        
        const sessionStatusResponse = await apiService.get('/assessment/session/status');
        
        if (sessionStatusResponse.success && sessionStatusResponse.data.hasActiveSession) {
          console.log('✅ Successfully loaded existing session:', sessionStatusResponse.data);
          
          setSessionId(sessionStatusResponse.data.sessionId);
          setCurrentSkillIndex(sessionStatusResponse.data.currentSkillIndex);
          setTotalSkills(sessionStatusResponse.data.totalSkills);
          setSelectedSkills(sessionStatusResponse.data.selectedSkills || []);
          
          // Load current assessment using the specific endpoint
          try {
            console.log('🔍 Loading current assessment for session:', sessionStatusResponse.data.sessionId);
            // Add retries with backoff and extended timeout
            let currentAssessmentResponse: any = null;
            const maxAttempts = 3;
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
              try {
                currentAssessmentResponse = await apiService.get(`/assessment/session/${sessionStatusResponse.data.sessionId}/current`, { timeout: 150000 });
                break;
              } catch (err) {
                console.log(`⏳ Current assessment load attempt ${attempt} failed`);
                if (attempt === maxAttempts) throw err;
                await new Promise(r => setTimeout(r, attempt * 2000));
              }
            }

            if (currentAssessmentResponse?.success && currentAssessmentResponse.data.assessment) {
              console.log('✅ Current assessment loaded:', currentAssessmentResponse.data.assessment);
              setCurrentAssessment(currentAssessmentResponse.data.assessment);
              setCurrentView('scenario');
              setCreatingAssessment(false);
              
              // Ensure AI loader is hidden for resume cases
              setShowAILoader(false);
              setAiProgress(0);
              
              // Hide shimmer and show actual content
              setShowShimmer(false);
              
              // Session resumed silently
            } else if (currentAssessmentResponse?.success && currentAssessmentResponse.data.completed) {
              console.log('✅ All assessments completed');
              setError('All assessments have been completed. Great job!');
            } else {
              console.error('❌ No assessment data in response:', currentAssessmentResponse);
              setError('Failed to load assessment data. The system will try to create a new assessment.');
            }
          } catch (assessmentError) {
            console.error('❌ Error loading current assessment:', assessmentError);
            console.error('❌ Error details:', {
              message: assessmentError.message,
              status: assessmentError.status,
              data: assessmentError.data
            });
            
            // Hide shimmer on error
            setShowShimmer(false);
            
            // Check if it's a 404 (assessment not found) - show create button
            if (assessmentError.status === 404) {
              console.log('🔄 Assessment not found, showing create button...');
              setError('Failed to load assessment data. Please try again.');
            } else {
              setError('Failed to load assessment data. Please try again.');
            }
          }
          return;
        } else {
          // No active session found - this is normal for new assessments
          console.log('ℹ️ No active session found, will start new assessment');
          // Don't set error here, let the flow continue to create new assessment
        }
      } catch (sessionError) {
        console.log('ℹ️ No existing session found or error checking session:', sessionError.message);
        // Hide shimmer on error
        setShowShimmer(false);
        // Continue with starting new session - don't set error
      }
    }

    // Handle resume for specific skill (from activity card)
    if (params.skillId && params.resume === 'true') {
      try {
        // Get the current assessment for this specific skill
        const skillAssessmentResponse = await apiService.get(`/assessment/skill/${params.skillId}/current`);
        
        if (skillAssessmentResponse.success && skillAssessmentResponse.data.assessment) {
          // Set all the necessary state
          setSessionId(skillAssessmentResponse.data.sessionId);
          setCurrentSkillIndex(0);
          setTotalSkills(1);
          setSelectedSkills([params.skillId]);
          setCurrentAssessment(skillAssessmentResponse.data.assessment);
          setCurrentView('scenario');
          setCreatingAssessment(false);
          
          // Ensure AI loader is hidden for resume cases
          setShowAILoader(false);
          setAiProgress(0);
          
          // Load existing responses and find next unanswered question
          try {
            await fetchRealProgress();
            findNextUnansweredQuestion();
          } catch (responseError) {
            setCurrentScenarioIndex(0);
            setCurrentResponse('');
          }
          
          // Hide shimmer and show actual content
          setShowShimmer(false);
          return;
        } else {
          // Hide shimmer on error
          setShowShimmer(false);
          
          // Redirect to intro screen to create new assessment
          router.replace({
            pathname: '/assessment-intro',
            params: { skillId: params.skillId }
          });
          return;
        }
      } catch (skillError) {
        // Hide shimmer on error
        setShowShimmer(false);
        
        // Redirect to intro screen on error
        router.replace({
          pathname: '/assessment-intro',
          params: { skillId: params.skillId }
        });
        return;
      }
    }

    // Handle new assessment
    console.log('🚀 Starting new assessment with skills:', selectedSkills);
    console.log('📊 Selected skills length:', selectedSkills?.length || 0);
    console.log('📊 Selected skills type:', typeof selectedSkills);
    
    // Skills should always be provided via params from dashboard
    if (!selectedSkills || selectedSkills.length === 0) {
      console.error('❌ No skills provided for assessment');
      setError('No skills selected for assessment. Please select skills first and try again.');
      return;
    }

    // First, check if there's an existing active session
    try {
      console.log('🔍 Checking for existing active session...');
      
      // Prevent rapid API calls - only check once every 5 seconds
      const now = Date.now();
      if (now - lastSessionCheck < 5000) {
        console.log('⏱️ Skipping session check - too soon since last check');
        return;
      }
      setLastSessionCheck(now);
      
      const sessionStatusResponse = await apiService.get('/assessment/session/status');
      
      if (sessionStatusResponse.success && sessionStatusResponse.data.hasActiveSession) {
        console.log('🔄 Found existing active session:', sessionStatusResponse.data);
        
        // Check if the existing session has the same skills
        const existingSkillIds = sessionStatusResponse.data.selectedSkills || [];
        const skillsMatch = selectedSkills.length === existingSkillIds.length && 
                           selectedSkills.every(id => existingSkillIds.includes(id));
        
        if (skillsMatch) {
          console.log('✅ Resuming existing session with same skills');
          
          // Resume the existing session
          const skillsToUse = selectedSkills && selectedSkills.length > 0 ? selectedSkills : [];
          console.log('📊 Skills to use for resuming session:', skillsToUse);
          
          const resumeResponse = await apiService.post('/assessment/session/start', {
            skillIds: skillsToUse
          });
          
          if (resumeResponse.success && resumeResponse.data.resumed) {
            console.log('✅ Successfully resumed existing session');
            setSessionId(resumeResponse.data.sessionId);
            setCurrentSkillIndex(resumeResponse.data.currentSkillIndex);
            setTotalSkills(resumeResponse.data.totalSkills);
            setCurrentAssessment(resumeResponse.data.currentAssessment);
            setCurrentView('scenario');
            setCreatingAssessment(false);
            
            // Hide shimmer and show actual content
            setShowShimmer(false);
            
            // Session resumed silently
            return;
          }
        } else {
          console.log('⚠️ Existing session has different skills, will start new session');
        }
      }
    } catch (sessionError) {
      console.log('ℹ️ No existing session found or error checking session:', sessionError.message);
      // Hide shimmer on error
      setShowShimmer(false);
      // Continue with starting new session
    }

    // For new assessments, show the create button instead of auto-creating
    console.log('🆕 New assessment flow - showing create button');
    setError('Failed to load assessment data. Please try again.');
    setLoading(false);
    
    // Hide shimmer for new assessment flow
    setShowShimmer(false);
  };

  // Retry initialization handler
  const handleRetryInitialization = () => {
    setError('');
    setCreatingAssessment(true);
    setShowAILoader(true);
    setAiProgress(0);
    initializeAssessment();
  };

  // Handle start assessment
  const handleStartAssessment = () => {
    if (selectedSkills && selectedSkills.length > 0) {
      setCreatingAssessment(true);
      initializeAssessment();
    } else {
      setError('No skills selected');
    }
  };

  // Handle create assessment with AI animation
  const handleCreateAssessment = async () => {
    try {
      setCreatingAssessment(true);
      setError('');
      setShowAILoader(true);
      setAiProgress(0);
      
      console.log('🔄 Creating new assessment for skills:', selectedSkills);
      
      // Simulate AI progress steps
      const progressSteps = [0.1, 0.3, 0.6, 0.8, 0.95, 1.0];
      let currentStepIndex = 0;
      
      const progressInterval = setInterval(() => {
        if (currentStepIndex < progressSteps.length) {
          setAiProgress(progressSteps[currentStepIndex]);
          currentStepIndex++;
        }
      }, 1200); // Update progress every 1.2 seconds
      
      // Create assessment session with the selected skills
      const response = await apiService.post('/assessment/session/start', {
        skillIds: selectedSkills
      });

      // Clear progress simulation
      clearInterval(progressInterval);
      
      if (response.success) {
        console.log('✅ Assessment created successfully:', response.data);
        
        // Complete the progress
        setAiProgress(1.0);
        
        // Wait for animation to complete
        setTimeout(() => {
          setShowAILoader(false);
          setSessionId(response.data.sessionId);
          setCurrentSkillIndex(response.data.currentSkillIndex);
          setTotalSkills(response.data.totalSkills);
          setCurrentAssessment(response.data.currentAssessment);
          setCurrentView('scenario');
          setCreatingAssessment(false);
          showToast('success', 'Assessment Created', 'Your personalized assessment is ready!');
        }, 1500);
      } else {
        console.error('❌ Failed to create assessment:', response.message);
        setShowAILoader(false);
        setCreatingAssessment(false);
        
        // Hide shimmer on error
        setShowShimmer(false);
        
        setError('Failed to create assessment: ' + response.message);
      }
          } catch (error) {
        console.error('❌ Error creating assessment:', error);
        setShowAILoader(false);
        setCreatingAssessment(false);
        
        // Hide shimmer on error
        setShowShimmer(false);
        
        setError('Failed to create assessment. Please try again.');
      }
  };

  // Handle back to dashboard
  // Handle back button press with double-tap to exit
  const handleBackPress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 2000; // 2 seconds
    
    if (now - lastBackPress < DOUBLE_TAP_DELAY) {
      // Double tap detected - exit
      setShowExitWarning(false);
      setLastBackPress(0);
      router.replace('/dashboard');
    } else {
      // First tap - show warning
      setLastBackPress(now);
      setShowExitWarning(true);
      
      // Auto-hide warning after delay
      setTimeout(() => {
        setShowExitWarning(false);
        setLastBackPress(0);
      }, DOUBLE_TAP_DELAY);
    }
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

  // Handle next scenario
  const handleNextScenario = async () => {
    const prompts = currentAssessment?.template?.prompts || [];
    
    // Save current response to local state
    if (currentResponse.trim()) {
      setUserResponses(prev => ({
        ...prev,
        [currentScenarioIndex]: currentResponse.trim()
      }));
    }

          // Store current response in database for progress tracking (but don't complete assessment)
      if (currentResponse.trim() && currentAssessment?.id && prompts[currentScenarioIndex]?.id) {
        try {
          const currentPrompt = prompts[currentScenarioIndex];
          await apiService.post('/assessment/response', {
            assessmentId: currentAssessment.id,
            promptId: currentPrompt.id,
            response: {
              text_content: currentResponse.trim(),
              time_taken_seconds: 0
            },
            completeAssessment: false // Don't complete assessment, just store for progress
          });
          
          // Update progress after storing response
          await updateAssessmentStatus();
          console.log('✅ Response stored in database for progress tracking');
        } catch (error) {
          console.error('❌ Failed to store response for progress tracking:', error);
          // Continue anyway, but log the error
        }
      }

    if (currentScenarioIndex < prompts.length - 1) {
      // Move to next scenario
      setCurrentScenarioIndex(prev => prev + 1);
      setCurrentResponse(userResponses[currentScenarioIndex + 1] || "");
    } else {
      // Last scenario - show submit button instead of auto-completing
      // User must click "Submit Assessment" to submit all responses
      console.log('ℹ️ Last scenario reached. User must click Submit Assessment to complete.');
    }
  };

  // Handle previous scenario
  const handlePreviousScenario = async () => {
    // Save current response to local state
    if (currentResponse.trim()) {
      setUserResponses(prev => ({
        ...prev,
        [currentScenarioIndex]: currentResponse.trim()
      }));
    }

    // Store current response in database for progress tracking (but don't complete assessment)
    if (currentResponse.trim() && currentAssessment?.id && currentAssessment?.template?.prompts[currentScenarioIndex]?.id) {
      try {
        const currentPrompt = currentAssessment.template.prompts[currentScenarioIndex];
        await apiService.post('/assessment/response', {
          assessmentId: currentAssessment.id,
          promptId: currentPrompt.id,
          response: {
            text_content: currentResponse.trim(),
            time_taken_seconds: 0
          },
          completeAssessment: false // Don't complete assessment, just store for progress
        });
        
        // Update progress after storing response
        await updateAssessmentStatus();
        console.log('✅ Response stored in database for progress tracking');
      } catch (error) {
        console.error('❌ Failed to store response for progress tracking:', error);
        // Continue anyway, but log the error
      }
    }

    if (currentScenarioIndex > 0) {
      setCurrentScenarioIndex(prev => prev - 1);
      setCurrentResponse(userResponses[currentScenarioIndex - 1] || "");
    }
  };

  // Fetch real progress data from backend
  const fetchRealProgress = async () => {
    try {
      if (currentAssessment?.id) {
        const response = await apiService.get('/assessment/session/status');
        
        if (response.success && response.data.progress) {
          const progressData = response.data.progress;
          
          const progressPercentage = progressData.totalPrompts > 0 
            ? (progressData.completedResponses / progressData.totalPrompts) * 100 
            : 0;
          
          const progressObject = {
            totalPrompts: progressData.totalPrompts,
            completedResponses: progressData.completedResponses,
            percentage: progressPercentage,
            status: progressData.status
          };
          
          setRealProgress(progressObject);
        }
      }
    } catch (error) {
      // Silent error handling
    }
  };

  // Find the next unanswered question when resuming assessment
  const findNextUnansweredQuestion = async () => {
    try {
      if (!currentAssessment?.id) {
        return;
      }

      // Get all responses for this assessment
      const response = await apiService.get(`/assessment/response/${currentAssessment.id}`);
      
      if (response.success && response.data) {
        const answeredPromptIds = new Set(response.data.responses.map(r => r.prompt_id));
        const prompts = currentAssessment.template?.prompts || [];
        
        // Load existing responses into local state
        const existingResponses = {};
        response.data.responses.forEach(r => {
          const promptIndex = prompts.findIndex(p => p.id === r.prompt_id);
          if (promptIndex !== -1) {
            existingResponses[promptIndex] = r.text_content || '';
          }
        });
        
        setUserResponses(existingResponses);
        
        // Find the first unanswered question
        for (let i = 0; i < prompts.length; i++) {
          const isAnswered = answeredPromptIds.has(prompts[i].id);
          
          if (!isAnswered) {
            setCurrentScenarioIndex(i);
            setCurrentResponse(existingResponses[i] || "");
            break;
          }
        }
      }
    } catch (error) {
      // Default to first question if the error
      setCurrentScenarioIndex(0);
      setCurrentResponse(userResponses[0] || "");
    }
  };

  // Update assessment status when responses are submitted
  const updateAssessmentStatus = async () => {
    try {
      if (!currentAssessment?.id) return;
      
      // Get current assessment responses to check count
      const response = await apiService.get(`/assessment/response/${currentAssessment.id}`);
      if (response.success && response.data) {
        const totalPrompts = response.data.totalPrompts || 3;
        const completedResponses = response.data.completedResponses;
        
        // Update local progress state
        setRealProgress(prev => ({
          ...prev,
          totalPrompts,
          completedResponses,
          percentage: (completedResponses / totalPrompts) * 100,
          status: completedResponses >= totalPrompts ? 'COMPLETED' : 'IN_PROGRESS'
        }));
      }
    } catch (error) {
      console.log('⚠️ Could not update assessment status:', error);
    }
  };



  // Fetch progress when assessment loads
  useEffect(() => {
    if (currentAssessment && currentAssessment.id) {
      fetchRealProgress();
      // If this is a resume, find the next unanswered question
      if (params.resume === 'true') {
        findNextUnansweredQuestion();
      }
    }
  }, [currentAssessment]);



  // Handle complete skill assessment
  const handleCompleteSkillAssessment = async () => {
    try {
      setSubmitting(true);
      
      // Check if assessment is already completed
      if (currentAssessment?.status === 'COMPLETED') {
        console.log('ℹ️ Assessment already completed, showing completion modal');
        setCompletedSkillName(currentAssessment.skill?.skill_name || "Skill");
        setShowSkillCompleteModal(true);
        setSubmitting(false);
        return;
      }
      
      // Save final response to local state
      if (currentResponse.trim()) {
        setUserResponses(prev => ({
          ...prev,
          [currentScenarioIndex]: currentResponse.trim()
        }));
      }

      // Now submit ALL responses at once using bulk endpoint
      console.log('📤 Submitting all assessment responses at once...');

      // Check if all scenarios have responses
      const prompts = currentAssessment?.template?.prompts || [];
      const allResponses = { ...userResponses };
      if (currentResponse.trim()) {
        allResponses[currentScenarioIndex] = currentResponse.trim();
      }

      const hasAllResponses = prompts.every((_, index) => allResponses[index] && allResponses[index].trim());
      
      if (!hasAllResponses) {
        Alert.alert(
          "Incomplete Assessment",
          "Please provide responses for all scenarios before submitting.",
          [{ text: "OK" }]
        );
        return;
      }

      console.log('📤 Submitting skill assessment responses:', allResponses);
      console.log('📤 Current assessment ID:', currentAssessment.id);
      console.log('📤 Prompts:', prompts);
      
      // Validate assessment ID
      if (!currentAssessment.id) {
        console.error('❌ Assessment ID is missing');
        Alert.alert("Error", "Assessment ID is missing. Please refresh and try again.");
        return;
      }

      // Validate prompts
      if (!prompts || prompts.length === 0) {
        console.error('❌ No prompts found for assessment');
        Alert.alert("Error", "No prompts found for assessment. Please refresh and try again.");
        return;
      }

      // Validate responses
      const responseEntries = Object.entries(allResponses);
      if (responseEntries.length === 0) {
        console.error('❌ No responses to submit');
        Alert.alert("Error", "No responses to submit. Please provide responses for all scenarios.");
        return;
      }

      const requestData = {
        assessmentId: currentAssessment.id,
        responses: responseEntries.map(([index, response]) => {
          const promptIndex = parseInt(index);
          const prompt = prompts[promptIndex];
          
          if (!prompt || !prompt.id) {
            console.error(`❌ Invalid prompt at index ${index}`);
            throw new Error(`Invalid prompt at index ${index}`);
          }
          
          // Validate response text
          if (!response || typeof response !== 'string' || response.trim().length === 0) {
            console.error(`❌ Invalid response at index ${index}:`, response);
            throw new Error(`Invalid response at index ${index}`);
          }
          
          // Trim and validate response length
          const trimmedResponse = response.trim();
          if (trimmedResponse.length > 10000) { // 10KB limit
            console.error(`❌ Response too long at index ${index}: ${trimmedResponse.length} characters`);
            throw new Error(`Response too long at index ${index} (${trimmedResponse.length} characters, max 10000)`);
          }
          
          return {
            promptId: prompt.id,
            response: trimmedResponse
          };
        })
      };
      
      console.log('📤 Request data:', JSON.stringify(requestData, null, 2));
      console.log('📤 API Service base URL:', apiService.api?.defaults?.baseURL);
      
      // Test connection first
      try {
        console.log('🔍 Testing connection to backend...');
        const testResponse = await apiService.get('/auth/health');
        console.log('✅ Backend connection test successful:', testResponse);
        
        // Also test a simple GET request to verify API is working
        console.log('🔍 Testing API functionality...');
        const sessionStatusResponse = await apiService.get('/assessment/session/status');
        console.log('✅ Session status test successful:', sessionStatusResponse);
        
      } catch (testError) {
        console.error('❌ Backend connection test failed:', testError);
        console.error('❌ Test error details:', {
          message: testError.message,
          status: testError.response?.status,
          data: testError.response?.data,
          code: testError.code
        });
        
        // Show specific error message for connection issues
        if (testError.message.includes('Network Error') || testError.code === 'ECONNREFUSED') {
          Alert.alert(
            "Connection Error", 
            "Cannot connect to the server. Please check your internet connection and try again."
          );
          return;
        } else if (testError.response?.status === 401) {
          Alert.alert(
            "Authentication Error", 
            "Your session has expired. Please log in again."
          );
          return;
        }
      }
      
      // Check if assessment is already completed before bulk submission
      if (currentAssessment?.status === 'COMPLETED') {
        console.log('ℹ️ Assessment already completed, skipping bulk submission');
        setCompletedSkillName(currentAssessment.skill?.skill_name || "Skill");
        setShowSkillCompleteModal(true);
        setSubmitting(false);
        return;
      }
      
      // Submit responses to backend with extended timeout
      console.log('📤 Making API call to /assessment/response/bulk...');
      console.log('📤 Request data size:', JSON.stringify(requestData).length, 'characters');
      console.log('📤 Request data preview:', JSON.stringify(requestData).substring(0, 500) + '...');
      
      // Log request headers for debugging
      console.log('📤 API Service base URL:', apiService.api?.defaults?.baseURL);
      console.log('📤 Request timeout:', 60000);
      
      try {
        // Add completeAssessment flag to bulk request
        const bulkRequestData = {
          ...requestData,
          completeAssessment: true // This will complete and score the assessment
        };
        
        const response = await apiService.post('/assessment/response/bulk', bulkRequestData, { 
          timeout: 60000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        console.log('📤 API call completed');
        console.log('📤 Response received:', response);

              if (response.success) {
        console.log('✅ Skill assessment completed:', response.data);
        console.log('✅ Assessment completion response:', response);
        console.log('✅ Current assessment ID after completion:', currentAssessment.id);
        
        // Show skill completion modal
        setCompletedSkillName(currentAssessment.skill?.skill_name || "Skill");
        setShowSkillCompleteModal(true);
      } else {
        console.log('❌ API returned success: false');
        console.log('❌ Error message:', response.message);
        console.log('❌ Full response:', response);
        
        // Check if this is an AI analysis failure
        if (response.message && (
          response.message.includes('Failed to generate result analysis') ||
          response.message.includes('Failed to submit responses') ||
          response.message.includes('AI analysis failed')
        )) {
          setAiAnalysisFailed(true);
          throw new Error('AI analysis failed. Please try again.');
        } else {
          throw new Error(response.message || 'Failed to submit assessment');
        }
      }
      } catch (apiError) {
        console.error('❌ API call failed:', apiError);
        console.error('❌ Error type:', typeof apiError);
        console.error('❌ Error message:', apiError.message);
        console.error('❌ Error response:', apiError.response);
        console.error('❌ Error status:', apiError.response?.status);
        console.error('❌ Error data:', apiError.response?.data);
        console.error('❌ Full error object:', JSON.stringify(apiError, null, 2));
        
        // Log the full request data for debugging
        console.error('❌ Full request data that failed:', JSON.stringify(requestData, null, 2));
        
        // Check if this is an AI analysis failure
        const errorMessage = apiError.message || '';
        const responseData = apiError.response?.data;
        const responseMessage = responseData?.message || '';
        
        if (errorMessage.includes('Failed to generate result analysis') ||
            errorMessage.includes('Failed to submit responses') ||
            errorMessage.includes('AI analysis failed') ||
            responseMessage.includes('Failed to generate result analysis') ||
            responseMessage.includes('Failed to submit responses') ||
            responseMessage.includes('AI analysis failed')) {
          
          console.log('🤖 AI analysis failure detected, showing AI error screen');
          setAiAnalysisFailed(true);
          return; // Don't show alert, let the AI error screen handle it
        }
        
        // Provide more specific error messages for other errors
        let alertMessage = 'Failed to submit assessment. Please try again.';
        
        if (apiError.response?.status === 404) {
          alertMessage = 'Assessment not found. Please refresh and try again.';
        } else if (apiError.response?.status === 401) {
          alertMessage = 'Authentication expired. Please log in again.';
        } else if (apiError.response?.status === 500) {
          alertMessage = 'Server error. Please try again later.';
        } else if (apiError.response?.status === 400) {
          alertMessage = `Validation error: ${apiError.response?.data?.message || 'Invalid request format'}`;
        } else if (apiError.message) {
          alertMessage = `Submission failed: ${apiError.message}`;
        }
        
        // Show detailed error in development
        if (__DEV__) {
          console.error('❌ Detailed error for development:', {
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            data: apiError.response?.data,
            headers: apiError.response?.headers,
            config: apiError.config
          });
        }
        
        Alert.alert("Submission Error", alertMessage);
        throw apiError; // Re-throw to be caught by outer catch
      }
      
    } catch (error) {
      console.error('❌ Submit assessment error:', error);
      // Only show error if AI analysis failure wasn't detected
      if (!aiAnalysisFailed) {
        Alert.alert("Error", "Failed to submit assessment. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle retry assessment submission
  const handleRetrySubmission = () => {
    setAiAnalysisFailed(false);
    setSubmitting(false);
    // This will trigger the submission again when the component re-renders
  };

  // Handle navigation to home
  const handleGoHome = () => {
    setAiAnalysisFailed(false);
    router.replace('/dashboard');
  };

  // Handle see results now
  const handleSeeResults = async () => {
    console.log('🎯 See Results clicked!');
    console.log('🎯 Current assessment:', currentAssessment);
    console.log('🎯 Assessment ID:', currentAssessment?.id);
    console.log('🎯 Skill name:', currentAssessment?.skill?.skill_name);
    
    if (!currentAssessment?.id) {
      console.error('❌ No assessment ID available!');
      Alert.alert("Error", "Assessment ID not found. Please try again.");
      return;
    }
    
    setShowSkillCompleteModal(false);
    
    // Add a small delay to ensure backend processing is complete
    console.log('⏳ Waiting for backend processing...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Navigate to results screen
    console.log('🚀 Navigating to assessment results...');
    console.log('🚀 Navigation params:', {
      pathname: '/assessment-results',
      params: { 
        assessmentId: currentAssessment.id,
        skillName: currentAssessment.skill?.skill_name
      }
    });
    
    try {
      await router.push({
        pathname: '/assessment-results',
        params: { 
          assessmentId: currentAssessment.id,
          skillName: currentAssessment.skill?.skill_name
        }
      });
      console.log('✅ Navigation completed successfully');
    } catch (navError) {
      console.error('❌ Navigation error:', navError);
      Alert.alert("Navigation Error", "Failed to navigate to results. Please try again.");
    }
  };

  // Handle continue to next skill
  const handleContinueToNextSkill = async () => {
    try {
      setShowSkillCompleteModal(false);
      setSubmitting(true);
      
      console.log('🔄 Continuing to next skill...');
      
      const response = await apiService.post(`/assessment/session/${sessionId}/next`);
      
      if (response.success) {
        if (response.data.completed) {
          // All skills completed
          setCurrentView('complete');
          showToast('success', 'All Assessments Complete!', 'You have completed all skill assessments.');
        } else {
          // Move to next skill
          console.log('✅ Next skill loaded:', response.data);
          setCurrentSkillIndex(response.data.currentSkillIndex);
          setCurrentAssessment(response.data.currentAssessment);
          setCurrentScenarioIndex(0);
          setUserResponses({});
          setCurrentResponse("");
          setCurrentView('scenario');
        }
      } else {
        throw new Error(response.message || 'Failed to continue to next skill');
      }
      
    } catch (error) {
      console.error('❌ Continue to next skill error:', error);
      Alert.alert("Error", "Failed to continue to next skill. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state
  if (loading || authLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 18, color: BRAND, marginBottom: 16 }}>
            {authLoading ? 'Loading Authentication...' : 'Loading Assessment...'}
          </Text>
          <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center" }}>
            {authLoading ? 'Checking your login status' : 'Preparing your assessment'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show AI analysis failure error state
  if (aiAnalysisFailed) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🤖</Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a", textAlign: "center", marginBottom: 8 }}>
              AI Analysis Failed
            </Text>
            <Text style={{ fontSize: 16, color: "#64748b", textAlign: "center", lineHeight: 24 }}>
              We couldn't analyze your assessment responses due to a temporary issue with our AI service.
            </Text>
          </View>
          
          <View style={{ width: "100%", gap: 12 }}>
            <Button
              mode="contained"
              onPress={handleRetrySubmission}
              style={{ 
                backgroundColor: BRAND,
                height: 48
              }}
              contentStyle={{ height: 48 }}
              labelStyle={{ fontWeight: "600", fontSize: 16 }}
            >
              Retry Assessment
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleGoHome}
              style={{ 
                borderColor: BRAND,
                borderWidth: 2,
                height: 48
              }}
              contentStyle={{ height: 48 }}
              labelStyle={{ color: BRAND, fontWeight: "600", fontSize: 16 }}
            >
              Go to Dashboard
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    // Check if this is a "no assessment" error that should show create button
    const isNoAssessmentError = error.includes('Failed to load assessment data') || 
                               error.includes('Assessment not found') ||
                               error.includes('no assessment found');
    
    if (isNoAssessmentError && selectedSkills && selectedSkills.length > 0) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
          <StatusBar style="dark" />
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 18, color: BRAND, marginBottom: 16, textAlign: "center" }}>
              Create Assessment
            </Text>
            <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 24 }}>
              No assessment found for your selected skills. Click below to generate a personalized assessment using AI.
            </Text>
            <Button
              mode="contained"
              onPress={handleCreateAssessment}
              loading={creatingAssessment}
              disabled={creatingAssessment}
              style={{ 
                backgroundColor: creatingAssessment ? BRAND : BRAND,
                marginBottom: 16,
                opacity: creatingAssessment ? 0.8 : 1
              }}
              contentStyle={{ height: 48 }}
              labelStyle={{ 
                fontWeight: "600", 
                fontSize: 16,
                color: "#ffffff"
              }}
            >
              {creatingAssessment ? "Generating Assessment..." : "Create Assessment"}
            </Button>
            <Button
              mode="outlined"
              onPress={handleBackToDashboard}
              style={{ borderColor: BRAND }}
              labelStyle={{ color: BRAND }}
            >
              Back to Dashboard
            </Button>
          </View>
        </SafeAreaView>
      );
    }
    
    // Show regular error state
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 18, color: "#DC2626", marginBottom: 16, textAlign: "center" }}>
            Assessment Error
          </Text>
          <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 24 }}>
            {error}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button
              mode="contained"
              onPress={handleRetryInitialization}
              style={{ backgroundColor: BRAND }}
            >
              Retry
            </Button>
            <Button
              mode="outlined"
              onPress={handleBackToDashboard}
              style={{ borderColor: BRAND }}
              labelStyle={{ color: BRAND }}
            >
              Back to Dashboard
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show start screen (but skip for resume cases)
  if (currentView === 'start' && !(params.resume === 'true' && (params.skillId || params.sessionId))) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
        <StatusBar style="light" />

        {/* Hero header */}
        <View style={{ minHeight: 200, position: "relative" }}>
          <LinearGradient colors={["#0A66C2", "#0E75D1", "#1285E0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0 }} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start", paddingHorizontal: 18, paddingTop: 10 }}>
            <Image source={logoSrc} style={{ width: 56, height: 56, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10 }} resizeMode="contain" />
            <Text style={{ marginLeft: 12, color: "#ffffff", fontSize: 22, fontWeight: "900", letterSpacing: 0.8, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>{APP_NAME}</Text>
          </View>
          <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 18, paddingBottom: 20 }}>
            <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 480 }}>
              <Text style={{ fontSize: 24, fontWeight: "900", color: "#ffffff" }}>Assessment Ready</Text>
              <Text style={{ marginTop: 8, color: "#E6F2FF", fontSize: 15 }}>Scenario-based Assessment</Text>
              <Text style={{ marginTop: 4, color: "#E6F2FF", fontSize: 13, opacity: 0.9 }}>
                {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} selected • 60 minutes total
              </Text>
            </MotiView>
          </View>
        </View>

        {/* Content card */}
        <View style={{ flex: 1, marginTop: -24 }}>
          <View style={{ flex: 1, backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 24, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100, maxWidth: 560, width: '100%', alignSelf: 'center' }} showsVerticalScrollIndicator={false}>

              {/* Instructions */}
              <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 420, delay: 100 }}>
          <Surface style={{ 
            padding: 20, 
                  borderRadius: 16,
                  marginBottom: 20,
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2
                }}>
                  <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a", marginBottom: 16 }}>
                    📖 Instructions
            </Text>
            
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: "#374151", lineHeight: 20 }}>
                      • Read each scenario carefully and provide detailed written responses
                    </Text>
                  </View>
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: "#374151", lineHeight: 20 }}>
                      • Answer based on your actual experience and approach
              </Text>
                  </View>
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: "#374151", lineHeight: 20 }}>
                      • Each skill has 3 scenarios to assess different aspects
              </Text>
                  </View>
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: "#374151", lineHeight: 20 }}>
                      • All responses are text-based - no audio or voice recording required
              </Text>
                  </View>
                  <View style={{ marginBottom: 0 }}>
                    <Text style={{ fontSize: 14, color: "#374151", lineHeight: 20 }}>
                      • You can navigate between scenarios before submitting
              </Text>
            </View>
                </Surface>
              </MotiView>

            </ScrollView>
            
            {/* Sticky footer CTA */}
            <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 34, zIndex: 1000, backgroundColor: "#ffffff" }}>
              <LinearGradient colors={["#0A66C2", "#0E75D1", "#1285E0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0, opacity: 0.1 }} />
            <Button
              mode="contained"
              onPress={handleStartAssessment}
              loading={creatingAssessment}
                disabled={creatingAssessment}
                contentStyle={{ height: 56 }}
                style={{
                  borderRadius: 28,
                  backgroundColor: BRAND,
                  opacity: creatingAssessment ? 0.8 : 1,
                  shadowColor: BRAND,
                  shadowOpacity: creatingAssessment ? 0.2 : 0.35,
                  shadowRadius: 14
                }}
                labelStyle={{ 
                  fontWeight: "800", 
                  letterSpacing: 0.3,
                  color: "#ffffff"
                }}
              >
                {creatingAssessment ? "Generating Assessment..." : "Begin Assessment"}
            </Button>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show shimmer loading for resume cases
  if (showShimmer) {
    return <ShimmerLoader />;
  }

  // Show scenario screen
  if (currentView === 'scenario') {
    const prompts = currentAssessment?.template?.prompts || [];
    const currentPrompt = prompts[currentScenarioIndex];
    const totalScenarios = prompts ? prompts.length : 3; // Default to 3 if undefined
    
    // Use real progress from backend if available, otherwise fallback to scenario-based progress
    const progress = realProgress ? realProgress.percentage / 100 : (realProgress?.completedResponses || 0) / (realProgress?.totalPrompts || 3);
    const hasResponse = currentResponse ? currentResponse.trim().length >= 50 : false;
    const wordCount = currentResponse ? currentResponse.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
    const isWithinLimit = wordCount <= 100;
    
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
        <StatusBar style="light" />
        
        {/* Back Button Warning Overlay - Footer */}
        {showBackWarning && (
          <View style={{
            position: 'absolute',
            bottom: 20,
            left: 16,
            right: 16,
            zIndex: 1000,
            backgroundColor: '#ffffff',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#e5e7eb'
          }}>
            <Text style={{
              color: '#374151',
              fontSize: 14,
              fontWeight: '500',
              textAlign: 'center'
            }}>
              Press back again to exit assessment
            </Text>
          </View>
        )}
        
        {/* Blue Header */}
        <View style={{ 
          paddingHorizontal: 16, 
          paddingTop: 8, 
          paddingBottom: 16,
          backgroundColor: BRAND
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image source={logoSrc} style={{ width: 32, height: 32 }} resizeMode="contain" />
              <Text style={{ 
                marginLeft: 10, 
                color: "#ffffff", 
                fontSize: 16, 
                fontWeight: "900", 
                letterSpacing: 0.4 
              }}>{APP_NAME}</Text>
            </View>
            
            {/* Progress indicator */}
            <View style={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 12
            }}>
              <Text style={{
                fontSize: 12,
                color: "#ffffff",
                fontWeight: "700"
              }}>
                {realProgress ? `${realProgress.completedResponses + 1} of ${realProgress.totalPrompts}` : `${currentScenarioIndex + 1} of ${totalScenarios}`}
              </Text>
            </View>
          </View>
          
          {/* Assessment title */}
          <Text style={{ 
            fontSize: 20, 
            fontWeight: "700", 
            color: "#ffffff",
            marginTop: 12
          }}>
            Assessment for {currentAssessment?.skill?.skill_name || "Skill"}
          </Text>
          
          {/* Progress text */}
          <Text style={{ 
            fontSize: 14, 
            color: "#E6F2FF", 
            marginTop: 4,
            opacity: 0.9
          }}>
            {realProgress ? `${realProgress.completedResponses} of ${realProgress.totalPrompts} questions answered` : `${Math.round(progress * 100)}% Complete`}
          </Text>
        </View>

                <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 24, // Space after blue header
            paddingBottom: 100, // Account for bottom buttons
            maxWidth: 520,
            width: '100%',
            alignSelf: 'center'
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Background Gradient Overlay */}
          <View style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: BRAND + "01" // Very subtle brand color overlay
          }} />
          {currentAssessment && currentPrompt ? (
            <>
              {/* Scenario Header */}
              <MotiView
                from={{ opacity: 0, translateY: 8, scale: 0.95 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                transition={{ type: "timing", duration: 420, delay: 100 }}
              >
              <Surface style={{ 
                  padding: 20,
                  borderRadius: 16,
                  marginBottom: 20,
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                  backgroundColor: "#ffffff"
                }}>
                  {/* Scenario Badge */}
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                    backgroundColor: BRAND + "08",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 10,
                    alignSelf: "flex-start"
                  }}>
                    <Text style={{ fontSize: 16, marginRight: 6 }}>📝</Text>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: BRAND,
                      letterSpacing: 0.4
                    }}>
                      SCENARIO {currentScenarioIndex + 1}
                </Text>
                  </View>

                  {/* Scenario Text */}
                  <Text style={{
                    fontSize: 16,
                    color: "#1f2937",
                    lineHeight: 24,
                    marginBottom: 20,
                    fontWeight: "500"
                  }}>
                    {currentPrompt?.prompt_text || currentPrompt?.instruction || "Loading scenario..."}
                  </Text>

                  {!currentPrompt && (
                    <Text style={{ fontSize: 14, color: "#9CA3AF", textAlign: "center", marginTop: 20 }}>
                      Loading scenario content...
                    </Text>
                  )}
              </Surface>
              </MotiView>

                            {/* Response Section */}
              <MotiView
                from={{ opacity: 0, translateY: 8, scale: 0.95 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                transition={{ type: "timing", duration: 420, delay: 200 }}
              >
                <Surface style={{
                  padding: 20,
                  borderRadius: 16,
                  marginBottom: 20,
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                  backgroundColor: "#ffffff"
                }}>
                  {/* Response Header */}
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 20,
                    backgroundColor: "#f8fafc",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#e2e8f0"
                  }}>
                    <View style={{
                      backgroundColor: BRAND + "15",
                      padding: 8,
                      borderRadius: 8,
                      marginRight: 12
                    }}>
                      <AntDesign name="edit" size={18} color={BRAND} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: "#1f2937",
                        marginBottom: 2
                      }}>
                        Your Response
                      </Text>
                      <Text style={{
                        fontSize: 13,
                        color: "#64748b"
                      }}>
                        Share your thoughts and experience
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: hasResponse ? "#dcfce7" : "#f1f5f9",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: hasResponse ? "#bbf7d0" : "#e2e8f0"
                    }}>
                      <Text style={{
                        fontSize: 12,
                        color: hasResponse ? "#16A34A" : "#64748b",
                        fontWeight: "600"
                      }}>
                        {hasResponse ? "✓ Draft Saved" : "⏳ Not Started"}
                      </Text>
                    </View>
                  </View>

                  {/* Response Input */}
                  <View style={{
                    marginBottom: 12
                  }}>
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8
                    }}>
                      <AntDesign name="message1" size={14} color="#6B7280" />
                      <Text style={{
                        fontSize: 13,
                        color: "#6B7280",
                        marginLeft: 6,
                        fontWeight: "500"
                      }}>
                        Write your detailed response below
                      </Text>
                    </View>
                  </View>
                  <View style={{
                    position: "relative",
                    marginBottom: 16
                  }}>
                    <TextInput
                      style={{
                        borderWidth: 2,
                        borderColor: isWithinLimit
                          ? (hasResponse ? "#10B981" : "#E5E7EB")
                          : "#EF4444",
                        borderRadius: 16,
                        padding: 20,
                        minHeight: 200,
                        backgroundColor: "#ffffff",
                        fontSize: 15,
                        color: "#1f2937",
                        textAlignVertical: "top",
                        shadowColor: "#000",
                        shadowOpacity: 0.04,
                        shadowRadius: 8,
                        elevation: 2
                      }}
                      multiline
                      placeholder="Share your thoughts, experiences, and insights about this scenario..."
                      placeholderTextColor="#9CA3AF"
                      value={currentResponse}
                      onChangeText={setCurrentResponse}
                      maxLength={500}
                    />

                    {/* Word Count Badge */}
                    <View style={{
                      position: "absolute",
                      top: -8,
                      right: 10,
                      backgroundColor: isWithinLimit ? "#ffffff" : "#FEF2F2",
                      borderWidth: 1,
                      borderColor: isWithinLimit ? "#E5E7EB" : "#FECACA",
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      shadowColor: "#000",
                      shadowOpacity: 0.04,
                      shadowRadius: 4,
                      elevation: 2
                    }}>
                      <Text style={{
                        fontSize: 11,
                        color: isWithinLimit ? "#6B7280" : "#DC2626",
                        fontWeight: "600"
                      }}>
                        {wordCount}/100 words
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={{
                    marginBottom: 10
                  }}>
                    <View style={{
                      height: 3,
                      backgroundColor: "#F3F4F6",
                      borderRadius: 2,
                      overflow: "hidden"
                    }}>
                      <View style={{
                        height: "100%",
                        backgroundColor: isWithinLimit
                          ? (wordCount >= 50 ? "#10B981" : "#E5E7EB")
                          : "#EF4444",
                        width: `${Math.min(100, (wordCount / 100) * 100)}%`,
                        borderRadius: 2
                      }} />
                    </View>
                  </View>

                  {/* Status Indicator */}
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 16,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: "#f1f5f9"
                  }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={{
                        backgroundColor: hasResponse && isWithinLimit ? "#dcfce7" :
                                         hasResponse && !isWithinLimit ? "#fef3c7" : "#f1f5f9",
                        padding: 6,
                        borderRadius: 6,
                        marginRight: 8
                      }}>
                        {hasResponse && isWithinLimit ? (
                          <AntDesign name="check" size={14} color="#16A34A" />
                        ) : hasResponse && !isWithinLimit ? (
                          <AntDesign name="exclamation" size={14} color="#F59E0B" />
                        ) : (
                          <AntDesign name="clockcircle" size={14} color="#9CA3AF" />
                        )}
                      </View>
                      <Text style={{
                        fontSize: 13,
                        color: hasResponse && isWithinLimit ? "#16A34A" :
                               hasResponse && !isWithinLimit ? "#F59E0B" : "#9CA3AF",
                        fontWeight: "600"
                      }}>
                        {hasResponse && isWithinLimit ? "Ready to submit" :
                         hasResponse && !isWithinLimit ? "Word limit exceeded" :
                         "Waiting for your response"}
                      </Text>
                    </View>

                    {wordCount > 0 && wordCount < 50 && (
                      <View style={{
                        backgroundColor: "#fef3c7",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6
                      }}>
                        <Text style={{
                          fontSize: 11,
                          color: "#F59E0B",
                          fontWeight: "600"
                        }}>
                          {50 - wordCount} more words needed
                        </Text>
                      </View>
                    )}
                  </View>
                </Surface>
              </MotiView>

                            {/* Navigation Buttons */}
              <MotiView
                from={{ opacity: 0, translateY: 8, scale: 0.95 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                transition={{ type: "timing", duration: 420, delay: 300 }}
              >
                <Surface style={{
                  padding: 20,
                  borderRadius: 16,
                  marginTop: 24,
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                  backgroundColor: "#ffffff"
                }}>
                  <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    {currentScenarioIndex > 0 && (
                      <Button
                        mode="outlined"
                        onPress={handlePreviousScenario}
                        style={{
                          flex: 1,
                          marginRight: 12,
                          borderRadius: 12,
                          borderColor: "#D1D5DB",
                          borderWidth: 2,
                          backgroundColor: "#ffffff"
                        }}
                        contentStyle={{ height: 52 }}
                        labelStyle={{ color: "#6B7280", fontWeight: "600", fontSize: 15 }}
                        icon={() => <AntDesign name="left" size={18} color="#6B7280" />}
                      >
                        Previous
                      </Button>
                    )}

                    <Button
                      mode="contained"
                      onPress={currentScenarioIndex < totalScenarios - 1 ? handleNextScenario : handleCompleteSkillAssessment}
                      loading={submitting}
                      disabled={!hasResponse || !isWithinLimit || submitting}
                      style={{
                        flex: currentScenarioIndex > 0 ? 1 : 1,
                        backgroundColor: hasResponse && isWithinLimit ? "#10B981" : "#F3F4F6",
                        borderRadius: 12,
                        shadowColor: hasResponse && isWithinLimit ? "#10B981" : "#000",
                        shadowOpacity: hasResponse && isWithinLimit ? 0.3 : 0.04,
                        shadowRadius: 8,
                        elevation: hasResponse && isWithinLimit ? 4 : 1
                      }}
                      contentStyle={{ height: 52 }}
                      labelStyle={{
                        color: hasResponse && isWithinLimit ? "#ffffff" : "#9CA3AF",
                        fontWeight: "700",
                        fontSize: 15
                      }}
                      icon={submitting ? undefined : () =>
                        <AntDesign
                          name={currentScenarioIndex < totalScenarios - 1 ? "right" : "check"}
                          size={16}
                          color={hasResponse && isWithinLimit ? "#ffffff" : "#9CA3AF"}
                        />
                      }
                    >
                      {submitting ? "Submitting..." :
                       currentScenarioIndex < totalScenarios - 1 ? "Next Scenario" : "Submit Assessment"}
                    </Button>
                  </View>

                  {/* Progress Indicator */}
                  <View style={{
                    marginTop: 12,
                    alignItems: "center"
                  }}>
                    <Text style={{
                      fontSize: 11,
                      color: "#9CA3AF",
                      fontWeight: "500"
                    }}>
                      {currentScenarioIndex + 1} of {totalScenarios} scenarios
                    </Text>
                    <View style={{
                      flexDirection: "row",
                      marginTop: 6,
                      alignItems: "center"
                    }}>
                      {Array.from({ length: totalScenarios || 3 }, (_, i) => (
                        <View
                          key={i}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: i <= currentScenarioIndex ? "#10B981" : "#E5E7EB",
                            marginHorizontal: 2
                          }}
                        />
                      ))}
                    </View>
                  </View>
                </Surface>
              </MotiView>
            </>
          ) : (
            <Surface style={{ 
              padding: 16, 
              borderRadius: 14,
              marginBottom: 16,
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2
            }}>
              <Text style={{ fontSize: 16, color: BRAND, marginBottom: 12, textAlign: "center" }}>
                Loading Scenarios...
              </Text>
              <Text style={{ fontSize: 14, color: "#374151", textAlign: "center", marginBottom: 16 }}>
                Preparing your assessment questions.
              </Text>
              
              <Button
                mode="contained"
                onPress={handleBackToDashboard}
                style={{
                  backgroundColor: BRAND,
                  borderRadius: 10
                }}
                contentStyle={{ height: 44 }}
                labelStyle={{ fontWeight: "600", fontSize: 14 }}
              >
                Back to Dashboard
              </Button>
            </Surface>
          )}
        </ScrollView>

        {/* Skill Completion Modal */}
        <Portal>
          <Modal
            visible={showSkillCompleteModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {}}
          >
            <View style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 20
            }}>
              <View style={{
                backgroundColor: "#ffffff",
                borderRadius: 16,
                padding: 20,
                width: "100%",
                maxWidth: 360,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 16
              }}>
                <View style={{ alignItems: "center", marginBottom: 20 }}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>🎉</Text>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a", textAlign: "center" }}>
                    Assessment Complete!
                  </Text>
                  <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginTop: 6 }}>
                    You completed <Text style={{ fontWeight: "600", color: BRAND }}>{completedSkillName}</Text> assessment!
              </Text>
                </View>

                <Text style={{ fontSize: 14, color: "#374151", textAlign: "center", marginBottom: 20, lineHeight: 20 }}>
                  Great job! What would you like to do next?
              </Text>

                <View style={{ gap: 10 }}>
              <Button
                mode="contained"
                onPress={handleSeeResults}
                style={{ 
                  backgroundColor: BRAND, 
                      borderRadius: 10,
                      height: 44
                }}
                    contentStyle={{ height: 44 }}
                    labelStyle={{ fontWeight: "600", fontSize: 15 }}
              >
                See Results Now
              </Button>
              <Button
                mode="outlined"
                onPress={handleContinueToNextSkill}
                loading={submitting}
                    disabled={submitting}
                style={{ 
                  borderColor: BRAND,
                      borderWidth: 2,
                      borderRadius: 10,
                      height: 44
                }}
                    contentStyle={{ height: 44 }}
                    labelStyle={{ color: BRAND, fontWeight: "600", fontSize: 15 }}
              >
                Continue to Next Skill
              </Button>
                </View>
              </View>
            </View>
          </Modal>
        </Portal>

        {/* AI Generation Loader */}
        <AIGenerationLoader
          visible={showAILoader}
          progress={aiProgress}
          onComplete={() => setShowAILoader(false)}
        />
      </SafeAreaView>
    );
  }

  // Show completion screen
  if (currentView === 'complete') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
        <StatusBar style="light" />

        {/* Hero header */}
        <View style={{ minHeight: 200, position: "relative" }}>
          <LinearGradient colors={["#0A66C2", "#0E75D1", "#1285E0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0 }} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start", paddingHorizontal: 18, paddingTop: 10 }}>
            <Image source={logoSrc} style={{ width: 56, height: 56, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10 }} resizeMode="contain" />
            <Text style={{ marginLeft: 12, color: "#ffffff", fontSize: 22, fontWeight: "900", letterSpacing: 0.8, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>{APP_NAME}</Text>
          </View>
          <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 18, paddingBottom: 20 }}>
            <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 480 }}>
              <Text style={{ fontSize: 24, fontWeight: "900", color: "#ffffff" }}>All Assessments Complete!</Text>
              <Text style={{ marginTop: 8, color: "#E6F2FF", fontSize: 15 }}>🎉 Congratulations!</Text>
            </MotiView>
          </View>
        </View>

        {/* Content card */}
        <View style={{ flex: 1, marginTop: -24 }}>
          <View style={{ flex: 1, backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 24, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100, maxWidth: 560, width: '100%', alignSelf: 'center' }} showsVerticalScrollIndicator={false}>

              <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 420, delay: 100 }}>
                <Surface style={{
                  padding: 24,
                  borderRadius: 16,
                  marginBottom: 20,
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                  alignItems: "center"
                }}>
                  <Text style={{ fontSize: 48, marginBottom: 16 }}>🏆</Text>
                  <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a", textAlign: "center", marginBottom: 8 }}>
                    Excellent Work!
                  </Text>
                  <Text style={{ fontSize: 16, color: "#64748b", textAlign: "center", lineHeight: 22 }}>
                    You have successfully completed all skill assessments. Your results and personalized recommendations are now available.
                  </Text>
                </Surface>
              </MotiView>

              <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 420, delay: 200 }}>
                <Surface style={{
                  padding: 20,
                  borderRadius: 16,
                  marginBottom: 20,
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2
                }}>
                  <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a", marginBottom: 16 }}>
                    📊 What Happens Next?
                  </Text>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: "#374151", lineHeight: 20 }}>
                      • View detailed results for each skill you assessed
                    </Text>
                  </View>
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: "#374151", lineHeight: 20 }}>
                      • Get personalized recommendations for improvement
                    </Text>
                  </View>
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: "#374151", lineHeight: 20 }}>
                      • Track your progress over time
          </Text>
                  </View>
                  <View style={{ marginBottom: 0 }}>
                    <Text style={{ fontSize: 14, color: "#374151", lineHeight: 20 }}>
                      • Set goals for your next skill development phase
          </Text>
                  </View>
                </Surface>
              </MotiView>

            </ScrollView>

            {/* Sticky footer CTA */}
            <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 34, zIndex: 1000, backgroundColor: "#ffffff" }}>
              <LinearGradient colors={["#0A66C2", "#0E75D1", "#1285E0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0, opacity: 0.1 }} />
          <Button
            mode="contained"
            onPress={handleBackToDashboard}
                contentStyle={{ height: 56 }}
                style={{
                  borderRadius: 28,
                  backgroundColor: BRAND,
                  shadowColor: BRAND,
                  shadowOpacity: 0.35,
                  shadowRadius: 14
                }}
                labelStyle={{ fontWeight: "800", letterSpacing: 0.3 }}
          >
            Back to Dashboard
          </Button>
            </View>
          </View>
        </View>

        {/* AI Generation Loader for completion screen */}
        <AIGenerationLoader
          visible={showAILoader}
          progress={aiProgress}
          onComplete={() => setShowAILoader(false)}
        />
      </SafeAreaView>
    );
  }

  // Default fallback
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, color: BRAND }}>
          Assessment Screen
        </Text>
        <Button
          mode="contained"
          onPress={handleBackToDashboard}
          style={{ backgroundColor: BRAND, marginTop: 20 }}
        >
          Back to Dashboard
        </Button>

        {/* AI Generation Loader for default fallback */}
        <AIGenerationLoader
          visible={showAILoader}
          progress={aiProgress}
          onComplete={() => setShowAILoader(false)}
        />
      </View>
    </SafeAreaView>
  );
}
