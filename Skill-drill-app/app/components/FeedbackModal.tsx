// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';

const BRAND = "#0A66C2";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  skillName: string;
  assessmentStatus: string;
  score?: number;
  aiTag: string;
  aiInsights: string;
  detailedFeedback?: string;
  identifiedStyle?: string;
  strengths?: string[];
  areasForImprovement?: string[];
  recommendations?: string[];
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  skillName,
  assessmentStatus,
  score,
  aiTag,
  aiInsights,
  detailedFeedback,
  identifiedStyle,
  strengths = [],
  areasForImprovement = [],
  recommendations = []
}) => {
  const [overlayInteractive, setOverlayInteractive] = useState(false);

  useEffect(() => {
    if (visible) {
      setOverlayInteractive(false);
      const timer = setTimeout(() => setOverlayInteractive(true), 350);
      return () => clearTimeout(timer);
    } else {
      setOverlayInteractive(false);
    }
  }, [visible]);

  const handleClose = () => {
    try {
      onClose();
    } catch (error) {
      console.error('Error closing modal:', error);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
      hardwareAccelerated={true}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
        zIndex: 99999
      }}>
        {overlayInteractive ? (
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        
        <MotiView
          from={{ translateY: SCREEN_HEIGHT }}
          animate={{ translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: SCREEN_HEIGHT * 0.8,
            minHeight: SCREEN_HEIGHT * 0.5,
            zIndex: 100000,
            elevation: 20
          }}
        >
          {/* Header */}
          <LinearGradient
            colors={[BRAND, '#1E40AF']}
            style={{
              paddingTop: 20,
              paddingBottom: 24,
              paddingHorizontal: 24,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '800',
                color: '#FFFFFF'
              }}>
                Detailed Feedback
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <AntDesign name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#FFFFFF',
                marginBottom: 8
              }}>
                {skillName || 'Skill'}
              </Text>
              {score && (
                <View style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16
                }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#FFFFFF'
                  }}>
                    {Math.round(score)}/10
                  </Text>
                </View>
              )}
            </View>

            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 16,
              alignSelf: 'flex-start'
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#FFFFFF'
              }}>
                {aiTag || 'AI Analysis'}
              </Text>
            </View>
          </LinearGradient>

          {/* Content */}
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24 }}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* AI Insights Section */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200 }}
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 16,
                padding: 20,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: '#E5E7EB'
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: BRAND + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <AntDesign name="bulb1" size={18} color={BRAND} />
                </View>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#1F2937'
                }}>
                  AI Analysis
                </Text>
              </View>
              <Text style={{
                fontSize: 15,
                color: '#374151',
                lineHeight: 22
              }}>
                {aiInsights || 'No AI insights available for this skill.'}
              </Text>
            </MotiView>

            {/* Detailed Feedback Section */}
            {detailedFeedback && (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 300 }}
                style={{
                  backgroundColor: '#F0F9FF',
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: '#BAE6FD'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#0369A1' + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <AntDesign name="filetext1" size={18} color="#0369A1" />
                  </View>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#1F2937'
                  }}>
                    Detailed Feedback
                  </Text>
                </View>
                <Text style={{
                  fontSize: 15,
                  color: '#374151',
                  lineHeight: 22
                }}>
                  {detailedFeedback}
                </Text>
              </MotiView>
            )}

            {/* Strengths Section */}
            {strengths && strengths.length > 0 && (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 400 }}
                style={{
                  backgroundColor: '#F0FDF4',
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: '#BBF7D0'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#16A34A' + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <AntDesign name="checkcircle" size={18} color="#16A34A" />
                  </View>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#1F2937'
                  }}>
                    Key Strengths
                  </Text>
                </View>
                {strengths.map((strength, index) => (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                    <View style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#16A34A',
                      marginTop: 8,
                      marginRight: 12
                    }} />
                    <Text style={{
                      fontSize: 15,
                      color: '#374151',
                      lineHeight: 22,
                      flex: 1
                    }}>
                      {strength}
                    </Text>
                  </View>
                ))}
              </MotiView>
            )}

            {/* Areas for Improvement */}
            {areasForImprovement && areasForImprovement.length > 0 && (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 500 }}
                style={{
                  backgroundColor: '#FEF3C7',
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: '#FCD34D'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#F59E0B' + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <AntDesign name="exclamationcircle" size={18} color="#F59E0B" />
                  </View>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#1F2937'
                  }}>
                    Areas for Improvement
                  </Text>
                </View>
                {areasForImprovement.map((area, index) => (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                    <View style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#F59E0B',
                      marginTop: 8,
                      marginRight: 12
                    }} />
                    <Text style={{
                      fontSize: 15,
                      color: '#374151',
                      lineHeight: 22,
                      flex: 1
                    }}>
                      {area}
                    </Text>
                  </View>
                ))}
              </MotiView>
            )}

            {/* Recommendations */}
            {recommendations && recommendations.length > 0 && (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 600 }}
                style={{
                  backgroundColor: '#F3E8FF',
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: '#C4B5FD'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#7C3AED' + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <AntDesign name="star" size={18} color="#7C3AED" />
                  </View>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#1F2937'
                  }}>
                    Recommendations
                  </Text>
                </View>
                {recommendations.map((recommendation, index) => (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                    <View style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#7C3AED',
                      marginTop: 8,
                      marginRight: 12
                    }} />
                    <Text style={{
                      fontSize: 15,
                      color: '#374151',
                      lineHeight: 22,
                      flex: 1
                    }}>
                      {recommendation}
                    </Text>
                  </View>
                ))}
              </MotiView>
            )}
          </ScrollView>
        </MotiView>
      </View>
    </Modal>
  );
};

export default FeedbackModal;
