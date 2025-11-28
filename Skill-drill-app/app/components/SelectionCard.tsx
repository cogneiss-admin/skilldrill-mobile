import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS, BRAND } from './Brand';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SelectionCardProps {
    title: string;
    subtitle?: string;
    price?: string;
    features?: (string | { title: string; description: string })[];
    isSelected: boolean;
    onSelect: () => void;
    badge?: string;
    variant?: 'subscription' | 'one-time';
}

const SelectionCard: React.FC<SelectionCardProps> = ({
    title,
    subtitle,
    price,
    features,
    isSelected,
    onSelect,
    badge,
    variant = 'subscription',
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
            {/* Badge (Best Value) */}
            {badge && (
                <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}

            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>{title}</Text>
                        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                    </View>

                    {/* Radio Button */}
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                    </View>
                </View>

                {/* Features List (only for subscription) */}
                {features && features.length > 0 && (
                    <View style={styles.featuresContainer}>
                        {features.map((feature, index) => (
                            <View key={index} style={styles.featureRow}>
                                <Ionicons name="star" size={SCREEN_WIDTH * 0.04} color="#F59E0B" style={{ marginTop: 2 }} />
                                <View style={{ flex: 1 }}>
                                    {typeof feature === 'string' ? (
                                        <Text style={styles.featureText}>{feature}</Text>
                                    ) : (
                                        <>
                                            <Text style={styles.featureTitle}>{feature.title}</Text>
                                            <Text style={styles.featureDescription}>{feature.description}</Text>
                                        </>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Price for one-time pack (if not in subtitle) */}
                {variant === 'one-time' && price && (
                    <Text style={styles.oneTimePrice}>{price}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        borderRadius: SCREEN_WIDTH * 0.03,
        borderWidth: 1.5,
        borderColor: COLORS.border.light,
        marginBottom: SCREEN_WIDTH * 0.04,
        position: 'relative',
        ...SHADOWS.sm,
    },
    selectedContainer: {
        borderColor: '#FFD700', // Gold/Yellow glow
        backgroundColor: '#FFFFF9', // Very subtle yellow tint
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: SCREEN_WIDTH * 0.02,
        elevation: 4,
    },
    badgeContainer: {
        position: 'absolute',
        top: -SCREEN_WIDTH * 0.025,
        right: SCREEN_WIDTH * 0.04,
        backgroundColor: '#FFD700',
        paddingHorizontal: SCREEN_WIDTH * 0.03,
        paddingVertical: SCREEN_WIDTH * 0.01,
        borderRadius: SCREEN_WIDTH * 0.03,
        zIndex: 10,
    },
    badgeText: {
        fontSize: SCREEN_WIDTH * 0.025,
        fontWeight: '800',
        color: '#000000',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    content: {
        padding: SCREEN_WIDTH * 0.05,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: SCREEN_WIDTH * 0.04,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: SCREEN_WIDTH * 0.01,
    },
    subtitle: {
        fontSize: SCREEN_WIDTH * 0.035,
        color: COLORS.text.secondary,
        fontWeight: '500',
    },
    radioOuter: {
        width: SCREEN_WIDTH * 0.06,
        height: SCREEN_WIDTH * 0.06,
        borderRadius: SCREEN_WIDTH * 0.03,
        borderWidth: 2,
        borderColor: COLORS.gray[300],
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: SCREEN_WIDTH * 0.03,
    },
    radioOuterSelected: {
        borderColor: BRAND,
        backgroundColor: BRAND,
        borderWidth: 0,
    },
    radioInner: {
        width: SCREEN_WIDTH * 0.025,
        height: SCREEN_WIDTH * 0.025,
        borderRadius: SCREEN_WIDTH * 0.0125,
        backgroundColor: COLORS.white,
    },
    featuresContainer: {
        marginTop: SCREEN_WIDTH * 0.04,
        gap: SCREEN_WIDTH * 0.02,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SCREEN_WIDTH * 0.02,
    },
    featureText: {
        fontSize: SCREEN_WIDTH * 0.035,
        color: COLORS.text.secondary,
        lineHeight: SCREEN_WIDTH * 0.05,
    },
    featureTitle: {
        fontSize: SCREEN_WIDTH * 0.035,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: SCREEN_WIDTH * 0.005,
    },
    featureDescription: {
        fontSize: SCREEN_WIDTH * 0.032,
        color: COLORS.text.secondary,
        lineHeight: SCREEN_WIDTH * 0.045,
    },
    oneTimePrice: {
        fontSize: SCREEN_WIDTH * 0.045,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginTop: SCREEN_WIDTH * 0.02,
    },
});

export default SelectionCard;
