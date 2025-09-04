// @ts-nocheck
import React from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import SkeletonLine from './SkeletonLine';
import { BRAND, GRADIENTS, SPACING, BORDER_RADIUS, COLORS } from './Brand';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Pill = () => (
  <SkeletonLine width={120} height={28} radius={BORDER_RADIUS.full} style={{ marginRight: SPACING.margin.xs, marginBottom: SPACING.margin.xs }} />
);

const SectionSkeleton = ({ titleWidth = '60%' }) => (
  <View style={{ marginBottom: SPACING.margin.lg }}>
    <SkeletonLine width={titleWidth} height={16} radius={BORDER_RADIUS.sm} style={{ marginBottom: SPACING.margin.sm }} />
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
        <LinearGradient colors={GRADIENTS.footer} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.padding.md, paddingTop: SPACING.padding.sm }}>
          <View style={{ width: 56, height: 56, borderRadius: BORDER_RADIUS.md, backgroundColor: 'rgba(255,255,255,0.25)' }} />
          <SkeletonLine width={140} height={20} radius={BORDER_RADIUS.sm} style={{ marginLeft: SPACING.margin.sm }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.padding.md, paddingBottom: SPACING.padding.lg }}>
          <SkeletonLine width={200} height={22} radius={BORDER_RADIUS.sm} />
          <SkeletonLine width={260} height={14} radius={BORDER_RADIUS.sm} style={{ marginTop: SPACING.margin.xs }} />
          <SkeletonLine width={220} height={12} radius={BORDER_RADIUS.sm} style={{ marginTop: SPACING.margin.xs }} />
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, marginTop: -SPACING.margin['2xl'] }}>
        <View style={{ flex: 1, backgroundColor: COLORS.background.primary, borderTopLeftRadius: BORDER_RADIUS['2xl'], borderTopRightRadius: BORDER_RADIUS['2xl'], paddingTop: SPACING.padding['2xl'] }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.padding.md, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
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


