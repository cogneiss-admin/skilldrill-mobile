// @ts-nocheck
import React, { useEffect } from 'react';
import { View, Text, Pressable, Animated, Dimensions } from 'react-native';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');

type ErrorTone = 'error' | 'warning' | 'success' | 'info';

interface EnhancedErrorBannerProps {
  message?: string | null;
  tone?: ErrorTone;
  title?: string;
  compact?: boolean;
  dismissible?: boolean;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
  ctaText?: string;
  onCtaPress?: () => void;
  onDismiss?: () => void;
  style?: any;
  showIcon?: boolean;
  animated?: boolean;
}

const TONE_CONFIG = {
  error: {
    bg: '#FEF2F2',
    border: '#FCA5A5',
    text: '#991B1B',
    icon: '#B91C1C',
    iconName: 'exclamationcircleo',
    title: 'Error',
  },
  warning: {
    bg: '#FFFBEB',
    border: '#FCD34D',
    text: '#92400E',
    icon: '#D97706',
    iconName: 'warning',
    title: 'Warning',
  },
  success: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    text: '#065F46',
    icon: '#059669',
    iconName: 'checkcircle',
    title: 'Success',
  },
  info: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    text: '#1E40AF',
    icon: '#2563EB',
    iconName: 'infocirlceo',
    title: 'Info',
  },
} as const;

export default function EnhancedErrorBanner({
  message,
  tone = 'error',
  title,
  compact = false,
  dismissible = true,
  autoDismiss = false,
  autoDismissDelay = 5000,
  ctaText,
  onCtaPress,
  onDismiss,
  style,
  showIcon = true,
  animated = true,
}: EnhancedErrorBannerProps) {
  const responsive = useResponsive();
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  const config = TONE_CONFIG[tone];

  useEffect(() => {
    if (message && animated) {
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
      ]).start();

      // Auto dismiss
      if (autoDismiss) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoDismissDelay);

        return () => clearTimeout(timer);
      }
    } else if (!message && animated) {
      // Slide out animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
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
  }, [message, autoDismiss, autoDismissDelay]);

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

  const bannerContent = (
    <View
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
        borderWidth: 1,
        borderRadius: responsive.card.borderRadius,
        paddingVertical: compact ? responsive.padding.xs : responsive.padding.sm,
        paddingHorizontal: compact ? responsive.padding.sm : responsive.padding.md,
        flexDirection: 'row',
        alignItems: 'flex-start',
        maxWidth: responsive.maxWidth.form,
        alignSelf: 'center',
        width: '100%',
        shadowColor: config.icon,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        ...style,
      }}
    >
      {showIcon && (
        <View style={{ marginRight: responsive.spacing(8), marginTop: 2 }}>
          <AntDesign
            name={config.iconName}
            size={responsive.size(18)}
            color={config.icon}
          />
        </View>
      )}

      <View style={{ flex: 1, marginRight: dismissible ? responsive.spacing(8) : 0 }}>
        {(title || config.title) && (
          <Text
            style={{
              color: config.text,
              fontWeight: '700',
              fontSize: compact ? responsive.typography.caption : responsive.typography.body2,
              marginBottom: responsive.spacing(2),
            }}
          >
            {title || config.title}
          </Text>
        )}

        <Text
          style={{
            color: config.text,
            fontWeight: '500',
            fontSize: compact ? responsive.typography.caption : responsive.typography.body2,
            lineHeight: compact ? 16 : 20,
          }}
        >
          {message}
          {ctaText && onCtaPress && (
            <Text
              onPress={handleCtaPress}
              style={{
                color: '#0A66C2',
                textDecorationLine: 'underline',
                fontWeight: '600',
                marginLeft: responsive.spacing(4),
              }}
            >
              {ctaText}
            </Text>
          )}
        </Text>
      </View>

      {dismissible && onDismiss && (
        <Pressable
          onPress={handleDismiss}
          style={{
            padding: responsive.spacing(4),
            marginTop: -responsive.spacing(4),
            marginRight: -responsive.spacing(4),
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="close"
            size={responsive.size(16)}
            color={config.text}
          />
        </Pressable>
      )}
    </View>
  );

  if (animated) {
    return (
      <Animated.View
        style={{
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          width: '100%',
        }}
      >
        {bannerContent}
      </Animated.View>
    );
  }

  return bannerContent;
}
