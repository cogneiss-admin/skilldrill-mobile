/**
 * Subscription Screen
 *
 * Beautiful payment screen showing two options:
 * 1. One-time drill pack purchase
 * 2. Monthly subscription with recurring credits
 *
 * Features:
 * - Animated option cards
 * - Stripe payment integration
 * - Subscription credit support
 * - Beautiful gradient header
 * - Loading states
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { StripeProvider } from '@stripe/stripe-react-native';

import Button from '../components/Button';
import OptionCard from '../components/OptionCard';
import { usePayment } from '../hooks/usePayment';
import { useSubscription } from '../hooks/useSubscription';
import { useAnimation } from '../hooks/useAnimation';
import apiService from '../services/api';

import {
  BRAND,
  BRAND_DARK,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  GRADIENTS
} from './components/Brand';

type PaymentOption = 'drill-pack' | 'subscription';

export default function SubscriptionScreen() {
  const params = useLocalSearchParams<{
    skillId?: string;
    assessmentId?: string;
    recommendationId?: string;
    drillCount?: string;
  }>();

  const { processPayment, processing } = usePayment();
  const { hasActiveSubscription, availableCredits, unlockWithCredits } = useSubscription();
  const { fadeIn, fadeAnim } = useAnimation();

  const [selectedOption, setSelectedOption] = useState<PaymentOption>('drill-pack');
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [pricingData, setPricingData] = useState<any>(null);

  const drillCount = params.drillCount ? parseInt(params.drillCount) : 15;

  useEffect(() => {
    fadeIn();
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    try {
      setLoadingPricing(true);

      try {
        const res = await apiService.getPricingPlans();

        if (res.success) {
          setPricingData(res.data);
        }
      } catch (apiError: any) {
        // If endpoint doesn't exist yet, use default pricing
        if (apiError.status === 404 || apiError.message?.includes('Route') || apiError.message?.includes('not found')) {
          console.log('[Subscription] Using default pricing (endpoint not implemented yet)');
          setPricingData({
            drillPack: {
              priceId: 'price_drill_pack_default',
              price: '$4.99',
              currency: 'USD'
            },
            subscription: {
              priceId: 'price_subscription_default',
              price: '$9.99',
              currency: 'USD'
            }
          });
        } else {
          throw apiError;
        }
      }
    } catch (error: any) {
      console.error('Failed to load pricing:', error);
      // Use fallback pricing
      setPricingData({
        drillPack: {
          priceId: 'price_drill_pack_default',
          price: '$4.99',
          currency: 'USD'
        },
        subscription: {
          priceId: 'price_subscription_default',
          price: '$9.99',
          currency: 'USD'
        }
      });
    } finally {
      setLoadingPricing(false);
    }
  };

  const handlePayment = async () => {
    if (!params.skillId) {
      console.error('Missing skillId parameter');
      return;
    }

    try {
      // Check if user has subscription and enough credits
      if (hasActiveSubscription && availableCredits > 0) {
        // Use subscription credits
        const assignmentId = await unlockWithCredits({
          skillId: params.skillId,
          assessmentId: params.assessmentId,
          recommendationId: params.recommendationId
        });

        // Navigate to drill practice
        router.push({
          pathname: '/drillPractice',
          params: { assignmentId }
        });
        return;
      }

      // Process payment
      const priceId = selectedOption === 'drill-pack'
        ? pricingData?.drillPack?.priceId
        : pricingData?.subscription?.priceId;

      if (!priceId) {
        throw new Error('Price information not available');
      }

      await processPayment({
        priceId,
        metadata: {
          skillId: params.skillId,
          assessmentId: params.assessmentId,
          recommendationId: params.recommendationId
        },
        onSuccess: (assignmentId) => {
          // Navigate to drill practice
          router.push({
            pathname: '/drillPractice',
            params: { assignmentId }
          });
        }
      });
    } catch (error: any) {
      console.error('Payment failed:', error);
    }
  };

  if (loadingPricing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND} />
          <Text style={styles.loadingText}>Loading pricing plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const drillPackPrice = pricingData?.drillPack?.price || '$4.99';
  const subscriptionPrice = pricingData?.subscription?.price || '$9.99';

  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Gradient */}
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>

            <MotiView
              from={{ opacity: 0, translateY: -20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: 100 }}
            >
              <Text style={styles.headerTitle}>Unlock Your Drills</Text>
              <Text style={styles.headerSubtitle}>
                Choose the plan that works best for you
              </Text>
            </MotiView>

            {/* Drill Count Badge */}
            <MotiView
              from={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: 300 }}
              style={styles.drillBadge}
            >
              <Ionicons name="fitness" size={20} color={BRAND} />
              <Text style={styles.drillBadgeText}>{drillCount} Practice Drills</Text>
            </MotiView>
          </LinearGradient>

          {/* Subscription Credit Notice */}
          {hasActiveSubscription && availableCredits > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 400 }}
              style={styles.creditNotice}
            >
              <View style={styles.creditNoticeContent}>
                <Ionicons name="gift" size={24} color={COLORS.success} />
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <Text style={styles.creditNoticeTitle}>
                    You have {availableCredits} credit{availableCredits !== 1 ? 's' : ''} available!
                  </Text>
                  <Text style={styles.creditNoticeText}>
                    Use your subscription credits to unlock these drills for free
                  </Text>
                </View>
              </View>
            </MotiView>
          )}

          {/* Payment Options */}
          <View style={styles.optionsContainer}>
            {/* Drill Pack Option */}
            <OptionCard
              title="Drill Pack"
              price={drillPackPrice}
              period="one-time"
              features={[
                `${drillCount} AI-generated practice drills`,
                'Instant access after payment',
                'Milestone feedback system',
                'Progress tracking & analytics'
              ]}
              isSelected={selectedOption === 'drill-pack'}
              onPress={() => setSelectedOption('drill-pack')}
              style={styles.optionCard}
            />

            {/* Monthly Subscription Option */}
            <OptionCard
              title="Monthly Subscription"
              price={subscriptionPrice}
              period="per month"
              features={[
                '10 drill credits every month',
                'Unlock any skill drills',
                'Cancel anytime',
                'Priority support',
                'Early access to new features'
              ]}
              badge="BEST VALUE"
              isSelected={selectedOption === 'subscription'}
              onPress={() => setSelectedOption('subscription')}
              premium
              style={styles.optionCard}
            />
          </View>

          {/* Benefits Section */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 600 }}
            style={styles.benefitsSection}
          >
            <Text style={styles.benefitsTitle}>What you'll get:</Text>

            <View style={styles.benefitsList}>
              {[
                { icon: 'trending-up', text: 'AI-powered skill improvement' },
                { icon: 'analytics', text: 'Detailed progress analytics' },
                { icon: 'star', text: 'Personalized feedback at milestones' },
                { icon: 'shield-checkmark', text: 'Secure payment via Stripe' }
              ].map((benefit, index) => (
                <MotiView
                  key={index}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: 700 + index * 100 }}
                  style={styles.benefitItem}
                >
                  <View style={styles.benefitIcon}>
                    <Ionicons name={benefit.icon as any} size={20} color={BRAND} />
                  </View>
                  <Text style={styles.benefitText}>{benefit.text}</Text>
                </MotiView>
              ))}
            </View>
          </MotiView>

          {/* Payment Button */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 900 }}
            style={styles.paymentButtonContainer}
          >
            <Button
              variant="gradient"
              size="large"
              onPress={handlePayment}
              loading={processing}
              disabled={processing}
              icon="card"
              fullWidth
            >
              {hasActiveSubscription && availableCredits > 0
                ? 'Use Subscription Credit'
                : selectedOption === 'drill-pack'
                ? `Pay ${drillPackPrice}`
                : `Subscribe for ${subscriptionPrice}/month`}
            </Button>

            <Text style={styles.securePaymentText}>
              <Ionicons name="lock-closed" size={12} color={COLORS.text.tertiary} />
              {' '}Secure payment powered by Stripe
            </Text>
          </MotiView>
        </ScrollView>
      </SafeAreaView>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary
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
    paddingBottom: SPACING['3xl']
  },
  header: {
    paddingTop: SPACING['2xl'],
    paddingBottom: SPACING['3xl'],
    paddingHorizontal: SPACING.padding.lg,
    position: 'relative'
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 28,
    color: COLORS.white,
    fontWeight: '800',
    marginBottom: SPACING.xs
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    opacity: 0.9
  },
  drillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.padding.md,
    paddingVertical: SPACING.padding.xs,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
    marginTop: SPACING.lg
  },
  drillBadgeText: {
    ...TYPOGRAPHY.label,
    color: BRAND,
    fontWeight: '700',
    marginLeft: SPACING.xs
  },
  creditNotice: {
    marginHorizontal: SPACING.padding.lg,
    marginTop: -SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.success,
    overflow: 'hidden'
  },
  creditNoticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.padding.md
  },
  creditNoticeTitle: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.success,
    marginBottom: SPACING.xs
  },
  creditNoticeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary
  },
  optionsContainer: {
    paddingHorizontal: SPACING.padding.lg,
    gap: SPACING.gap.lg
  },
  optionCard: {
    marginBottom: SPACING.margin.md
  },
  benefitsSection: {
    marginHorizontal: SPACING.padding.lg,
    marginTop: SPACING.margin['2xl'],
    padding: SPACING.padding.lg,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.xl
  },
  benefitsTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    marginBottom: SPACING.md
  },
  benefitsList: {
    gap: SPACING.gap.md
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md
  },
  benefitText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    flex: 1
  },
  paymentButtonContainer: {
    marginTop: SPACING.margin['2xl'],
    paddingHorizontal: SPACING.padding.lg
  },
  securePaymentText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginTop: SPACING.md
  }
});
