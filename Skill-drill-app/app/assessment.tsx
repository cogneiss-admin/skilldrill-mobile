// @ts-nocheck
import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { useResponsive } from "../utils/responsive";
import { useAuth } from "../hooks/useAuth";

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";

export default function AssessmentScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  // Placeholder assessment questions
  const questions = [
    {
      id: 1,
      question: "How would you rate your communication skills?",
      options: [
        { value: 1, label: "Beginner" },
        { value: 2, label: "Novice" },
        { value: 3, label: "Intermediate" },
        { value: 4, label: "Advanced" },
        { value: 5, label: "Expert" }
      ]
    },
    {
      id: 2,
      question: "How comfortable are you with time management?",
      options: [
        { value: 1, label: "Not comfortable" },
        { value: 2, label: "Somewhat comfortable" },
        { value: 3, label: "Comfortable" },
        { value: 4, label: "Very comfortable" },
        { value: 5, label: "Extremely comfortable" }
      ]
    }
  ];

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log('📊 Submitting assessment answers:', answers);
      
      // TODO: Submit answers to backend
      // const response = await apiService.post('/user/assessment', { answers });
      
      // For now, show success message
      alert('Assessment completed! Your results will be available soon.');
      router.replace('/dashboard');
      
    } catch (error) {
      console.error('❌ Assessment submission error:', error);
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentQ = questions[currentQuestion];
  const hasAnswered = answers[currentQ?.id];
  const isLastQuestion = currentQuestion === questions.length - 1;

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
          Question {currentQuestion + 1} of {questions.length}
        </Text>
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
            width: `${((currentQuestion + 1) / questions.length) * 100}%` 
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
              {currentQ.question}
            </Text>

            {/* Answer Options */}
            {currentQ.options.map((option, index) => (
              <Pressable
                key={option.value}
                onPress={() => handleAnswer(currentQ.id, option.value)}
                style={({ pressed }) => ({
                  paddingVertical: responsive.padding.md,
                  paddingHorizontal: responsive.padding.lg,
                  backgroundColor: answers[currentQ.id] === option.value ? BRAND : "#ffffff",
                  borderWidth: 2,
                  borderColor: answers[currentQ.id] === option.value ? BRAND : "#E5E7EB",
                  borderRadius: responsive.size(12),
                  marginBottom: responsive.spacing(12),
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                })}
              >
                <Text style={{ 
                  fontSize: responsive.typography.body1, 
                  fontWeight: "600",
                  color: answers[currentQ.id] === option.value ? "#ffffff" : "#0f172a",
                  textAlign: "center"
                }}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
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
