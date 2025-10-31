// @ts-nocheck
import React from 'react';
import { View, ScrollView, Dimensions, Text } from 'react-native';
import { MotiView } from 'moti';
import SkeletonLine from './SkeletonLine';
import { SPACING, BORDER_RADIUS, COLORS } from './Brand';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TierRow = () => (
  <View style={{ marginBottom: 22, position: 'relative' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <View style={{ width: 16 }} />
      <View style={{ width: 18, height: 2, backgroundColor: '#D1D5DB', marginRight: 8 }} />
      <SkeletonLine width={160} height={16} radius={6} />
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 32, alignItems: 'center' }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB' }} />
      </View>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <View style={{
          backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 12, paddingHorizontal: 14
        }}>
          <SkeletonLine width={'60%'} height={16} radius={6} />
          <SkeletonLine width={'40%'} height={12} radius={6} style={{ marginTop: 6 }} />
        </View>
      </View>
    </View>
  </View>
);

const SkillsSkeleton: React.FC = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{ paddingVertical: 16, paddingHorizontal: SPACING.padding.md, borderBottomWidth: 1.5, borderBottomColor: '#D1D5DB', marginHorizontal: -SPACING.padding.md }}>
        <SkeletonLine width={180} height={20} radius={6} style={{ alignSelf: 'center' }} />
      </View>

      {/* Body */}
      <View style={{ flex: 1, backgroundColor: '#F3F4F6', marginHorizontal: -SPACING.padding.md, paddingHorizontal: SPACING.padding.md }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
          <SkeletonLine width={'70%'} height={14} radius={6} style={{ marginBottom: 6 }} />
          <SkeletonLine width={'55%'} height={12} radius={6} style={{ marginBottom: 16 }} />

          {/* Vertical line placeholder */}
          <View style={{ position: 'relative' }}>
            <View style={{ position: 'absolute', left: 16, top: 14, bottom: 0, width: 2, backgroundColor: '#D1D5DB' }} />
            <TierRow />
            <TierRow />
            <TierRow />
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default SkillsSkeleton;


