// @ts-nocheck
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';

interface SkillCardProps {
  skill: any;
  isSelected: boolean;
  onPress: () => void;
  index: number;
  brand?: string;
  hasAssessment?: boolean;
}

const DEFAULT_BRAND = '#0A66C2';

const getTierLabel = (tier?: string) => {
  switch (tier) {
    case 'TIER_1_CORE_SURVIVAL':
      return 'Core Survival';
    case 'TIER_2_PROGRESSION':
      return 'Progression';
    case 'TIER_3_EXECUTIVE':
      return 'Executive';
    default:
      return 'General';
  }
};

const SkillCard: React.FC<SkillCardProps> = ({ skill, isSelected, onPress, index, brand = DEFAULT_BRAND, hasAssessment = false }) => {
  const name = skill?.name || skill?.skill_name || 'Unknown Skill';
  const category = skill?.category || '';
  const tier = getTierLabel(skill?.tier);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: index * 60 }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{
          backgroundColor: isSelected ? '#E6F2FF' : '#FFFFFF',
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: isSelected ? brand : '#E5E7EB',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 2
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '700',
              color: '#111827'
            }} numberOfLines={1}>
              {name}
            </Text>
            <Text style={{
              marginTop: 4,
              fontSize: 12,
              color: '#6B7280'
            }} numberOfLines={1}>
              {tier}{category ? ` · ${category}` : ''}
            </Text>
          </View>

          {/* Right-side status pill */}
          <View style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: isSelected ? brand : '#F3F4F6',
            borderWidth: isSelected ? 0 : 1,
            borderColor: '#E5E7EB',
            minWidth: 78,
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '700',
              color: isSelected ? '#FFFFFF' : '#374151'
            }}>
              {isSelected ? 'Selected' : 'Select'}
            </Text>
          </View>
        </View>

        {/* Existing assessment note */}
        {hasAssessment && (
          <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 }} />
            <Text style={{ fontSize: 11, color: '#059669', fontWeight: '600' }}>Assessment exists</Text>
          </View>
        )}
      </TouchableOpacity>
    </MotiView>
  );
};

export default SkillCard;


