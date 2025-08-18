// @ts-nocheck
import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { Dimensions, StyleSheet, Image, Animated as RNAnimated } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
const logoSrc = require("../../assets/images/logo.png");

const AnimatedLogo = RNAnimated.Image;

const { width, height } = Dimensions.get("window");

interface SplashOverlayProps {
  onFinish: () => void;
  /**
   * Size of the logo relative to screen width. Defaults to 0.4 (40% of width)
   */
  logoSizePct?: number;
  /**
   * Target opacity for the logo during the intro (0..1). Defaults to 0.95
   */
  logoOpacityTarget?: number;
}

const SplashOverlay = React.memo(({ onFinish, logoSizePct = 0.4, logoOpacityTarget = 1 }: SplashOverlayProps) => {
  // Animate logo with React Native Animated to guarantee visibility
  const rnLogoScale = useRef(new RNAnimated.Value(0.5)).current;
  const rnLogoOpacity = useRef(new RNAnimated.Value(0)).current;
  const fadeOut = useSharedValue(1);
  const particleRadius = useSharedValue(0);

  const handleFinish = useCallback(() => {
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    const opacityAnim = RNAnimated.timing(rnLogoOpacity, {
      toValue: logoOpacityTarget,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    });
    const scaleAnim = RNAnimated.timing(rnLogoScale, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    });
    opacityAnim.start();
    scaleAnim.start();

    // Particle burst after logo appears
    const particleTimeout = setTimeout(() => {
      particleRadius.value = withTiming(width * 0.8, { duration: 1000 });
    }, 1200);

    // Fade out after particles
    const fadeTimeout = setTimeout(() => {
      fadeOut.value = withTiming(0, { duration: 800 }, () => {
        runOnJS(handleFinish)();
      });
    }, 2500);
    return () => {
      // stop animations and clear timers to avoid leaks on fast nav
      rnLogoOpacity.stopAnimation?.();
      rnLogoScale.stopAnimation?.();
      clearTimeout(particleTimeout);
      clearTimeout(fadeTimeout);
    };
  }, [logoOpacityTarget, handleFinish]);

  const logoStyle = useMemo(() => ({
    opacity: rnLogoOpacity,
    transform: [{ scale: rnLogoScale }],
  }), [rnLogoOpacity, rnLogoScale]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  const particleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: particleRadius.value / 50 }],
    opacity: particleRadius.value > 0 ? 0.3 : 0,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Particle burst */}
      <Animated.View style={[styles.particleLayer, particleStyle]}>
        <Svg height={height} width={width}>
          <Circle
            cx={width / 2}
            cy={height / 2}
            r={50}
            fill="rgba(255,255,255,0.1)"
          />
        </Svg>
      </Animated.View>

      {/* Animated Logo */}
      <AnimatedLogo
        source={logoSrc}
        style={[styles.logo, { width: width * logoSizePct, height: width * logoSizePct }, logoStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
});

SplashOverlay.displayName = 'SplashOverlay';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A66C2", // Your brand color
    justifyContent: "center",
    alignItems: "center",
  },
  particleLayer: {
    position: "absolute",
    width,
    height,
    justifyContent: "center",
    alignItems: "center",
    zIndex: -1,
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    position: "relative",
    zIndex: 1,
    elevation: 2,
  },
});

export default SplashOverlay;
