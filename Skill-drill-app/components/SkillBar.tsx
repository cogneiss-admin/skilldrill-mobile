/**
 * SkillBar Component
 *
 * Animated progress bar with milestone indicators.
 *
 * Features:
 * - Smooth animated progress transitions
 * - Milestone markers at 25%, 50%, 75%, 100%
 * - Gradient fill
 * - Percentage label
 * - Completion celebration animation
 *
 * Usage:
 * <SkillBar
 *   progress={65}
 *   total={20}
 *   completed={13}
 *   showMilestones
 *   animated
 *   label="Drill Progress"
 * />
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleProp,
  ViewStyle,
  Animated
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
  GRADIENTS
} from '../app/components/Brand';

interface SkillBarProps {
  progress: number; // 0-100
  total?: number;
  completed?: number;
  showMilestones?: boolean;
  animated?: boolean;
  label?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

const SkillBar: React.FC<SkillBarProps> = ({
  progress,
  total,
  completed,
  showMilestones = true,
  animated = true,
  label,
  height = 12,
  style
}) => {
  const animatedWidth = React.useRef(new Animated.Value(0)).current;

  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));

  useEffect(() => {
    if (animated) {
      Animated.spring(animatedWidth, {
        toValue: clampedProgress,
        useNativeDriver: false,
        tension: 40,
        friction: 8
      }).start();
    } else {
      animatedWidth.setValue(clampedProgress);
    }
  }, [clampedProgress, animated, animatedWidth]);

  const milestones = [25, 50, 75, 100];

  const renderMilestone = (milestone: number) => {
    const isPassed = clampedProgress >= milestone;
    const isNext = milestone > clampedProgress && milestones.filter(m => m <= clampedProgress).length === milestones.indexOf(milestone);

    return (
      <MotiView
        key={milestone}
        from={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: milestone * 10 }}
        style={{
          position: 'absolute',
          left: `${milestone}%`,
          top: -8,
          transform: [{ translateX: -12 }],
          alignItems: 'center'
        }}
      >
        {/* Milestone Marker */}
        <View style={{
          width: 24,
          height: 24,
          borderRadius: BORDER_RADIUS.full,
          backgroundColor: isPassed ? BRAND : isNext ? COLORS.warning : COLORS.gray[300],
          borderWidth: 2,
          borderColor: COLORS.white,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 3
        }}>
          {isPassed ? (
            <Ionicons name="checkmark" size={14} color={COLORS.white} />
          ) : (
            <View style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: isNext ? COLORS.white : COLORS.gray[500]
            }} />
          )}
        </View>

        {/* Milestone Label */}
        <Text style={{
          ...TYPOGRAPHY.caption,
          color: isPassed ? BRAND : COLORS.text.tertiary,
          fontWeight: isPassed ? '700' : '500',
          marginTop: 4
        }}>
          {milestone}%
        </Text>
      </MotiView>
    );
  };

  return (
    <View style={style}>
      {/* Label and Stats */}
      {(label || typeof total !== 'undefined' || typeof completed !== 'undefined') && (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.sm
        }}>
          {label && (
            <Text style={{
              ...TYPOGRAPHY.subtitle,
              color: COLORS.text.secondary
            }}>
              {label}
            </Text>
          )}

          {typeof completed !== 'undefined' && typeof total !== 'undefined' && (
            <Text style={{
              ...TYPOGRAPHY.label,
              color: COLORS.text.tertiary
            }}>
              {completed}/{total} completed
            </Text>
          )}
        </View>
      )}

      {/* Progress Bar Container */}
      <View style={{ position: 'relative' }}>
        {/* Background Track */}
        <View style={{
          height,
          backgroundColor: COLORS.gray[200],
          borderRadius: BORDER_RADIUS.full,
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Animated Progress Fill */}
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              }),
              overflow: 'hidden',
              borderRadius: BORDER_RADIUS.full
            }}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: '100%',
                width: '100%'
              }}
            />
          </Animated.View>

          {/* Progress Percentage Label (inside bar if enough space) */}
          {clampedProgress > 15 && (
            <Animated.View
              style={{
                position: 'absolute',
                right: 8,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
                opacity: animatedWidth.interpolate({
                  inputRange: [0, 15, 30],
                  outputRange: [0, 0, 1]
                })
              }}
            >
              <Text style={{
                fontSize: 10,
                fontWeight: '700',
                color: COLORS.white
              }}>
                {Math.round(clampedProgress)}%
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Milestones */}
        {showMilestones && (
          <View style={{
            position: 'relative',
            height: 40,
            marginTop: 4
          }}>
            {milestones.map(renderMilestone)}
          </View>
        )}
      </View>

      {/* Completion Message */}
      {clampedProgress === 100 && (
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 300 }}
          style={{
            marginTop: SPACING.margin.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: COLORS.successLight,
            paddingVertical: SPACING.padding.xs,
            paddingHorizontal: SPACING.padding.md,
            borderRadius: BORDER_RADIUS.lg
          }}
        >
          <Ionicons name="trophy" size={16} color={COLORS.white} style={{ marginRight: SPACING.xs }} />
          <Text style={{
            ...TYPOGRAPHY.body,
            color: COLORS.white,
            fontWeight: '700'
          }}>
            All drills completed!
          </Text>
        </MotiView>
      )}
    </View>
  );
};

export default SkillBar;
