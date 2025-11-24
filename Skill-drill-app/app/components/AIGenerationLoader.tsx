import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, Dimensions, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const BRAND = "#0A66C2";

interface AIGenerationLoaderProps {
  visible?: boolean;
  progress?: number; // 0-1
  message?: string;
  subMessage?: string;
  onComplete?: () => void;
}

export default function AIGenerationLoader({
  visible = true,
  progress = 0,
  message,
  subMessage,
  onComplete
}: AIGenerationLoaderProps) {
  const brainPulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const steps = [
    "Analyzing your skill requirements",
    "Generating personalized scenarios",
    "Creating assessment questions",
    "Finalizing assessment structure"
  ];

  const currentStep = Math.floor(progress * steps.length);
  const currentStepText = steps[currentStep] || steps[0];
  const [dots, setDots] = React.useState('');

  useEffect(() => {
    if (visible) {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      // Brain pulse animation
      const brainPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(brainPulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(brainPulseAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );

      // Rotation animation
      const rotation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      brainPulse.start();
      rotation.start();

      // Call onComplete when progress reaches 1
      if (progress >= 1 && onComplete) {
        const timer = setTimeout(onComplete, 1000);
        return () => clearTimeout(timer);
      }

      return () => {
        brainPulse.stop();
        rotation.stop();
      };
    }
  }, [visible, progress, onComplete]);

  if (!visible) return null;

  const brainScale = brainPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const brainOpacity = brainPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <BlurView
      intensity={40}
      tint="dark"
      style={StyleSheet.absoluteFill}
    >
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)', // Slight overlay for contrast
      }}>
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            padding: 40,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 20,
            maxWidth: width * 0.85,
            minWidth: width * 0.75,
          }}
        >
          {/* Main Brain Animation */}
          <View style={{
            position: 'relative',
            marginBottom: 32,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Outer Rotating Ring */}
            <Animated.View
              style={{
                position: 'absolute',
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 3,
                borderColor: BRAND + '30',
                borderTopColor: BRAND,
                transform: [{ rotate: rotation }],
              }}
            />

            {/* Neural Network Dots */}
            {[...Array(8)].map((_, i) => {
              const angle = (i * 45) * (Math.PI / 180);
              const radius = 50;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <MotiView
                  key={i}
                  from={{ opacity: 0.3 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    type: 'timing',
                    duration: 1000,
                    delay: i * 125,
                    repeatReverse: true,
                    loop: true,
                  }}
                  style={{
                    position: 'absolute',
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: BRAND,
                    left: x + 57,
                    top: y + 57,
                  }}
                />
              );
            })}

            {/* Central Brain Icon */}
            <Animated.View
              style={{
                transform: [{ scale: brainScale }],
                opacity: brainOpacity,
                backgroundColor: BRAND + '15',
                padding: 20,
                borderRadius: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="psychology" size={48} color={BRAND} />
            </Animated.View>
          </View>

          {/* Title */}
          <Text style={{
            fontSize: 22,
            fontWeight: '700',
            color: '#1F2937',
            textAlign: 'center',
            marginBottom: 8,
          }}>
            {message || 'AI Assessment Generation'}{dots}
          </Text>

          {/* Message */}
          <Text style={{
            fontSize: 16,
            color: '#6B7280',
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 22,
          }}>
            {subMessage || 'Creating your personalized assessment...'}
          </Text>

          {/* Current Step */}
          <View style={{
            width: '100%',
            marginBottom: 24,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: BRAND + '08',
              borderRadius: 12,
            }}>
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: BRAND,
                marginRight: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MaterialIcons name="auto-awesome" size={12} color="#ffffff" />
              </View>
              <Text style={{
                fontSize: 15,
                color: BRAND,
                fontWeight: '600',
                flex: 1,
              }}>
                {currentStepText}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={{
            width: '100%',
            height: 6,
            backgroundColor: '#F3F4F6',
            borderRadius: 3,
            overflow: 'hidden',
            marginBottom: 16,
          }}>
            <MotiView
              from={{ width: '0%' }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: 'timing', duration: 500 }}
              style={{
                height: '100%',
                backgroundColor: BRAND,
                borderRadius: 3,
              }}
            />
          </View>

          {/* Progress Percentage */}
          <Text style={{
            fontSize: 14,
            color: BRAND,
            fontWeight: '600',
            marginBottom: 16,
          }}>
            {Math.round(progress * 100)}% Complete
          </Text>

          {/* Animated Dots */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            {[0, 1, 2].map((i) => (
              <MotiView
                key={i}
                from={{ opacity: 0.3, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: 'timing',
                  duration: 600,
                  delay: i * 200,
                  repeatReverse: true,
                  loop: true,
                }}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: BRAND,
                  marginHorizontal: 3,
                }}
              />
            ))}
          </View>
        </MotiView>
      </MotiView>
    </View>
    </BlurView >
  );
}