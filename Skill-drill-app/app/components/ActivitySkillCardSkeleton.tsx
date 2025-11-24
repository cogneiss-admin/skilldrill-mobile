import React from 'react';
import { View, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import SkeletonLine from './SkeletonLine';
import { BRAND } from './Brand';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ActivitySkillCardSkeletonProps {
  index: number;
}

const ActivitySkillCardSkeleton: React.FC<ActivitySkillCardSkeletonProps> = ({ index }) => {
  const base = Math.min(1, SCREEN_WIDTH / 390);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 40, scale: 0.97 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'spring', delay: index * 80, damping: 16, stiffness: 110 }}
      style={{ marginBottom: 12 }}
    >
      <View style={{
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden',
        marginHorizontal: 4
      }}>
        <LinearGradient colors={[BRAND, '#0056B3']} style={{ padding: 14 * base, paddingBottom: 12 * base }}>
          <SkeletonLine width={'70%'} height={20 * base} radius={6} />
        </LinearGradient>

        <View style={{ padding: 14 * base }}>
          <SkeletonLine width={'30%'} height={14 * base} radius={6} style={{ marginBottom: 8 * base }} />
          <SkeletonLine width={'95%'} height={12 * base} radius={6} style={{ marginBottom: 6 * base }} />
          <SkeletonLine width={'90%'} height={12 * base} radius={6} style={{ marginBottom: 6 * base }} />
          <SkeletonLine width={'70%'} height={12 * base} radius={6} style={{ marginBottom: 12 * base }} />

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <SkeletonLine width={140} height={28} radius={999} />
            <View style={{ flex: 1 }} />
            <SkeletonLine width={110} height={28} radius={999} />
          </View>

          <View style={{ paddingTop: 10 * base, borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 12 * base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <SkeletonLine width={120} height={12 * base} radius={6} />
            <SkeletonLine width={70} height={16 * base} radius={6} />
          </View>
        </View>
      </View>
    </MotiView>
  );
};

export default ActivitySkillCardSkeleton;


