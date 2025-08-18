// @ts-nocheck
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useResponsive } from "../utils/responsive";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { useToast } from "../hooks/useToast";

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";

export default function AssessmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const responsive = useResponsive();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Assessment state
  const [sessionId, setSessionId] = useState(null);
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState("");

  // Get selected skills from navigation params
  const selectedSkills = params.selectedSkills ? JSON.parse(params.selectedSkills) : [];

  // Initialize assessment session
  const initializeAssessment = async () => {
    try {
      setInitializing(true);
      setError("");

      if (!selectedSkills || selectedSkills.length === 0) {
        setError("No skills selected for assessment");
        return;
      }

      console.log('🎯 Starting assessment session for skills:', selectedSkills);

      // Start assessment session with selected skills
      const response = await apiService.post('/assessment/session/start', {
        skillIds: selectedSkills
      });

      if (response.success) {
        console.log('✅ Assessment session started:', response.data);
        console.log('📊 Current assessment data:', response.data.currentAssessment);
        setSessionId(response.data.sessionId);
        setCurrentAssessment(response.data.currentAssessment);
        setCurrentQuestion(0);
        setAnswers({});
      } else {
        setError(response.message || 'Failed to start assessment session');
      }
    } catch (error) {
      console.error('❌ Assessment initialization error:', error);
      setError(error.message || 'Failed to initialize assessment');
    } finally {
      setInitializing(false);
    }
  };

  // Load current assessment for session
  const loadCurrentAssessment = async () => {
    if (!sessionId) return;

    try {
      const response = await apiService.get(`/assessment/session/${sessionId}/current`);
      
      if (response.success) {
        if (response.data.completed) {
          // All assessments completed
          showToast('success', 'Assessment Complete', 'All assessments have been completed!');
          router.replace('/dashboard');
          return;
        }
        
        setCurrentAssessment(response.data.currentAssessment);
        setCurrentQuestion(0);
        setAnswers({});
      } else {
        setError(response.message || 'Failed to load current assessment');
      }
    } catch (error) {
      console.error('❌ Load assessment error:', error);
      setError(error.message || 'Failed to load assessment');
    }
  };

  // Initialize on component mount
  useEffect(() => {
    initializeAssessment();
  }, []);

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = async () => {
    if (!currentAssessment) return;

    const currentQ = currentAssessment.template?.prompts?.[currentQuestion];
    if (!currentQ) return;

    if (currentQuestion < (currentAssessment.template?.prompts?.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      await handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!sessionId || !currentAssessment) return;

    try {
      setLoading(true);

      // Format responses for bulk submission
      const formattedResponses = Object.entries(answers).map(([promptId, response]) => ({
        promptId,
        response: typeof response === 'string' ? response : response.toString()
      }));

      console.log('📊 Submitting responses:', formattedResponses);

      // Submit current assessment responses
      const response = await apiService.post('/assessment/response/bulk', {
        assessmentId: currentAssessment.id,
        responses: formattedResponses
      });

      if (response.success) {
        console.log('✅ Assessment responses submitted');
        
        // Move to next assessment in session
        const nextResponse = await apiService.post(`/assessment/session/${sessionId}/next`);
        
        if (nextResponse.success) {
          if (nextResponse.data.completed) {
            // All assessments completed
            showToast('success', 'Assessment Complete', 'All assessments have been completed!');
            router.replace('/dashboard');
          } else {
            // Load next assessment
            setCurrentAssessment(nextResponse.data.assessment);
            setCurrentQuestion(0);
            setAnswers({});
          }
        } else {
          setError(nextResponse.message || 'Failed to continue to next assessment');
        }
      } else {
        setError(response.message || 'Failed to submit assessment responses');
      }
    } catch (error) {
      console.error('❌ Assessment submission error:', error);
      setError(error.message || 'Failed to submit assessment');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (initializing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: responsive.typography.h5, color: BRAND, marginBottom: responsive.spacing(16) }}>
            Initializing Assessment...
          </Text>
          <Text style={{ fontSize: responsive.typography.body2, color: "#64748b", textAlign: "center" }}>
            Preparing your personalized assessment for {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''}
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
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: responsive.padding.lg }}>
          <Text style={{ fontSize: responsive.typography.h5, color: "#DC2626", marginBottom: responsive.spacing(16), textAlign: "center" }}>
            Assessment Error
          </Text>
          <Text style={{ fontSize: responsive.typography.body2, color: "#64748b", textAlign: "center", marginBottom: responsive.spacing(24) }}>
            {error}
          </Text>
          <Button
            mode="contained"
            onPress={() => router.replace('/dashboard')}
            style={{ backgroundColor: BRAND }}
          >
            Return to Dashboard
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Show assessment content
  if (!currentAssessment) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: responsive.typography.h5, color: BRAND }}>
            Loading Assessment...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQ = currentAssessment.template?.prompts?.[currentQuestion];
  const hasAnswered = currentQ ? (
    currentQ.prompt_type === 'MULTIPLE_CHOICE' ? 
      answers[currentQ.id] !== undefined :
      (answers[currentQ.id] && answers[currentQ.id].trim().length > 0)
  ) : false;
  const isLastQuestion = currentQuestion === (currentAssessment.template?.prompts?.length || 0) - 1;
  const totalQuestions = currentAssessment.template?.prompts?.length || 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={{ 
        paddingHorizontal: responsive.padding.lg, 
        paddingTop: responsive.padding.sm, 
        paddingBottom: responsive.padding.md, 
        borderBottomWidth: 1, 
        borderBottomColor: "#E5E7EB" 
      }}>
        <Text style={{ 
          fontSize: responsive.typography.h4, 
          fontWeight: "900", 
          color: BRAND, 
          textAlign: "center" 
        }}>Skill Assessment</Text>
        <Text style={{ 
          marginTop: responsive.spacing(4), 
          fontSize: responsive.typography.body2, 
          color: "#64748b", 
          textAlign: "center" 
        }}>
          Question {currentQuestion + 1} of {totalQuestions}
        </Text>
        {currentAssessment.skill && (
          <Text style={{ 
            marginTop: responsive.spacing(4), 
            fontSize: responsive.typography.body2, 
            color: BRAND, 
            textAlign: "center",
            fontWeight: "600"
          }}>
            Assessing: {currentAssessment.skill.name}
          </Text>
        )}
      </View>

      {/* Progress Bar */}
      <View style={{ 
        paddingHorizontal: responsive.padding.lg, 
        paddingVertical: responsive.padding.sm 
      }}>
        <View style={{ 
          height: 4, 
          backgroundColor: "#E5E7EB", 
          borderRadius: 2 
        }}>
          <View style={{ 
            height: 4, 
            backgroundColor: BRAND, 
            borderRadius: 2, 
            width: `${((currentQuestion + 1) / totalQuestions) * 100}%` 
          }} />
        </View>
      </View>

      {/* Question Content */}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingHorizontal: responsive.padding.lg, 
          paddingVertical: responsive.padding.lg 
        }}
      >
        {currentQ && (
          <View>
            <Text style={{ 
              fontSize: responsive.typography.h5, 
              fontWeight: "700", 
              color: "#0f172a", 
              marginBottom: responsive.spacing(20),
              lineHeight: responsive.typography.h5 * 1.4
            }}>
              {currentQ.instruction || currentQ.prompt_text || currentQ.question}
            </Text>

            {/* Answer Options - Only for multiple choice questions */}
            {currentQ.prompt_type === 'MULTIPLE_CHOICE' && currentQ.options && currentQ.options.map((option, index) => (
              <Pressable
                key={option.value || index}
                onPress={() => handleAnswer(currentQ.id, option.value || index + 1)}
                style={({ pressed }) => ({
                  paddingVertical: responsive.padding.md,
                  paddingHorizontal: responsive.padding.lg,
                  backgroundColor: answers[currentQ.id] === (option.value || index + 1) ? BRAND : "#ffffff",
                  borderWidth: 2,
                  borderColor: answers[currentQ.id] === (option.value || index + 1) ? BRAND : "#E5E7EB",
                  borderRadius: responsive.size(12),
                  marginBottom: responsive.spacing(12),
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                })}
              >
                <Text style={{ 
                  fontSize: responsive.typography.body1, 
                  fontWeight: "600",
                  color: answers[currentQ.id] === (option.value || index + 1) ? "#ffffff" : "#0f172a",
                  textAlign: "center"
                }}>
                  {option.label || option.text}
                </Text>
              </Pressable>
            ))}

            {/* For text-based questions */}
            {(currentQ.prompt_type === 'TEXT' || currentQ.prompt_type === 'SCENARIO') && (
              <View style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: responsive.size(12),
                padding: responsive.padding.md,
                backgroundColor: "#F9FAFB"
              }}>
                <Text style={{ 
                  fontSize: responsive.typography.body2, 
                  color: "#64748b",
                  fontStyle: "italic",
                  marginBottom: responsive.spacing(8)
                }}>
                  Please provide your detailed response below:
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#D1D5DB",
                    borderRadius: responsive.size(8),
                    padding: responsive.padding.md,
                    minHeight: 120,
                    backgroundColor: "#ffffff",
                    fontSize: responsive.typography.body2,
                    color: "#374151",
                    textAlignVertical: "top"
                  }}
                  multiline
                  placeholder="Type your response here..."
                  value={answers[currentQ.id] || ""}
                  onChangeText={(text) => handleAnswer(currentQ.id, text)}
                  maxLength={currentQ.word_limit ? currentQ.word_limit * 10 : 1000} // Rough estimate for word limit
                />
                <Text style={{ 
                  fontSize: responsive.typography.body2, 
                  color: "#64748b",
                  marginTop: responsive.spacing(4),
                  textAlign: "right"
                }}>
                  {currentQ.word_limit && `${(answers[currentQ.id] || "").split(/\s+/).filter(word => word.length > 0).length}/${currentQ.word_limit} words`}
                </Text>
              </View>
            )}

            {/* For audio questions */}
            {currentQ.prompt_type === 'AUDIO' && (
              <View style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: responsive.size(12),
                padding: responsive.padding.md,
                backgroundColor: "#F0F9FF",
                alignItems: "center"
              }}>
                <Text style={{ 
                  fontSize: responsive.typography.body2, 
                  color: "#64748b",
                  textAlign: "center",
                  marginBottom: responsive.spacing(8)
                }}>
                  🎤 Audio Response Required
                </Text>
                <Text style={{ 
                  fontSize: responsive.typography.body2, 
                  color: "#374151",
                  textAlign: "center"
                }}>
                  {currentQ.audio_duration_limit && `Duration limit: ${currentQ.audio_duration_limit} seconds`}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={{ 
        paddingHorizontal: responsive.padding.lg, 
        paddingVertical: responsive.padding.lg,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB"
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {currentQuestion > 0 && (
            <Button
              mode="outlined"
              onPress={handlePrevious}
              style={{ 
                flex: 1, 
                marginRight: responsive.spacing(8),
                borderColor: BRAND
              }}
              labelStyle={{ color: BRAND }}
            >
              Previous
            </Button>
          )}
          
          <Button
            mode="contained"
            onPress={handleNext}
            loading={loading}
            disabled={!hasAnswered || loading}
            style={{ 
              flex: 1, 
              backgroundColor: BRAND,
              marginLeft: currentQuestion > 0 ? responsive.spacing(8) : 0
            }}
            labelStyle={{ color: "#ffffff" }}
          >
            {loading ? "Submitting..." : isLastQuestion ? "Submit" : "Next"}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
