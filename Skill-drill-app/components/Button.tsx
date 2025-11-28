/**
 * Button Component
 *
 * Reusable button component following Brand design system.
 *
 * Variants:
 * - primary: Filled brand color button (default)
 * - secondary: Outlined button
 * - ghost: Text-only button
 * - success: Success/confirm action button
 * - danger: Delete/warning action button
 *
 * Sizes:
 * - small: Compact button
 * - medium: Standard button (default)
 * - large: Prominent button
 *
 * Usage:
 * <Button
 *   variant="primary"
 *   size="medium"
 *   onPress={() => {}}
 *   loading={false}
 *   disabled={false}
 *   icon="checkmark"
 *   fullWidth
 * >
 *   Button Text
 * </Button>
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BRAND,
  BRAND_DARK,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  GRADIENTS
} from '../app/components/Brand';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'gradient';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle: textStyleProp,
  testID
}) => {
  // Size configurations
  const sizeConfig = {
    small: {
      paddingVertical: SPACING.padding.xs,
      paddingHorizontal: SPACING.padding.sm,
      fontSize: TYPOGRAPHY.fontSize.sm,
      iconSize: 16,
      height: 36
    },
    medium: {
      paddingVertical: SPACING.padding.sm,
      paddingHorizontal: SPACING.padding.lg,
      fontSize: TYPOGRAPHY.fontSize.md,
      iconSize: 20,
      height: 48
    },
    large: {
      paddingVertical: SPACING.padding.md,
      paddingHorizontal: SPACING.padding.xl,
      fontSize: TYPOGRAPHY.fontSize.lg,
      iconSize: 24,
      height: 56
    }
  };

  const currentSize = sizeConfig[size];

  // Variant styles
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    if (disabled) {
      return {
        container: {
          backgroundColor: COLORS.gray[200],
          borderWidth: 0
        },
        text: {
          color: COLORS.text.disabled
        }
      };
    }

    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: BRAND,
            borderWidth: 0
          },
          text: {
            color: COLORS.white,
            fontWeight: TYPOGRAPHY.fontWeight.semibold
          }
        };

      case 'secondary':
        return {
          container: {
            backgroundColor: COLORS.background.primary,
            borderWidth: 1.5,
            borderColor: COLORS.border.medium
          },
          text: {
            color: COLORS.text.primary,
            fontWeight: TYPOGRAPHY.fontWeight.semibold
          }
        };

      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0
          },
          text: {
            color: BRAND,
            fontWeight: TYPOGRAPHY.fontWeight.semibold
          }
        };

      case 'success':
        return {
          container: {
            backgroundColor: COLORS.success,
            borderWidth: 0
          },
          text: {
            color: COLORS.white,
            fontWeight: TYPOGRAPHY.fontWeight.semibold
          }
        };

      case 'danger':
        return {
          container: {
            backgroundColor: COLORS.error,
            borderWidth: 0
          },
          text: {
            color: COLORS.white,
            fontWeight: TYPOGRAPHY.fontWeight.semibold
          }
        };

      case 'gradient':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0
          },
          text: {
            color: COLORS.white,
            fontWeight: TYPOGRAPHY.fontWeight.semibold
          }
        };

      default:
        return {
          container: {
            backgroundColor: BRAND,
            borderWidth: 0
          },
          text: {
            color: COLORS.white,
            fontWeight: TYPOGRAPHY.fontWeight.semibold
          }
        };
    }
  };

  const variantStyles = getVariantStyles();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: currentSize.paddingVertical,
    paddingHorizontal: currentSize.paddingHorizontal,
    minHeight: currentSize.height,
    ...variantStyles.container,
    ...(fullWidth && { width: '100%' }),
    ...(disabled && { opacity: 0.6 }),
    ...(variant !== 'ghost' && !disabled && SHADOWS.md)
  };

  const textStyle: TextStyle = {
    fontSize: currentSize.fontSize,
    ...variantStyles.text,
    letterSpacing: 0.3
  };

  const renderContent = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'ghost' ? BRAND : COLORS.white}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={currentSize.iconSize}
              color={variantStyles.text.color}
              style={{ marginRight: SPACING.xs }}
            />
          )}

          <Text style={[textStyle, textStyleProp]} numberOfLines={1}>
            {children}
          </Text>

          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={currentSize.iconSize}
              color={variantStyles.text.color}
              style={{ marginLeft: SPACING.xs }}
            />
          )}
        </>
      )}
    </View>
  );

  // Gradient variant uses LinearGradient wrapper
  if (variant === 'gradient' && !disabled) {
    return (
      <MotiView
        from={{ scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ type: 'timing', duration: 200 }}
      >
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled || loading}
          activeOpacity={0.8}
          style={style}
          testID={testID}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={containerStyle}
          >
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      </MotiView>
    );
  }

  // Standard variants
  return (
    <MotiView
      from={{ scale: 1 }}
      animate={{ scale: 1 }}
      transition={{ type: 'timing', duration: 200 }}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[containerStyle, style]}
        testID={testID}
      >
        {renderContent()}
      </TouchableOpacity>
    </MotiView>
  );
};

export default Button;
