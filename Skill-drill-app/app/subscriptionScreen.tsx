import React, { useState, useMemo, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions, ActivityIndicator, Modal, TextInput, ViewStyle, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StripeProvider } from '@stripe/stripe-react-native';
import apiService from '../services/api';

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
import PromoCodeView from './components/PromoCodeView';
import { usePayment } from '../hooks/usePayment';
import { useSubscription } from '../hooks/useSubscription';
import { useSubscriptionPlans, SubscriptionPlan } from '../hooks/useSubscriptionPlans';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCREEN_BACKGROUND,
  } as ViewStyle,
  header: {
    paddingVertical: SCREEN_WIDTH * 0.04,
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.gray[300],
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: SCREEN_WIDTH * 0.048,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginRight: SCREEN_WIDTH * 0.05,
  } as TextStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  } as ViewStyle,
  loadingText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.md,
    color: COLORS.text.tertiary
  } as TextStyle,
  scrollView: {
    flex: 1
  } as ViewStyle,
  scrollContent: {
    paddingBottom: SCREEN_WIDTH * 0.1,
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    paddingTop: SCREEN_WIDTH * 0.05,
  } as ViewStyle,
  section: {
    marginBottom: SCREEN_WIDTH * 0.02, // Reduced from 0.08 to bring promo code closer
  } as ViewStyle,
  sectionTitle: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SCREEN_WIDTH * 0.04,
    marginTop: SCREEN_WIDTH * 0.025,
  } as TextStyle,
  plansContainer: {
    marginTop: -SCREEN_WIDTH * 0.04,
  } as ViewStyle,
  footer: {
    paddingTop: SCREEN_WIDTH * 0.04,
    paddingBottom: SCREEN_WIDTH * 0.04,
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  } as ViewStyle,
  payButton: {
    backgroundColor: BRAND,
    borderRadius: SCREEN_WIDTH * 0.075,
    height: SCREEN_WIDTH * 0.14,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  } as ViewStyle,
  payButtonText: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '700',
    color: COLORS.white,
  } as TextStyle,
  securePayment: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SCREEN_WIDTH * 0.04,
    gap: SCREEN_WIDTH * 0.01,
  } as ViewStyle,
  secureText: {
    fontSize: SCREEN_WIDTH * 0.03,
    color: COLORS.text.tertiary,
  } as TextStyle,
  comingSoonContainer: {
    marginTop: -SCREEN_WIDTH * 0.04,
  } as ViewStyle,
  comingSoonCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SCREEN_WIDTH * 0.06,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BRAND,
    borderStyle: 'dashed',
    ...SHADOWS.sm,
  } as ViewStyle,
  comingSoonIconContainer: {
    width: SCREEN_WIDTH * 0.16,
    height: SCREEN_WIDTH * 0.16,
    borderRadius: SCREEN_WIDTH * 0.08,
    backgroundColor: `${BRAND}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SCREEN_WIDTH * 0.04,
  } as ViewStyle,
  comingSoonTitle: {
    fontSize: SCREEN_WIDTH * 0.05,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SCREEN_WIDTH * 0.025,
  } as TextStyle,
  comingSoonText: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: SCREEN_WIDTH * 0.05,
    marginBottom: SCREEN_WIDTH * 0.05,
  } as TextStyle,
  switchToDrillPackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${BRAND}10`,
    paddingVertical: SCREEN_WIDTH * 0.03,
    paddingHorizontal: SCREEN_WIDTH * 0.05,
    borderRadius: BORDER_RADIUS.full,
    gap: SCREEN_WIDTH * 0.02,
  } as ViewStyle,
  switchToDrillPackText: {
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: '600',
    color: BRAND,
  } as TextStyle,
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.1,
  } as ViewStyle,
  errorTitle: {
    fontSize: SCREEN_WIDTH * 0.05,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginTop: SCREEN_WIDTH * 0.04,
    marginBottom: SCREEN_WIDTH * 0.02,
  } as TextStyle,
  errorText: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: SCREEN_WIDTH * 0.05,
    marginBottom: SCREEN_WIDTH * 0.06,
  } as TextStyle,
  errorButton: {
    backgroundColor: BRAND,
    paddingVertical: SCREEN_WIDTH * 0.035,
    paddingHorizontal: SCREEN_WIDTH * 0.08,
    borderRadius: SCREEN_WIDTH * 0.02,
  } as ViewStyle,
  errorButtonText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '600',
    color: COLORS.white,
  } as TextStyle,
  subscriberContainer: {
    marginTop: SCREEN_WIDTH * 0.02,
    gap: SCREEN_WIDTH * 0.05,
  } as ViewStyle,
  unlockHeader: {
    alignItems: 'center',
    marginBottom: SCREEN_WIDTH * 0.02,
  } as ViewStyle,
  unlockTitle: {
    fontSize: SCREEN_WIDTH * 0.06,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SCREEN_WIDTH * 0.02,
  } as TextStyle,
  unlockSubtitle: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: COLORS.text.secondary,
    textAlign: 'center',
  } as TextStyle,
  balanceCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: BORDER_RADIUS.xl,
    padding: SCREEN_WIDTH * 0.06,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  } as ViewStyle,
  balanceLabel: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: COLORS.text.secondary,
    marginBottom: SCREEN_WIDTH * 0.01,
  } as TextStyle,
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SCREEN_WIDTH * 0.02,
  } as ViewStyle,
  balanceValue: {
    fontSize: SCREEN_WIDTH * 0.12,
    fontWeight: '800',
    color: '#166534',
  } as TextStyle,
  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SCREEN_WIDTH * 0.06,
    ...SHADOWS.sm,
  } as ViewStyle,
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SCREEN_WIDTH * 0.04,
  } as ViewStyle,
  costLabel: {
    fontSize: SCREEN_WIDTH * 0.04,
    color: COLORS.text.secondary,
  } as TextStyle,
  costValue: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '700',
    color: COLORS.text.primary,
  } as TextStyle,
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginBottom: SCREEN_WIDTH * 0.04,
  } as ViewStyle,
  checklistTitle: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: COLORS.text.secondary,
    marginBottom: SCREEN_WIDTH * 0.03,
  } as TextStyle,
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SCREEN_WIDTH * 0.03,
    marginBottom: SCREEN_WIDTH * 0.03,
  } as ViewStyle,
  checklistText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
  } as TextStyle,
  actionContainer: {
    marginTop: SCREEN_WIDTH * 0.02,
    gap: SCREEN_WIDTH * 0.04,
  } as ViewStyle,
  remainingText: {
    fontSize: SCREEN_WIDTH * 0.03,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  } as TextStyle,
  claimButton: {
    backgroundColor: '#22C55E',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SCREEN_WIDTH * 0.04,
    alignItems: 'center',
    ...SHADOWS.md,
  } as ViewStyle,
  claimButtonText: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '700',
    color: COLORS.white,
  } as TextStyle,
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.08,
  } as ViewStyle,
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SCREEN_WIDTH * 0.06,
    alignItems: 'center',
    width: '100%',
    ...SHADOWS.lg,
  } as ViewStyle,
  modalIconContainer: {
    marginBottom: SCREEN_WIDTH * 0.04,
    backgroundColor: '#FEF3C7',
    padding: SCREEN_WIDTH * 0.03,
    borderRadius: SCREEN_WIDTH * 0.1,
  } as ViewStyle,
  modalTitle: {
    fontSize: SCREEN_WIDTH * 0.05,
    fontWeight: '700',
    color: '#D97706',
    marginBottom: SCREEN_WIDTH * 0.03,
  } as TextStyle,
  modalText: {
    fontSize: SCREEN_WIDTH * 0.038,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: SCREEN_WIDTH * 0.055,
    marginBottom: SCREEN_WIDTH * 0.02,
  } as TextStyle,
  modalSubText: {
    fontSize: SCREEN_WIDTH * 0.032,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginBottom: SCREEN_WIDTH * 0.06,
  } as TextStyle,
  modalActions: {
    width: '100%',
    gap: SCREEN_WIDTH * 0.03,
  } as ViewStyle,
  renewButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SCREEN_WIDTH * 0.035,
    alignItems: 'center',
  } as ViewStyle,
  renewButtonText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '600',
    color: COLORS.white,
  } as TextStyle,
  upgradeButton: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SCREEN_WIDTH * 0.035,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1D4ED8',
  } as ViewStyle,
  upgradeButtonText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '600',
    color: '#1D4ED8',
  } as TextStyle,
  planOverviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: SCREEN_WIDTH * 0.045,
    padding: SCREEN_WIDTH * 0.055,
    marginBottom: SCREEN_WIDTH * 0.04,
    ...SHADOWS.sm,
  } as ViewStyle,
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SCREEN_WIDTH * 0.04,
  } as ViewStyle,
  subscriptionTitle: {
    fontSize: SCREEN_WIDTH * 0.06,
    fontWeight: '800',
    color: COLORS.text.primary,
  } as TextStyle,
  subscriptionPrice: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginTop: SCREEN_WIDTH * 0.01,
  } as TextStyle,
  statusBadge: {
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    paddingVertical: SCREEN_WIDTH * 0.018,
    borderRadius: BORDER_RADIUS.full,
  } as ViewStyle,
  statusActive: {
    backgroundColor: '#CFF5D9',
  } as ViewStyle,
  statusInactive: {
    backgroundColor: COLORS.gray[200],
  } as ViewStyle,
  statusBadgeText: {
    fontSize: SCREEN_WIDTH * 0.034,
    fontWeight: '800',
  } as TextStyle,
  statusActiveText: {
    color: '#12A150',
  } as TextStyle,
  statusInactiveText: {
    color: COLORS.text.secondary,
  } as TextStyle,
  creditCard: {
    backgroundColor: COLORS.white,
    borderRadius: SCREEN_WIDTH * 0.04,
    padding: SCREEN_WIDTH * 0.045,
    ...SHADOWS.sm,
  } as ViewStyle,
  creditTitle: {
    fontSize: SCREEN_WIDTH * 0.048,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: SCREEN_WIDTH * 0.04,
  } as TextStyle,
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SCREEN_WIDTH * 0.03,
  } as ViewStyle,
  creditLabel: {
    fontSize: SCREEN_WIDTH * 0.04,
    color: '#5B79A6',
  } as TextStyle,
  creditValue: {
    fontSize: SCREEN_WIDTH * 0.05,
    fontWeight: '800',
    color: COLORS.text.primary,
  } as TextStyle,
  creditValueAvailable: {
    color: '#22A05B',
  } as TextStyle,
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: SCREEN_WIDTH * 0.02,
    marginBottom: 0,
  } as ViewStyle,
  subscriptionRenewLabel: {
    fontSize: SCREEN_WIDTH * 0.038,
    color: '#5B79A6',
    fontWeight: '500',
  } as TextStyle,
  subscriptionActions: {
    marginTop: SCREEN_WIDTH * 0.02,
    gap: SCREEN_WIDTH * 0.04,
  } as ViewStyle,
  primaryActionButton: {
    backgroundColor: '#0E64CE',
    paddingVertical: SCREEN_WIDTH * 0.04,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
  } as ViewStyle,
  primaryActionText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '700',
    color: COLORS.white,
  } as TextStyle,
  secondaryActionButton: {
    backgroundColor: '#F3F7FC',
    paddingVertical: SCREEN_WIDTH * 0.04,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
  } as ViewStyle,
  secondaryActionText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '700',
    color: COLORS.text.primary,
  } as TextStyle,
  cancelActionButton: {
    backgroundColor: 'transparent',
    paddingVertical: SCREEN_WIDTH * 0.04,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    marginTop: SCREEN_WIDTH * 0.02,
  } as ViewStyle,
  cancelHelperText: {
    fontSize: SCREEN_WIDTH * 0.03,
    color: '#64748B',
    textAlign: 'center',
    marginTop: -SCREEN_WIDTH * 0.02,
    marginBottom: SCREEN_WIDTH * 0.04,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    lineHeight: SCREEN_WIDTH * 0.045,
  } as TextStyle,
  cancelActionText: {
    fontSize: SCREEN_WIDTH * 0.044,
    fontWeight: '800',
    color: '#D63B30',
  } as TextStyle,
  actionMessage: {
    marginTop: SCREEN_WIDTH * 0.03,
    fontSize: SCREEN_WIDTH * 0.035,
    textAlign: 'center',
  } as TextStyle,
  actionMessageSuccess: {
    color: COLORS.success,
  } as TextStyle,
  actionMessageError: {
    color: '#B91C1C',
  } as TextStyle,
  dangerButton: {
    backgroundColor: '#DC2626',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SCREEN_WIDTH * 0.035,
    alignItems: 'center',
  } as ViewStyle,
  dangerButtonText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '700',
    color: COLORS.white,
  } as TextStyle,
  neutralButton: {
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SCREEN_WIDTH * 0.035,
    alignItems: 'center',
  } as ViewStyle,
  neutralButtonText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '700',
    color: COLORS.text.primary,
  } as TextStyle,
  promoCodeContainer: {
    alignSelf: 'flex-end',
    marginTop: 0, // Removed top margin
    marginRight: SPACING.margin.lg,
    marginBottom: SPACING.margin.md,
  } as ViewStyle,
  promoCodeText: {
    ...TYPOGRAPHY.bodySmall,
    color: BRAND,
    textDecorationLine: 'underline',
  } as TextStyle,
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  } as ViewStyle,
  promoInput: {
    width: '100%',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.padding.md,
    paddingVertical: SPACING.padding.md,
    fontSize: SCREEN_WIDTH * 0.04,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    marginBottom: SPACING.margin.md,
  } as TextStyle,
  promoMessage: {
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: '500',
    marginBottom: SPACING.margin.md,
    textAlign: 'center',
  } as TextStyle,
  promoSuccess: {
    color: COLORS.success,
  } as TextStyle,
  promoError: {
    color: COLORS.error,
  } as TextStyle,
  applyButton: {
    width: '100%',
    backgroundColor: BRAND,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.padding.md,
    alignItems: 'center',
    marginBottom: SPACING.margin.md,
  } as ViewStyle,
  applyButtonText: {
    ...TYPOGRAPHY.buttonMedium,
    color: COLORS.white,
  } as TextStyle,
  promoMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.gap.sm,
    padding: SPACING.padding.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.margin.md,
  } as ViewStyle,
  promoSuccessContainer: {
    backgroundColor: '#ECFDF3',
  } as ViewStyle,
  promoErrorContainer: {
    backgroundColor: '#FEF2F2',
  } as ViewStyle,
  orderSummary: {
    width: '100%',
    marginTop: SPACING.margin.md,
    padding: SPACING.padding.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  } as ViewStyle,
  orderSummaryTitle: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '700',
    marginBottom: SPACING.margin.sm,
    color: COLORS.text.primary,
  } as TextStyle,
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.margin.xs,
  } as ViewStyle,
  summaryLabel: {
    fontSize: SCREEN_WIDTH * 0.038,
    color: COLORS.text.secondary,
  } as TextStyle,
  summaryValue: {
    fontSize: SCREEN_WIDTH * 0.038,
    color: COLORS.text.primary,
  } as TextStyle,
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border.light,
    marginVertical: SPACING.margin.sm,
  } as ViewStyle,
});
const FALLBACK_SUBSCRIPTION_PLANS = [
  { id: '12_months', duration: '12 Months', price: '$3.99/month', savings: 'Save 60%', badge: 'BEST VALUE' as const },
  { id: '6_months', duration: '6 Months', price: '$5.99/month', savings: 'Save 40%', badge: 'POPULAR' as const },
  { id: '3_months', duration: '3 Months', price: '$7.99/month', savings: 'Save 20%' },
  { id: '1_month', duration: '1 Month', price: '$9.99/month' },
];

const formatPlanForDisplay = (plan: SubscriptionPlan, index: number) => {
  const savingsPercent = plan.durationMonths > 1
    ? Math.round((1 - (plan.monthlyPrice / (plan.price / plan.durationMonths))) * 100) || 0
    : 0;

  const badge = plan.durationMonths >= 12 ? 'BEST VALUE' as const :
                plan.durationMonths >= 6 ? 'POPULAR' as const : undefined;

  return {
    id: plan.planId,
    duration: `${plan.durationMonths} Month${plan.durationMonths > 1 ? 's' : ''}`,
    price: `${plan.monthlyPriceFormatted}/month`,
    totalPrice: plan.priceFormatted,
    savings: savingsPercent > 0 ? `Save ${savingsPercent}%` : undefined,
    badge,
  };
};

export default function SubscriptionScreen() {
  const params = useLocalSearchParams<{
    recommendationId?: string;
    skillId?: string;
    assessmentId?: string;
    drillCount?: string;
    price?: string;
    currency?: string;
    mode?: string;
  }>();
  const router = useRouter();
  const {
    subscription,
    loading: subscriptionLoading,
    refresh: refreshSubscription,
    hasActiveSubscription,
    availableCredits,
    creditValue,
    unlockWithCredits
  } = useSubscription();
  const { processPayment, processing } = usePayment();
  const { plans: apiPlans, hasPlans } = useSubscriptionPlans();
  const formattedPlans = useMemo(() => apiPlans.map(formatPlanForDisplay), [apiPlans]);

  // 1. Extract params first
  const drillCount = params.drillCount ? parseInt(params.drillCount as string, 10) : 0;
  const drillPrice = params.price ? parseFloat(params.price as string) : 0;
  const currency = params.currency as string;
  const isSubscriptionMode = params.mode === 'subscription';
  const hasRequiredData = isSubscriptionMode || (params.recommendationId && params.skillId && params.price && params.drillCount && params.currency);

  // 2. State Declarations
  const [selectedOption, setSelectedOption] = useState<'subscription' | 'one-time'>(isSubscriptionMode ? 'subscription' : 'one-time');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  const [changePlanMode, setChangePlanMode] = useState(false);
  const [actionLoading, setActionLoading] = useState<'change' | 'cancel' | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Promo Code State
  const [showPromoView, setShowPromoView] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 3. Derived State / Memos
  const subscriptionPlanMatch = useMemo(() => {
    if (!subscription?.plan) return null;
    return apiPlans.find(p => p.planName.toLowerCase().includes(subscription.plan.toLowerCase()));
  }, [subscription, apiPlans]);

  const subscriptionPriceDisplay = useMemo(() => {
    if ((subscription as any)?.planPrice) return (subscription as any).planPrice;
    if (subscriptionPlanMatch?.price) return `$${subscriptionPlanMatch.price}`;
    return '';
  }, [subscription, subscriptionPlanMatch]);

  const selectedPlan = useMemo(() => {
    return apiPlans.find((p) => p.planId === selectedPlanId) || apiPlans[0];
  }, [apiPlans, selectedPlanId]);

  const baseSubtotal = useMemo(() => {
    if (selectedOption === 'subscription') {
      return selectedPlan?.price || 0;
    }
    return drillPrice || 0;
  }, [selectedOption, selectedPlan, drillPrice]);

  const activeCurrency = useMemo(() => {
    if (selectedOption === 'subscription') {
      return selectedPlan?.currency || 'USD';
    }
    return currency || 'USD';
  }, [selectedOption, selectedPlan, currency]);

  const creditsNeeded = useMemo(() => {
    if (creditValue > 0 && drillPrice > 0) {
      return Math.ceil(drillPrice / creditValue);
    }
    return 0;
  }, [drillPrice, creditValue]);

  useEffect(() => {
    if (selectedPlanId === '' && apiPlans.length > 0) {
      setSelectedPlanId(apiPlans[0].planId);
    }
  }, [apiPlans, selectedPlanId]);

  useEffect(() => {
    // Reset discounts when pricing context changes
    setDiscountAmount(0);
    setOrderTotal(baseSubtotal);
    setAppliedCouponCode(null);
    setPromoMessage(null);
  }, [baseSubtotal, selectedOption]);

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
    const monthlyPlan = apiPlans.find(p => p.durationMonths === 1);

    if (monthlyPlan) {
      setShowOutOfCreditsModal(false);
      try {
        setIsProcessing(true);
        await processPayment({
          planId: monthlyPlan.planId,
          onSuccess: () => {
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
        setIsProcessing(false);
      }
    } else {
      setShowOutOfCreditsModal(false);
      handleUpgradePlan();
    }
  };

  const handleUpgradePlan = () => {
    setShowOutOfCreditsModal(false);
    router.push({
      pathname: '/subscriptionScreen',
      params: { ...params, mode: 'subscription' }
    });
  };

  const handleChangePlanPress = () => {
    if (hasPlans && apiPlans.length > 0) {
      const planId = subscriptionPlanMatch?.planId || apiPlans[0].planId;
      setSelectedPlanId(planId);
    }
    setChangePlanMode(true);
    setActionMessage(null);
  };

  const handleCancelPress = () => {
    setActionMessage(null);
    setShowCancelConfirm(true);
  };

  const handleExitChangePlan = () => {
    setChangePlanMode(false);
    setActionMessage(null);
  };

  const handleViewPaymentHistory = () => {
    router.push('/paymentHistory');
  };

  const handleCancelSubscription = async () => {
    setActionMessage(null);
    setActionLoading('cancel');
    try {
      const res = await apiService.cancelSubscription({ cancelAtPeriodEnd: true });
      if (!res.success) {
        throw new Error(res.message || 'Unable to cancel subscription.');
      }
      await refreshSubscription();
      setChangePlanMode(false);
      setActionMessage({ type: 'success', text: 'Subscription cancellation scheduled. Your plan remains active until the period ends.' });
    } catch (error: any) {
      setActionMessage({ type: 'error', text: 'We couldn’t cancel your subscription right now. Please try again in a moment or contact support.' });
    } finally {
      setActionLoading(null);
    }
  };



  useEffect(() => {
    if (hasPlans && apiPlans.length > 0 && !selectedPlanId) {
      const planId = subscriptionPlanMatch?.planId || apiPlans[0].planId;
      setSelectedPlanId(planId);
    }
  }, [hasPlans, apiPlans, selectedPlanId, subscriptionPlanMatch]);

  const formatDateString = (dateString?: string | null) => {
    if (!dateString) return '—';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatPrice = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formattedDrillPrice = (!isSubscriptionMode && currency) ? formatPrice(drillPrice, currency) : '';

  const formatMoney = (amount: number) => formatPrice(amount, activeCurrency);

  const mapCouponError = (message?: string) => {
    if (!message) return 'Unable to apply this code right now.';
    const normalized = message.toLowerCase();
    if (normalized.includes('expired')) return 'This code has expired.';
    if (normalized.includes('not yet valid')) return 'This code is not active yet.';
    if (normalized.includes('usage limit')) return 'This code has reached its usage limit.';
    if (normalized.includes('already used')) return 'You have already used this code.';
    if (normalized.includes('minimum purchase')) return message;
    if (normalized.includes('not active')) return 'This code is no longer active.';
    if (normalized.includes('cannot be used')) return message;
    return 'This code is not valid for this purchase.';
  };

  const handleDrillPackPayment = async () => {
    if (!params.recommendationId || !params.skillId) {
      return;
    }

    try {
      setIsProcessing(true);

      await processPayment({
        recommendationId: params.recommendationId,
        couponCode: appliedCouponCode || undefined,
        metadata: {
          skillId: params.skillId,
          assessmentId: params.assessmentId,
          recommendationId: params.recommendationId,
        },
        onSuccess: (assignmentId) => {
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
      const errorMessage = error.message || 'Payment failed. Please try again.';

      // Check if it's a price quote expired error
      if (errorMessage.toLowerCase().includes('price quote expired') || errorMessage.toLowerCase().includes('expired')) {
        // Navigate back to refresh the pricing
        setTimeout(() => {
          router.back();
        }, 1500);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseCredit = async () => {
    if (!params.skillId) {
      return;
    }

    if (!drillPrice || drillPrice <= 0) {
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

      router.push({
        pathname: '/activity',
        params: { tab: 'drills' }
      });
    } catch (error: any) {
      // Handle error silently
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscriptionPayment = async () => {
    if (!selectedPlanId) {
      return;
    }

    try {
      setIsProcessing(true);

      await processPayment({
        planId: selectedPlanId,
        couponCode: appliedCouponCode || undefined,
        onSuccess: () => {
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
      // Handle error silently
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwipeSuccess = () => {
    if (selectedOption === 'subscription' && hasPlans) {
      handleSubscriptionPayment();
    } else {
      handleDrillPackPayment();
    }
  };

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

  if (showPromoView) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <PromoCodeView
            onClose={() => setShowPromoView(false)}
            onSuccess={(assignmentId) => {
              // Check if it's a drill pack purchase (has recommendationId) or subscription
              if (selectedOption === 'one-time' || params.recommendationId) {
                // Drill pack purchase - redirect to activity page
                router.push({
                  pathname: '/activity',
                  params: { tab: 'drills' }
                });
              } else {
                // Subscription purchase - refresh subscription screen
                router.replace({
                  pathname: '/subscriptionScreen',
                  params: params
                });
              }
            }}
            basePrice={baseSubtotal}
            currency={activeCurrency}
            pricingMode={selectedOption === 'subscription' ? 'SUBSCRIPTION' : (params.recommendationId ? 'DYNAMIC' : 'FIXED')}
            recommendationId={params.recommendationId}
            processPayment={async (paymentParams) => {
              if (selectedOption === 'subscription') {
                await processPayment({
                  planId: selectedPlanId,
                  ...paymentParams,
                  onSuccess: paymentParams.onSuccess,
                  onCancel: () => setIsProcessing(false),
                });
              } else {
                await processPayment({
                  recommendationId: params.recommendationId,
                  metadata: {
                    skillId: params.skillId,
                    assessmentId: params.assessmentId,
                    recommendationId: params.recommendationId,
                  },
                  ...paymentParams,
                  onSuccess: paymentParams.onSuccess,
                  onCancel: () => setIsProcessing(false),
                });
              }
            }}
            isProcessing={isProcessing || processing}
          />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}>
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
            <Text style={styles.headerTitle}>
              {isSubscriptionMode ? 'My Subscription' : (hasActiveSubscription ? 'Unlock Drills' : 'Unlock Your Drills')}
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {subscriptionLoading && !isSubscriptionMode ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={BRAND} />
                <Text style={styles.loadingText}>Checking subscription status...</Text>
              </View>
            ) : (
              <>
                {isSubscriptionMode ? (
                  hasActiveSubscription ? (
                    changePlanMode ? (
                      <>
                        <View style={styles.plansContainer}>
                          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
                          {hasPlans ? (
                            formattedPlans.map((plan) => (
                              <PlanCard
                                key={plan.id}
                                duration={plan.duration}
                                price={plan.price}
                                savings={plan.savings}
                                isSelected={selectedPlanId === plan.id}
                                onSelect={() => setSelectedPlanId(plan.id)}
                                badge={plan.badge}
                              />
                            ))
                          ) : (
                            <View style={styles.comingSoonContainer}>
                              <View style={styles.comingSoonCard}>
                                <View style={styles.comingSoonIconContainer}>
                                  <Ionicons name="rocket-outline" size={SCREEN_WIDTH * 0.08} color={BRAND} />
                                </View>
                                <Text style={styles.comingSoonTitle}>Plans unavailable</Text>
                                <Text style={styles.comingSoonText}>
                                  We couldn't find subscription plans right now. Please try again later.
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity style={styles.neutralButton} onPress={handleExitChangePlan}>
                          <Text style={styles.neutralButtonText}>Back to current plan</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>

                        <View style={styles.planOverviewCard}>
                          <View style={styles.subscriptionHeader}>
                            <View style={{ flex: 1, paddingRight: SCREEN_WIDTH * 0.02 }}>
                              <Text style={styles.subscriptionTitle}>
                                {subscription?.plan
                                  ? (subscription.plan.toLowerCase().includes('monthly') ? 'Monthly Pro Plan' : subscription.plan.charAt(0) + subscription.plan.slice(1).toLowerCase() + ' Plan')
                                  : 'Current Plan'}
                              </Text>
                              <Text style={styles.subscriptionPrice}>
                                {subscriptionPriceDisplay || 'Price unavailable'}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.statusBadge,
                                subscription?.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  subscription?.status === 'ACTIVE' ? styles.statusActiveText : styles.statusInactiveText
                                ]}
                              >
                                {subscription?.status === 'ACTIVE' ? 'Active' : (subscription?.status || 'Inactive')}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.divider} />

                          <View style={styles.subscriptionRow}>
                            <Text style={styles.subscriptionRenewLabel}>Renews on {formatDateString(subscription?.endDate)}</Text>
                          </View>
                        </View>

                        <View style={styles.creditCard}>
                          <Text style={styles.creditTitle}>Credit Balance</Text>
                          <View style={styles.creditRow}>
                            <Text style={styles.creditLabel}>Total Monthly Credits</Text>
                            <Text style={styles.creditValue}>{subscription?.totalCredits ?? 0}</Text>
                          </View>
                          <View style={styles.creditRow}>
                            <Text style={styles.creditLabel}>Credits Available</Text>
                            <Text style={[styles.creditValue, styles.creditValueAvailable]}>{subscription?.credits ?? 0}</Text>
                          </View>
                        </View>

                        <View style={styles.subscriptionActions}>
                          <TouchableOpacity
                            style={styles.primaryActionButton}
                            onPress={handleChangePlanPress}
                            disabled={actionLoading === 'change'}
                          >
                            <Text style={styles.primaryActionText}>Change Plan</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.secondaryActionButton}
                            onPress={handleViewPaymentHistory}
                          >
                            <Text style={styles.secondaryActionText}>View Payment History</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.cancelActionButton}
                            onPress={handleCancelPress}
                            disabled={actionLoading === 'cancel'}
                          >
                            <Text style={styles.cancelActionText}>Cancel Subscription</Text>
                          </TouchableOpacity>
                          <Text style={styles.cancelHelperText}>
                            Please proceed with caution. This action is final and cannot be undone.
                          </Text>
                        </View>

                        {actionMessage && (
                          <Text
                            style={[
                              styles.actionMessage,
                              actionMessage.type === 'success' ? styles.actionMessageSuccess : styles.actionMessageError
                            ]}
                          >
                            {actionMessage.text}
                          </Text>
                        )}
                      </>
                    )
                  ) : (
                    <>
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

                      {hasPlans ? (
                        <View style={styles.plansContainer}>
                          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
                          {formattedPlans.map((plan) => (
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

                      <TouchableOpacity
                        style={styles.promoCodeContainer}
                        onPress={() => setShowPromoView(true)}
                      >
                        <Text style={styles.promoCodeText}>Have a promo code?</Text>
                      </TouchableOpacity>
                    </>
                  )
                ) : hasActiveSubscription ? (
                  <View style={styles.subscriberContainer}>
                    <View style={styles.unlockHeader}>
                      <Text style={styles.unlockTitle}>Unlock {params.skillId ? 'Communication' : 'Skill'} Drills!</Text>
                      <Text style={styles.unlockSubtitle}>
                        {drillCount} Personalized Drills for {params.skillId ? 'Communication' : 'this skill'}
                      </Text>
                    </View>

                    <View style={styles.balanceCard}>
                      <Text style={styles.balanceLabel}>Your Current Credits</Text>
                      <View style={styles.balanceRow}>
                        <Text style={styles.balanceValue}>{availableCredits}</Text>
                        <Ionicons name="ellipse" size={SCREEN_WIDTH * 0.04} color={COLORS.success} />
                      </View>
                    </View>

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

                    <TouchableOpacity
                      style={styles.promoCodeContainer}
                      onPress={() => setShowPromoView(true)}
                    >
                      <Text style={styles.promoCodeText}>Have a promo code?</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </ScrollView>

          {!isSubscriptionMode && !hasActiveSubscription && (
            <View style={styles.footer}>
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

          {isSubscriptionMode && hasPlans && (!hasActiveSubscription || changePlanMode) && (
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

          <Modal
            visible={showOutOfCreditsModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowOutOfCreditsModal(false)}
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

          <Modal
            visible={showCancelConfirm}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowCancelConfirm(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Cancel subscription?</Text>
                <Text style={styles.modalText}>
                  This action is final and cannot be undone. You will lose access to your remaining credits immediately.
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.dangerButton}
                    onPress={() => {
                      setShowCancelConfirm(false);
                      handleCancelSubscription();
                    }}
                    disabled={actionLoading === 'cancel'}
                  >
                    <Text style={styles.dangerButtonText}>
                      {actionLoading === 'cancel' ? 'Cancelling...' : 'Confirm Cancel'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.neutralButton}
                    onPress={() => setShowCancelConfirm(false)}
                    disabled={actionLoading === 'cancel'}
                  >
                    <Text style={styles.neutralButtonText}>Keep Subscription</Text>
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

