/**
 * useAnimation Hook
 *
 * Reusable animation utilities for beautiful UI interactions.
 *
 * Features:
 * - Fade in/out animations
 * - Slide animations
 * - Scale animations
 * - Milestone celebration animations
 * - Progress bar animations
 * - Bounce effects
 *
 * Usage:
 * const {
 *   fadeAnim,
 *   scaleAnim,
 *   slideAnim,
 *   fadeIn,
 *   fadeOut,
 *   slideIn,
 *   slideOut,
 *   scale,
 *   celebrate,
 *   reset
 * } = useAnimation();
 */

import { useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: any;
  useNativeDriver?: boolean;
}

interface UseAnimationReturn {
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  slideAnim: Animated.Value;
  rotateAnim: Animated.Value;
  fadeIn: (config?: AnimationConfig) => Promise<void>;
  fadeOut: (config?: AnimationConfig) => Promise<void>;
  slideIn: (direction?: 'left' | 'right' | 'top' | 'bottom', config?: AnimationConfig) => Promise<void>;
  slideOut: (direction?: 'left' | 'right' | 'top' | 'bottom', config?: AnimationConfig) => Promise<void>;
  scale: (toValue: number, config?: AnimationConfig) => Promise<void>;
  celebrate: () => Promise<void>;
  pulse: (count?: number) => Promise<void>;
  shake: () => Promise<void>;
  reset: () => void;
}

export const useAnimation = (): UseAnimationReturn => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  /**
   * Fade in animation
   */
  const fadeIn = useCallback((config: AnimationConfig = {}): Promise<void> => {
    return new Promise((resolve) => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: config.duration || 300,
        delay: config.delay || 0,
        easing: config.easing || Easing.ease,
        useNativeDriver: config.useNativeDriver !== false,
      }).start(() => resolve());
    });
  }, [fadeAnim]);

  /**
   * Fade out animation
   */
  const fadeOut = useCallback((config: AnimationConfig = {}): Promise<void> => {
    return new Promise((resolve) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: config.duration || 300,
        delay: config.delay || 0,
        easing: config.easing || Easing.ease,
        useNativeDriver: config.useNativeDriver !== false,
      }).start(() => resolve());
    });
  }, [fadeAnim]);

  /**
   * Slide in animation
   */
  const slideIn = useCallback((
    direction: 'left' | 'right' | 'top' | 'bottom' = 'bottom',
    config: AnimationConfig = {}
  ): Promise<void> => {
    // Set initial position based on direction
    const startValue = direction === 'left' || direction === 'top' ? -100 : 100;
    slideAnim.setValue(startValue);

    return new Promise((resolve) => {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: config.duration ? 100 / config.duration : 50,
        friction: 7,
        delay: config.delay || 0,
        useNativeDriver: config.useNativeDriver !== false,
      }).start(() => resolve());
    });
  }, [slideAnim]);

  /**
   * Slide out animation
   */
  const slideOut = useCallback((
    direction: 'left' | 'right' | 'top' | 'bottom' = 'bottom',
    config: AnimationConfig = {}
  ): Promise<void> => {
    const endValue = direction === 'left' || direction === 'top' ? -100 : 100;

    return new Promise((resolve) => {
      Animated.timing(slideAnim, {
        toValue: endValue,
        duration: config.duration || 300,
        delay: config.delay || 0,
        easing: config.easing || Easing.ease,
        useNativeDriver: config.useNativeDriver !== false,
      }).start(() => resolve());
    });
  }, [slideAnim]);

  /**
   * Scale animation
   */
  const scale = useCallback((
    toValue: number = 1,
    config: AnimationConfig = {}
  ): Promise<void> => {
    return new Promise((resolve) => {
      Animated.spring(scaleAnim, {
        toValue,
        tension: 100,
        friction: 3,
        delay: config.delay || 0,
        useNativeDriver: config.useNativeDriver !== false,
      }).start(() => resolve());
    });
  }, [scaleAnim]);

  /**
   * Celebration animation (for milestones)
   * Combines scale, rotation, and opacity for a fun effect
   */
  const celebrate = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      // Reset values
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      rotateAnim.setValue(0);

      // Parallel animations
      Animated.parallel([
        // Scale up with bounce
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 3,
          useNativeDriver: true,
        }),
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Rotate
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => resolve());
    });
  }, [scaleAnim, fadeAnim, rotateAnim]);

  /**
   * Pulse animation (for buttons or attention)
   */
  const pulse = useCallback((count: number = 3): Promise<void> => {
    return new Promise((resolve) => {
      const pulses = Array(count).fill(null).map(() =>
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 200,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );

      Animated.sequence(pulses).start(() => resolve());
    });
  }, [scaleAnim]);

  /**
   * Shake animation (for errors or invalid input)
   */
  const shake = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      slideAnim.setValue(0);

      Animated.sequence([
        Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start(() => resolve());
    });
  }, [slideAnim]);

  /**
   * Reset all animations to initial state
   */
  const reset = useCallback(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(1);
    slideAnim.setValue(0);
    rotateAnim.setValue(0);
  }, [fadeAnim, scaleAnim, slideAnim, rotateAnim]);

  return {
    fadeAnim,
    scaleAnim,
    slideAnim,
    rotateAnim,
    fadeIn,
    fadeOut,
    slideIn,
    slideOut,
    scale,
    celebrate,
    pulse,
    shake,
    reset,
  };
};

/**
 * useProgressAnimation Hook
 *
 * Specialized hook for animated progress bars.
 *
 * Usage:
 * const { progressAnim, animateProgress } = useProgressAnimation();
 */
export const useProgressAnimation = () => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = useCallback((
    toValue: number,
    duration: number = 500
  ): Promise<void> => {
    return new Promise((resolve) => {
      Animated.timing(progressAnim, {
        toValue,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // Width/height can't use native driver
      }).start(() => resolve());
    });
  }, [progressAnim]);

  return {
    progressAnim,
    animateProgress,
  };
};

/**
 * useStagger Hook
 *
 * Create staggered animations for lists.
 *
 * Usage:
 * const { stagger } = useStagger();
 * stagger(items, (item, index) => animateItem(item, index));
 */
export const useStagger = () => {
  const stagger = useCallback(async <T,>(
    items: T[],
    animateItem: (item: T, index: number) => Promise<void>,
    delayBetween: number = 100
  ): Promise<void> => {
    for (let i = 0; i < items.length; i++) {
      await new Promise(resolve => setTimeout(resolve, delayBetween * i));
      await animateItem(items[i], i);
    }
  }, []);

  return { stagger };
};
