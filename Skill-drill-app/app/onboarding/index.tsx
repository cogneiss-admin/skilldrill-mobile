// @ts-nocheck
import React, { useMemo, useRef, useState, useEffect } from "react";
import { Dimensions, Text, View, Animated as RNAnimated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Carousel from "react-native-reanimated-carousel";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient as SvgRadialGradient, Rect, Stop } from "react-native-svg";
import { Button } from "react-native-paper";
import { MotiView } from "moti";
import { StatusBar } from "react-native";
import * as Haptics from "expo-haptics";

const logoSrc = require("../../assets/images/logo.png");

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BRAND = "#0A66C2";

export default function Onboarding() {
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();

  const handleGetStarted = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setNavigating(true);
    setTimeout(() => {
      router.push("/auth/signup");
    }, 300);
  };

  return (
    <View style={{ flex: 1, backgroundColor: BRAND }}>
      <WelcomeScreen onGetStarted={handleGetStarted} />
    </View>
  );
}

function WelcomeScreen({ onGetStarted }: { onGetStarted: () => void }) {
  const slides = useMemo(
    () => [
      { id: "s1", headline: "Master the skills that matter most in today's workplace", caption: "85% of career success depends on soft skills — Stanford & Harvard Research", icon: "🎯" },
      { id: "s2", headline: "Stand out in a competitive job market", caption: "93% of employers value soft skills over technical expertise — LinkedIn Report", icon: "🚀" },
      { id: "s3", headline: "Boost your performance and productivity", caption: "Soft skills increase job performance by 256% — Harvard Business Review", icon: "📈" },
      { id: "s4", headline: "Unlock higher earning potential", caption: "Top earners have 4x stronger communication skills — Fortune 500 Survey", icon: "💎" },
      { id: "s5", headline: "Build skills that AI can't replace — emotional intelligence matters.", caption: "Future-proof your career with SkillDrill" }
    ],
    []
  );
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="light-content" />
      <View className="flex-1">
        <StaticBackground />
        <View style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
          <Carousel
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            autoPlay
            autoPlayInterval={4000}
            loop
            pagingEnabled
            data={slides}
            onSnapToItem={(index) => setActiveIndex(index)}
            renderItem={() => <View />}
          />
        </View>
        <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }} className="items-center justify-center">
          <View style={{ marginTop: -120 }} className="items-center">
            <LogoPulse size={120} />
            <View style={{ marginTop: 24 }}>
              <AnimatedWelcome />
            </View>
          </View>
        </View>
        <LinearGradient colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0)"]} style={{ position: "absolute", left: 0, right: 0, top: 0, height: 120 }} />
        <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
          <View className="px-8 pt-12 pb-10">
            <MotiView key={`txt-${activeIndex}`} from={{ opacity: 0, translateY: 15, scale: 0.98 }} animate={{ opacity: 1, translateY: 0, scale: 1 }} exit={{ opacity: 0, translateY: -10, scale: 0.98 }} transition={{ type: "timing", duration: 600, opacity: { duration: 400 }, translateY: { duration: 600 }, scale: { duration: 500 } }}>
              <Text style={{ fontSize: 26, lineHeight: 34, fontWeight: "800", textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 6 }} className="text-white">
                {slides[activeIndex].headline}
              </Text>
              {slides[activeIndex].caption && (
                <Text style={{ fontSize: 15, fontWeight: "500", textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 }} className="mt-3 text-gray-100">
                  {slides[activeIndex].caption}
                </Text>
              )}
            </MotiView>
            <View className="flex-row items-center justify-center mt-6">
              {slides.map((s, idx) => (
                <MotiView key={s.id} animate={{ scale: idx === activeIndex ? 1.3 : 1, opacity: idx === activeIndex ? 1 : 0.6 }} transition={{ type: "spring", damping: 15, stiffness: 150 }}>
                  <MotiView animate={{ width: idx === activeIndex ? 12 : 8, height: idx === activeIndex ? 12 : 8 }} transition={{ type: "spring", damping: 20, stiffness: 200 }} style={{ borderRadius: 6, marginHorizontal: 4, backgroundColor: "#ffffff", shadowColor: "#ffffff", shadowOffset: { width: 0, height: 0 }, shadowOpacity: idx === activeIndex ? 0.8 : 0, shadowRadius: idx === activeIndex ? 6 : 0 }} />
                </MotiView>
              ))}
            </View>
            <View className="mt-8" />
            <Button mode="contained" onPress={onGetStarted} contentStyle={{ height: 56 }} style={{ borderRadius: 28, backgroundColor: "#ffffff", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 }} labelStyle={{ fontSize: 18, fontWeight: "700", color: "#0A66C2", letterSpacing: 0.5 }}>
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
    <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: "timing", duration: 1500, delay: 800 }} className="items-center">
      <Text className="text-white text-center" style={{ fontSize: 32, fontWeight: "800", letterSpacing: 0.8, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 6 }}>
        Welcome to
      </Text>
      <Text className="text-white text-center" style={{ fontSize: 40, fontWeight: "900", letterSpacing: 1.2, marginTop: 4, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 8 }}>
        SkillDrill
      </Text>
      <View style={{ height: 3, backgroundColor: "rgba(255,255,255,0.8)", marginTop: 8, width: 180, borderRadius: 2 }} />
      <Text className="text-white text-center" style={{ fontSize: 16, fontWeight: "500", letterSpacing: 0.3, marginTop: 12, opacity: 0.9, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 }}>
        Your personal platform for growing professional soft skills
      </Text>
    </MotiView>
  );
}

function LogoPulse({ size = 200 }: { size?: number }) {
  const scale = useRef(new RNAnimated.Value(1)).current;
  useEffect(() => {
    const pulseAnim = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(scale, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        RNAnimated.timing(scale, { toValue: 1.0, duration: 2000, useNativeDriver: true }),
      ])
    );
    pulseAnim.start();
    return () => { pulseAnim.stop(); };
  }, [scale]);
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <RNAnimated.View style={{ width: size, height: size, transform: [{ scale }], position: 'relative' }}>
        <LinearGradient colors={["#0A66C2", "#0E75D1", "#1285E0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2 }} />
        <RNAnimated.Image source={logoSrc} style={{ width: size, height: size, position: 'absolute' }} resizeMode="contain" />
      </RNAnimated.View>
    </View>
  );
}

function StaticBackground() {
  return (
    <View className="flex-1">
      <LinearGradient colors={["#0A66C2", "#0E75D1", "#1285E0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
      <LinearGradient colors={["rgba(10, 102, 194, 0.9)", "rgba(18, 133, 224, 0.6)", "rgba(10, 102, 194, 0.8)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0 }} />
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={{ position: "absolute" }}>
        <Defs>
          <SvgRadialGradient id="brand-accent1" cx="30%" cy="30%" r="50%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </SvgRadialGradient>
          <SvgRadialGradient id="brand-accent2" cx="70%" cy="80%" r="60%">
            <Stop offset="0%" stopColor="#0A66C2" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#0A66C2" stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#brand-accent1)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#brand-accent2)" />
      </Svg>
    </View>
  );
}



