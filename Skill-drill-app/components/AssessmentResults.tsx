import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button, Surface, Chip, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { useResponsive } from '../utils/responsive';

const BRAND = "#0A66C2";

interface AssessmentResult {
  id: string;
  skillName: string;
  skillDescription: string;
  finalScore: number;
  scoreLabel: string;
  stars: number;
  whatThisMeans: string;
  recommendedNextStep: string;
  subSkillScores: Record<string, { score: number; evidence: string }>;
  timeSpent: number;
  completedAt: string;
}

interface AssessmentResultsProps {
  result: AssessmentResult;
  onBackToDashboard: () => void;
  onTakeAnotherAssessment: () => void;
}

export const AssessmentResults: React.FC<AssessmentResultsProps> = ({
  result,
  onBackToDashboard,
  onTakeAnotherAssessment
}) => {
  const router = useRouter();
  const responsive = useResponsive();

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#16A34A'; // Green
    if (score >= 6) return '#F59E0B'; // Yellow
    return '#DC2626'; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Improvement';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar style="dark" />
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingHorizontal: responsive.padding.lg, 
          paddingVertical: responsive.padding.lg 
        }}
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
        >
          <Surface style={{ 
            padding: responsive.padding.lg, 
            borderRadius: responsive.size(16),
            elevation: 2,
            marginBottom: responsive.spacing(20)
          }}>
            <View style={{ alignItems: 'center', marginBottom: responsive.spacing(16) }}>
              <View style={{
                width: responsive.size(80),
                height: responsive.size(80),
                backgroundColor: getScoreColor(result.finalScore),
                borderRadius: responsive.size(40),
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: responsive.spacing(12)
              }}>
                <MaterialCommunityIcons 
                  name="trophy" 
                  size={32} 
                  color="#ffffff" 
                />
              </View>
              
              <Text style={{ 
                fontSize: responsive.typography.h3, 
                fontWeight: "900", 
                color: "#0f172a",
                textAlign: 'center',
                marginBottom: responsive.spacing(4)
              }}>
                Assessment Complete!
              </Text>
              
              <Text style={{ 
                fontSize: responsive.typography.body1, 
                color: "#64748b",
                textAlign: 'center'
              }}>
                {result.skillName}
              </Text>
            </View>

            {/* Score Display */}
            <View style={{ alignItems: 'center', marginBottom: responsive.spacing(20) }}>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginBottom: responsive.spacing(8) 
              }}>
                <Text style={{ 
                  fontSize: responsive.typography.h2, 
                  fontWeight: "900", 
                  color: getScoreColor(result.finalScore),
                  marginRight: responsive.spacing(8)
                }}>
                  {result.finalScore}/10
                </Text>
                <Chip 
                  mode="outlined" 
                  textStyle={{ color: getScoreColor(result.finalScore) }}
                  style={{ borderColor: getScoreColor(result.finalScore) }}
                >
                  {getScoreLabel(result.finalScore)}
                </Chip>
              </View>
              
              {/* Stars */}
              <View style={{ flexDirection: 'row', marginBottom: responsive.spacing(12) }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <MaterialCommunityIcons
                    key={star}
                    name={star <= result.stars ? "star" : "star-outline"}
                    size={24}
                    color={star <= result.stars ? "#F59E0B" : "#D1D5DB"}
                    style={{ marginHorizontal: 2 }}
                  />
                ))}
              </View>
            </View>

            {/* Assessment Details */}
            <View style={{ marginBottom: responsive.spacing(16) }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: responsive.spacing(8) }}>
                <Text style={{ fontSize: responsive.typography.body2, color: "#6B7280" }}>
                  Time Spent:
                </Text>
                <Text style={{ fontSize: responsive.typography.body2, color: "#374151", fontWeight: "600" }}>
                  {formatTime(result.timeSpent)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: responsive.spacing(8) }}>
                <Text style={{ fontSize: responsive.typography.body2, color: "#6B7280" }}>
                  Completed:
                </Text>
                <Text style={{ fontSize: responsive.typography.body2, color: "#374151", fontWeight: "600" }}>
                  {formatDate(result.completedAt)}
                </Text>
              </View>
            </View>
          </Surface>
        </MotiView>

        {/* What This Means */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600, delay: 200 }}
        >
          <Surface style={{ 
            padding: responsive.padding.lg, 
            borderRadius: responsive.size(12),
            elevation: 1,
            marginBottom: responsive.spacing(16)
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsive.spacing(12) }}>
              <MaterialCommunityIcons name="lightbulb" size={20} color={BRAND} />
              <Text style={{ 
                fontSize: responsive.typography.h6, 
                fontWeight: "700", 
                color: "#0f172a",
                marginLeft: responsive.spacing(8)
              }}>
                What This Means
              </Text>
            </View>
            <Text style={{ 
              fontSize: responsive.typography.body2, 
              color: "#374151",
              lineHeight: responsive.typography.body2 * 1.5
            }}>
              {result.whatThisMeans}
            </Text>
          </Surface>
        </MotiView>

        {/* Sub-skill Scores */}
        {result.subSkillScores && Object.keys(result.subSkillScores).length > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600, delay: 400 }}
          >
            <Surface style={{ 
              padding: responsive.padding.lg, 
              borderRadius: responsive.size(12),
              elevation: 1,
              marginBottom: responsive.spacing(16)
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsive.spacing(12) }}>
                <MaterialCommunityIcons name="chart-line" size={20} color={BRAND} />
                <Text style={{ 
                  fontSize: responsive.typography.h6, 
                  fontWeight: "700", 
                  color: "#0f172a",
                  marginLeft: responsive.spacing(8)
                }}>
                  Skill Breakdown
                </Text>
              </View>
              
              {Object.entries(result.subSkillScores).map(([skillName, data], index) => (
                <View key={skillName} style={{ marginBottom: responsive.spacing(12) }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: responsive.spacing(4) }}>
                    <Text style={{ 
                      fontSize: responsive.typography.body2, 
                      color: "#374151",
                      fontWeight: "600"
                    }}>
                      {skillName}
                    </Text>
                    <Text style={{ 
                      fontSize: responsive.typography.body2, 
                      color: getScoreColor(data.score),
                      fontWeight: "600"
                    }}>
                      {data.score}/10
                    </Text>
                  </View>
                  <ProgressBar 
                    progress={data.score / 10} 
                    color={getScoreColor(data.score)}
                    style={{ height: 6, borderRadius: 3 }}
                  />
                </View>
              ))}
            </Surface>
          </MotiView>
        )}

        {/* Recommended Next Steps */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600, delay: 600 }}
        >
          <Surface style={{ 
            padding: responsive.padding.lg, 
            borderRadius: responsive.size(12),
            elevation: 1,
            marginBottom: responsive.spacing(20)
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsive.spacing(12) }}>
              <MaterialCommunityIcons name="target" size={20} color={BRAND} />
              <Text style={{ 
                fontSize: responsive.typography.h6, 
                fontWeight: "700", 
                color: "#0f172a",
                marginLeft: responsive.spacing(8)
              }}>
                Recommended Next Steps
              </Text>
            </View>
            <Text style={{ 
              fontSize: responsive.typography.body2, 
              color: "#374151",
              lineHeight: responsive.typography.body2 * 1.5
            }}>
              {result.recommendedNextStep}
            </Text>
          </Surface>
        </MotiView>

        {/* Action Buttons */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600, delay: 800 }}
        >
          <View style={{ gap: responsive.spacing(12) }}>
            <Button
              mode="contained"
              onPress={onBackToDashboard}
              style={{ backgroundColor: BRAND }}
              contentStyle={{ height: responsive.button.height }}
              labelStyle={{ fontSize: responsive.typography.button, fontWeight: "600" }}
            >
              Back to Dashboard
            </Button>
            
            <Button
              mode="outlined"
              onPress={onTakeAnotherAssessment}
              style={{ borderColor: BRAND }}
              labelStyle={{ color: BRAND }}
              contentStyle={{ height: responsive.button.height }}
            >
              Take Another Assessment
            </Button>
          </View>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
};
