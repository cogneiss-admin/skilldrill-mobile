import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, TextInput, TouchableOpacity, ScrollView, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavigation from '../components/BottomNavigation';
import { SCREEN_BACKGROUND, SCREEN_CONTAINER_BACKGROUND, TYPOGRAPHY, COLORS, SPACING, BORDER_RADIUS, BRAND, BRAND_LIGHT } from './components/Brand';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SIZE = (SCREEN_WIDTH - SPACING.padding.lg * 2 - SPACING.padding.md) / 2;
const PAGE_WIDTH = SCREEN_WIDTH - SPACING.padding.lg * 2;

interface Category {
  id: string;
  name: string;
}

interface Skill {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

interface Recommendation {
  type: 'assessment' | 'drillPack';
  skillId: string;
  skillName: string;
  category?: string;
  createdAt: string;
  // For assessment type
  userSkillId?: string;
  // For drillPack type
  recommendationId?: string;
  assessmentId?: string;
  drillCount?: number;
  price?: number;
  pricePerDrill?: number;
  currency?: string;
  pricingMode?: string;
}

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  // Debounce search query - 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim().toLowerCase());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter categories based on debounced search
  const filteredCategories = useMemo(() => {
    if (!debouncedSearchQuery) return categories;
    return categories.filter(category =>
      category.name.toLowerCase().includes(debouncedSearchQuery)
    );
  }, [categories, debouncedSearchQuery]);

  // Filter recommendations based on debounced search
  const filteredRecommendations = useMemo(() => {
    if (!debouncedSearchQuery) return recommendations;
    return recommendations.filter(rec =>
      rec.skillName.toLowerCase().includes(debouncedSearchQuery) ||
      (typeof rec.category === 'string' && rec.category.toLowerCase().includes(debouncedSearchQuery))
    );
  }, [recommendations, debouncedSearchQuery]);

  const getInitials = (name: string): string => {
    const words = name.trim().split(' ').filter(word => word.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const loadData = async () => {
    setLoading(true);
    const careerLevelId = user?.careerLevelId;

    try {
      // Load categories
      const categoriesResponse = await apiService.get(`/skills/career-level/${careerLevelId}/categories`);

      if (categoriesResponse.success && categoriesResponse.data) {
        const skillGroups = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : categoriesResponse.data?.skillGroups || [];

        const categoryMap = new Map<string, Category>();

        skillGroups.forEach((group: { title?: string; skills?: any[] }) => {
          if (group.title && !categoryMap.has(group.title)) {
            categoryMap.set(group.title, {
              id: group.title.toLowerCase().replace(/\s+/g, '-'),
              name: group.title,
            });
          }
        });

        setCategories(Array.from(categoryMap.values()));
      }

      // Load recommendations
      const recommendationsResponse = await apiService.getUserRecommendations();

      if (recommendationsResponse.success && recommendationsResponse.data) {
        const { pendingAssessments = [], unpurchasedDrills = [] } = recommendationsResponse.data;

        // Merge both arrays and sort by createdAt
        const allRecommendations = [...pendingAssessments, ...unpurchasedDrills].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        setRecommendations(allRecommendations);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refetch data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.careerLevelId) {
        loadData();
      }
    }, [user?.careerLevelId])
  );

  const categoryPages = useMemo(() => {
    const pages: Category[][] = [];
    for (let i = 0; i < filteredCategories.length; i += 4) {
      pages.push(filteredCategories.slice(i, i + 4));
    }
    return pages;
  }, [filteredCategories]);

  const renderCategoryPage = ({ item }: { item: Category[] }) => (
    <View style={styles.categoryPage}>
      {item.map((category, index) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryCard,
            index % 2 === 0 && styles.categoryCardLeft,
            index % 2 === 1 && styles.categoryCardRight,
            index < 2 && styles.categoryCardTop,
            index >= 2 && styles.categoryCardBottom,
          ]}
          activeOpacity={0.8}
        >
          <View style={styles.categoryAvatar}>
            <Text style={styles.categoryInitials}>{getInitials(category.name)}</Text>
          </View>
          <Text style={styles.categoryName} numberOfLines={2}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Discover</Text>
            <TouchableOpacity 
              style={styles.notificationButton}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.text.tertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for skills or drills..."
              placeholderTextColor={COLORS.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={20} color={COLORS.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Skill Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Skill Categories</Text>
        </View>

        {/* Categories Grid - 2x2 Grid Horizontal Scrollable */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading categories...</Text>
          </View>
        ) : filteredCategories.length > 0 ? (
          <FlatList
            data={categoryPages}
            renderItem={renderCategoryPage}
            keyExtractor={(_, index) => `page-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesListContainer}
            pagingEnabled={false}
            snapToInterval={PAGE_WIDTH + SPACING.padding.md}
            decelerationRate="fast"
          />
        ) : (
          <View style={styles.emptyStateCard}>
            <LottieView
              source={require('../assets/lottie/NotFoundAnime.json')}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
            <Text style={styles.emptyStateTitle}>
              {debouncedSearchQuery ? 'No categories match your search' : 'No skill categories found.'}
            </Text>
            {!debouncedSearchQuery && (
              <TouchableOpacity activeOpacity={0.8} onPress={() => router.push({ pathname: '/auth/skills', params: { returnTo: 'discover' } })}>
                <Text style={styles.emptyStateLink}>Explore All Skills</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Recommendations Section - Vertical List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended For You</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading recommendations...</Text>
          </View>
        ) : filteredRecommendations.length > 0 ? (
          <View style={styles.recommendationsListContainer}>
            {filteredRecommendations.map((recommendation) => (
              <TouchableOpacity
                key={recommendation.type === 'assessment' ? recommendation.userSkillId : recommendation.recommendationId}
                style={[
                  styles.recommendationCard,
                  recommendation.type === 'drillPack' && styles.paidDrillCard
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  if (recommendation.type === 'assessment') {
                    // Navigate to Activity screen with assessments tab
                    router.push({ pathname: '/activity', params: { tab: 'assessments' } });
                  } else {
                    // Navigate to Activity screen with drills tab
                    router.push({ pathname: '/activity', params: { tab: 'drills' } });
                  }
                }}
              >
                <View style={styles.skillIconContainer}>
                  <Text style={styles.skillInitials}>{getInitials(recommendation.skillName)}</Text>
                </View>
                <View style={styles.skillContent}>
                  <Text style={styles.skillName} numberOfLines={1}>
                    {recommendation.skillName}
                  </Text>
                  {recommendation.type === 'assessment' ? (
                    <Text style={styles.skillBadge}>Free Assessment</Text>
                  ) : (
                    <View style={styles.paidDrillBadge}>
                      <Ionicons name="lock-closed" size={14} color="#DAA520" />
                      <Text style={styles.paidDrillText}>Paid Drills</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={recommendation.type === 'drillPack' ? '#DAA520' : COLORS.text.tertiary} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyStateCard}>
            <LottieView
              source={require('../assets/lottie/NotFoundAnime.json')}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
            <Text style={styles.emptyStateTitle}>
              {debouncedSearchQuery ? 'No recommendations match your search' : 'No New Recommendations are available at present'}
            </Text>
            {!debouncedSearchQuery && (
              <TouchableOpacity activeOpacity={0.8} onPress={() => router.push({ pathname: '/auth/skills', params: { returnTo: 'discover' } })}>
                <Text style={styles.emptyStateLink}>Explore All Skills</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Premium Upgrade Card */}
        <View style={styles.premiumCardContainer}>
          <LinearGradient
            colors={['#1e293b', '#0f172a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premiumCard}
          >
            {/* Decorative Badge Icon */}
            <View style={styles.premiumBadgeContainer}>
              <Ionicons name="ribbon" size={80} color="#d97706" style={styles.premiumBadgeIcon} />
            </View>

            <Text style={styles.premiumTitle}>Unlock Your Full Potential</Text>
            <Text style={styles.premiumDescription}>
              Get unlimited access to all drills, advanced analytics, and personalized feedback with Premium.
            </Text>
            <TouchableOpacity
              style={styles.premiumButton}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/subscriptionScreen', params: { mode: 'subscription' } })}
            >
              <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>

      <BottomNavigation activeTab="discover" />
    </SafeAreaView>
  );
}

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
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: SPACING.padding.lg,
    paddingBottom: SPACING.padding.md,
    paddingHorizontal: SPACING.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#D0D0D0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.padding.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.3,
  },
  notificationButton: {
    padding: SPACING.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.padding.md,
    height: 48,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.primary,
    paddingVertical: 0,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.padding.lg,
    paddingTop: SPACING.padding.lg,
    paddingBottom: SPACING.padding.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  categoriesListContainer: {
    paddingLeft: SPACING.padding.lg,
    paddingRight: SPACING.padding.lg,
    paddingBottom: SPACING.padding.lg,
  },
  categoryPage: {
    width: PAGE_WIDTH,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: SPACING.padding.md,
  },
  categoryCard: {
    width: CARD_SIZE,
    height: 140,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.padding.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  categoryCardLeft: {
    marginRight: SPACING.padding.md,
  },
  categoryCardRight: {
    marginLeft: 0,
  },
  categoryCardTop: {
    marginBottom: SPACING.padding.md,
  },
  categoryCardBottom: {
    marginTop: 0,
  },
  categoryAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: BRAND_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.padding.sm,
  },
  categoryInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  skillIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: BRAND_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  skillInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND,
  },
  skillContent: {
    flex: 1,
    marginLeft: SPACING.padding.md,
    marginRight: SPACING.padding.md,
  },
  skillName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  skillBadge: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '500',
    color: COLORS.success,
  },
  recommendationsListContainer: {
    paddingHorizontal: SPACING.padding.lg,
    paddingBottom: SPACING.padding.lg,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.padding.md,
    marginBottom: SPACING.padding.md,
  },
  paidDrillCard: {
    borderWidth: 1.5,
    borderColor: '#DAA520',
    shadowColor: '#DAA520',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  paidDrillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidDrillText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: '#DAA520',
    marginLeft: 4,
  },
  loadingContainer: {
    padding: SPACING.padding.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.tertiary,
  },
  emptyStateCard: {
    marginHorizontal: SPACING.padding.lg,
    marginBottom: SPACING.padding.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.padding.md,
    paddingHorizontal: SPACING.padding.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  emptyStateTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.tertiary,
    marginBottom: SPACING.padding.sm,
    textAlign: 'center',
  },
  emptyStateLink: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    color: BRAND,
  },
  lottieAnimation: {
    width: 100,
    height: 100,
  },
  premiumCardContainer: {
    paddingHorizontal: SPACING.padding.lg,
    paddingBottom: SPACING.padding.lg,
    marginTop: SPACING.padding.md,
  },
  premiumCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.padding.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  premiumBadgeContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
    opacity: 0.3,
  },
  premiumBadgeIcon: {
    transform: [{ rotate: '15deg' }],
  },
  premiumTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.padding.sm,
  },
  premiumDescription: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: '#94a3b8',
    lineHeight: 22,
    marginBottom: SPACING.padding.lg,
  },
  premiumButton: {
    backgroundColor: '#f59e0b',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.padding.md,
    paddingHorizontal: SPACING.padding.xl,
    alignSelf: 'flex-start',
  },
  premiumButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    color: '#1e293b',
  },
});

