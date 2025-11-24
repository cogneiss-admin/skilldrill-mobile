/**
 * Results Component
 *
 * Unified component for both Assessment Results and Drill Milestone screens.
 * Handles conditional rendering based on type prop.
 *
 * Features:
 * - Full-screen layout for assessments
 * - Modal layout for drill milestones
 * - Trophy icon with celebration
 * - Score display (stars + numeric for assessment, numeric for drill)
 * - Detailed feedback sections (assessment only)
 * - Stats summary (drill milestones only)
 * - Adaptive action buttons
 */

import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import Button from '../../components/Button';
import {
  BRAND,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  GRADIENTS,
} from './Brand';

export interface ResultsProps {
  type: 'assessment' | 'drill';
  visible?: boolean; // For modal mode (drill)
  score?: number; // 0-10 score
  feedbackGood?: string; // Assessment only
  feedbackImprove?: string; // Assessment only
  feedbackSummary?: string; // Assessment only
  stats?: {
    averageScore: number;
    count: number;
  }; // Drill milestones only
  milestone?: number; // 25, 50, 75, or 100 (drill only)
  onAction: () => void; // Primary action button
  actionText?: string; // Custom action button text
  onBack?: () => void; // For assessment results back button
  title?: string; // Optional custom title
  completionText?: string; // Optional completion message
}

const ASSESSMENT_BRAND = "#0A66C2";

// Golden Star Rating Component (Assessment only)
const GoldenStarRating = ({ score }: { score: number }) => {
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

const Results: React.FC<ResultsProps> = ({
  type,
  visible = true,
  score,
  feedbackGood,
  feedbackImprove,
  feedbackSummary,
  stats,
  milestone,
  onAction,
  actionText,
  onBack,
  title,
  completionText,
}) => {
  const isAssessment = type === 'assessment';
  const isDrill = type === 'drill';

  // Get motivational message based on milestone
  const getMotivationalMessage = (percentage: number) => {
    if (percentage === 100) {
      return "You've completed all drills! You're mastering this skill. Keep up the excellent work!";
    } else if (percentage >= 75) {
      return "Almost there! You're doing fantastic. Finish strong!";
    } else if (percentage >= 50) {
      return "You're halfway through! Your progress is impressive. Keep going!";
    } else {
      return "Great start! You're building momentum. Keep practicing!";
    }
  };

  // Determine action button text
  const getActionButtonText = () => {
    if (actionText) return actionText;
    if (isAssessment) return 'Recommended Next Steps';
    if (milestone === 100) return 'Go to Dashboard';
    return 'Continue Practice';
  };

  // Render Assessment Results (Full Screen)
  const renderAssessmentResults = () => (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" />

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
          onPress={onBack || onAction}
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
          {title || 'Assessment Result'}
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* Main Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
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
            {completionText || "You've completed the assessment"}
          </Text>

          {/* Golden Star Rating */}
          {score !== undefined && <GoldenStarRating score={score} />}

          {/* Numeric Score Display */}
          {score !== undefined && (
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
                {score.toFixed(1)}/10
              </Text>
            </View>
          )}
        </View>

        {/* Card 2: Comprehensive Feedback */}
        {(feedbackGood || feedbackImprove || feedbackSummary) && (
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
            {feedbackGood && (
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
                  {feedbackGood}
                </Text>
              </View>
            )}

            {/* Areas for Improvement */}
            {feedbackImprove && (
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
                  {feedbackImprove}
                </Text>
              </View>
            )}

            {/* Overall Summary */}
            {feedbackSummary && (
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
                  {feedbackSummary}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={{
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
      }}>
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.85}
          style={{
            backgroundColor: ASSESSMENT_BRAND,
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#0A66C2',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          <Text style={{
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '600',
            letterSpacing: 0.3,
          }}>
            {getActionButtonText()}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // Render Drill Milestone Modal
  const renderDrillMilestone = () => (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onAction}
    >
      <View style={{
        flex: 1,
        backgroundColor: COLORS.background.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.padding.lg,
      }}>
        <MotiView
          from={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            width: '100%',
            maxWidth: 400,
            borderRadius: BORDER_RADIUS['2xl'],
            overflow: 'hidden',
            ...SHADOWS.xl,
          }}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: SPACING.padding['2xl'],
              alignItems: 'center',
            }}
          >
            {/* Trophy Icon */}
            <MotiView
              from={{ scale: 0, rotate: '-180deg' }}
              animate={{ scale: 1, rotate: '0deg' }}
              transition={{ type: 'spring', delay: 200 }}
              style={{
                width: 100,
                height: 100,
                borderRadius: BORDER_RADIUS.full,
                backgroundColor: COLORS.white,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: SPACING.lg,
              }}
            >
              <Ionicons name="trophy" size={64} color={COLORS.warning} />
            </MotiView>

            {/* Milestone Title */}
            <Text style={{
              ...TYPOGRAPHY.h1,
              fontSize: 28,
              color: COLORS.white,
              textAlign: 'center',
              marginBottom: SPACING.xs,
            }}>
              {milestone === 100 ? '🎉 Congratulations!' : '🎯 Milestone Reached!'}
            </Text>

            <Text style={{
              ...TYPOGRAPHY.subtitle,
              color: COLORS.white,
              opacity: 0.9,
              marginBottom: SPACING.lg,
            }}>
              {milestone}% Complete
            </Text>

            {/* Stats Card */}
            {stats && (
              <View style={{
                flexDirection: 'row',
                backgroundColor: COLORS.white,
                borderRadius: BORDER_RADIUS.xl,
                padding: SPACING.padding.lg,
                marginBottom: SPACING.lg,
                width: '100%',
              }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 32,
                    fontWeight: '800',
                    color: BRAND,
                    marginBottom: SPACING.xs,
                  }}>
                    {stats.averageScore.toFixed(1)}
                  </Text>
                  <Text style={{
                    ...TYPOGRAPHY.caption,
                    color: COLORS.text.tertiary,
                    textAlign: 'center',
                  }}>
                    Average Score
                  </Text>
                </View>

                <View style={{
                  width: 1,
                  backgroundColor: COLORS.border.light,
                  marginHorizontal: SPACING.md,
                }} />

                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 32,
                    fontWeight: '800',
                    color: BRAND,
                    marginBottom: SPACING.xs,
                  }}>
                    {stats.count}
                  </Text>
                  <Text style={{
                    ...TYPOGRAPHY.caption,
                    color: COLORS.text.tertiary,
                    textAlign: 'center',
                  }}>
                    Drills Completed
                  </Text>
                </View>
              </View>
            )}

            {/* Motivational Message */}
            <Text style={{
              ...TYPOGRAPHY.body,
              color: COLORS.white,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: SPACING.lg,
            }}>
              {milestone ? getMotivationalMessage(milestone) : ''}
            </Text>

            {/* Action Button */}
            <Button
              variant="secondary"
              size="large"
              onPress={onAction}
              icon={milestone === 100 ? 'home' : 'arrow-forward'}
              iconPosition="right"
              style={{ backgroundColor: COLORS.white }}
              fullWidth
            >
              {getActionButtonText()}
            </Button>
          </LinearGradient>
        </MotiView>
      </View>
    </Modal>
  );

  // Return appropriate component based on type
  if (isAssessment) {
    return renderAssessmentResults();
  } else {
    return renderDrillMilestone();
  }
};

export default Results;
