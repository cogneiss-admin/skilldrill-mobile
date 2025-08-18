// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';
import * as Haptics from 'expo-haptics';

type ErrorTone = 'error' | 'warning' | 'success' | 'info';

interface CompactErrorBannerProps {
  message?: string | null;
  tone?: ErrorTone;
  dismissible?: boolean;
  onDismiss?: () => void;
  animated?: boolean;
  showIcon?: boolean;
  style?: any;
}

const TONE_CONFIG = {
  error: {
    bg: '#FEF7F7',
    border: '#FCA5A5',
    text: '#991B1B',
    icon: '#B91C1C',
  },
  warning: {
    bg: '#FFFBEB',
    border: '#FCD34D',
    text: '#92400E',
    icon: '#D97706',
  },
  success: {
    bg: '#F0FDF4',
    border: '#A7F3D0',
    text: '#065F46',
    icon: '#059669',
  },
  info: {
    bg: '#F8FAFF',
    border: '#BFDBFE',
    text: '#1E40AF',
    icon: '#2563EB',
  },
} as const;

export default function CompactErrorBanner({
  message,
  tone = 'error',
  dismissible = true,
  onDismiss,
  animated = true,
  showIcon = true,
  style,
}: CompactErrorBannerProps) {
  const responsive = useResponsive();
  const slideAnim = React.useRef(new Animated.Value(-50)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  const config = TONE_CONFIG[tone];

  useEffect(() => {
    if (message && animated) {
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Slide in animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
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
      ]).start();
    }
  }, [message, animated]);

  const handleDismiss = () => {
    if (dismissible && onDismiss) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDismiss();
    }
  };

  if (!message) return null;

  const bannerContent = (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          borderRadius: responsive.card.borderRadius,
          paddingVertical: responsive.padding.sm,
          paddingHorizontal: responsive.padding.md,
          maxWidth: responsive.maxWidth.form,
          alignSelf: 'center',
          width: '100%',
          shadowColor: config.icon,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 2,
          elevation: 1,
          ...style,
        },
      ]}
    >
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconContainer}>
            <AntDesign
              name={tone === 'success' ? 'checkcircle' : tone === 'info' ? 'infocirlceo' : 'exclamationcircleo'}
              size={responsive.size(18)}
              color={config.icon}
            />
          </View>
        )}

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.message,
              {
                color: config.text,
                fontSize: responsive.typography.body2,
                fontWeight: '500',
              },
            ]}
            numberOfLines={1}
          >
            {message}
          </Text>
        </View>

        {dismissible && onDismiss && (
          <Pressable
            onPress={handleDismiss}
            style={styles.dismissButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="close"
              size={responsive.size(16)}
              color={config.text}
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
            transform: [{ translateY: slideAnim }],
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
    lineHeight: 20,
  },
  dismissButton: {
    padding: 4,
  },
});
