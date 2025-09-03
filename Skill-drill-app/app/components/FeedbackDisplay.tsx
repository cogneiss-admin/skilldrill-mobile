// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BRAND = "#0A66C2";

interface FeedbackData {
  id: string;
  skillId: string;
  skillName: string;
  finalScore: number;
  scoreLabel?: string;
  stars?: number;
  identifiedStyle?: string;
  whatThisMeans?: string;
  identifiedFlaws?: string[];
  strengths?: string;
  improvementFeedback?: string;
  recommendedAction?: string;
  responses?: Array<{
    id: string;
    prompt: string;
    aiFeedback?: string;
    aiScore?: number;
  }>;
  subSkillScores?: Record<string, any>;
  completedAt?: string;
}

interface FeedbackDisplayProps {
  feedback: FeedbackData;
  onClose?: () => void;
  showCloseButton?: boolean;
  compact?: boolean;
}

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({
  feedback,
  onClose,
  showCloseButton = false,
  compact = false
}) => {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#10B981'; // Green
    if (score >= 6) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getStarsColor = (stars: number) => {
    if (stars >= 4) return '#FFD700'; // Gold
    if (stars >= 3) return '#C0C0C0'; // Silver
    return '#CD7F32'; // Bronze
  };

  const renderStars = (stars: number = 0) => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {[...Array(5)].map((_, index) => (
          <AntDesign
            key={index}
            name={index < Math.floor(stars) ? "star" : "staro"}
            size={16}
            color={index < Math.floor(stars) ? getStarsColor(stars) : '#E5E7EB'}
            style={{ marginHorizontal: 1 }}
          />
        ))}
        <Text style={{ marginLeft: 6, fontSize: 14, color: '#6B7280', fontWeight: '500' }}>
          {stars.toFixed(1)}/5
        </Text>
      </View>
    );
  };

  const renderScoreBadge = (score: number, size: 'sm' | 'lg' = 'sm') => {
    const sizeStyles = {
      sm: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
      lg: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }
    };

    return (
      <View style={{
        backgroundColor: getScoreColor(score) + '15',
        borderWidth: 1,
        borderColor: getScoreColor(score) + '30',
        ...sizeStyles[size]
      }}>
        <Text style={{
          fontSize: size === 'lg' ? 16 : 14,
          fontWeight: '700',
          color: getScoreColor(score),
          textAlign: 'center'
        }}>
          {Math.round(score)}/10
        </Text>
      </View>
    );
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const renderSection = (
    id: string,
    title: string,
    icon: React.ReactNode,
    content: React.ReactNode,
    color: string,
    bgColor: string,
    expandable: boolean = false
  ) => {
    const isExpanded = expandedSection === id;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 100 }}
        style={{ marginBottom: 16 }}
      >
        <TouchableOpacity
          onPress={() => expandable && toggleSection(id)}
          activeOpacity={0.8}
          style={{
            backgroundColor: bgColor,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: color + '30',
            shadowColor: color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 2
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: expandable ? 12 : 0 }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: color + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              {icon}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: color.replace('#', '#') // Darker version
              }}>
                {title}
              </Text>
            </View>
            {expandable && (
              <AntDesign
                name={isExpanded ? "up" : "down"}
                size={16}
                color={color}
              />
            )}
          </View>

          {(!expandable || isExpanded) && content}
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 400 }}
        style={{ marginBottom: 20 }}
      >
        <LinearGradient
          colors={[BRAND, '#1E40AF', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 20,
            shadowColor: BRAND,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 8
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '800',
                color: '#FFFFFF',
                marginBottom: 4
              }}>
                {feedback.skillName}
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#E6F2FF',
                opacity: 0.9
              }}>
                Assessment Results
              </Text>
            </View>
            {renderScoreBadge(feedback.finalScore, 'lg')}
          </View>

          {/* Stars */}
          {feedback.stars && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              {renderStars(feedback.stars)}
            </View>
          )}

          {/* Date */}
          {feedback.completedAt && (
            <Text style={{
              fontSize: 12,
              color: '#E6F2FF',
              opacity: 0.8
            }}>
              Completed on {new Date(feedback.completedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          )}
        </LinearGradient>
      </MotiView>

      {/* Communication Style */}
      {feedback.identifiedStyle && (
        renderSection(
          'style',
          'Your Communication Style',
          <AntDesign name="user" size={18} color="#7C3AED" />,
          <View>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#7C3AED',
              marginBottom: 8
            }}>
              {feedback.identifiedStyle}
            </Text>
            {feedback.whatThisMeans && (
              <Text style={{
                fontSize: 15,
                color: '#6B21A8',
                lineHeight: 22
              }}>
                {feedback.whatThisMeans}
              </Text>
            )}
          </View>,
          '#7C3AED',
          '#F3E8FF'
        )
      )}

      {/* Strengths */}
      {feedback.strengths && (
        renderSection(
          'strengths',
          'Your Strengths',
          <AntDesign name="checkcircle" size={18} color="#16A34A" />,
          <Text style={{
            fontSize: 15,
            color: '#166534',
            lineHeight: 22
          }}>
            {feedback.strengths}
          </Text>,
          '#16A34A',
          '#F0FDF4'
        )
      )}

      {/* Areas for Improvement */}
      {feedback.identifiedFlaws && feedback.identifiedFlaws.length > 0 && (
        renderSection(
          'flaws',
          'Areas for Improvement',
          <AntDesign name="warning" size={18} color="#DC2626" />,
          <View>
            {feedback.identifiedFlaws.map((flaw, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                <Text style={{
                  fontSize: 16,
                  color: '#DC2626',
                  marginRight: 8,
                  fontWeight: 'bold'
                }}>•</Text>
                <Text style={{
                  fontSize: 15,
                  color: '#991B1B',
                  lineHeight: 22,
                  flex: 1
                }}>
                  {flaw}
                </Text>
              </View>
            ))}
          </View>,
          '#DC2626',
          '#FEF2F2'
        )
      )}

      {/* Improvement Feedback */}
      {feedback.improvementFeedback && (
        renderSection(
          'improvement',
          'Improvement Plan',
          <AntDesign name="aim" size={18} color="#F59E0B" />,
          <View>
            <Text style={{
              fontSize: 15,
              color: '#92400E',
              lineHeight: 22,
              marginBottom: 16
            }}>
              {feedback.improvementFeedback}
            </Text>

            {/* Recommended Action */}
            {feedback.recommendedAction && (
              <View style={{
                backgroundColor: '#F59E0B15',
                padding: 16,
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: '#F59E0B'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <AntDesign name="arrowright" size={16} color="#F59E0B" style={{ marginRight: 8 }} />
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#92400E'
                  }}>
                    Next Action Step
                  </Text>
                </View>
                <Text style={{
                  fontSize: 15,
                  color: '#92400E',
                  lineHeight: 22
                }}>
                  {feedback.recommendedAction}
                </Text>
              </View>
            )}
          </View>,
          '#F59E0B',
          '#FEF3C7'
        )
      )}

      {/* Skill Breakdown */}
      {feedback.subSkillScores && Object.keys(feedback.subSkillScores).length > 0 && (
        renderSection(
          'breakdown',
          'Skill Breakdown',
          <AntDesign name="barschart" size={18} color={BRAND} />,
          <View>
            {Object.entries(feedback.subSkillScores).map(([subSkillName, data], index) => (
              <View key={subSkillName} style={{ marginBottom: 16 }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: '#374151',
                    flex: 1
                  }}>
                    {subSkillName}
                  </Text>
                  <Text style={{
                    fontSize: 15,
                    color: getScoreColor(data.score * 10),
                    fontWeight: '700'
                  }}>
                    {(Math.round((data.score + Number.EPSILON) * 10) / 10).toFixed(1)}/10
                  </Text>
                </View>

                <View style={{
                  height: 8,
                  backgroundColor: '#E5E7EB',
                  borderRadius: 4,
                  overflow: 'hidden',
                  marginBottom: 8
                }}>
                  <View style={{
                    height: '100%',
                    backgroundColor: getScoreColor(data.score * 10),
                    width: `${Math.min(100, Math.max(0, data.score * 10))}%`,
                    borderRadius: 4
                  }} />
                </View>

                {data.evidence && (
                  <Text style={{
                    fontSize: 14,
                    color: '#6B7280',
                    fontStyle: 'italic',
                    lineHeight: 18
                  }}>
                    "{data.evidence}"
                  </Text>
                )}
              </View>
            ))}
          </View>,
          BRAND,
          '#F0F9FF',
          true
        )
      )}

      {/* Individual Responses */}
      {feedback.responses && feedback.responses.length > 0 && (
        renderSection(
          'responses',
          'Detailed Feedback',
          <AntDesign name="message1" size={18} color={BRAND} />,
          <View>
            {feedback.responses.map((response, index) => (
              <View key={response.id || index} style={{
                marginBottom: 16,
                padding: 16,
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: BRAND
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8
                }}>
                  <Text style={{
                    fontSize: 14,
                    color: '#64748B',
                    fontWeight: '600'
                  }}>
                    Scenario {index + 1}
                  </Text>
                  {response.aiScore !== undefined && (
                    <View style={{
                      backgroundColor: getScoreColor(response.aiScore * 10) + '20',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12
                    }}>
                      <Text style={{
                        fontSize: 12,
                        color: getScoreColor(response.aiScore * 10),
                        fontWeight: '700'
                      }}>
                        {response.aiScore}/10
                      </Text>
                    </View>
                  )}
                </View>

                {response.prompt && (
                  <Text style={{
                    fontSize: 14,
                    color: '#374151',
                    marginBottom: 8,
                    fontStyle: 'italic',
                    lineHeight: 18
                  }}>
                    {response.prompt}
                  </Text>
                )}

                {response.aiFeedback && (
                  <Text style={{
                    fontSize: 14,
                    color: '#4B5563',
                    lineHeight: 20
                  }}>
                    {response.aiFeedback}
                  </Text>
                )}
              </View>
            ))}
          </View>,
          BRAND,
          '#F8FAFC',
          true
        )
      )}

      {/* Close Button */}
      {showCloseButton && (
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 600 }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: BRAND,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              shadowColor: BRAND,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
              marginTop: 20
            }}
            activeOpacity={0.8}
          >
            <Text style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '700'
            }}>
              Close Feedback
            </Text>
          </TouchableOpacity>
        </MotiView>
      )}
    </ScrollView>
  );
};

export default FeedbackDisplay;
