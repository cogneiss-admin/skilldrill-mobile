import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import BottomNavigation from '../../components/BottomNavigation';
import SkeletonLine from './SkeletonLine';
import { SCREEN_BACKGROUND, SCREEN_CONTAINER_BACKGROUND, SPACING, BORDER_RADIUS, COLORS } from './Brand';

const DashboardShimmer: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header Skeleton */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.emojiSkeleton} />
              <View style={styles.greetingTextSkeleton}>
                <SkeletonLine width="70%" height={22} radius={6} />
              </View>
            </View>
          </View>
          
          {/* Overall Progress Card Skeleton */}
          <View style={styles.progressCard}>
            <View style={styles.animatedLottieSkeleton} />
            <View style={styles.progressContent}>
              <SkeletonLine width="50%" height={20} radius={6} style={styles.progressTitleSkeleton} />
              <View style={styles.progressStats}>
                {[1, 2, 3].map((idx) => (
                  <View key={idx} style={styles.progressStatItem}>
                    <SkeletonLine width={40} height={24} radius={6} />
                    <SkeletonLine width={60} height={14} radius={6} style={styles.progressStatLabelSkeleton} />
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Quick Actions Section Skeleton */}
          <View style={styles.sectionHeader}>
            <SkeletonLine width="40%" height={22} radius={6} />
          </View>

          <View style={styles.quickActionsContainer}>
            {[1, 2].map((idx) => (
              <View key={idx} style={styles.quickActionButtonSkeleton} />
            ))}
          </View>

          {/* Recent Activity Section Skeleton */}
          <View style={styles.sectionHeader}>
            <SkeletonLine width="45%" height={22} radius={6} />
          </View>

          <View style={styles.recentActivityList}>
            {[1, 2, 3].map((idx) => (
              <View key={idx} style={styles.activityCardSkeleton}>
                <View style={styles.activityAvatarSkeleton} />
                <View style={styles.activityContentSkeleton}>
                  <SkeletonLine width="60%" height={16} radius={6} />
                  <SkeletonLine width="40%" height={12} radius={6} style={styles.activityDateSkeleton} />
                </View>
                <View style={styles.activityScoreSkeleton}>
                  <SkeletonLine width={50} height={16} radius={6} />
                  <SkeletonLine width={40} height={12} radius={6} style={styles.activityScoreLabelSkeleton} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNavigation activeTab="home" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCREEN_CONTAINER_BACKGROUND,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: SCREEN_BACKGROUND,
  },
  scrollContent: {
    paddingBottom: 60,
    paddingTop: 5,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.padding.lg,
    paddingTop: SPACING.padding.lg,
    paddingBottom: SPACING.padding.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiSkeleton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border.light,
    marginRight: SPACING.padding.sm,
  },
  greetingTextSkeleton: {
    flex: 1,
  },
  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.padding.lg,
    marginBottom: SPACING.padding.md,
    overflow: 'hidden',
  },
  animatedLottieSkeleton: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.border.light,
  },
  progressContent: {
    paddingTop: SPACING.padding.sm,
    paddingHorizontal: SPACING.padding.md,
    paddingBottom: SPACING.padding.md,
  },
  progressTitleSkeleton: {
    marginBottom: SPACING.padding.sm,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressStatLabelSkeleton: {
    marginTop: SPACING.xs,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.padding.lg,
    paddingTop: SPACING.padding.lg,
    paddingBottom: SPACING.padding.md,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.padding.lg,
    paddingBottom: SPACING.padding.md,
    gap: SPACING.padding.md,
  },
  quickActionButtonSkeleton: {
    flex: 1,
    height: 90,
    backgroundColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.lg,
  },
  recentActivityList: {
    paddingHorizontal: SPACING.padding.lg,
    paddingBottom: SPACING.padding.md,
  },
  activityCardSkeleton: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.padding.sm,
    paddingVertical: SPACING.padding.md,
    paddingHorizontal: SPACING.padding.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityAvatarSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.border.light,
    marginRight: SPACING.padding.md,
  },
  activityContentSkeleton: {
    flex: 1,
    marginRight: SPACING.padding.sm,
  },
  activityDateSkeleton: {
    marginTop: SPACING.xs,
  },
  activityScoreSkeleton: {
    alignItems: 'flex-end',
  },
  activityScoreLabelSkeleton: {
    marginTop: SPACING.xs,
  },
});

export default DashboardShimmer;
