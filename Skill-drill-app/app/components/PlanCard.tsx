import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, BRAND } from './Brand';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PlanCardProps {
    duration: string; // e.g., "12 Months"
    price: string; // e.g., "$3.99/month"
    savings?: string; // e.g., "Save 60%"
    isSelected: boolean;
    onSelect: () => void;
    badge?: 'BEST VALUE' | 'POPULAR';
}

const PlanCard: React.FC<PlanCardProps> = ({
    duration,
    price,
    savings,
    isSelected,
    onSelect,
    badge,
}) => {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onSelect}
            style={[
                styles.container,
                isSelected && styles.selectedContainer,
            ]}
        >
            {/* Badge */}
            {badge && (
                <View style={[
                    styles.badge,
                    badge === 'BEST VALUE' ? styles.badgeBestValue : styles.badgePopular
                ]}>
                    <Text style={[
                        styles.badgeText,
                        badge === 'POPULAR' && { color: COLORS.white }
                    ]}>{badge}</Text>
                </View>
            )}

            <View style={styles.content}>
                <View>
                    <Text style={styles.duration}>{duration}</Text>
                    <Text style={styles.price}>{price}</Text>
                </View>

                {savings && (
                    <Text style={styles.savings}>{savings}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        borderRadius: SCREEN_WIDTH * 0.03,
        borderWidth: 1,
        borderColor: COLORS.border.light,
        marginBottom: SCREEN_WIDTH * 0.04,
        padding: SCREEN_WIDTH * 0.05,
        position: 'relative',
        minHeight: SCREEN_WIDTH * 0.18,
        justifyContent: 'center',
    },
    selectedContainer: {
        borderColor: BRAND,
        borderWidth: 2,
        backgroundColor: '#F0F7FF', // Light Blue Tint
    },
    badge: {
        position: 'absolute',
        top: -SCREEN_WIDTH * 0.025,
        left: SCREEN_WIDTH * 0.04,
        paddingHorizontal: SCREEN_WIDTH * 0.025,
        paddingVertical: SCREEN_WIDTH * 0.005,
        borderRadius: SCREEN_WIDTH * 0.025,
        zIndex: 1,
    },
    badgeBestValue: {
        backgroundColor: '#FFD700', // Gold
    },
    badgePopular: {
        backgroundColor: BRAND,
    },
    badgeText: {
        fontSize: SCREEN_WIDTH * 0.025,
        fontWeight: '700',
        color: '#000000',
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    duration: {
        fontSize: SCREEN_WIDTH * 0.04,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: SCREEN_WIDTH * 0.005,
    },
    price: {
        fontSize: SCREEN_WIDTH * 0.035,
        color: COLORS.text.secondary,
        fontWeight: '500',
    },
    savings: {
        fontSize: SCREEN_WIDTH * 0.035,
        fontWeight: '700',
        color: '#16A34A', // Success Green
    },
});

export default PlanCard;
