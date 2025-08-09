// @ts-nocheck
import React, { useEffect, useRef } from "react";
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
}

export default function SplashOverlay({ onFinish }: SplashOverlayProps) {
  // Animate logo with React Native Animated to guarantee visibility
  const rnLogoScale = useRef(new RNAnimated.Value(0.5)).current;
  const rnLogoOpacity = useRef(new RNAnimated.Value(0)).current;
  const fadeOut = useSharedValue(1);
  const particleRadius = useSharedValue(0);

  useEffect(() => {
    RNAnimated.timing(rnLogoOpacity, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();
    RNAnimated.timing(rnLogoScale, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Particle burst after logo appears
    setTimeout(() => {
      particleRadius.value = withTiming(width * 0.8, { duration: 1000 });
    }, 1200);

    // Fade out after particles
    setTimeout(() => {
      fadeOut.value = withTiming(0, { duration: 800 }, () => {
        runOnJS(onFinish)();
      });
    }, 2500);
  }, []);

  const logoStyle = {
    opacity: rnLogoOpacity,
    transform: [{ scale: rnLogoScale }],
  } as const;

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
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

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
