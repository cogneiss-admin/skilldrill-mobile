import React, { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StripeProvider } from '@stripe/stripe-react-native';

import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  SHADOWS,
  BRAND,
  SCREEN_BACKGROUND
} from './components/Brand';
import SelectionCard from './components/SelectionCard';
import PlanCard from './components/PlanCard';
import SwipeButton from './components/SwipeButton';
import SubscriberView from './components/SubscriberView';
import { usePayment } from '../hooks/usePayment';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../hooks/useToast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Subscription Plans (Coming Soon - for future implementation)
const SUBSCRIPTION_PLANS = [
  { id: '12_months', duration: '12 Months', price: '$3.99/month', savings: 'Save 60%', badge: 'BEST VALUE' as const },
  { id: '6_months', duration: '6 Months', price: '$5.99/month', savings: 'Save 40%', badge: 'POPULAR' as const },
  { id: '3_months', duration: '3 Months', price: '$7.99/month', savings: 'Save 20%' },
  { id: '1_month', duration: '1 Month', price: '$9.99/month' },
];

export default function SubscriptionScreen() {
  // Get params - can come from activity screen (drill unlock) or profile (subscription mode)
  const params = useLocalSearchParams<{
    recommendationId?: string;
    skillId?: string;
    assessmentId?: string;
    drillCount?: string;
    price?: string;
    currency?: string;
    mode?: string; // 'subscription' when coming from profile
  }>();

  // Check if this is subscription-only mode (from profile)
  const isSubscriptionMode = params.mode === 'subscription';

  // Hooks
  const { processPayment, processing } = usePayment();
  const { hasActiveSubscription, availableCredits, unlockWithCredits } = useSubscription();
  const { showError, showSuccess } = useToast();

  // Parse params - only required when NOT in subscription mode
  const drillCount = params.drillCount ? parseInt(params.drillCount, 10) : 0;
  const drillPrice = params.price ? parseFloat(params.price) : 0;
  const currency = params.currency;

  // Validate required data is present (only for drill unlock flow, not subscription mode)
  const hasRequiredData = isSubscriptionMode || (params.recommendationId && params.skillId && params.price && params.drillCount && params.currency);

  // State
  const [selectedOption, setSelectedOption] = useState<'subscription' | 'one-time'>(isSubscriptionMode ? 'subscription' : 'one-time');
  const [selectedPlanId, setSelectedPlanId] = useState('6_months');
  const [isProcessing, setIsProcessing] = useState(false);

  // Format price for display
  const formatPrice = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formattedDrillPrice = (!isSubscriptionMode && currency) ? formatPrice(drillPrice, currency) : '';

  // Handle drill pack payment (real implementation)
  const handleDrillPackPayment = async () => {
    if (!params.recommendationId || !params.skillId) {
      showError('Missing required information. Please try again.');
      return;
    }

    try {
      setIsProcessing(true);

      await processPayment({
        recommendationId: params.recommendationId,
        metadata: {
          skillId: params.skillId,
          assessmentId: params.assessmentId,
          recommendationId: params.recommendationId,
        },
        onSuccess: (assignmentId) => {
          showSuccess('Payment successful! Your drills are unlocked.');
          // Redirect to Activity page (drills tab) - user will click "Start" to generate drills
          router.push({
            pathname: '/activity',
            params: { tab: 'drills' }
          });
        },
        onCancel: () => {
          setIsProcessing(false);
        }
      });
    } catch (error: any) {
      showError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle subscription credit usage (for subscribers)
  const handleUseCredit = async () => {
    if (!params.skillId) {
      showError('Missing skill information.');
      return;
    }

    try {
      setIsProcessing(true);
      const assignmentId = await unlockWithCredits({
        skillId: params.skillId,
        assessmentId: params.assessmentId,
        recommendationId: params.recommendationId,
      });

      showSuccess('Drills unlocked! Tap Start to begin practice.');
      // Redirect to Activity page (drills tab) - user will click "Start" to generate drills
      router.push({
        pathname: '/activity',
        params: { tab: 'drills' }
      });
    } catch (error: any) {
      showError(error.message || 'Failed to unlock drills.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle swipe success - only called when drill pack is selected (button disabled for subscription)
  const handleSwipeSuccess = () => {
    // Process drill pack payment
    handleDrillPackPayment();
  };

  // If required data is missing, show error state
  if (!hasRequiredData) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={SCREEN_WIDTH * 0.05} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Unlock Your Drills</Text>
          </View>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={SCREEN_WIDTH * 0.15} color={COLORS.text.tertiary} />
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>
              Unable to load pricing information. Please go back and try again.
            </Text>
            <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
              <Text style={styles.errorButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />

          {/* Header - match Profile screen layout */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={SCREEN_WIDTH * 0.05} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isSubscriptionMode ? 'Subscription' : (hasActiveSubscription ? 'Unlock Drills' : 'Unlock Your Drills')}
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Subscription Mode - Show only subscription card and coming soon */}
            {isSubscriptionMode ? (
              <>
                {/* Subscription Card Only */}
                <View style={styles.section}>
                  <SelectionCard
                    title="Unlock Unlimited Drills & More"
                    subtitle="Starting at $3.99/month"
                    features={[
                      {
                        title: 'Unlimited AI-powered drills',
                        description: 'Practice as much as you want — no limits, no restrictions.'
                      },
                      {
                        title: 'Faster learning progress + confidence boost',
                        description: 'Master your communication 5× faster with continuous training.'
                      },
                      {
                        title: 'All skills unlocked instantly',
                        description: 'Access every soft-skill domain the moment you upgrade.'
                      },
                      {
                        title: 'Save up to 70% over time',
                        description: 'Subscription costs far less than buying multiple drill packs.'
                      }
                    ]}
                    isSelected={true}
                    onSelect={() => {}}
                    badge="BEST VALUE"
                  />
                </View>

                {/* Coming Soon Notice */}
                <View style={styles.comingSoonContainer}>
                  <View style={styles.comingSoonCard}>
                    <View style={styles.comingSoonIconContainer}>
                      <Ionicons name="rocket-outline" size={SCREEN_WIDTH * 0.08} color={BRAND} />
                    </View>
                    <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
                    <Text style={styles.comingSoonText}>
                      We're working hard to bring you unlimited subscription plans.
                      Stay tuned for updates!
                    </Text>
                  </View>

                  {/* Preview of Subscription Plans (Disabled) */}
                  <Text style={[styles.sectionTitle, { opacity: 0.5, marginTop: SPACING.margin.lg }]}>
                    Upcoming Subscription Plans
                  </Text>

                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <View key={plan.id} style={{ opacity: 0.4 }}>
                      <PlanCard
                        duration={plan.duration}
                        price={plan.price}
                        savings={plan.savings}
                        isSelected={false}
                        onSelect={() => {}}
                        badge={plan.badge}
                      />
                    </View>
                  ))}
                </View>
              </>
            ) : hasActiveSubscription && availableCredits > 0 ? (
              <SubscriberView
                credits={availableCredits}
                drillCount={drillCount}
                onUseCredit={handleUseCredit}
              />
            ) : (
              <>
                {/* Main Options - Drill Unlock Flow */}
                <View style={styles.section}>
                  {/* Drill Pack Option - Uses Real Price from Backend */}
                  <SelectionCard
                    title="Drill Pack (one-time)"
                    subtitle={`${formattedDrillPrice} one-time payment for ${drillCount} drills.`}
                    price={formattedDrillPrice}
                    variant="one-time"
                    isSelected={selectedOption === 'one-time'}
                    onSelect={() => setSelectedOption('one-time')}
                  />

                  {/* Subscription Option - Coming Soon */}
                  <SelectionCard
                    title="Unlock Unlimited Drills & More"
                    subtitle="Starting at $3.99/month"
                    features={[
                      {
                        title: 'Unlimited AI-powered drills',
                        description: 'Practice as much as you want — no limits, no restrictions.'
                      },
                      {
                        title: 'Faster learning progress + confidence boost',
                        description: 'Master your communication 5× faster with continuous training.'
                      },
                      {
                        title: 'All skills unlocked instantly',
                        description: 'Access every soft-skill domain the moment you upgrade.'
                      },
                      {
                        title: 'Save up to 70% over time',
                        description: 'Subscription costs far less than buying multiple drill packs.'
                      }
                    ]}
                    isSelected={selectedOption === 'subscription'}
                    onSelect={() => setSelectedOption('subscription')}
                    badge="BEST VALUE"
                  />
                </View>

                {/* Coming Soon Notice - Show when subscription is selected */}
                {selectedOption === 'subscription' && (
                  <View style={styles.comingSoonContainer}>
                    <View style={styles.comingSoonCard}>
                      <View style={styles.comingSoonIconContainer}>
                        <Ionicons name="rocket-outline" size={SCREEN_WIDTH * 0.08} color={BRAND} />
                      </View>
                      <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
                      <Text style={styles.comingSoonText}>
                        We're working hard to bring you unlimited subscription plans.
                        For now, you can purchase drill packs to start practicing.
                      </Text>
                      <TouchableOpacity
                        style={styles.switchToDrillPackButton}
                        onPress={() => setSelectedOption('one-time')}
                      >
                        <Text style={styles.switchToDrillPackText}>
                          Switch to Drill Pack ({formattedDrillPrice})
                        </Text>
                        <Ionicons name="arrow-forward" size={SCREEN_WIDTH * 0.04} color={BRAND} />
                      </TouchableOpacity>
                    </View>

                    {/* Preview of Subscription Plans (Disabled) */}
                    <Text style={[styles.sectionTitle, { opacity: 0.5, marginTop: SPACING.margin.lg }]}>
                      Upcoming Subscription Plans
                    </Text>

                    {SUBSCRIPTION_PLANS.map((plan) => (
                      <View key={plan.id} style={{ opacity: 0.4 }}>
                        <PlanCard
                          duration={plan.duration}
                          price={plan.price}
                          savings={plan.savings}
                          isSelected={false}
                          onSelect={() => {}}
                          badge={plan.badge}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Fixed Footer - Only show for non-subscription mode and non-subscriber */}
          {!isSubscriptionMode && !(hasActiveSubscription && availableCredits > 0) && (
            <View style={styles.footer}>
              {/* SwipeButton - disabled when subscription is selected */}
              <SwipeButton
                onSwipeSuccess={handleSwipeSuccess}
                loading={isProcessing || processing}
                disabled={selectedOption === 'subscription'}
              />

              <View style={styles.securePayment}>
                <Ionicons name="lock-closed-outline" size={SCREEN_WIDTH * 0.03} color={COLORS.text.tertiary} />
                <Text style={styles.secureText}>Secure payment powered by Stripe</Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </GestureHandlerRootView>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCREEN_BACKGROUND,
  },
  header: {
    paddingVertical: SCREEN_WIDTH * 0.04,
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.gray[300],
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: SCREEN_WIDTH * 0.048,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginRight: SCREEN_WIDTH * 0.05, // Offset for back button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.md,
    color: COLORS.text.tertiary
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: SCREEN_WIDTH * 0.1,
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    paddingTop: SCREEN_WIDTH * 0.05,
  },
  section: {
    marginBottom: SCREEN_WIDTH * 0.08,
  },
  sectionTitle: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SCREEN_WIDTH * 0.04,
    marginTop: SCREEN_WIDTH * 0.025,
  },
  footer: {
    paddingTop: SCREEN_WIDTH * 0.04,
    paddingBottom: SCREEN_WIDTH * 0.04,
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  payButton: {
    backgroundColor: BRAND,
    borderRadius: SCREEN_WIDTH * 0.075,
    height: SCREEN_WIDTH * 0.14,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  payButtonText: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '700',
    color: COLORS.white,
  },
  securePayment: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SCREEN_WIDTH * 0.04,
    gap: SCREEN_WIDTH * 0.01,
  },
  secureText: {
    fontSize: SCREEN_WIDTH * 0.03,
    color: COLORS.text.tertiary,
  },
  // Coming Soon Styles
  comingSoonContainer: {
    marginTop: -SCREEN_WIDTH * 0.04,
  },
  comingSoonCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SCREEN_WIDTH * 0.06,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BRAND,
    borderStyle: 'dashed',
    ...SHADOWS.sm,
  },
  comingSoonIconContainer: {
    width: SCREEN_WIDTH * 0.16,
    height: SCREEN_WIDTH * 0.16,
    borderRadius: SCREEN_WIDTH * 0.08,
    backgroundColor: `${BRAND}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SCREEN_WIDTH * 0.04,
  },
  comingSoonTitle: {
    fontSize: SCREEN_WIDTH * 0.05,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SCREEN_WIDTH * 0.025,
  },
  comingSoonText: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: SCREEN_WIDTH * 0.05,
    marginBottom: SCREEN_WIDTH * 0.05,
  },
  switchToDrillPackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${BRAND}10`,
    paddingVertical: SCREEN_WIDTH * 0.03,
    paddingHorizontal: SCREEN_WIDTH * 0.05,
    borderRadius: BORDER_RADIUS.full,
    gap: SCREEN_WIDTH * 0.02,
  },
  switchToDrillPackText: {
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: '600',
    color: BRAND,
  },
  // Error State Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.1,
  },
  errorTitle: {
    fontSize: SCREEN_WIDTH * 0.05,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginTop: SCREEN_WIDTH * 0.04,
    marginBottom: SCREEN_WIDTH * 0.02,
  },
  errorText: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: SCREEN_WIDTH * 0.05,
    marginBottom: SCREEN_WIDTH * 0.06,
  },
  errorButton: {
    backgroundColor: BRAND,
    paddingVertical: SCREEN_WIDTH * 0.035,
    paddingHorizontal: SCREEN_WIDTH * 0.08,
    borderRadius: SCREEN_WIDTH * 0.02,
  },
  errorButtonText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '600',
    color: COLORS.white,
  },
});
