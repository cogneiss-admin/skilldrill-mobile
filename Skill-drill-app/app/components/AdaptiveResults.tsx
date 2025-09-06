import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button, Surface, Chip, Card } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useResponsive } from "../../utils/responsive";
import { AntDesign, MaterialIcons } from '@expo/vector-icons';

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";

interface AdaptiveResultsProps {
  results: {
    final_score: number;
    star_rating: number;
    stars_display: string;
    identified_style: string;
    what_this_means: string;
    strengths: string;
    improvement_feedback: string;
    recommended_action: string;
    identified_flaws?: string[];
    level_label: string;
    questions_answered: number;
    tier_progression: string[];
  };
  skillName: string;
  onRetake?: () => void;
  onHome?: () => void;
}

// Star rating component
const StarRating = ({ rating, display }: { rating: number; display: string }) => {
  return (
    <View style={{ alignItems: 'center', marginVertical: 16 }}>
      <Text style={{ fontSize: 32, letterSpacing: 2 }}>{display}</Text>
      <Text style={{ fontSize: 16, color: '#666', marginTop: 4 }}>
        {rating} out of 5 stars
      </Text>
    </View>
  );
};

// Score circle component
const ScoreCircle = ({ score, level }: { score: number; level: string }) => {
  const getScoreColor = (score: number) => {
    if (score >= 8) return '#4CAF50';
    if (score >= 6) return '#FF9800';
    if (score >= 4) return '#FFC107';
    return '#F44336';
  };

  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <View style={{
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: getScoreColor(score),
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: getScoreColor(score),
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      }}>
        <Text style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: 'white',
        }}>
          {score.toFixed(1)}
        </Text>
        <Text style={{
          fontSize: 12,
          color: 'white',
          opacity: 0.9,
        }}>
          out of 10
        </Text>
      </View>
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 12,
      }}>
        {level}
      </Text>
    </View>
  );
};

// Communication style badge
const StyleBadge = ({ style }: { style: string }) => {
  const getStyleColor = (style: string) => {
    const styleColors: { [key: string]: string } = {
      'Collaborative Communicator': '#4CAF50',
      'Direct Communicator': '#2196F3', 
      'Analytical Communicator': '#9C27B0',
      'Diplomatic Communicator': '#00BCD4',
      'Inspirational Communicator': '#FF5722',
      'Adaptive Communicator': '#795548',
    };
    return styleColors[style] || '#607D8B';
  };

  return (
    <View style={{
      backgroundColor: getStyleColor(style),
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      alignSelf: 'center',
      marginVertical: 12,
    }}>
      <Text style={{
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
      }}>
        🎭 {style}
      </Text>
    </View>
  );
};

// Tier progression component
const TierProgression = ({ progression }: { progression: string[] }) => {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'L1': return '#4CAF50';
      case 'L2': return '#FF9800';
      case 'L3': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 16 }}>
      {progression.map((tier, index) => (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: getTierColor(tier),
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
              {tier}
            </Text>
          </View>
          {index < progression.length - 1 && (
            <AntDesign name="arrowright" size={16} color="#666" style={{ marginHorizontal: 8 }} />
          )}
        </View>
      ))}
    </View>
  );
};

const AdaptiveResults: React.FC<AdaptiveResultsProps> = ({
  results,
  skillName,
  onRetake,
  onHome
}) => {
  const router = useRouter();
  const { wp, hp } = useResponsive();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger haptic feedback and animation
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setIsVisible(true), 300);
  }, []);

  const handleShare = async () => {
    try {
      const shareMessage = `I just completed a ${skillName} assessment on ${APP_NAME}!\n\n` +
        `🎭 Style: ${results.identified_style}\n` +
        `📊 Score: ${results.final_score}/10 (${results.level_label})\n` +
        `⭐ Rating: ${results.stars_display}\n\n` +
        `Check out ${APP_NAME} for personalized skill development!`;

      await Share.share({
        message: shareMessage,
        title: `My ${skillName} Assessment Results`
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      router.push("/dashboard");
    }
  };

  const handleRetake = () => {
    if (onRetake) {
      onRetake();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={{ 
        paddingHorizontal: 16, 
        paddingTop: 8, 
        paddingBottom: 16,
        backgroundColor: BRAND
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
            Assessment Results
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.95)", "rgba(255,255,255,1)"]}
          locations={[0, 0.05, 0.15]}
          style={{ flex: 1 }}
        >
          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ padding: 16, paddingTop: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Celebration Header */}
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
              transition={{ type: 'spring', delay: 100 }}
            >
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 24, marginBottom: 8 }}>🎉</Text>
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#333',
                  textAlign: 'center',
                }}>
                  {skillName} Assessment Complete!
                </Text>
              </View>
            </MotiView>

            {/* Score Card */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, translateY: isVisible ? 0 : 20 }}
              transition={{ type: 'timing', duration: 600, delay: 200 }}
            >
              <Surface style={{
                padding: 24,
                borderRadius: 16,
                backgroundColor: 'white',
                elevation: 4,
                marginBottom: 16,
                alignItems: 'center',
              }}>
                <ScoreCircle score={results.final_score} level={results.level_label} />
                <StarRating rating={results.star_rating} display={results.stars_display} />
                <StyleBadge style={results.identified_style} />
                
                <Text style={{
                  fontSize: 12,
                  color: '#666',
                  textAlign: 'center',
                  marginTop: 8,
                }}>
                  {results.questions_answered} questions • Adaptive difficulty
                </Text>
                
                <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  Tier progression:
                </Text>
                <TierProgression progression={results.tier_progression} />
              </Surface>
            </MotiView>

            {/* What This Means */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, translateY: isVisible ? 0 : 20 }}
              transition={{ type: 'timing', duration: 600, delay: 400 }}
            >
              <Surface style={{
                padding: 20,
                borderRadius: 16,
                backgroundColor: 'white',
                elevation: 4,
                marginBottom: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <MaterialIcons name="info-outline" size={20} color={BRAND} />
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#333',
                    marginLeft: 8,
                  }}>
                    What This Means
                  </Text>
                </View>
                <Text style={{
                  fontSize: 15,
                  color: '#666',
                  lineHeight: 22,
                }}>
                  {results.what_this_means}
                </Text>
              </Surface>
            </MotiView>

            {/* Strengths */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, translateY: isVisible ? 0 : 20 }}
              transition={{ type: 'timing', duration: 600, delay: 500 }}
            >
              <Surface style={{
                padding: 20,
                borderRadius: 16,
                backgroundColor: 'white',
                elevation: 4,
                marginBottom: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <MaterialIcons name="trending-up" size={20} color="#4CAF50" />
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#333',
                    marginLeft: 8,
                  }}>
                    Your Strengths
                  </Text>
                </View>
                <Text style={{
                  fontSize: 15,
                  color: '#666',
                  lineHeight: 22,
                }}>
                  {results.strengths}
                </Text>
              </Surface>
            </MotiView>

            {/* Areas for Improvement */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, translateY: isVisible ? 0 : 20 }}
              transition={{ type: 'timing', duration: 600, delay: 600 }}
            >
              <Surface style={{
                padding: 20,
                borderRadius: 16,
                backgroundColor: 'white',
                elevation: 4,
                marginBottom: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <MaterialIcons name="lightbulb-outline" size={20} color="#FF9800" />
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#333',
                    marginLeft: 8,
                  }}>
                    Areas for Improvement
                  </Text>
                </View>
                <Text style={{
                  fontSize: 15,
                  color: '#666',
                  lineHeight: 22,
                  marginBottom: 12,
                }}>
                  {results.improvement_feedback}
                </Text>
                
                {results.identified_flaws && results.identified_flaws.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                    {results.identified_flaws.map((flaw, index) => (
                      <Chip
                        key={index}
                        mode="outlined"
                        style={{ margin: 2 }}
                        textStyle={{ fontSize: 12 }}
                      >
                        {flaw}
                      </Chip>
                    ))}
                  </View>
                )}
              </Surface>
            </MotiView>

            {/* Recommended Action */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, translateY: isVisible ? 0 : 20 }}
              transition={{ type: 'timing', duration: 600, delay: 700 }}
            >
              <Surface style={{
                padding: 20,
                borderRadius: 16,
                backgroundColor: '#E8F5E8',
                elevation: 4,
                marginBottom: 24,
                borderLeftWidth: 4,
                borderLeftColor: '#4CAF50',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <MaterialIcons name="directions-run" size={20} color="#4CAF50" />
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#333',
                    marginLeft: 8,
                  }}>
                    Recommended Next Step
                  </Text>
                </View>
                <Text style={{
                  fontSize: 15,
                  color: '#2E7D32',
                  lineHeight: 22,
                  fontWeight: '500',
                }}>
                  {results.recommended_action}
                </Text>
              </Surface>
            </MotiView>

            {/* Action Buttons */}
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9 }}
              transition={{ type: 'timing', duration: 600, delay: 800 }}
            >
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <Button
                  mode="contained"
                  onPress={handleShare}
                  buttonColor={BRAND}
                  style={{ flex: 1, marginRight: 8, borderRadius: 12 }}
                  icon="share-variant"
                  contentStyle={{ paddingVertical: 8 }}
                >
                  Share
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleRetake}
                  style={{ flex: 1, marginLeft: 8, borderRadius: 12 }}
                  contentStyle={{ paddingVertical: 8 }}
                >
                  Retake
                </Button>
              </View>
              
              <Button
                mode="contained"
                onPress={handleHome}
                buttonColor="#4CAF50"
                style={{ borderRadius: 12, marginBottom: 32 }}
                contentStyle={{ paddingVertical: 12 }}
                labelStyle={{ fontSize: 16, fontWeight: '600' }}
              >
                Continue Learning
              </Button>
            </MotiView>
          </ScrollView>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

export default AdaptiveResults;