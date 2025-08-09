// @ts-nocheck
import React, { useMemo, useRef, useState, useEffect } from "react";
import { Dimensions, Text, View, StyleSheet, Animated as RNAnimated, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import SplashOverlay from "./components/SplashOverlay";
import Carousel from "react-native-reanimated-carousel";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient as SvgRadialGradient, Rect, Stop } from "react-native-svg";
import { Button } from "react-native-paper";
import { MotiView } from "moti";
import { StatusBar } from "expo-status-bar";
// Animated logo asset
const logoSrc = require("../assets/images/logo.png");
import * as Haptics from "expo-haptics";
import "./home"; // pre-load home route to avoid router spinner during navigation

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BRAND = "#0A66C2"; // keep consistent with splash

export default function App() {
  const [isSplashDone, setSplashDone] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();


  const handleGetStarted = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setNavigating(true);
    router.push("/auth/login");
  };

  const handleSkip = async () => {
    try {
      await Haptics.selectionAsync();
    } catch {}
    router.push("/home");
  };

  return (
    <View style={{ flex: 1, backgroundColor: BRAND }}>
      <WelcomeScreen onGetStarted={handleGetStarted} onSkip={handleSkip} />
      {!isSplashDone && (
        <View style={StyleSheet.absoluteFillObject}>
          <SplashOverlay onFinish={() => setSplashDone(true)} />
        </View>
      )}
      {navigating && (
        <View style={[StyleSheet.absoluteFillObject, { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.25)" }]}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </View>
  );
}

function WelcomeScreen({ onGetStarted, onSkip }: { onGetStarted: () => void; onSkip: () => void }) {
  const slides = useMemo(
    () => [
      {
        id: "s1",
        headline: "85% of career success depends on soft skills — not hard skills.",
        caption: "Source: Stanford & Harvard Research",
      },
      {
        id: "s2",
        headline: "Soft skills turn knowledge into impact.",
        caption: "Practice > theory. Build habits that stick.",
      },
      {
        id: "s3",
        headline: "Communicate clearly. Lead with empathy. Grow every day.",
        caption: "Bite-sized drills. Real-world tasks.",
      },
      {
        id: "s4",
        headline: "Track growth with streaks, milestones, and insights.",
        caption: "Stay consistent with science-backed methods.",
      },
    ],
    []
  );

  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <SafeAreaView className="flex-1">
      <StatusBar style="light" />
      <View className="flex-1">
        {/* Skip button */}
        <View style={{ position: "absolute", top: 6, right: 12, zIndex: 10 }}>
          <Button mode="text" onPress={onSkip} compact>
            Skip
          </Button>
        </View>

        <Carousel
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          autoPlay
          autoPlayInterval={3500}
          loop
          pagingEnabled
          data={slides}
          onSnapToItem={(index) => setActiveIndex(index)}
          renderItem={() => (
            <PremiumSlide />
          )}
        />

        {/* Center animated logo + animated welcome headline */}
        <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }} className="items-center justify-center">
          <LogoPulse size={110} />
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 700, delay: 150 }}
          >
            <AnimatedWelcome />
          </MotiView>
        </View>

        {/* Light top gradient for readability */}
        <LinearGradient
          colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0)"]}
          style={{ position: "absolute", left: 0, right: 0, top: 0, height: 120 }}
        />

        {/* Bottom overlay with copy + CTA */}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.25)"]}
          style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
        >
          <View className="px-6 pt-10 pb-6">
            <MotiView
              key={`txt-${activeIndex}`}
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 450 }}
            >
              <Text style={{ fontSize: 26, lineHeight: 34 }} className="font-bold text-white">
                {slides[activeIndex].headline}
              </Text>
              {slides[activeIndex].caption ? (
                <Text style={{ fontSize: 16 }} className="mt-2 text-gray-200">
                  {slides[activeIndex].caption}
                </Text>
              ) : null}
            </MotiView>

            {/* Pagination dots */}
            <View className="flex-row items-center mt-4">
              {slides.map((s, idx) => (
                <View
                  key={s.id}
                  style={{
                    width: idx === activeIndex ? 10 : 6,
                    height: 6,
                    borderRadius: 3,
                    marginRight: 6,
                    backgroundColor: idx === activeIndex ? "#ffffff" : "rgba(255,255,255,0.45)",
                  }}
                />
              ))}
            </View>

            <View className="mt-5" />
            <Button
              mode="contained"
              onPress={onGetStarted}
              contentStyle={{ height: 52 }}
              style={{ borderRadius: 26 }}
            >
              Get Started
            </Button>
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

function AnimatedWelcome() {
  return (
    <MotiView
      from={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 700 }}
      className="items-center"
    >
      <Text
        className="text-white"
        style={{ fontSize: 24, fontWeight: "800", letterSpacing: 0.5 }}
      >
        Welcome to <Text style={{ color: BRAND }}>Skill Drill</Text>
      </Text>
      <MotiView
        from={{ scale: 1 }}
        animate={{ scale: 1.04 }}
        transition={{ loop: true, type: "timing", duration: 1400 }}
      >
        <View style={{ height: 2, backgroundColor: "rgba(255,255,255,0.45)", width: 140, marginTop: 6, borderRadius: 1 }} />
      </MotiView>
    </MotiView>
  );
}

function LogoPulse({ size = 200 }: { size?: number }) {
  const scale = useRef(new RNAnimated.Value(1)).current;
  const opacity = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    const loopAnim = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.parallel([
          RNAnimated.timing(scale, { toValue: 1.06, duration: 900, useNativeDriver: true }),
          RNAnimated.timing(opacity, { toValue: 0.95, duration: 900, useNativeDriver: true }),
        ]),
        RNAnimated.parallel([
          RNAnimated.timing(scale, { toValue: 1.0, duration: 900, useNativeDriver: true }),
          RNAnimated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      ])
    );
    loopAnim.start();
    return () => loopAnim.stop();
  }, [scale, opacity]);

  return (
    <RNAnimated.Image
      source={logoSrc}
      style={{ width: size, height: size, opacity, transform: [{ scale }] }}
      resizeMode="contain"
    />
  );
}

function PremiumSlide() {
  return (
    <View className="flex-1">
      {/* Base brand gradient */}
      <LinearGradient
        colors={["#0A66C2", "#0A3E86"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />

      {/* Soft radial accents (brand teal + violet) */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={{ position: "absolute" }}>
        <Defs>
          <SvgRadialGradient id="accent1" cx="20%" cy="15%" r="35%">
            <Stop offset="0%" stopColor="#22D3EE" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </SvgRadialGradient>
          <SvgRadialGradient id="accent2" cx="85%" cy="60%" r="45%">
            <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#accent1)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#accent2)" />
      </Svg>

      {/* Gentle sheen to keep it clean */}
      <LinearGradient
        colors={["rgba(255,255,255,0.0)", "rgba(255,255,255,0.04)"]}
        style={{ position: "absolute", inset: 0 }}
      />
    </View>
  );
}
