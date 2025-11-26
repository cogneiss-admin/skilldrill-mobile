import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastNotificationProps {
  visible: boolean;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onDismiss?: () => void;
  onPress?: () => void;
  actionText?: string;
  showIcon?: boolean;
  position?: 'top' | 'bottom';
}

const TOAST_CONFIG = {
  success: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    text: '#065F46',
    icon: '#059669',
    iconName: 'checkmark-circle' as const,
    title: 'Success',
  },
  error: {
    bg: '#FEF2F2',
    border: '#FCA5A5',
    text: '#991B1B',
    icon: '#B91C1C',
    iconName: 'alert-circle-outline' as const,
    title: 'Error',
  },
  warning: {
    bg: '#FFFBEB',
    border: '#FCD34D',
    text: '#92400E',
    icon: '#D97706',
    iconName: 'warning-outline' as const,
    title: 'Warning',
  },
  info: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    text: '#1E40AF',
    icon: '#2563EB',
    iconName: 'information-circle-outline' as const,
    title: 'Info',
  },
};

export default function ToastNotification({
  visible,
  type,
  title,
  message,
  duration = 4000,
  onDismiss,
  onPress,
  actionText,
  showIcon = true,
  position = 'top',
}: ToastNotificationProps) {
  const responsive = useResponsive();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const config = TOAST_CONFIG[type];

  useEffect(() => {
    if (visible) {
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

      // Auto dismiss
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
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
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, duration]);

  const handleDismiss = () => {
    if (onDismiss) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDismiss();
    }
  };

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: position === 'top' ? responsive.spacing(20) : undefined,
          bottom: position === 'bottom' ? responsive.spacing(20) : undefined,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <Pressable
        style={[
          styles.toast,
          {
            backgroundColor: config.bg,
            borderColor: config.border,
            borderRadius: responsive.card.borderRadius,
            paddingHorizontal: responsive.padding.md,
            paddingVertical: responsive.padding.sm,
            marginHorizontal: responsive.padding.lg,
            shadowColor: config.icon,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
          },
        ]}
        onPress={handlePress}
        disabled={!onPress}
      >
        <View style={styles.content}>
          {showIcon && (
            <View style={styles.iconContainer}>
              <Ionicons
                name={config.iconName}
                size={responsive.size(20)}
                color={config.icon}
              />
            </View>
          )}

          <View style={styles.textContainer}>
            {(title || config.title) && (
              <Text
                style={[
                  styles.title,
                  {
                    color: config.text,
                    fontSize: responsive.typography.body2,
                    fontWeight: '700',
                  },
                ]}
              >
                {title || config.title}
              </Text>
            )}

            <Text
              style={[
                styles.message,
                {
                  color: config.text,
                  fontSize: responsive.typography.body2,
                  fontWeight: '500',
                },
              ]}
            >
              {message}
            </Text>

            {actionText && onPress && (
              <Text
                style={[
                  styles.actionText,
                  {
                    color: '#0A66C2',
                    fontSize: responsive.typography.body2,
                    fontWeight: '600',
                    marginTop: responsive.spacing(4),
                  },
                ]}
              >
                {actionText}
              </Text>
            )}
          </View>

          {onDismiss && (
            <Pressable
              onPress={handleDismiss}
              style={styles.dismissButton}
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
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  toast: {
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    marginBottom: 4,
  },
  message: {
    lineHeight: 20,
  },
  actionText: {
    textDecorationLine: 'underline',
  },
  dismissButton: {
    padding: 4,
    marginTop: -4,
    marginRight: -4,
  },
});
