import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, ViewStyle, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';
import * as Haptics from 'expo-haptics';

type Props = {
  message?: string | null;
  tone?: 'error' | 'success' | 'info' | 'warning';
  compact?: boolean;
  ctaText?: string;
  onCtaPress?: () => void;
  style?: ViewStyle;
  dismissible?: boolean;
  onDismiss?: () => void;
  animated?: boolean;
  showIcon?: boolean;
};

const COLORS = {
  error: {
    bg: '#FEF2F2',
    border: '#FCA5A5',
    text: '#991B1B',
    icon: '#B91C1C',
    bgLight: '#FEF7F7',
  },
  warning: {
    bg: '#FFFBEB',
    border: '#FCD34D',
    text: '#92400E',
    icon: '#D97706',
    bgLight: '#FFFBEB',
  },
  success: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    text: '#065F46',
    icon: '#059669',
    bgLight: '#F0FDF4',
  },
  info: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    text: '#1E40AF',
    icon: '#2563EB',
    bgLight: '#F8FAFF',
  },
} as const;

export default function ErrorBanner({ 
  message, 
  tone = 'error', 
  compact = false, 
  ctaText, 
  onCtaPress, 
  style,
  dismissible = false,
  onDismiss,
  animated = true,
  showIcon = true,
}: Props) {
  const responsive = useResponsive();
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (message && animated) {
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Slide in animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!message && animated) {
      // Slide out animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [message, animated]);

  const handleDismiss = () => {
    if (dismissible && onDismiss) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDismiss();
    }
  };

  const handleCtaPress = () => {
    if (onCtaPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onCtaPress();
    }
  };

  if (!message) return null;
  const palette = COLORS[tone];
  
  const bannerContent = (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: palette.bgLight,
          borderColor: palette.border,
          borderRadius: responsive.card.borderRadius,
          paddingVertical: compact ? responsive.padding.xs : responsive.padding.sm,
          paddingHorizontal: compact ? responsive.padding.sm : responsive.padding.md,
          maxWidth: responsive.maxWidth.form,
          alignSelf: 'center',
          width: '100%',
          shadowColor: palette.icon,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
          elevation: 2,
          ...(style || {}),
        },
      ]}
    >
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconContainer}>
            <Ionicons
              name={tone === 'success' ? 'checkmark-circle' :
                    tone === 'info' ? 'information-circle-outline' :
                    tone === 'warning' ? 'warning-outline' : 'alert-circle-outline'}
              size={responsive.size(16)}
              color={palette.icon}
            />
          </View>
        )}
        
        <View style={styles.textContainer}>
          <Text style={[
            styles.message,
            { 
              color: palette.text, 
              fontWeight: '500', 
              fontSize: compact ? responsive.typography.caption : responsive.typography.body2 
            }
          ]} numberOfLines={2}>
            {message}
          </Text>
          {ctaText && onCtaPress && (
            <Text onPress={handleCtaPress} style={[
              styles.ctaText,
              { 
                color: '#0A66C2', 
                fontSize: compact ? responsive.typography.caption : responsive.typography.body2,
                fontWeight: '600',
                marginTop: responsive.spacing(2),
              }
            ]}>
              {ctaText}
            </Text>
          )}
        </View>

        {dismissible && onDismiss && (
          <Pressable
            onPress={handleDismiss}
            style={styles.dismissButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close"
              size={responsive.size(14)}
              color={palette.text}
            />
          </Pressable>
        )}
      </View>
    </View>
  );

  if (animated) {
    return (
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        {bannerContent}
      </Animated.View>
    );
  }

  return bannerContent;
}

const styles = StyleSheet.create({
  animatedContainer: {
    width: '100%',
  },
  banner: {
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  message: {
    lineHeight: 18,
  },
  ctaText: {
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
});


