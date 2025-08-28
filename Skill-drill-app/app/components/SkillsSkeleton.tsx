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

const Pill = () => (
  <SkeletonLine width={120} height={28} radius={999} style={{ marginRight: 8, marginBottom: 8 }} />
);

const SectionSkeleton = ({ titleWidth = '60%' }) => (
  <View style={{ marginBottom: 20 }}>
    <SkeletonLine width={titleWidth} height={16} radius={6} style={{ marginBottom: 12 }} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Pill key={i} />
      ))}
    </View>
  </View>
);

const SkillsSkeleton: React.FC = () => {
  return (
    <View style={{ flex: 1, backgroundColor: BRAND }}>
      {/* Header shimmer */}
      <View style={{ minHeight: 200, position: 'relative' }}>
        <LinearGradient colors={[BRAND, '#0E75D1', '#1285E0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10 }}>
          <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.25)' }} />
          <SkeletonLine width={140} height={20} radius={6} style={{ marginLeft: 12 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 18, paddingBottom: 20 }}>
          <SkeletonLine width={200} height={22} radius={6} />
          <SkeletonLine width={260} height={14} radius={6} style={{ marginTop: 8 }} />
          <SkeletonLine width={220} height={12} radius={6} style={{ marginTop: 6 }} />
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, marginTop: -24 }}>
        <View style={{ flex: 1, backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 24 }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            <SectionSkeleton titleWidth={'70%'} />
            <SectionSkeleton titleWidth={'60%'} />
            <SectionSkeleton titleWidth={'50%'} />
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default SkillsSkeleton;


