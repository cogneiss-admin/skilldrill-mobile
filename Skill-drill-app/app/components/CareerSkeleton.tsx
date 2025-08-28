// @ts-nocheck
import React from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

const BRAND = '#0A66C2';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SkeletonLine = ({ width = '100%', height = 14, radius = 8, style = {} }) => (
  <View style={{ width, height, borderRadius: radius, backgroundColor: '#E5E7EB', overflow: 'hidden', ...style }}>
    <MotiView from={{ translateX: -SCREEN_WIDTH }} animate={{ translateX: SCREEN_WIDTH }} transition={{ type: 'timing', duration: 1200, loop: true }} style={{ width: '50%', height: '100%' }}>
      <LinearGradient colors={["#E5E7EB", "#F3F4F6", "#E5E7EB"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
    </MotiView>
  </View>
);

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
    <View style={{ flex: 1, backgroundColor: BRAND }}>
      {/* Header shimmer */}
      <View style={{ minHeight: 200, position: 'relative' }}>
        <LinearGradient colors={[BRAND, '#0E75D1', '#1285E0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10 }}>
          <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.25)' }} />
          <SkeletonLine width={140} height={20} radius={6} style={{ marginLeft: 12 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 18 }}>
          <SkeletonLine width={260} height={20} radius={6} />
          <SkeletonLine width={180} height={14} radius={6} style={{ marginTop: 8 }} />
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, marginTop: -24 }}>
        <View style={{ flex: 1, backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 18 }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
            <SkeletonLine width={'40%'} height={16} radius={6} style={{ marginBottom: 10 }} />
            {Array.from({ length: 3 }).map((_, i) => <ChoiceSkeleton key={`career-${i}`} />)}

            <View style={{ height: 18 }} />
            <SkeletonLine width={'50%'} height={16} radius={6} style={{ marginBottom: 10 }} />
            {Array.from({ length: 3 }).map((_, i) => <ChoiceSkeleton key={`role-${i}`} />)}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default CareerSkeleton;


