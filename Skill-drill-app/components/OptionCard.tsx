/**
 * OptionCard Component
 *
 * Reusable option card for subscription/payment choices.
 *
 * Features:
 * - Interactive selection state
 * - Badge/label support (e.g., "BEST VALUE", "POPULAR")
 * - Price display with currency formatting
 * - Feature list with checkmarks
 * - Gradient accent for premium options
 * - Animated selection state
 *
 * Usage:
 * <OptionCard
 *   title="Monthly Subscription"
 *   price="$9.99"
 *   period="per month"
 *   features={['10 drill credits/month', 'Cancel anytime', 'Priority support']}
 *   badge="BEST VALUE"
 *   isSelected={selectedOption === 'subscription'}
 *   onPress={() => setSelectedOption('subscription')}
 *   premium
 * />
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleProp,
  ViewStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BRAND,
  BRAND_LIGHT,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS
} from '../app/components/Brand';

interface OptionCardProps {
  title: string;
  price: string;
  period?: string;
  features: string[];
  badge?: string;
  isSelected: boolean;
  onPress: () => void;
  premium?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const OptionCard: React.FC<OptionCardProps> = ({
  title,
  price,
  period,
  features,
  badge,
  isSelected,
  onPress,
  premium = false,
  disabled = false,
  style,
  testID
}) => {
  const containerStyle: ViewStyle = {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: isSelected ? BRAND : COLORS.border.light,
    backgroundColor: isSelected ? BRAND_LIGHT : COLORS.white,
    overflow: 'hidden',
    ...(!disabled && SHADOWS.lg)
  };

  return (
    <MotiView
      from={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', duration: 400 }}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        style={[containerStyle, style]}
        testID={testID}
      >
        {/* Badge */}
        {badge && (
          <View style={{
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 10
          }}>
            <LinearGradient
              colors={[BRAND, COLORS.successDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingHorizontal: SPACING.padding.md,
                paddingVertical: SPACING.padding.xs,
                borderBottomLeftRadius: BORDER_RADIUS.lg
              }}
            >
              <Text style={{
                ...TYPOGRAPHY.label,
                color: COLORS.white,
                fontWeight: '700',
                letterSpacing: 0.8
              }}>
                {badge}
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Card Content */}
        <View style={{
          padding: SPACING.padding.lg
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: SPACING.margin.md
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                ...TYPOGRAPHY.h2,
                color: COLORS.text.primary,
                marginBottom: SPACING.xs
              }}>
                {title}
              </Text>

              {/* Price */}
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{
                  fontSize: 32,
                  fontWeight: '800',
                  color: isSelected ? BRAND : COLORS.text.primary,
                  letterSpacing: -0.5
                }}>
                  {price}
                </Text>
                {period && (
                  <Text style={{
                    ...TYPOGRAPHY.body,
                    color: COLORS.text.tertiary,
                    marginLeft: SPACING.xs
                  }}>
                    {period}
                  </Text>
                )}
              </View>
            </View>

            {/* Selection Indicator */}
            <View style={{
              width: 32,
              height: 32,
              borderRadius: BORDER_RADIUS.full,
              borderWidth: 2,
              borderColor: isSelected ? BRAND : COLORS.border.medium,
              backgroundColor: isSelected ? BRAND : COLORS.white,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isSelected && (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={COLORS.white}
                />
              )}
            </View>
          </View>

          {/* Divider */}
          <View style={{
            height: 1,
            backgroundColor: COLORS.border.light,
            marginVertical: SPACING.margin.md
          }} />

          {/* Features List */}
          <View style={{ gap: SPACING.gap.sm }}>
            {features.map((feature, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start'
                }}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: BORDER_RADIUS.full,
                  backgroundColor: isSelected ? BRAND : COLORS.success,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: SPACING.sm,
                  marginTop: 2
                }}>
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={COLORS.white}
                  />
                </View>

                <Text style={{
                  ...TYPOGRAPHY.body,
                  color: COLORS.text.secondary,
                  flex: 1,
                  lineHeight: 20
                }}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* Premium Accent */}
          {premium && isSelected && (
            <View style={{
              marginTop: SPACING.margin.md,
              padding: SPACING.padding.sm,
              backgroundColor: BRAND,
              borderRadius: BORDER_RADIUS.md,
              alignItems: 'center'
            }}>
              <Text style={{
                ...TYPOGRAPHY.caption,
                color: COLORS.white,
                fontWeight: '600'
              }}>
                ✨ Premium Choice
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </MotiView>
  );
};

export default OptionCard;
