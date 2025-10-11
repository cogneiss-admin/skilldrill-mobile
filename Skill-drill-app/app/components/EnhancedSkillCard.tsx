import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';

interface EnhancedSkillCardProps {
  skill: any;
  index: number;
  brand?: string;
}

const DEFAULT_BRAND = '#0A66C2';


const EnhancedSkillCard: React.FC<EnhancedSkillCardProps> = ({ 
  skill,
  index,
  brand = DEFAULT_BRAND
}) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  
  const name = skill?.name;
  const category = skill?.category;
  const tier = skill?.skillTier?.name;
  const skillId = skill?.id || skill?.skill_id;

  const handleAdaptiveAssessment = () => {
    if (!skillId) {
      Alert.alert('Error', 'Skill ID not found. Please try again.');
      return;
    }

    router.push({
      pathname: "/adaptive-assessment",
      params: {
        skillId: skillId,
        skillName: name
      }
    });
  };


  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: index * 60 }}
    >
      <View style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 16,
      }}>
        {/* Skill Header */}
        <TouchableOpacity
          onPress={handleAdaptiveAssessment}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#111827',
                marginBottom: 4,
              }} numberOfLines={2}>
                {name}
              </Text>
              <Text style={{
                fontSize: 12,
                color: '#6B7280',
                marginBottom: 8,
              }} numberOfLines={1}>
                {tier}{category ? ` · ${category}` : ''}
              </Text>
              
              {/* Skill indicators */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: brand, marginRight: 4 }} />
                  <Text style={{ fontSize: 11, color: brand, fontWeight: '600' }}>AI Adaptive</Text>
                </View>
              </View>
            </View>

            {/* Expand/Collapse Icon */}
            <TouchableOpacity
              onPress={() => setExpanded(!expanded)}
              style={{
                padding: 8,
                borderRadius: 20,
                backgroundColor: expanded ? brand : '#F3F4F6',
              }}
            >
              <AntDesign
                name={expanded ? "up" : "down"}
                size={16}
                color={expanded ? 'white' : '#666'}
              />
            </TouchableOpacity>
          </View>

          {/* Quick Action Button */}
          <View style={{ marginTop: 12 }}>
            <Button
              mode="contained"
              onPress={handleAdaptiveAssessment}
              buttonColor={brand}
              style={{ borderRadius: 8 }}
              contentStyle={{ paddingVertical: 4 }}
              labelStyle={{ fontSize: 14, fontWeight: '600' }}
            >
              Start AI Adaptive Assessment
            </Button>
          </View>
        </TouchableOpacity>

        {/* Expanded Assessment Options */}
        <MotiView
          animate={{
            height: expanded ? 'auto' : 0,
            opacity: expanded ? 1 : 0,
          }}
          transition={{ type: 'timing', duration: 300 }}
          style={{ overflow: 'hidden' }}
        >
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
            {/* New Adaptive Assessment Option */}
            <View style={{
              backgroundColor: '#F0F9FF',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderLeftWidth: 4,
              borderLeftColor: brand,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name="psychology" size={20} color={brand} />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#1F2937',
                  marginLeft: 8,
                }}>
                  AI Adaptive Assessment
                </Text>
                <View style={{
                  backgroundColor: '#EF4444',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 10,
                  marginLeft: 8,
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>NEW</Text>
                </View>
              </View>
              
              <Text style={{
                fontSize: 13,
                color: '#6B7280',
                lineHeight: 18,
                marginBottom: 12,
              }}>
                Personalized assessment that adapts to your responses and provides AI-generated feedback with your communication style.
              </Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                  <MaterialIcons name="timer" size={14} color="#6B7280" />
                  <Text style={{ fontSize: 11, color: '#6B7280', marginLeft: 4 }}>5-10 min</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                  <MaterialIcons name="trending-up" size={14} color="#6B7280" />
                  <Text style={{ fontSize: 11, color: '#6B7280', marginLeft: 4 }}>Adaptive</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="psychology" size={14} color="#6B7280" />
                  <Text style={{ fontSize: 11, color: '#6B7280', marginLeft: 4 }}>AI Powered</Text>
                </View>
              </View>
              
              <Button
                mode="contained"
                onPress={handleAdaptiveAssessment}
                buttonColor={brand}
                style={{ borderRadius: 8 }}
                contentStyle={{ paddingVertical: 4 }}
                labelStyle={{ fontSize: 14, fontWeight: '600' }}
              >
                Start Adaptive Assessment
              </Button>
            </View>

          </View>
        </MotiView>
      </View>
    </MotiView>
  );
};

export default EnhancedSkillCard;