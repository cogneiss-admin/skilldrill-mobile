import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { Skill } from '../../hooks/useSkillsData';

interface SkillCardProps {
  skill: Skill;
  isSelected: boolean;
  onPress: () => void;
  index: number;
  brand?: string;
  hasAssessment?: boolean;
  locked?: boolean;
}

const DEFAULT_BRAND = '#0A66C2';


const SkillCard: React.FC<SkillCardProps> = ({ skill, isSelected, onPress, index, brand = DEFAULT_BRAND, hasAssessment = false, locked = false }) => {
  const name = skill?.name;
  const category = skill?.category;
  const tier = skill?.skillTier?.name;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: index * 60 }}
    >
      <TouchableOpacity
        onPress={locked ? undefined : onPress}
        activeOpacity={0.85}
        style={{
          backgroundColor: locked ? '#F9FAFB' : (isSelected ? '#E6F2FF' : '#FFFFFF'),
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: locked ? '#E5E7EB' : (isSelected ? brand : '#E5E7EB'),
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
              color: locked ? '#9CA3AF' : '#111827'
            }} numberOfLines={1}>
              {name}
            </Text>
            <Text style={{
              marginTop: 4,
              fontSize: 12,
              color: locked ? '#9CA3AF' : '#6B7280'
            }} numberOfLines={1}>
              {tier}{category ? ` · ${category}` : ''}
            </Text>
          </View>

          {/* Right-side status pill */}
          <View style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: locked ? '#E5E7EB' : (isSelected ? brand : '#F3F4F6'),
            borderWidth: isSelected || locked ? 0 : 1,
            borderColor: locked ? '#E5E7EB' : '#E5E7EB',
            minWidth: 78,
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '700',
              color: locked ? '#6B7280' : (isSelected ? '#FFFFFF' : '#374151')
            }}>
              {locked ? 'Locked' : (isSelected ? 'Selected' : 'Select')}
            </Text>
          </View>
        </View>

        {/* Existing assessment note */}
        {hasAssessment && !locked && (
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


