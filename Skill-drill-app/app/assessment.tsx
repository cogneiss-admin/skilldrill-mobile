// @ts-nocheck
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button, Surface, ProgressBar, Portal, Dialog } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useResponsive } from "../utils/responsive";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { useToast } from "../hooks/useToast";

const BRAND = "#0A66C2";

export default function AssessmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const responsive = useResponsive();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Assessment session state
  const [sessionId, setSessionId] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [totalSkills, setTotalSkills] = useState(0);
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentView, setCurrentView] = useState('start'); // 'start', 'scenario', 'skill-complete', 'complete'
  
  // Scenario state management
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [userResponses, setUserResponses] = useState({});
  const [currentResponse, setCurrentResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Modal state
  const [showSkillCompleteModal, setShowSkillCompleteModal] = useState(false);
  const [completedSkillName, setCompletedSkillName] = useState("");

  // Parse skills safely
  useEffect(() => {
    try {
      console.log('🎯 Assessment screen initializing...');
      console.log('📊 Raw params:', params);
      console.log('📊 Raw selectedSkills param:', params.selectedSkills);
      
      if (params.selectedSkills) {
        const parsed = JSON.parse(params.selectedSkills);
        console.log('📊 Parsed skills:', parsed);
        console.log('📊 Parsed skills type:', typeof parsed);
        console.log('📊 Is array?', Array.isArray(parsed));
        console.log('📊 Skills length:', parsed?.length);
        
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
          setSelectedSkills(validSkills);
          setTotalSkills(validSkills.length);
        } else {
          console.error('❌ Parsed skills is not an array:', parsed);
          setSelectedSkills([]);
          setError('Invalid skills format - expected array');
        }
      } else {
        console.log('❌ No skills provided');
        setSelectedSkills([]);
        setError('No skills selected for assessment');
      }
    } catch (error) {
      console.error('❌ Error parsing skills:', error);
      setSelectedSkills([]);
      setError('Invalid skills data format');
    } finally {
      setLoading(false);
    }
  }, [params.selectedSkills]);

  // Initialize assessment session
  const initializeAssessment = async () => {
    try {
      setLoading(true);
      console.log('🚀 Starting assessment with skills:', selectedSkills);
      
      if (!selectedSkills || selectedSkills.length === 0) {
        setError('No skills selected for assessment');
        return;
      }

      // Log the exact data being sent
      const requestData = {
        skillIds: selectedSkills
      };
      console.log('📤 Sending request data:', JSON.stringify(requestData, null, 2));

      const response = await apiService.post('/assessment/session/start', requestData);

      console.log('✅ Assessment response:', response);

      if (response.success) {
        console.log('✅ Assessment started:', response.data);
        console.log('📊 Assessment data structure:', JSON.stringify(response.data, null, 2));
        console.log('📊 Current assessment:', response.data.currentAssessment);
        console.log('📊 Assessment template:', response.data.currentAssessment?.template);
        console.log('📊 Prompts:', response.data.currentAssessment?.template?.prompts);
        console.log('📊 Number of prompts:', response.data.currentAssessment?.template?.prompts?.length || 0);
        
        setSessionId(response.data.sessionId);
        setCurrentSkillIndex(response.data.currentSkillIndex);
        setTotalSkills(response.data.totalSkills);
        setCurrentAssessment(response.data.currentAssessment);
        setCurrentView('scenario');
      } else {
        console.error('❌ Assessment failed:', response.message);
        setError(response.message || 'Failed to start assessment');
      }
    } catch (error) {
      console.error('❌ Assessment error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        data: error.data
      });
      
      // Show more detailed error message
      let errorMessage = 'Failed to start assessment';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle start assessment
  const handleStartAssessment = () => {
    if (selectedSkills && selectedSkills.length > 0) {
      initializeAssessment();
    } else {
      setError('No skills selected');
    }
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    router.replace('/dashboard');
  };

  // Handle next scenario
  const handleNextScenario = () => {
    const prompts = currentAssessment?.template?.prompts || [];
    
    // Save current response
    if (currentResponse.trim()) {
      setUserResponses(prev => ({
        ...prev,
        [currentScenarioIndex]: currentResponse.trim()
      }));
    }

    if (currentScenarioIndex < prompts.length - 1) {
      // Move to next scenario
      setCurrentScenarioIndex(prev => prev + 1);
      setCurrentResponse(userResponses[currentScenarioIndex + 1] || "");
    } else {
      // Complete current skill assessment
      handleCompleteSkillAssessment();
    }
  };

  // Handle previous scenario
  const handlePreviousScenario = () => {
    // Save current response
    if (currentResponse.trim()) {
      setUserResponses(prev => ({
        ...prev,
        [currentScenarioIndex]: currentResponse.trim()
      }));
    }

    if (currentScenarioIndex > 0) {
      setCurrentScenarioIndex(prev => prev - 1);
      setCurrentResponse(userResponses[currentScenarioIndex - 1] || "");
    }
  };

  // Handle complete skill assessment
  const handleCompleteSkillAssessment = async () => {
    try {
      setSubmitting(true);
      
      // Save final response
      if (currentResponse.trim()) {
        setUserResponses(prev => ({
          ...prev,
          [currentScenarioIndex]: currentResponse.trim()
        }));
      }

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
      
      // Submit responses to backend
      const response = await apiService.post('/assessment/response/bulk', {
        assessmentId: currentAssessment.id,
        responses: Object.entries(allResponses).map(([index, response]) => ({
          promptId: prompts[parseInt(index)].id,
          response: response
        }))
      });

      if (response.success) {
        console.log('✅ Skill assessment completed:', response.data);
        
        // Show skill completion modal
        setCompletedSkillName(currentAssessment.skill?.skill_name || "Skill");
        setShowSkillCompleteModal(true);
      } else {
        throw new Error(response.message || 'Failed to submit assessment');
      }
      
    } catch (error) {
      console.error('❌ Submit assessment error:', error);
      Alert.alert("Error", "Failed to submit assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle see results now
  const handleSeeResults = () => {
    setShowSkillCompleteModal(false);
    // Navigate to results screen
    router.push({
      pathname: '/assessment-results',
      params: { 
        assessmentId: currentAssessment.id,
        skillName: currentAssessment.skill?.skill_name
      }
    });
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
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 18, color: BRAND, marginBottom: 16 }}>
            Loading Assessment...
          </Text>
          <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center" }}>
            Preparing your assessment
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
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
          <Button
            mode="contained"
            onPress={handleBackToDashboard}
            style={{ backgroundColor: BRAND }}
          >
            Back to Dashboard
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Show start screen
  if (currentView === 'start') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <StatusBar style="dark" />
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingHorizontal: 20, 
            paddingVertical: 20 
          }}
        >
          <Surface style={{ 
            padding: 20, 
            borderRadius: 12,
            marginBottom: 20
          }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "#0f172a", marginBottom: 12 }}>
              Assessment Ready
            </Text>
            <Text style={{ fontSize: 16, color: BRAND, marginBottom: 20 }}>
              Scenario-based Assessment
            </Text>
            
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, color: "#374151", marginBottom: 8 }}>
                Selected Skills: {selectedSkills.length}
              </Text>
              <Text style={{ fontSize: 14, color: "#374151", marginBottom: 8 }}>
                Duration: 60 minutes
              </Text>
              <Text style={{ fontSize: 14, color: "#374151" }}>
                Type: Scenario-based
              </Text>
            </View>
            
            <Button
              mode="contained"
              onPress={handleStartAssessment}
              loading={loading}
              style={{ backgroundColor: BRAND }}
            >
              Begin Assessment
            </Button>
          </Surface>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show scenario screen
  if (currentView === 'scenario') {
    const prompts = currentAssessment?.template?.prompts || [];
    const currentPrompt = prompts[currentScenarioIndex];
    const totalScenarios = prompts.length;
    const progress = (currentScenarioIndex + 1) / totalScenarios;
    const hasResponse = currentResponse.trim().length >= 50;
    const wordCount = currentResponse.trim().split(/\s+/).filter(word => word.length > 0).length;
    const isWithinLimit = wordCount <= 100;
    
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <StatusBar style="dark" />
        
        {/* Header with Progress */}
        <Surface style={{ 
          paddingHorizontal: 20, 
          paddingVertical: 16,
          elevation: 2
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#6B7280" }}>
              Skill {currentSkillIndex + 1} of {totalSkills} • Scenario {currentScenarioIndex + 1} of {totalScenarios}
            </Text>
            <Text style={{ fontSize: 14, color: "#6B7280" }}>
              {Math.round(progress * 100)}% Complete
            </Text>
          </View>
          <ProgressBar 
            progress={progress} 
            color={BRAND} 
            style={{ height: 4, borderRadius: 2 }}
          />
        </Surface>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingHorizontal: 20, 
            paddingVertical: 20 
          }}
        >
          {currentAssessment && currentPrompt ? (
            <>
              {/* Scenario Header */}
              <Surface style={{ 
                padding: 20, 
                borderRadius: 12,
                marginBottom: 20
              }}>
                <Text style={{ fontSize: 20, fontWeight: "bold", color: "#0f172a", marginBottom: 12 }}>
                  {currentAssessment.skill?.skill_name || "Assessment"}
                </Text>
                <Text style={{ fontSize: 16, color: BRAND, marginBottom: 16 }}>
                  Scenario {currentScenarioIndex + 1}
                </Text>
                
                <Text style={{ fontSize: 16, color: "#374151", lineHeight: 24, marginBottom: 16 }}>
                  {currentPrompt?.prompt_text || currentPrompt?.instruction || "Loading scenario..."}
                </Text>
              </Surface>

              {/* Response Section */}
              <Surface style={{ 
                padding: 20, 
                borderRadius: 12,
                marginBottom: 20
              }}>
                <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a", marginBottom: 12 }}>
                  Your Response
                </Text>
                
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: isWithinLimit ? "#D1D5DB" : "#DC2626",
                    borderRadius: 8,
                    padding: 16,
                    minHeight: 200,
                    backgroundColor: "#F9FAFB",
                    fontSize: 16,
                    color: "#374151",
                    textAlignVertical: "top"
                  }}
                  multiline
                  placeholder="Share your solution and approach..."
                  value={currentResponse}
                  onChangeText={setCurrentResponse}
                  maxLength={500}
                />
                
                <View style={{ 
                  flexDirection: "row", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginTop: 12
                }}>
                  <Text style={{ fontSize: 14, color: "#6B7280" }}>
                    {wordCount} / 100 words
                  </Text>
                  <Text style={{ fontSize: 14, color: hasResponse && isWithinLimit ? "#16A34A" : "#9CA3AF" }}>
                    {hasResponse && isWithinLimit ? "✓ Response ready" : "50-100 words required"}
                  </Text>
                </View>
              </Surface>

              {/* Navigation Buttons */}
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                {currentScenarioIndex > 0 && (
                  <Button
                    mode="outlined"
                    onPress={handlePreviousScenario}
                    style={{ flex: 1, marginRight: 8 }}
                    labelStyle={{ color: BRAND }}
                  >
                    Previous
                  </Button>
                )}
                
                <Button
                  mode="contained"
                  onPress={handleNextScenario}
                  loading={submitting}
                  disabled={!hasResponse || !isWithinLimit || submitting}
                  style={{ 
                    flex: 1, 
                    backgroundColor: BRAND,
                    marginLeft: currentScenarioIndex > 0 ? 8 : 0
                  }}
                  labelStyle={{ color: "#ffffff" }}
                >
                  {submitting ? "Submitting..." : 
                   currentScenarioIndex < totalScenarios - 1 ? "Next Scenario" : "Submit Assessment"}
                </Button>
              </View>
            </>
          ) : (
            <Surface style={{ 
              padding: 20, 
              borderRadius: 12,
              marginBottom: 20
            }}>
              <Text style={{ fontSize: 18, color: BRAND, marginBottom: 16 }}>
                Loading Scenarios...
              </Text>
              <Text style={{ fontSize: 16, color: "#374151", marginBottom: 20 }}>
                Preparing your assessment questions.
              </Text>
              
              <Button
                mode="contained"
                onPress={handleBackToDashboard}
                style={{ backgroundColor: BRAND }}
              >
                Back to Dashboard
              </Button>
            </Surface>
          )}
        </ScrollView>

        {/* Skill Completion Modal */}
        <Portal>
          <Dialog
            visible={showSkillCompleteModal}
            dismissable={false}
            style={{ backgroundColor: "#ffffff", borderRadius: 12 }}
          >
            <Dialog.Title style={{ textAlign: "center", color: "#16A34A" }}>
              🎉 Assessment Complete!
            </Dialog.Title>
            <Dialog.Content>
              <Text style={{ fontSize: 16, textAlign: "center", marginBottom: 20 }}>
                You completed <Text style={{ fontWeight: "bold" }}>{completedSkillName}</Text> assessment!
              </Text>
              <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 20 }}>
                What would you like to do next?
              </Text>
            </Dialog.Content>
            <Dialog.Actions style={{ flexDirection: "column", paddingHorizontal: 20, paddingBottom: 20 }}>
              <Button
                mode="contained"
                onPress={handleSeeResults}
                style={{ 
                  backgroundColor: BRAND, 
                  marginBottom: 12,
                  width: "100%"
                }}
              >
                See Results Now
              </Button>
              <Button
                mode="outlined"
                onPress={handleContinueToNextSkill}
                loading={submitting}
                style={{ 
                  borderColor: BRAND,
                  width: "100%"
                }}
                labelStyle={{ color: BRAND }}
              >
                Continue to Next Skill
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    );
  }

  // Show completion screen
  if (currentView === 'complete') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 18, color: "#16A34A", marginBottom: 16 }}>
            All Assessments Complete!
          </Text>
          <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 24 }}>
            You have successfully completed all skill assessments.
          </Text>
          <Button
            mode="contained"
            onPress={handleBackToDashboard}
            style={{ backgroundColor: BRAND }}
          >
            Back to Dashboard
          </Button>
        </View>
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
      </View>
    </SafeAreaView>
  );
}
