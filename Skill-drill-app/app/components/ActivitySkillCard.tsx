// @ts-nocheck
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const BRAND = "#0A66C2";

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
  onGenerateAssessment
}) => {
  const router = useRouter();
  
  // Debug logging
  console.log(`🎯 ActivitySkillCard for ${skillName}:`, {
    assessmentStatus,
    templateExists,
    progressData,
    skillId
  });
  
  const statusColor = getStatusColor(assessmentStatus);
  const statusLabel = getStatusLabel(assessmentStatus);
  const skillIcon = getSkillIcon(skillName);
  const scoreColor = score ? getScoreColor(score) : '#6B7280';
  const levelLabel = score ? getLevelLabel(score) : 'Not Assessed';

  // Calculate progress based on backend session data
  const totalPrompts = progressData?.totalPrompts || 3;
  const completedResponses = progressData?.completedResponses || 0;
  const progress = totalPrompts > 0 ? Math.round((completedResponses / totalPrompts) * 100) : 0;

  const handleCardPress = () => {
    if (assessmentStatus === 'COMPLETED') {
      // Navigate to results if completed
    } else if (assessmentStatus === 'IN_PROGRESS') {
      // Resume assessment - go directly to assessment screen
      if (skillId) {
        // For resume, go directly to assessment screen with resume flag
        router.push({
          pathname: '/assessment',
          params: { 
            skillId,
            resume: 'true'
          }
        });
      }
    } else if (templateExists) {
      // Navigate to assessment intro if template exists (new assessment)
      if (skillId) {
        router.push({
          pathname: '/assessment-intro',
          params: { skillId }
        });
      }
    } else {
      // Generate assessment template if none exists
      if (onGenerateAssessment) {
        onGenerateAssessment();
      }
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 40, scale: 0.97 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'spring', delay: index * 80, damping: 16, stiffness: 110 }}
      style={{ marginBottom: 16 }}
    >
      <TouchableOpacity
        onPress={handleCardPress}
        activeOpacity={0.8}
        style={{
          borderRadius: 20,
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5,
          borderWidth: 1,
          borderColor: '#E5E7EB',
          overflow: 'hidden'
        }}
      >
        {/* Header with skill icon and status */}
        <LinearGradient colors={[BRAND, '#0056B3']} style={{ padding: 20, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <AntDesign name={skillIcon} size={24} color="#FFFFFF" />
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#FFFFFF',
                marginBottom: 4
              }}>
                {skillName}
              </Text>
            </View>

            {/* Status Badge */}
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#FFFFFF'
              }}>
                {statusLabel}
              </Text>
              {/* Debug info */}
              <Text style={{
                fontSize: 10,
                color: 'rgba(255, 255, 255, 0.7)',
                marginLeft: 8
              }}>
                {templateExists ? '✓' : '✗'} Template
              </Text>
            </View>
          </View>

          {/* AI Tag */}
          {aiTag && (
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              alignSelf: 'flex-start'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AntDesign name="robot1" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#FFFFFF'
                }}>
                  {aiTag}
                </Text>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Card Body */}
        <View style={{ padding: 20 }}>
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
                      paddingHorizontal: 8,
                      paddingVertical: 4,
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
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {assessmentStatus === 'COMPLETED' ? (
              <TouchableOpacity
                onPress={() => {
                  // Navigate to results
                  console.log('Navigate to results for:', skillId);
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#F3F4F6',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
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
                      pathname: '/assessment-intro',
                      params: { skillId }
                    });
                  }
                }}
                style={{
                  flex: 1,
                  backgroundColor: BRAND,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
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
                      pathname: '/assessment-intro',
                      params: { skillId }
                    });
                  }
                }}
                style={{
                  flex: 1,
                  backgroundColor: BRAND,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
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
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
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
      </TouchableOpacity>
    </MotiView>
  );
};

export default ActivitySkillCard;
