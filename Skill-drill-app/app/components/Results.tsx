import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import LottieView from "lottie-react-native";
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
  score?: number;
  feedbackGood?: string;
  feedbackImprove?: string;
  feedbackSummary?: string;
  onAction: () => void;
  actionText?: string;
  onBack?: () => void;
  skillName: string;
}

const ASSESSMENT_BRAND = "#0A66C2";

const GoldenStarRating = ({ score }: { score: number }) => {
  const [showAnimation, setShowAnimation] = React.useState(true);
  const lottieRef = React.useRef<LottieView>(null);

  React.useEffect(() => {
    const playTimer = setTimeout(() => {
      lottieRef.current?.play(0, 60);
    }, 100);

    const switchTimer = setTimeout(() => {
      setShowAnimation(false);
    }, 2100);

    return () => {
      clearTimeout(playTimer);
      clearTimeout(switchTimer);
    };
  }, []);

  const convertScoreToStars = (score: number) => {
    if (score >= 9.0) return 5;
    if (score >= 7.0) return 4;
    if (score >= 5.0) return 3;
    if (score >= 3.0) return 2;
    return 1;
  };

  const stars = convertScoreToStars(score);

  return (
    <View style={{ alignItems: 'center', marginVertical: 12 }}>
      <Text style={{
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
      }}>
        Your Score
      </Text>

      <View style={{ height: 80, justifyContent: 'center', alignItems: 'center' }}>
        {showAnimation ? (
          <LottieView
            ref={lottieRef}
            source={require('../../assets/lottie/StarRatingAnime.json')}
            loop={false}
            style={{
              width: 300,
              height: 300,
            }}
            resizeMode="contain"
          />
        ) : (
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring' }}
            style={{ flexDirection: 'row' }}
          >
            {Array.from({ length: 5 }).map((_, index) => (
              <Ionicons
                key={index}
                name={index < stars ? "star" : "star-outline"}
                size={48} // Increased size
                color={index < stars ? "#FFD700" : "#E0E0E0"}
                style={{
                  marginHorizontal: 4,
                  // Add shadow for "glowing" effect
                  textShadowColor: index < stars ? 'rgba(255, 215, 0, 0.5)' : 'transparent',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 10
                }}
              />
            ))}
          </MotiView>
        )}
      </View>
    </View>
  );
};

const Results: React.FC<ResultsProps> = ({
  type,
  score,
  feedbackGood,
  feedbackImprove,
  feedbackSummary,
  onAction,
  actionText,
  onBack,
  skillName,
}) => {
  const isAssessment = type === 'assessment';
  const isDrill = type === 'drill';

  const getActionButtonText = () => {
    if (actionText) return actionText;
    if (isAssessment) return 'Recommended Next Steps';
    if (isDrill) return 'Go to Dashboard';
    return 'Continue';
  };

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
            zIndex: 10,
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>

        <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{
            fontSize: 20, // Slightly smaller than 28 but bigger than 18 to fit centered
            fontWeight: '700',
            color: '#111827',
            textAlign: 'center',
          }}>
            Result
          </Text>
        </View>

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
          padding: 16, // Reduced from 24
          marginBottom: 16,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}>
          {/* Trophy Animation with Celebration */}
          <View style={{
            width: 140, // Reduced from 180
            height: 140, // Reduced from 180
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8, // Reduced from 16
            overflow: 'visible',
          }}>
            {/* Celebration Animation (background) */}
            <LottieView
              source={require('../../assets/lottie/CelebrationAnime.json')}
              autoPlay
              loop={false}
              style={{
                position: 'absolute',
                width: 240, // Reduced from 300
                height: 240, // Reduced from 300
                zIndex: 1,
              }}
            />
            {/* Trophy Animation (foreground) */}
            <LottieView
              source={require('../../assets/lottie/TrophyAnime.json')}
              autoPlay
              loop={false}
              style={{
                width: 120, // Reduced from 160
                height: 120, // Reduced from 160
                zIndex: 0,
              }}
            />
          </View>

          {/* Congratulations Text */}
          <Text style={{
            fontSize: 24, // Reduced from 28
            fontWeight: 'bold',
            color: '#111827',
            textAlign: 'center',
            marginBottom: 4, // Reduced from 12
          }}>
            Congratulations!
          </Text>

          {/* Completion Text */}
          <Text style={{
            fontSize: 14, // Reduced from 16
            color: '#6B7280',
            textAlign: 'center',
            marginBottom: 4, // Reduced from 8
          }}>
            You've completed
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
              fontSize: 18,
              color: '#111827',
              fontWeight: '700',
              marginBottom: 20,
            }}>
              Feedback
            </Text>

            {/* What You Did Well */}
            {feedbackGood && (
              <View style={{ marginBottom: 16 }}>
                <View style={{ marginBottom: 8 }}>
                  <Text style={{
                    fontSize: 12,
                    color: '#4B5563',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    What You Did Well
                  </Text>
                  <View style={{
                    height: 2,
                    width: 40,
                    backgroundColor: '#22C55E',
                    marginTop: 4,
                    borderRadius: 1
                  }} />
                </View>
                <Text style={{
                  fontSize: 14,
                  color: '#1F2937',
                  lineHeight: 22,
                }}>
                  {feedbackGood}
                </Text>
              </View>
            )}

            {/* Divider */}
            {(feedbackGood && (feedbackImprove || feedbackSummary)) && (
              <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 }} />
            )}

            {/* Areas for Improvement */}
            {feedbackImprove && (
              <View style={{ marginBottom: 16 }}>
                <View style={{ marginBottom: 8 }}>
                  <Text style={{
                    fontSize: 12,
                    color: '#4B5563',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    Areas for Improvement
                  </Text>
                  <View style={{
                    height: 2,
                    width: 40,
                    backgroundColor: '#22C55E',
                    marginTop: 4,
                    borderRadius: 1
                  }} />
                </View>
                <Text style={{
                  fontSize: 14,
                  color: '#1F2937',
                  lineHeight: 22,
                }}>
                  {feedbackImprove}
                </Text>
              </View>
            )}

            {/* Divider */}
            {(feedbackImprove && feedbackSummary) && (
              <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 }} />
            )}

            {/* Overall Summary */}
            {feedbackSummary && (
              <View>
                <View style={{ marginBottom: 8 }}>
                  <Text style={{
                    fontSize: 12,
                    color: '#4B5563',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    Overall Feedback
                  </Text>
                  <View style={{
                    height: 2,
                    width: 40,
                    backgroundColor: '#22C55E',
                    marginTop: 4,
                    borderRadius: 1
                  }} />
                </View>
                <Text style={{
                  fontSize: 14,
                  color: '#1F2937',
                  lineHeight: 22,
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

  if (isAssessment || isDrill) {
    return renderAssessmentResults();
  }

  return null;
};

export default Results;
