import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS, BRAND } from './Brand';

interface SubscriberViewProps {
    credits: number;
    drillName?: string;
    drillCount?: number;
    onUseCredit: () => void;
}

const SubscriberView: React.FC<SubscriberViewProps> = ({
    credits,
    drillName = 'Public Speaking Fundamentals',
    drillCount = 10,
    onUseCredit,
}) => {
    const creditsNeeded = 5; // Mock cost
    const remainingCredits = credits - creditsNeeded;

    return (
        <View style={styles.container}>
            {/* Credits Available Card */}
            <View style={styles.creditCard}>
                <View style={styles.iconContainer}>
                    <Ionicons name="wallet-outline" size={24} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.creditTitle}>You have {credits} credits available!</Text>
                    <Text style={styles.creditSubtitle}>
                        Use your subscription credits to unlock these drills for free.
                    </Text>
                    <Text style={styles.debitText}>
                        {creditsNeeded} credits will be debited for this unlock
                    </Text>
                </View>
            </View>

            {/* Unlock Details Card */}
            <View style={styles.detailsCard}>
                <Text style={styles.detailsTitle}>Unlocking:</Text>
                <View style={styles.divider} />
                <Text style={styles.drillName}>{drillName}</Text>
                <View style={styles.divider} />
                <Text style={styles.drillCount}>{drillCount} Personalized Drills</Text>

                <Text style={styles.remainingText}>
                    Remaining after unlock: {remainingCredits} credits
                </Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
                style={styles.actionButton}
                onPress={onUseCredit}
                activeOpacity={0.8}
            >
                <Text style={styles.actionButtonText}>Use Subscription Credit</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: SPACING.padding.lg,
        gap: SPACING.margin.xl,
    },
    creditCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS['2xl'],
        padding: SPACING.padding.xl,
        flexDirection: 'row',
        gap: SPACING.margin.md,
        ...SHADOWS.sm,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#DCFCE7', // Light green
        justifyContent: 'center',
        alignItems: 'center',
    },
    creditTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
    },
    creditSubtitle: {
        fontSize: 14,
        color: COLORS.text.secondary,
        lineHeight: 20,
        marginBottom: 12,
    },
    debitText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#16A34A',
    },
    detailsCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS['2xl'],
        padding: SPACING.padding.xl,
        ...SHADOWS.sm,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    detailsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    drillName: {
        fontSize: 16,
        color: COLORS.text.secondary,
    },
    drillCount: {
        fontSize: 16,
        color: COLORS.text.secondary,
    },
    remainingText: {
        fontSize: 14,
        color: COLORS.text.tertiary,
        textAlign: 'center',
        marginTop: 24,
    },
    actionButton: {
        backgroundColor: '#10B981', // Emerald 500
        borderRadius: BORDER_RADIUS['3xl'],
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.md,
        marginTop: SPACING.margin.lg,
    },
    actionButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
    },
});

export default SubscriberView;
