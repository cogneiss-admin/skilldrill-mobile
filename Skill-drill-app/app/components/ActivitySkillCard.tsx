import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BRAND, GRADIENTS, BORDER_RADIUS, SHADOWS, SPACING, COLORS, TYPOGRAPHY } from '../components/Brand';
import { useResponsive } from '../../utils/responsive';
import { 
  AssessmentStatus, 
  AssessmentActionType,
  ActivityCardProgressData 
} from '../../types/assessment';
import { 
  calculateAssessmentProgress,
  determineAssessmentAction,
  getActionButtonText,
  getAssessmentStatusColor,
  getAssessmentStatusLabel,
  safeNumber,
  safePercentage
} from '../../utils/assessmentUtils';

interface ActivitySkillCardProps {
  id: string;
  skillName: string;
  assessmentStatus: AssessmentStatus;
  aiInsights: string;
  aiTag: string;
  score?: number;
  index: number;
  skillId?: string;
  // Progress data from backend session
  progressData?: ActivityCardProgressData;
  // Assessment template status
  templateExists?: boolean;
  isGenerating?: boolean;
  onGenerateAssessment?: () => void;
  onViewFeedback?: () => void;
  onDeleteAssessment?: () => void; // Testing: Delete assessment progress
}

const getScoreColor = (score: number): string => {
  if (score >= 9) return '#10B981';
  if (score >= 8) return '#059669';
  if (score >= 7) return '#0D9488';
  if (score >= 6) return '#F59E0B';
  return '#DC2626';
};

const getLevelLabel = (score: number): string => {
  if (score >= 9) return 'Expert';
  if (score >= 8) return 'Advanced';
  if (score >= 7) return 'Proficient';
  if (score >= 6) return 'Competent';
  return 'Needs Improvement';
};

const getSkillIcon = (skillName: string): string => {
  if (!skillName) return 'book';
  const name = skillName.toLowerCase();
  if (name.includes('communication')) return 'message1';
  if (name.includes('leadership')) return 'team';
  if (name.includes('problem')) return 'bulb1';
  if (name.includes('team')) return 'team';
  if (name.includes('time')) return 'clockcircle';
  if (name.includes('conflict')) return 'exclamationcircle';
  if (name.includes('decision')) return 'checksquare';
  if (name.includes('creativity')) return 'star';
  if (name.includes('adaptability')) return 'reload1';
  if (name.includes('emotional')) return 'heart';
  if (name.includes('email') || name.includes('message')) return 'mail';
  return 'book';
};

export const ActivitySkillCard: React.FC<ActivitySkillCardProps> = ({
  id,
  skillName,
  assessmentStatus,
  aiInsights,
  aiTag,
  score,
  index,
  skillId,
  progressData,
  templateExists = false,
  isGenerating = false,
  onGenerateAssessment,
  onViewFeedback,
  onDeleteAssessment
}) => {
  const router = useRouter();
  const responsive = useResponsive();
  
  const statusColor = getAssessmentStatusColor(assessmentStatus);
  const statusLabel = getAssessmentStatusLabel(assessmentStatus);
  const skillIcon = getSkillIcon(skillName);
  const scoreColor = score ? getScoreColor(score) : '#6B7280';
  const levelLabel = score ? getLevelLabel(score) : 'Not Assessed';

  const progressCalc = calculateAssessmentProgress(
    progressData?.completedResponses || 0,
    progressData?.totalPrompts || 0
  );
  const progress = progressCalc.percentage;

  // Determine what action button to show
  const assessmentAction = determineAssessmentAction(assessmentStatus, progressData, templateExists);
  const actionButtonText = getActionButtonText(assessmentAction, isGenerating, templateExists);

  // Centralized action handler
  const handleAssessmentAction = () => {
    if (!skillId) return;

    switch (assessmentAction) {
      case AssessmentActionType.StartAssessment:
        if (templateExists) {
          // Start existing assessment
          router.push({
            pathname: '/assessmentScenarios',
            params: { skillId }
          });
        } else {
          // Generate new assessment
          onGenerateAssessment?.();
        }
        break;
      
      case AssessmentActionType.ResumeAssessment:
        // Resume with session ID for proper continuation
        router.push({
          pathname: '/assessmentScenarios',
          params: { 
            skillId,
            sessionId: id,
            resume: 'true'
          }
        });
        break;
      
      case AssessmentActionType.ViewResults:
        onViewFeedback?.();
        break;
    }
  };



  return (
    <MotiView
      from={{ opacity: 0, translateY: 40, scale: 0.97 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'spring', delay: index * 80, damping: 16, stiffness: 110 }}
      style={{ marginBottom: SPACING.margin.sm }}
    >
      <View
        style={{
          borderRadius: BORDER_RADIUS.xl,
          backgroundColor: '#FFFFFF',
          ...SHADOWS.md,
          borderWidth: 1,
          borderColor: '#E5E7EB',
          overflow: 'hidden'
        }}
      >
        {/* Header with skill name and status */}
        <LinearGradient colors={GRADIENTS.card} style={{ padding: SPACING.padding.md, paddingBottom: SPACING.padding.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.margin.sm }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLORS.text.inverse,
              flex: 1
            }}>
              {skillName}
            </Text>

            {/* Status Badge */}
            <View style={{
              backgroundColor: assessmentStatus === AssessmentStatus.COMPLETED ? '#10B981' : '#EF4444',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: '#FFFFFF'
              }}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Card Body */}
        <View style={{ padding: SPACING.padding.md }}>
          {/* Content based on status */}
          {assessmentStatus === AssessmentStatus.COMPLETED && score ? (
            // Completed assessment - show score and feedback
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: 8
                  }}>
                    Final Score
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#111827',
                      marginRight: 12
                    }}>
                      {Math.round(score)}/10
                    </Text>
                    <View style={{
                      backgroundColor: '#F3F4F6',
                      paddingHorizontal: SPACING.padding.sm,
                      paddingVertical: SPACING.padding.xs,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#E5E7EB'
                    }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        {levelLabel}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Identified Style Chip */}
                {aiTag && (
                  <View style={{
                    backgroundColor: '#E3F2FD',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#BBDEFB',
                    marginLeft: 12
                  }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: '#1976D2',
                      textAlign: 'center'
                    }}>
                      {aiTag}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : assessmentStatus === AssessmentStatus.PENDING ? (
            // In progress or pending - show progress bar based on backend data
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{
                  fontSize: 12,
                  color: '#6B7280'
                }}>
                  Progress
                </Text>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  {progress}%
                </Text>
              </View>
              
              {/* Progress Bar */}
              <View style={{
                height: 8,
                backgroundColor: '#E5E7EB',
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <View style={{
                  height: '100%',
                  backgroundColor: statusColor,
                  width: `${progress}%`,
                  borderRadius: 4
                }} />
              </View>
              
              {/* Progress Details */}
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                marginTop: 8 
              }}>
                <Text style={{
                  fontSize: 12,
                  color: '#6B7280',
                  fontStyle: 'italic'
                }}>
                  {progressData ? 'Continue your assessment' : 'Assessment ready to start'}
                </Text>
                {(progressCalc.totalQuestions > 0) && (
                  <Text style={{
                    fontSize: 11,
                    color: '#6B7280'
                  }}>
                    {progressCalc.completedResponses}/{progressCalc.totalQuestions} questions
                  </Text>
                )}
              </View>
            </View>
          ) : (
            // Not started - show empty state
            <View style={{ 
              marginBottom: 16, 
              alignItems: 'center',
              paddingVertical: 20
            }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#F3F4F6',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <AntDesign name="play-circle" size={24} color="#9CA3AF" />
              </View>
              <Text style={{
                fontSize: 14,
                color: '#6B7280',
                textAlign: 'center'
              }}>
                {templateExists ? 'Ready to start your assessment' : 'Assessment not generated yet'}
              </Text>
              <Text style={{
                fontSize: 12,
                color: '#9CA3AF',
                textAlign: 'center',
                marginTop: 4
              }}>
                {templateExists ? (progressData?.totalPrompts && progressData.totalPrompts > 0 ? `${progressData.totalPrompts} scenario-based questions` : 'Scenario-based assessment') : 'Click to generate AI-powered assessment'}
              </Text>
            </View>
          )}

          {/* Centralized Action Buttons */}
          <View style={{ flexDirection: 'row', gap: SPACING.gap.sm }}>
            <TouchableOpacity
              onPress={handleAssessmentAction}
              disabled={isGenerating}
              style={{
                flex: 1,
                backgroundColor: isGenerating ? '#9CA3AF' : 
                  (assessmentAction === AssessmentActionType.ViewResults ? '#F3F4F6' : BRAND),
                paddingVertical: SPACING.padding.sm,
                paddingHorizontal: SPACING.padding.sm,
                borderRadius: BORDER_RADIUS.md,
                borderWidth: assessmentAction === AssessmentActionType.ViewResults ? 1 : 0,
                borderColor: assessmentAction === AssessmentActionType.ViewResults ? '#E5E7EB' : 'transparent',
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center'
              }}
            >
              {isGenerating && assessmentAction === AssessmentActionType.StartAssessment && !templateExists ? (
                <>
                  <AntDesign name="loading1" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#FFFFFF'
                  }}>
                    {actionButtonText}
                  </Text>
                </>
              ) : assessmentAction === AssessmentActionType.StartAssessment && !templateExists ? (
                <>
                  <AntDesign name="plus" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#FFFFFF'
                  }}>
                    {actionButtonText}
                  </Text>
                </>
              ) : (
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: assessmentAction === AssessmentActionType.ViewResults ? '#374151' : '#FFFFFF'
                }}>
                  {actionButtonText}
                </Text>
              )}
            </TouchableOpacity>
            
            {/* Delete Button for Testing */}
            {onDeleteAssessment && (
              <TouchableOpacity
                onPress={onDeleteAssessment}
                style={{
                  backgroundColor: '#EF4444',
                  paddingVertical: SPACING.padding.sm,
                  paddingHorizontal: 12,
                  borderRadius: BORDER_RADIUS.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 50
                }}
              >
                <AntDesign name="delete" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </MotiView>
  );
};

export default ActivitySkillCard;
