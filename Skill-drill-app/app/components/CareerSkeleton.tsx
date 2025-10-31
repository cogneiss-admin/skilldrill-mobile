// @ts-nocheck
import React from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import SkeletonLine from './SkeletonLine';
import { BRAND } from './Brand';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ChoiceSkeleton = () => (
  <View style={{
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <SkeletonLine width={'60%'} height={16} radius={6} />
        <SkeletonLine width={'40%'} height={12} radius={6} style={{ marginTop: 6 }} />
      </View>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#E5E7EB' }} />
    </View>
  </View>
);

const CareerSkeleton: React.FC = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{ paddingVertical: 16, paddingHorizontal: 18, borderBottomWidth: 1.5, borderBottomColor: '#D1D5DB', marginHorizontal: -18 }}>
        <SkeletonLine width={140} height={20} radius={6} style={{ alignSelf: 'center' }} />
      </View>

      {/* Content */}
      <View style={{ flex: 1, backgroundColor: '#F3F4F6', marginHorizontal: -18, paddingHorizontal: 18 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
          <SkeletonLine width={'40%'} height={16} radius={6} style={{ marginBottom: 10 }} />
          {Array.from({ length: 3 }).map((_, i) => <ChoiceSkeleton key={`career-${i}`} />)}

          <View style={{ height: 18 }} />
          <SkeletonLine width={'50%'} height={16} radius={6} style={{ marginBottom: 10 }} />
          {Array.from({ length: 3 }).map((_, i) => <ChoiceSkeleton key={`role-${i}`} />)}
        </ScrollView>
      </View>
    </View>
  );
};

export default CareerSkeleton;


