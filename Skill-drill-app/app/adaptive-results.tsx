import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const BRAND = "#0A66C2";

// Golden Star Rating Component
const GoldenStarRating = ({ score }: { score: number }) => {
  // Convert score (0-10) to stars (1-5)
  const convertScoreToStars = (score: number) => {
    if (score >= 9.0) return 5;
    if (score >= 7.0) return 4;
    if (score >= 5.0) return 3;
    if (score >= 3.0) return 2;
    return 1;
  };

  const stars = convertScoreToStars(score);
  
  return (
    <View style={{ alignItems: 'center', marginVertical: 24 }}>
      <Text style={{
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 16,
      }}>
        Your Score
      </Text>
      <View style={{ flexDirection: 'row' }}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Ionicons
            key={index}
            name={index < stars ? "star" : "star-outline"}
            size={32}
            color={index < stars ? "#FFD700" : "#E0E0E0"}
            style={{ marginHorizontal: 2 }}
          />
        ))}
      </View>
    </View>
  );
};


const AdaptiveResultsScreen = () => {
  const { results, skillName } = useLocalSearchParams<{
    results: string;
    skillName: string;
  }>();
  
  const router = useRouter();

  // Parse results
  let parsedResults;
  try {
    parsedResults = JSON.parse(results || '{}');
  } catch (error) {
    console.error('Error parsing results:', error);
    parsedResults = {};
  }

  const handleBack = () => {
    // Navigate to dashboard instead of going back to assessment
    router.push('/dashboard');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <TouchableOpacity
          onPress={handleBack}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: '#111827',
          flex: 1,
          textAlign: 'center',
          marginHorizontal: 16,
        }}>
          Assessment Result
        </Text>
        
        <View style={{ width: 40 }} />
      </View>

      {/* Main Content */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Trophy, Congratulations, and Score */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 24,
          marginBottom: 16,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}>
          {/* Trophy Icon */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#FEF3C7',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}>
            <Ionicons name="trophy" size={40} color="#F59E0B" />
          </View>

          {/* Congratulations Text */}
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#111827',
            textAlign: 'center',
            marginBottom: 12,
          }}>
            Congratulations!
          </Text>

          {/* Completion Text */}
          <Text style={{
            fontSize: 16,
            color: '#6B7280',
            textAlign: 'center',
            marginBottom: 8,
          }}>
            You've completed the assessment
          </Text>

          {/* Golden Star Rating */}
          {parsedResults.finalScore && <GoldenStarRating score={parsedResults.finalScore} />}
          
          {/* Numeric Score Display */}
          {parsedResults.finalScore && (
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <Text style={{
                fontSize: 18,
                color: '#111827',
                fontWeight: '600',
                marginBottom: 4,
              }}>
                Your Score
              </Text>
              <Text style={{
                fontSize: 32,
                color: '#0A66C2',
                fontWeight: 'bold',
              }}>
                {parsedResults.finalScore.toFixed(1)}/10
              </Text>
            </View>
          )}
        </View>

        {/* Card 2: Comprehensive Feedback */}
        {(parsedResults.feedbackGood || parsedResults.feedbackImprove || parsedResults.feedbackSummary) && (
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <Text style={{
              fontSize: 16,
              color: '#111827',
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: 20,
            }}>
              Assessment Feedback
            </Text>

            {/* What You Did Well */}
            {parsedResults.feedbackGood && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  fontSize: 14,
                  color: '#059669',
                  fontWeight: '600',
                  marginBottom: 8,
                }}>
                  ✅ What You Did Well
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#4B5563',
                  lineHeight: 20,
                }}>
                  {parsedResults.feedbackGood}
                </Text>
              </View>
            )}

            {/* Areas for Improvement */}
            {parsedResults.feedbackImprove && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  fontSize: 14,
                  color: '#DC2626',
                  fontWeight: '600',
                  marginBottom: 8,
                }}>
                  🎯 Areas for Improvement
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#4B5563',
                  lineHeight: 20,
                }}>
                  {parsedResults.feedbackImprove}
                </Text>
              </View>
            )}

            {/* Overall Summary */}
            {parsedResults.feedbackSummary && (
              <View>
                <Text style={{
                  fontSize: 14,
                  color: '#1F2937',
                  fontWeight: '600',
                  marginBottom: 8,
                }}>
                  📝 Overall Assessment
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#4B5563',
                  lineHeight: 20,
                }}>
                  {parsedResults.feedbackSummary}
                </Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

export default AdaptiveResultsScreen;