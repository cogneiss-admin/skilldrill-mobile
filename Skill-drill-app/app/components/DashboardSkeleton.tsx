// @ts-nocheck
import React from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

const BRAND = '#0A66C2';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SkeletonLine = ({ width = '100%', height = 14, radius = 8, style = {} }) => (
  <View style={{
    width,
    height,
    borderRadius: radius,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    ...style
  }}>
    <MotiView
      from={{ translateX: -SCREEN_WIDTH }}
      animate={{ translateX: SCREEN_WIDTH }}
      transition={{ type: 'timing', duration: 1200, loop: true }}
      style={{ width: '50%', height: '100%' }}
    >
      <LinearGradient colors={["#E5E7EB", "#F3F4F6", "#E5E7EB"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
    </MotiView>
  </View>
);

const CardSkeleton = ({ height = 160 }) => (
  <View style={{
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E6F2FF'
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
      <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#E5E7EB', marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <SkeletonLine width={'40%'} height={18} radius={6} />
        <SkeletonLine width={'60%'} height={12} radius={6} style={{ marginTop: 6 }} />
      </View>
    </View>
    <SkeletonLine width={'90%'} height={12} radius={6} style={{ marginBottom: 8 }} />
    <SkeletonLine width={'95%'} height={12} radius={6} style={{ marginBottom: 8 }} />
    <SkeletonLine width={'70%'} height={12} radius={6} />
  </View>
);

const DashboardSkeleton: React.FC = () => {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[BRAND, '#1E40AF', '#3B82F6']} style={{ paddingTop: 20, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)' }} />
            <SkeletonLine width={120} height={16} radius={6} style={{ marginLeft: 10 }} />
          </View>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)' }} />
        </View>
        <View style={{ marginTop: 25 }}>
          <SkeletonLine width={120} height={14} radius={6} />
          <SkeletonLine width={180} height={20} radius={6} style={{ marginTop: 8 }} />
          <SkeletonLine width={220} height={14} radius={6} style={{ marginTop: 8 }} />
        </View>
      </LinearGradient>

      <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
        {/* Progress card */}
        <CardSkeleton />
        {/* Quick actions */}
        <CardSkeleton />
        {/* Skills overview */}
        <CardSkeleton />
        {/* Recent results */}
        <CardSkeleton />
      </View>
    </ScrollView>
  );
};

export default DashboardSkeleton;


