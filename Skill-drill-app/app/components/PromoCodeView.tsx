import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, ViewStyle, TextStyle, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, BRAND, SCREEN_BACKGROUND, SHADOWS } from './Brand';
import SwipeButton from './SwipeButton';
import apiService from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PromoCodeViewProps {
    onClose: () => void;
    onSuccess: (assignmentId?: string) => void;
    basePrice: number;
    currency: string;
    pricingMode: 'FIXED' | 'DYNAMIC' | 'SUBSCRIPTION';
    recommendationId?: string;
    processPayment: (params: any) => Promise<void>;
    isProcessing: boolean;
}

const PromoCodeView: React.FC<PromoCodeViewProps> = ({
    onClose,
    onSuccess,
    basePrice,
    currency,
    pricingMode,
    recommendationId,
    processPayment,
    isProcessing,
}) => {
    const [promoCode, setPromoCode] = useState('');
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [orderTotal, setOrderTotal] = useState(basePrice);
    const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const celebrationRef = useRef<LottieView>(null);

    useEffect(() => {
        setOrderTotal(basePrice);
        setDiscountAmount(0);
        setAppliedCouponCode(null);
        setPromoMessage(null);
    }, [basePrice]);

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
            minimumFractionDigits: 2,
        }).format(amount);
    };

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

    const handleApplyCoupon = async () => {
        const code = promoCode.trim().toUpperCase();

        if (!code) {
            setPromoMessage({ type: 'error', text: 'Please enter a promo code.' });
            return;
        }

        if (!basePrice || basePrice <= 0) {
            setPromoMessage({ type: 'error', text: 'Price unavailable. Please try again.' });
            return;
        }

        setPromoLoading(true);
        setPromoMessage(null);

        try {
            const res = await apiService.validateCoupon({
                code,
                orderAmount: basePrice,
                pricingMode,
                ...(pricingMode === 'DYNAMIC' && recommendationId ? { recommendationId } : {})
            });

            if (res.success && res.data?.discount) {
                const discount = res.data.discount.discountAmount ?? 0;
                const finalPrice = res.data.discount.finalPrice ?? Math.max(0, basePrice - discount);

                setDiscountAmount(discount);
                setOrderTotal(finalPrice);
                setAppliedCouponCode(code);
                setPromoMessage({ type: 'success', text: res.message || 'Promo code applied successfully!' });

                // Show celebration animation
                setShowCelebration(true);
                celebrationRef.current?.play();

                // Hide animation after 3 seconds
                setTimeout(() => {
                    setShowCelebration(false);
                }, 3000);
            } else {
                setPromoMessage({
                    type: 'error',
                    text: mapCouponError(res.message)
                });
                setAppliedCouponCode(null);
                setDiscountAmount(0);
                setOrderTotal(basePrice);
            }
        } catch (error: any) {
            setPromoMessage({
                type: 'error',
                text: mapCouponError(error?.message)
            });
            setAppliedCouponCode(null);
            setDiscountAmount(0);
            setOrderTotal(basePrice);
        } finally {
            setPromoLoading(false);
        }
    };

    const handleSwipeSuccess = async () => {
        await processPayment({
            couponCode: appliedCouponCode || undefined,
            onSuccess,
        });
    };

    return (
        <View style={styles.container}>
            {/* Header matching subscription screen */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="chevron-back" size={SCREEN_WIDTH * 0.05} color={COLORS.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Apply Promo Code</Text>
            </View>

            {/* Celebration Animation Overlay */}
            {showCelebration && (
                <View style={styles.celebrationOverlay} pointerEvents="none">
                    <LottieView
                        ref={celebrationRef}
                        source={require('../../assets/lottie/CelebrationAnime.json')}
                        style={styles.celebrationAnimation}
                        autoPlay
                        loop={false}
                    />
                </View>
            )}

            {/* Scrollable content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.subtitle}>
                    Enter your code below to claim your discount.
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Enter promo code"
                    placeholderTextColor={COLORS.text.tertiary}
                    value={promoCode}
                    onChangeText={(text) => {
                        setPromoCode(text.toUpperCase());
                        setPromoMessage(null);
                    }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                />

                <TouchableOpacity
                    style={styles.applyButton}
                    onPress={handleApplyCoupon}
                    disabled={promoLoading}
                >
                    {promoLoading ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.applyButtonText}>Apply</Text>
                    )}
                </TouchableOpacity>

                {promoMessage && (
                    <View style={[
                        styles.messageContainer,
                        promoMessage.type === 'success' ? styles.successContainer : styles.errorContainer
                    ]}>
                        <Ionicons
                            name={promoMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                            size={SCREEN_WIDTH * 0.05}
                            color={promoMessage.type === 'success' ? '#FDB022' : '#EF4444'}
                        />
                        <Text style={[
                            styles.messageText,
                            promoMessage.type === 'success' ? styles.successText : styles.errorText
                        ]}>
                            {promoMessage.text}
                        </Text>
                    </View>
                )}

                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>Order Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>{formatPrice(basePrice)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Discount</Text>
                        <Text style={[styles.summaryValue, styles.discountValue]}>
                            {discountAmount > 0 ? `- ${formatPrice(discountAmount)}` : formatPrice(0)}
                        </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, styles.totalLabel]}>Total</Text>
                        <Text style={[styles.summaryValue, styles.totalValue]}>{formatPrice(orderTotal)}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Footer at bottom matching subscription screen */}
            <View style={styles.footer}>
                <SwipeButton
                    onSwipeSuccess={handleSwipeSuccess}
                    loading={isProcessing}
                    disabled={false}
                />
                <View style={styles.securePayment}>
                    <Ionicons name="lock-closed-outline" size={SCREEN_WIDTH * 0.03} color={COLORS.text.tertiary} />
                    <Text style={styles.secureText}>Secure payment powered by Stripe</Text>
                </View>
            </View>
        </View>
    );
};

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
    scrollView: {
        flex: 1,
    } as ViewStyle,
    scrollContent: {
        paddingBottom: SCREEN_WIDTH * 0.1,
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingTop: SCREEN_WIDTH * 0.05,
    } as ViewStyle,
    subtitle: {
        fontSize: SCREEN_WIDTH * 0.038,
        color: COLORS.text.secondary,
        marginBottom: SCREEN_WIDTH * 0.06,
        lineHeight: SCREEN_WIDTH * 0.055,
    } as TextStyle,
    input: {
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        paddingHorizontal: SCREEN_WIDTH * 0.05,
        paddingVertical: SCREEN_WIDTH * 0.04,
        fontSize: SCREEN_WIDTH * 0.042,
        color: COLORS.text.primary,
        borderWidth: 1.5,
        borderColor: COLORS.gray[300],
        marginBottom: SCREEN_WIDTH * 0.04,
        ...SHADOWS.sm,
    } as TextStyle,
    applyButton: {
        width: '100%',
        backgroundColor: '#FDB022',
        borderRadius: BORDER_RADIUS.xl,
        paddingVertical: SCREEN_WIDTH * 0.04,
        alignItems: 'center',
        marginBottom: SCREEN_WIDTH * 0.05,
        ...SHADOWS.md,
    } as ViewStyle,
    applyButtonText: {
        fontSize: SCREEN_WIDTH * 0.042,
        fontWeight: '700',
        color: COLORS.text.primary,
    } as TextStyle,
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SCREEN_WIDTH * 0.03,
        padding: SCREEN_WIDTH * 0.04,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SCREEN_WIDTH * 0.05,
    } as ViewStyle,
    successContainer: {
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FDB022',
    } as ViewStyle,
    errorContainer: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#EF4444',
    } as ViewStyle,
    messageText: {
        fontSize: SCREEN_WIDTH * 0.038,
        fontWeight: '600',
        flex: 1,
        lineHeight: SCREEN_WIDTH * 0.052,
    } as TextStyle,
    successText: {
        color: '#FDB022',
    } as TextStyle,
    errorText: {
        color: '#EF4444',
    } as TextStyle,
    summaryContainer: {
        width: '100%',
        marginTop: SCREEN_WIDTH * 0.02,
        padding: SCREEN_WIDTH * 0.05,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.white,
        ...SHADOWS.sm,
    } as ViewStyle,
    summaryTitle: {
        fontSize: SCREEN_WIDTH * 0.045,
        fontWeight: '700',
        marginBottom: SCREEN_WIDTH * 0.04,
        color: COLORS.text.primary,
    } as TextStyle,
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SCREEN_WIDTH * 0.03,
    } as ViewStyle,
    summaryLabel: {
        fontSize: SCREEN_WIDTH * 0.04,
        color: COLORS.text.secondary,
    } as TextStyle,
    summaryValue: {
        fontSize: SCREEN_WIDTH * 0.04,
        fontWeight: '600',
        color: COLORS.text.primary,
    } as TextStyle,
    discountValue: {
        color: '#FDB022',
        fontWeight: '700',
    } as TextStyle,
    summaryDivider: {
        height: 1,
        backgroundColor: COLORS.gray[200],
        marginVertical: SCREEN_WIDTH * 0.03,
    } as ViewStyle,
    totalLabel: {
        fontWeight: '700',
        fontSize: SCREEN_WIDTH * 0.042,
        color: COLORS.text.primary,
    } as TextStyle,
    totalValue: {
        fontWeight: '800',
        fontSize: SCREEN_WIDTH * 0.05,
        color: COLORS.text.primary,
    } as TextStyle,
    footer: {
        paddingTop: SCREEN_WIDTH * 0.04,
        paddingBottom: SCREEN_WIDTH * 0.04,
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray[200],
    } as ViewStyle,
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
    celebrationOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    } as ViewStyle,
    celebrationAnimation: {
        width: SCREEN_WIDTH * 0.8,
        height: SCREEN_WIDTH * 0.8,
    } as ViewStyle,
});

export default PromoCodeView;
