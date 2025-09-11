// @ts-nocheck
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BRAND, GRADIENTS, BORDER_RADIUS, SHADOWS, SPACING, COLORS, TYPOGRAPHY } from '../components/Brand';
import { useResponsive } from '../../utils/responsive';

interface ActivitySkillCardProps {
  id: string;
  skillName: string;
  assessmentStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING';
  aiInsights: string;
  aiTag: string;
  score?: number;
  index: number;
  skillId?: string;
  // Progress data from backend session
  progressData?: {
    totalPrompts: number;
    completedResponses: number;
    status: string;
  };
  // Assessment template status
  templateExists?: boolean;
  isGenerating?: boolean;
  onGenerateAssessment?: () => void;
  onViewFeedback?: () => void;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'COMPLETED': return '#10B981';
    case 'IN_PROGRESS': return '#F59E0B';
    case 'NOT_STARTED': return '#6B7280';
    case 'PENDING': return '#8B5CF6';
    default: return '#6B7280';
  }
};

const getStatusLabel = (status: string): string => {
  // Use the exact backend enum values
  switch (status) {
    case 'COMPLETED': return 'COMPLETED';
    case 'IN_PROGRESS': return 'IN_PROGRESS';
    case 'NOT_STARTED': return 'NOT_STARTED';
    case 'PENDING': return 'PENDING';
    default: return status; // Fallback to show actual backend value
  }
};

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
  onViewFeedback
}) => {
  const router = useRouter();
  const responsive = useResponsive();
  
  const statusColor = getStatusColor(assessmentStatus);
  const statusLabel = getStatusLabel(assessmentStatus);
  const skillIcon = getSkillIcon(skillName);
  const scoreColor = score ? getScoreColor(score) : '#6B7280';
  const levelLabel = score ? getLevelLabel(score) : 'Not Assessed';

  // Calculate progress based on backend session data
  const totalPrompts = progressData?.totalPrompts || 3;
  const completedResponses = progressData?.completedResponses || 0;
  const progress = totalPrompts > 0 ? Math.round((completedResponses / totalPrompts) * 100) : 0;



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
        {/* Header with skill icon and status */}
        <LinearGradient colors={GRADIENTS.card} style={{ padding: SPACING.padding.md, paddingBottom: SPACING.padding.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.margin.sm }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: BORDER_RADIUS.full,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: SPACING.margin.sm
            }}>
              <AntDesign name={skillIcon} size={22} color="#FFFFFF" />
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: TYPOGRAPHY.fontSize.lg,
                fontWeight: TYPOGRAPHY.fontWeight.bold,
                color: COLORS.text.inverse,
                marginBottom: SPACING.margin.xs
              }}>
                {skillName}
              </Text>
            </View>

            {/* Status Badge */}
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              paddingHorizontal: SPACING.padding.sm,
              paddingVertical: SPACING.padding.xs,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: TYPOGRAPHY.fontSize.sm,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.inverse
              }}>
                {statusLabel}
              </Text>

            </View>
          </View>

          {/* AI Tag */}
          {aiTag && (
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              paddingHorizontal: SPACING.padding.sm,
              paddingVertical: SPACING.padding.xs,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              alignSelf: 'flex-start'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AntDesign name="robot1" size={16} color={COLORS.text.inverse} style={{ marginRight: SPACING.margin.xs }} />
                <Text style={{
                  fontSize: TYPOGRAPHY.fontSize.base,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  color: COLORS.text.inverse
                }}>
                  {aiTag}
                </Text>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Card Body */}
        <View style={{ padding: SPACING.padding.md }}>
          {/* Content based on status */}
          {assessmentStatus === 'COMPLETED' && score ? (
            // Completed assessment - show score and feedback
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 12,
                    color: '#6B7280',
                    marginBottom: 4
                  }}>
                    Final Score
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{
                      fontSize: 24,
                      fontWeight: '700',
                      color: scoreColor,
                      marginRight: 8
                    }}>
                      {Math.round(score)}/10
                    </Text>
                    <View style={{
                      backgroundColor: scoreColor + '20',
                                    paddingHorizontal: SPACING.padding.xs,
              paddingVertical: SPACING.padding.xs,
                      borderRadius: 8
                    }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: scoreColor
                      }}>
                        {levelLabel}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress Circle */}
                <View style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  borderWidth: 4,
                  borderColor: '#E5E7EB',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative'
                }}>
                  <View style={{
                    position: 'absolute',
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    borderWidth: 4,
                    borderColor: 'transparent',
                    borderTopColor: scoreColor,
                    borderRightColor: score >= 2.5 ? scoreColor : 'transparent',
                    borderBottomColor: score >= 5 ? scoreColor : 'transparent',
                    borderLeftColor: score >= 7.5 ? scoreColor : 'transparent',
                    transform: [{ rotate: '-90deg' }]
                  }} />
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: scoreColor
                  }}>
                    {Math.round(score)}
                  </Text>
                </View>
              </View>

              {/* Feedback section */}
              {aiInsights && (
                <View style={{
                  backgroundColor: '#F9FAFB',
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E5E7EB'
                }}>
                  <Text style={{
                    fontSize: 12,
                    color: '#6B7280',
                    marginBottom: 4,
                    fontWeight: '600'
                  }}>
                    AI Feedback
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: '#374151',
                    lineHeight: 18
                  }} numberOfLines={3}>
                    {aiInsights}
                  </Text>
                </View>
              )}
            </View>
          ) : assessmentStatus === 'IN_PROGRESS' || assessmentStatus === 'PENDING' ? (
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
                  {assessmentStatus === 'IN_PROGRESS' ? 'Continue your assessment' : 'Assessment ready to start'}
                </Text>
                <Text style={{
                  fontSize: 11,
                  color: '#6B7280'
                }}>
                  {completedResponses}/{totalPrompts} questions
                </Text>
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
                {templateExists ? `${totalPrompts} scenario-based questions` : 'Click to generate AI-powered assessment'}
              </Text>
            </View>
          )}

                     {/* Action Buttons */}
           <View style={{ flexDirection: 'row', gap: SPACING.gap.sm }}>
            {assessmentStatus === 'COMPLETED' ? (
              <TouchableOpacity
                onPress={() => {
                  console.log('🔍 DEBUG: View Details button pressed');
                  console.log('🔍 DEBUG: onViewFeedback exists?', !!onViewFeedback);
                  console.log('🔍 DEBUG: assessmentId (id):', id);
                  console.log('🔍 DEBUG: skillId:', skillId);
                  
                  // Show detailed feedback if available
                  if (onViewFeedback) {
                    console.log('✅ DEBUG: Calling onViewFeedback()');
                    onViewFeedback();
                  } else {
                    console.log('❌ DEBUG: No onViewFeedback handler - redirecting to fallback');
                    console.log('❌ DEBUG: Redirecting to /assessment-results with assessmentId:', id);
                    // Fallback to results screen if feedback handler not provided
                    router.push({
                      pathname: '/assessment-results',
                      params: { assessmentId: id }
                    });
                  }
                }}
                                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                                      paddingVertical: SPACING.padding.sm,
                  paddingHorizontal: SPACING.padding.sm,
                    borderRadius: BORDER_RADIUS.md,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    alignItems: 'center'
                  }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  View Details
                </Text>
              </TouchableOpacity>
            ) : assessmentStatus === 'IN_PROGRESS' ? (
              <TouchableOpacity
                onPress={() => {
                  if (skillId) {
                    router.push({
                      pathname: '/adaptive-assessment',
                      params: { skillId }
                    });
                  }
                }}
                                  style={{
                    flex: 1,
                    backgroundColor: BRAND,
                                      paddingVertical: SPACING.padding.sm,
                  paddingHorizontal: SPACING.padding.md,
                    borderRadius: BORDER_RADIUS.md,
                    alignItems: 'center'
                  }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#FFFFFF'
                }}>
                  Resume Assessment
                </Text>
              </TouchableOpacity>
            ) : templateExists ? (
              <TouchableOpacity
                onPress={() => {
                  if (skillId) {
                    router.push({
                      pathname: '/adaptive-assessment',
                      params: { skillId }
                    });
                  }
                }}
                style={{
                  flex: 1,
                  backgroundColor: BRAND,
                  paddingVertical: SPACING.padding.sm,
                  paddingHorizontal: SPACING.padding.sm,
                  borderRadius: BORDER_RADIUS.md,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#FFFFFF'
                }}>
                                    Start Assessment
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={onGenerateAssessment}
                disabled={isGenerating}
                style={{
                  flex: 1,
                  backgroundColor: isGenerating ? '#9CA3AF' : BRAND,
                  paddingVertical: SPACING.padding.sm,
                  paddingHorizontal: SPACING.padding.sm,
                  borderRadius: BORDER_RADIUS.md,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center'
                }}
              >
                {isGenerating ? (
                  <>
                    <AntDesign name="loading1" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#FFFFFF'
                    }}>
                      Generating...
                    </Text>
                  </>
                ) : (
                  <>
                    <AntDesign name="plus" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#FFFFFF'
                    }}>
                      Generate Assessment
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </MotiView>
  );
};

export default ActivitySkillCard;
