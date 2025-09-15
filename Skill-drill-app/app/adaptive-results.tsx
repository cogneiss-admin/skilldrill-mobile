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

// Style Chip Component
const StyleChip = ({ style }: { style: string }) => {
  return (
    <View style={{
      backgroundColor: '#E3F2FD',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      alignSelf: 'center',
      marginVertical: 16,
      borderWidth: 1,
      borderColor: '#BBDEFB',
    }}>
      <Text style={{
        color: '#1976D2',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
      }}>
        {style}
      </Text>
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
    router.back();
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
        </View>

        {/* Card 2: Identified Style and Personalized Feedback */}
        {(parsedResults.identifiedStyle || parsedResults.improvementFeedback) && (
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
            {/* Identified Style Section */}
            {parsedResults.identifiedStyle && (
              <View style={{ marginBottom: parsedResults.improvementFeedback ? 24 : 0 }}>
                <Text style={{
                  fontSize: 16,
                  color: '#111827',
                  fontWeight: '600',
                  textAlign: 'center',
                  marginBottom: 16,
                }}>
                  Identified Style
                </Text>

                <StyleChip style={parsedResults.identifiedStyle} />
              </View>
            )}

            {/* Personalized Feedback Section */}
            {parsedResults.improvementFeedback && (
              <View>
                <Text style={{
                  fontSize: 16,
                  color: '#111827',
                  fontWeight: '600',
                  textAlign: 'center',
                  marginBottom: 16,
                }}>
                  Personalized Feedback
                </Text>

                <Text style={{
                  fontSize: 15,
                  color: '#4B5563',
                  lineHeight: 24,
                  textAlign: 'center',
                }}>
                  {parsedResults.improvementFeedback}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Card 3: Recommended Next Steps */}
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
          {/* Main Card Header */}
          <Text style={{
            fontSize: 16,
            color: '#111827',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: 20,
          }}>
            Recommended Next Steps
          </Text>

          {/* Sub-Card 1: Flaws Identification */}
          {parsedResults.identifiedFlaws && parsedResults.identifiedFlaws.length > 0 && (
            <View style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}>
              <Text style={{
                fontSize: 15,
                color: '#4B5563',
                lineHeight: 24,
                textAlign: 'center',
                marginBottom: 16,
              }}>
                Currently from the responses given by you, the flaws identified are{' '}
                <Text style={{ fontWeight: '600', color: '#111827' }}>
                  {parsedResults.identifiedFlaws.join(', ')}
                </Text>
                . We recommend to work on improving this in order to grow.
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/dashboard')}
                style={{
                  backgroundColor: '#0A66C2',
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  alignSelf: 'center',
                }}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sub-Card 2: Performance Level */}
          {parsedResults.finalScore && (
            <View style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}>
              <Text style={{
                fontSize: 15,
                color: '#4B5563',
                lineHeight: 24,
                textAlign: 'center',
                marginBottom: 16,
              }}>
                {parsedResults.finalScore >= 7 ? 
                  'Excellent! Your assessment shows Thriving performance. You are demonstrating strong capabilities in this skill area and meeting professional expectations.' :
                  `Your assessment shows Stabilizing performance. But in order to Thrive, we recommend to take these drills to improve your skills and reach the next level.`
                }
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/dashboard')}
                style={{
                  backgroundColor: '#0A66C2',
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  alignSelf: 'center',
                }}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default AdaptiveResultsScreen;