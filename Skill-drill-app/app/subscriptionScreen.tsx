import React, { useState, useMemo, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions, ActivityIndicator, Modal } from 'react-native';
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
import { useSubscriptionPlans, SubscriptionPlan } from '../hooks/useSubscriptionPlans';
import { useToast } from '../hooks/useToast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Fallback Subscription Plans (Coming Soon - shown when no plans in backend)
const FALLBACK_SUBSCRIPTION_PLANS = [
  { id: '12_months', duration: '12 Months', price: '$3.99/month', savings: 'Save 60%', badge: 'BEST VALUE' as const },
  { id: '6_months', duration: '6 Months', price: '$5.99/month', savings: 'Save 40%', badge: 'POPULAR' as const },
  { id: '3_months', duration: '3 Months', price: '$7.99/month', savings: 'Save 20%' },
  { id: '1_month', duration: '1 Month', price: '$9.99/month' },
];

// Helper to format plan for display
const formatPlanForDisplay = (plan: SubscriptionPlan, index: number) => {
  // Calculate savings compared to 1-month plan (assuming first plan is longest duration)
  const savingsPercent = plan.durationMonths > 1
    ? Math.round((1 - (plan.monthlyPrice / (plan.price / plan.durationMonths))) * 100) || 0
    : 0;

  return {
    id: plan.planId,
    duration: `${plan.durationMonths} Month${plan.durationMonths > 1 ? 's' : ''}`,
    price: `${plan.monthlyPriceFormatted}/month`,
    totalPrice: plan.priceFormatted,
    savings: savingsPercent > 0 ? `Save ${savingsPercent}%` : undefined,
    badge: index === 0 ? 'BEST VALUE' as const : index === 1 ? 'POPULAR' as const : undefined,
    credits: plan.credits,
  };
};

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
  const { hasActiveSubscription, availableCredits, unlockWithCredits, loading: subscriptionLoading, creditValue } = useSubscription();
  const { plans: subscriptionPlans, hasPlans, loading: plansLoading } = useSubscriptionPlans();
  const { showError, showSuccess } = useToast();

  // Format backend plans for display
  const formattedPlans = subscriptionPlans.map(formatPlanForDisplay);

  // Parse params - only required when NOT in subscription mode
  const drillCount = params.drillCount ? parseInt(params.drillCount, 10) : 0;
  const drillPrice = params.price ? parseFloat(params.price) : 0;
  const currency = params.currency;

  // Calculate credits needed based on drill pack price and credit value
  // Must be calculated AFTER drillPrice and creditValue are defined
  const creditsNeeded = useMemo(() => {
    if (creditValue > 0 && drillPrice > 0) {
      return Math.ceil(drillPrice / creditValue);
    }
    return 0;
  }, [drillPrice, creditValue]);

  // Validate required data is present (only for drill unlock flow, not subscription mode)
  const hasRequiredData = isSubscriptionMode || (params.recommendationId && params.skillId && params.price && params.drillCount && params.currency);

  // State
  const [selectedOption, setSelectedOption] = useState<'subscription' | 'one-time'>(isSubscriptionMode ? 'subscription' : 'one-time');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);

  // Check for out of credits state and trigger modal after delay
  useEffect(() => {
    if (!isSubscriptionMode && hasActiveSubscription && !subscriptionLoading && creditsNeeded > 0) {
      if (availableCredits < creditsNeeded) {
        const timer = setTimeout(() => {
          setShowOutOfCreditsModal(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isSubscriptionMode, hasActiveSubscription, subscriptionLoading, availableCredits, creditsNeeded]);

  const handleRenewMonthly = async () => {
    // Find a monthly plan (durationMonths === 1)
    const monthlyPlan = subscriptionPlans.find(p => p.durationMonths === 1);

    if (monthlyPlan) {
      setShowOutOfCreditsModal(false);
      try {
        setIsProcessing(true);
        await processPayment({
          planId: monthlyPlan.planId,
          onSuccess: () => {
            showSuccess('Plan renewed successfully! Credits refreshed.');
            // Refresh logic if needed, or let the screen update naturally
            router.replace({
              pathname: '/subscriptionScreen',
              params: params
            });
          },
          onCancel: () => {
            setIsProcessing(false);
          }
        });
      } catch (error: any) {
        showError(error.message || 'Renewal failed. Please try again.');
        setIsProcessing(false);
      }
    } else {
      // Fallback if no monthly plan found - redirect to plans list
      setShowOutOfCreditsModal(false);
      handleUpgradePlan();
    }
  };

  const handleUpgradePlan = () => {
    setShowOutOfCreditsModal(false);
    // Switch to subscription mode to show plans
    router.push({
      pathname: '/subscriptionScreen',
      params: { ...params, mode: 'subscription' }
    });
  };

  // Set default selected plan when plans load
  useEffect(() => {
    if (hasPlans && subscriptionPlans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(subscriptionPlans[0].planId);
    }
  }, [hasPlans, subscriptionPlans, selectedPlanId]);

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

    if (!drillPrice || drillPrice <= 0) {
      showError('Drill pack price is required.');
      return;
    }

    try {
      setIsProcessing(true);
      const assignmentId = await unlockWithCredits({
        skillId: params.skillId,
        assessmentId: params.assessmentId,
        recommendationId: params.recommendationId,
        drillPackPrice: drillPrice,
      });

      showSuccess('Payment successful! Your drills are unlocked.');
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

  // Handle subscription purchase
  const handleSubscriptionPayment = async () => {
    if (!selectedPlanId) {
      showError('Please select a subscription plan.');
      return;
    }

    try {
      setIsProcessing(true);

      await processPayment({
        planId: selectedPlanId,
        onSuccess: () => {
          showSuccess('Subscription activated! You now have drill credits.');
          // Refresh the current screen to show the subscriber view
          router.replace({
            pathname: '/subscriptionScreen',
            params: params
          });
        },
        onCancel: () => {
          setIsProcessing(false);
        }
      });
    } catch (error: any) {
      showError(error.message || 'Subscription purchase failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle swipe success - called for both drill pack and subscription
  const handleSwipeSuccess = () => {
    if (selectedOption === 'subscription' && hasPlans) {
      // Process subscription payment
      handleSubscriptionPayment();
    } else {
      // Process drill pack payment
      handleDrillPackPayment();
    }
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
            {/* Show loading state while checking subscription */}
            {subscriptionLoading && !isSubscriptionMode ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={BRAND} />
                <Text style={styles.loadingText}>Checking subscription status...</Text>
              </View>
            ) : (
              <>
                {/* Subscription Mode - Show subscription plans or coming soon */}
                {isSubscriptionMode ? (
                  <>
                    {/* Subscription Card Only */}
                    <View style={styles.section}>
                      <SelectionCard
                        title="Unlock Unlimited Drills & More"
                        subtitle={hasPlans && formattedPlans[0] ? `Starting at ${formattedPlans[0].price}` : "Starting at $3.99/month"}
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
                        onSelect={() => { }}
                        badge="BEST VALUE"
                      />
                    </View>

                    {/* Conditional Rendering: Show dynamic plans if available, otherwise Coming Soon */}
                    {hasPlans ? (
                      <View style={styles.plansContainer}>
                        <Text style={styles.sectionTitle}>Choose Your Plan</Text>
                        {formattedPlans.map((plan, index) => (
                          <PlanCard
                            key={plan.id}
                            duration={plan.duration}
                            price={plan.price}
                            savings={plan.savings}
                            isSelected={selectedPlanId === plan.id}
                            onSelect={() => setSelectedPlanId(plan.id)}
                            badge={plan.badge}
                          />
                        ))}
                      </View>
                    ) : (
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

                        {FALLBACK_SUBSCRIPTION_PLANS.map((plan) => (
                          <View key={plan.id} style={{ opacity: 0.4 }}>
                            <PlanCard
                              duration={plan.duration}
                              price={plan.price}
                              savings={plan.savings}
                              isSelected={false}
                              onSelect={() => { }}
                              badge={plan.badge}
                            />
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                ) : hasActiveSubscription ? (
                  <View style={styles.subscriberContainer}>
                    {/* Header Section */}
                    <View style={styles.unlockHeader}>
                      <Text style={styles.unlockTitle}>Unlock {params.skillId ? 'Communication' : 'Skill'} Drills!</Text>
                      <Text style={styles.unlockSubtitle}>
                        {drillCount} Personalized Drills for {params.skillId ? 'Communication' : 'this skill'}
                      </Text>
                    </View>

                    {/* Balance Card */}
                    <View style={styles.balanceCard}>
                      <Text style={styles.balanceLabel}>Your Current Credits</Text>
                      <View style={styles.balanceRow}>
                        <Text style={styles.balanceValue}>{availableCredits}</Text>
                        <Ionicons name="ellipse" size={SCREEN_WIDTH * 0.04} color={COLORS.success} />
                      </View>
                    </View>

                    {/* Unlock Details Card */}
                    <View style={styles.detailsCard}>
                      <View style={styles.costRow}>
                        <Text style={styles.costLabel}>Drill Pack Price</Text>
                        <Text style={styles.costValue}>{formattedDrillPrice}</Text>
                      </View>
                      <View style={styles.costRow}>
                        <Text style={styles.costLabel}>Credits Required</Text>
                        <Text style={[styles.costValue, { color: BRAND, fontWeight: '800' }]}>
                          {subscriptionLoading
                            ? 'Calculating...'
                            : creditsNeeded > 0
                              ? `${creditsNeeded} ${creditsNeeded === 1 ? 'Credit' : 'Credits'}`
                              : drillPrice === 0
                                ? 'Drill pack price missing'
                                : 'Unable to calculate'}
                        </Text>
                      </View>

                      <View style={styles.divider} />

                      <Text style={styles.checklistTitle}>What You'll Unlock Today:</Text>

                      <View style={styles.checklistItem}>
                        <Ionicons name="checkbox" size={SCREEN_WIDTH * 0.06} color={COLORS.success} />
                        <Text style={styles.checklistText}>{drillCount} Personalized Drills for Communication</Text>
                      </View>
                      <View style={styles.checklistItem}>
                        <Ionicons name="checkbox" size={SCREEN_WIDTH * 0.06} color={COLORS.success} />
                        <Text style={styles.checklistText}>Milestone Tracking</Text>
                      </View>
                      <View style={styles.checklistItem}>
                        <Ionicons name="checkbox" size={SCREEN_WIDTH * 0.06} color={COLORS.success} />
                        <Text style={styles.checklistText}>Advanced Feedback</Text>
                      </View>
                    </View>


                  </View>
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

                    {/* Show plans or Coming Soon when subscription is selected */}
                    {selectedOption === 'subscription' && (
                      hasPlans ? (
                        <View style={styles.plansContainer}>
                          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
                          {formattedPlans.map((plan, index) => (
                            <PlanCard
                              key={plan.id}
                              duration={plan.duration}
                              price={plan.price}
                              savings={plan.savings}
                              isSelected={selectedPlanId === plan.id}
                              onSelect={() => setSelectedPlanId(plan.id)}
                              badge={plan.badge}
                            />
                          ))}
                        </View>
                      ) : (
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

                          {FALLBACK_SUBSCRIPTION_PLANS.map((plan) => (
                            <View key={plan.id} style={{ opacity: 0.4 }}>
                              <PlanCard
                                duration={plan.duration}
                                price={plan.price}
                                savings={plan.savings}
                                isSelected={false}
                                onSelect={() => { }}
                                badge={plan.badge}
                              />
                            </View>
                          ))}
                        </View>
                      )
                    )}
                  </>
                )}
              </>
            )}
          </ScrollView>

          {/* Fixed Footer - Show for purchase flows */}
          {/* For drill unlock flow - show when not a subscriber */}
          {!isSubscriptionMode && !hasActiveSubscription && (
            <View style={styles.footer}>
              {/* SwipeButton - enabled for drill pack OR subscription with plans */}
              <SwipeButton
                onSwipeSuccess={handleSwipeSuccess}
                loading={isProcessing || processing}
                disabled={selectedOption === 'subscription' && !hasPlans}
              />

              <View style={styles.securePayment}>
                <Ionicons name="lock-closed-outline" size={SCREEN_WIDTH * 0.03} color={COLORS.text.tertiary} />
                <Text style={styles.secureText}>Secure payment powered by Stripe</Text>
              </View>
            </View>
          )}

          {/* For subscription mode - show purchase button when plans available */}
          {isSubscriptionMode && hasPlans && (
            <View style={styles.footer}>
              <SwipeButton
                onSwipeSuccess={handleSubscriptionPayment}
                loading={isProcessing || processing}
                disabled={!selectedPlanId}
              />

              <View style={styles.securePayment}>
                <Ionicons name="lock-closed-outline" size={SCREEN_WIDTH * 0.03} color={COLORS.text.tertiary} />
                <Text style={styles.secureText}>Secure payment powered by Stripe</Text>
              </View>
            </View>
          )}

          {/* For subscribers unlocking drills - show claim button in footer */}
          {!isSubscriptionMode && hasActiveSubscription && (
            <View style={[styles.footer, { gap: 16 }]}>
              {availableCredits >= creditsNeeded && creditsNeeded > 0 ? (
                <>
                  <Text style={styles.remainingText}>
                    After this unlock, you'll have {availableCredits - creditsNeeded} credits remaining.
                  </Text>

                  <TouchableOpacity
                    style={styles.claimButton}
                    onPress={handleUseCredit}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Text style={styles.claimButtonText}>Processing...</Text>
                    ) : (
                      <Text style={styles.claimButtonText}>Unlock Your Drills Now</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.remainingText}>
                    {creditsNeeded > 0
                      ? `You need ${creditsNeeded} credits, but only have ${availableCredits}. Please purchase more credits or upgrade your subscription.`
                      : drillPrice === 0
                        ? 'Drill pack price not available. Please try again.'
                        : 'Unable to calculate credits. Please contact support.'}
                  </Text>

                  <TouchableOpacity
                    style={[styles.claimButton, { backgroundColor: COLORS.gray[400], opacity: 0.6 }]}
                    disabled={true}
                  >
                    <Text style={styles.claimButtonText}>
                      {creditsNeeded === 0 ? 'Unable to Calculate' : 'Insufficient Credits'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Out of Credits Modal */}
          <Modal
            visible={showOutOfCreditsModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowOutOfCreditsModal(false)} // Android back button
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalIconContainer}>
                  <Ionicons name="alert-circle" size={48} color="#F59E0B" />
                </View>

                <Text style={styles.modalTitle}>Out of Credits</Text>

                <Text style={styles.modalText}>
                  You used all your drills for this term. Choose to renew the same plan or upgrade for more credits.
                </Text>

                {/* Mocking refresh date for now as requested */}
                <Text style={styles.modalSubText}>
                  Next credits refresh on: 15 July 2024
                </Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.renewButton}
                    onPress={handleRenewMonthly}
                  >
                    <Text style={styles.renewButtonText}>Renew Monthly</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={handleUpgradePlan}
                  >
                    <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
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
  plansContainer: {
    marginTop: -SCREEN_WIDTH * 0.04,
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
  // Subscriber Unlock Styles
  subscriberContainer: {
    marginTop: SCREEN_WIDTH * 0.02,
    gap: SCREEN_WIDTH * 0.05,
  },
  unlockHeader: {
    alignItems: 'center',
    marginBottom: SCREEN_WIDTH * 0.02,
  },
  unlockTitle: {
    fontSize: SCREEN_WIDTH * 0.06,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SCREEN_WIDTH * 0.02,
  },
  unlockSubtitle: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: '#F0FDF4', // Light green bg
    borderRadius: BORDER_RADIUS.xl,
    padding: SCREEN_WIDTH * 0.06,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  balanceLabel: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: COLORS.text.secondary,
    marginBottom: SCREEN_WIDTH * 0.01,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SCREEN_WIDTH * 0.02,
  },
  balanceValue: {
    fontSize: SCREEN_WIDTH * 0.12,
    fontWeight: '800',
    color: '#166534', // Dark green
  },
  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SCREEN_WIDTH * 0.06,
    ...SHADOWS.sm,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SCREEN_WIDTH * 0.04,
  },
  costLabel: {
    fontSize: SCREEN_WIDTH * 0.04,
    color: COLORS.text.secondary,
  },
  costValue: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginBottom: SCREEN_WIDTH * 0.04,
  },
  checklistTitle: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: COLORS.text.secondary,
    marginBottom: SCREEN_WIDTH * 0.03,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SCREEN_WIDTH * 0.03,
    marginBottom: SCREEN_WIDTH * 0.03,
  },
  checklistText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
  },
  actionContainer: {
    marginTop: SCREEN_WIDTH * 0.02,
    gap: SCREEN_WIDTH * 0.04,
  },
  remainingText: {
    fontSize: SCREEN_WIDTH * 0.03,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  claimButton: {
    backgroundColor: '#22C55E', // Bright Green
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SCREEN_WIDTH * 0.04,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  claimButtonText: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '700',
    color: COLORS.white,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.08,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SCREEN_WIDTH * 0.06,
    alignItems: 'center',
    width: '100%',
    ...SHADOWS.lg,
  },
  modalIconContainer: {
    marginBottom: SCREEN_WIDTH * 0.04,
    backgroundColor: '#FEF3C7', // Light yellow
    padding: SCREEN_WIDTH * 0.03,
    borderRadius: SCREEN_WIDTH * 0.1,
  },
  modalTitle: {
    fontSize: SCREEN_WIDTH * 0.05,
    fontWeight: '700',
    color: '#D97706', // Dark yellow/orange
    marginBottom: SCREEN_WIDTH * 0.03,
  },
  modalText: {
    fontSize: SCREEN_WIDTH * 0.038,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: SCREEN_WIDTH * 0.055,
    marginBottom: SCREEN_WIDTH * 0.02,
  },
  modalSubText: {
    fontSize: SCREEN_WIDTH * 0.032,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginBottom: SCREEN_WIDTH * 0.06,
  },
  modalActions: {
    width: '100%',
    gap: SCREEN_WIDTH * 0.03,
  },
  renewButton: {
    backgroundColor: '#1D4ED8', // Blue
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SCREEN_WIDTH * 0.035,
    alignItems: 'center',
  },
  renewButtonText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '600',
    color: COLORS.white,
  },
  upgradeButton: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SCREEN_WIDTH * 0.035,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1D4ED8', // Blue
  },
  upgradeButtonText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '600',
    color: '#1D4ED8', // Blue
  },
});
