import React, { useMemo, useRef, useState } from "react";
import { Dimensions, Text, View, StyleSheet, Animated as RNAnimated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Carousel from "react-native-reanimated-carousel";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient as SvgRadialGradient, Rect, Stop } from "react-native-svg";
import Button from "../components/Button";
import { MotiView } from "moti";
import { StatusBar } from "react-native";
import * as Haptics from "expo-haptics";
import { useResponsive } from "../utils/responsive";

import { BRAND, GRADIENTS, LOGO_SRC } from "./components/Brand";
const logoSrc = LOGO_SRC;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const slides = useMemo(
    () => [
      {
        id: "s1",
        headline: "Master the skills that matter most in today's workplace",
        caption: "85% of career success depends on soft skills — Stanford & Harvard Research",
        icon: "🎯",
      },
      {
        id: "s2",
        headline: "Stand out in a competitive job market",
        caption: "93% of employers value soft skills over technical expertise — LinkedIn Report",
        icon: "🚀",
      },
      {
        id: "s3",
        headline: "Boost your performance and productivity",
        caption: "Soft skills increase job performance by 256% — Harvard Business Review",
        icon: "📈",
      },
      {
        id: "s4",
        headline: "Unlock higher earning potential",
        caption: "Top earners have 4x stronger communication skills — Fortune 500 Survey",
        icon: "💎",
      },
      {
        id: "s5",
        headline: "Future-proof your career with SkillDrill",
        caption: "Build skills that AI can't replace — emotional intelligence matters",
        icon: "🛡️",
      },
    ],
    []
  );

  const [activeIndex, setActiveIndex] = useState(0);

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/auth/login');
  };

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="light-content" />
      <View className="flex-1">
        <StaticBackground />
        
        {/* Hidden carousel for banner content cycling */}
        <View style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
          <Carousel
            width={responsive.screenWidth}
            height={responsive.screenHeight}
            autoPlay
            autoPlayInterval={4000}
            loop
            pagingEnabled
            data={slides}
            onSnapToItem={(index) => setActiveIndex(index)}
            renderItem={() => <View />}
          />
        </View>

        {/* Center animated logo + animated welcome headline */}
        <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }} className="items-center justify-center">
          <View style={{ marginTop: responsive.spacing(-120) }} className="items-center">
            <LogoPulse size={responsive.size(120)} />
            <View style={{ marginTop: responsive.spacing(24) }}>
              <AnimatedWelcome />
            </View>
          </View>
        </View>

        {/* Light top gradient for readability */}
        <LinearGradient
          colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0)"]}
          style={{ position: "absolute", left: 0, right: 0, top: 0, height: 120 }}
        />

        {/* Clean bottom section with content */}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]}
          style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
        >
          <View style={{ 
            paddingHorizontal: responsive.padding.lg,
            paddingTop: responsive.padding.xl,
            paddingBottom: responsive.padding.lg,
            maxWidth: responsive.maxWidth.form,
            alignSelf: 'center',
            width: '100%'
          }}>
            <MotiView
              key={`txt-${activeIndex}`}
              from={{ opacity: 0, translateY: 15, scale: 0.98 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              exit={{ opacity: 0, translateY: -10, scale: 0.98 }}
              transition={{ 
                type: "timing", 
                duration: 600,
                opacity: { duration: 400 },
                translateY: { duration: 600 },
                scale: { duration: 500 }
              }}
              className="items-center"
            >
              {/* Icon */}
              <MotiView
                from={{ scale: 0, rotate: "180deg" }}
                animate={{ scale: 1, rotate: "0deg" }}
                transition={{ 
                  type: "spring", 
                  damping: 15,
                  stiffness: 200,
                  delay: 200
                }}
                style={{
                  width: responsive.size(56),
                  height: responsive.size(56),
                  borderRadius: responsive.size(28),
                  backgroundColor: "rgba(255,255,255,0.15)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: responsive.spacing(14),
                  shadowColor: "#ffffff",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                }}
              >
                <Text style={{ fontSize: responsive.fontSize(24) }}>
                  {slides[activeIndex].icon}
                </Text>
              </MotiView>

              {/* Headline */}
              <Text 
                style={{ 
                  fontSize: responsive.typography.h3, 
                  lineHeight: responsive.fontSize(28), 
                  fontWeight: "700",
                  textAlign: 'center',
                  textShadowColor: 'rgba(0,0,0,0.8)', 
                  textShadowOffset: {width: 0, height: 2}, 
                  textShadowRadius: 6,
                  marginBottom: responsive.spacing(10)
                }} 
                className="text-white"
              >
                {slides[activeIndex].headline}
              </Text>

              {/* Caption */}
              {slides[activeIndex].caption && (
                <Text 
                  style={{ 
                    fontSize: responsive.typography.body2, 
                    fontWeight: "500",
                    textAlign: 'center',
                    textShadowColor: 'rgba(0,0,0,0.6)', 
                    textShadowOffset: {width: 0, height: 1}, 
                    textShadowRadius: 3,
                    lineHeight: responsive.fontSize(20)
                  }} 
                  className="text-gray-100"
                >
                  {slides[activeIndex].caption}
                </Text>
              )}
            </MotiView>

            {/* Elegant pagination dots */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginTop: responsive.spacing(24),
              paddingHorizontal: responsive.padding.md
            }}>
              {slides.map((s, idx) => (
                <MotiView
                  key={s.id}
                  animate={{
                    scale: idx === activeIndex ? 1.3 : 1,
                    opacity: idx === activeIndex ? 1 : 0.6,
                  }}
                  transition={{ 
                    type: "spring", 
                    damping: 15,
                    stiffness: 150,
                  }}
                >
                  <MotiView
                    animate={{
                      width: idx === activeIndex ? responsive.size(12) : responsive.size(8),
                      height: idx === activeIndex ? responsive.size(12) : responsive.size(8),
                    }}
                    transition={{ 
                      type: "spring", 
                      damping: 20,
                      stiffness: 200,
                    }}
                    style={{
                      borderRadius: responsive.size(6),
                      marginHorizontal: responsive.spacing(4),
                      backgroundColor: "#ffffff",
                      shadowColor: "#ffffff",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: idx === activeIndex ? 0.8 : 0,
                      shadowRadius: idx === activeIndex ? 6 : 0,
                    }}
                  />
                </MotiView>
              ))}
            </View>

            <View style={{ marginTop: responsive.margin.lg }} />
            <MotiView
              from={{ opacity: 0, scale: 0.9, translateY: 20 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ 
                type: "spring", 
                damping: 15,
                stiffness: 100,
                delay: 800
              }}
            >
              <Button
                variant="primary"
                onPress={handleGetStarted}
                size="large"
                style={{
                  borderRadius: responsive.button.borderRadius,
                  backgroundColor: "#ffffff",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 12,
                  paddingHorizontal: responsive.button.paddingHorizontal,
                }}
                textStyle={{ color: "#000000" }}
              >
                🚀 Start Your Journey
              </Button>
            </MotiView>
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

function AnimatedWelcome() {
  const responsive = useResponsive();
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 1500, delay: 800 }}
      className="items-center"
    >
      <Text
        className="text-white text-center"
        style={{ 
          fontSize: responsive.typography.h2, 
          fontWeight: "700", 
          letterSpacing: 0.6, 
          textShadowColor: 'rgba(0,0,0,0.5)', 
          textShadowOffset: {width: 0, height: 2}, 
          textShadowRadius: 6 
        }}
      >
        Welcome to
      </Text>
      <Text
        className="text-white text-center"
        style={{ 
          fontSize: responsive.typography.h1, 
          fontWeight: "800", 
          letterSpacing: 1.0, 
          marginTop: responsive.spacing(4),
          textShadowColor: 'rgba(0,0,0,0.6)', 
          textShadowOffset: {width: 0, height: 2}, 
          textShadowRadius: 8 
        }}
      >
        SkillDrill
      </Text>
      <View style={{ 
        height: 3, 
        backgroundColor: "rgba(255,255,255,0.8)", 
        marginTop: 8, 
        width: 180,
        borderRadius: 2,
      }} />
      <Text
        className="text-white text-center"
        style={{ 
          fontSize: responsive.typography.subtitle, 
          fontWeight: "600", 
          letterSpacing: 0.3, 
          marginTop: responsive.spacing(12),
          opacity: 0.95,
          textShadowColor: 'rgba(0,0,0,0.4)', 
          textShadowOffset: {width: 0, height: 1}, 
          textShadowRadius: 3 
        }}
      >
        Practice • Learn • Excel
      </Text>
      <Text
        className="text-white text-center"
        style={{ 
          fontSize: responsive.typography.caption, 
          fontWeight: "500", 
          letterSpacing: 0.1, 
          marginTop: responsive.spacing(6),
          opacity: 0.85,
          textShadowColor: 'rgba(0,0,0,0.4)', 
          textShadowOffset: {width: 0, height: 1}, 
          textShadowRadius: 3 
        }}
      >
        Master the soft skills that drive career success
      </Text>
    </MotiView>
  );
}

function LogoPulse({ size = 200 }: { size?: number }) {
  const scale = useRef(new RNAnimated.Value(1)).current;

  React.useEffect(() => {
    const pulseAnim = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(scale, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        RNAnimated.timing(scale, { toValue: 1.0, duration: 2000, useNativeDriver: true }),
      ])
    );

    pulseAnim.start();
    
    return () => {
      pulseAnim.stop();
    };
  }, [scale]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Logo with blending technique */}
      <RNAnimated.View
        style={{ 
          width: size, 
          height: size, 
          transform: [{ scale }],
          position: 'relative',
        }}
      >
        {/* Background gradient that matches our main background */}
        <LinearGradient
          colors={GRADIENTS.onboarding}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ 
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
        
        {/* Logo on top with blend mode */}
        <RNAnimated.Image
          source={logoSrc}
          style={{ 
            width: size, 
            height: size,
            position: 'absolute',
          }}
          resizeMode="contain"
        />
      </RNAnimated.View>
    </View>
  );
}

function StaticBackground() {
  const responsive = useResponsive();
  
  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#0A66C2", "#0E75D1", "#1285E0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />
      <LinearGradient
        colors={["rgba(10, 102, 194, 0.9)", "rgba(18, 133, 224, 0.6)", "rgba(10, 102, 194, 0.8)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />
      <Svg width={responsive.screenWidth} height={responsive.screenHeight} style={{ position: "absolute" }}>
        <Defs>
          <SvgRadialGradient id="brand-accent1" cx="30%" cy="30%" r="50%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </SvgRadialGradient>
          <SvgRadialGradient id="brand-accent2" cx="70%" cy="80%" r="60%">
            <Stop offset="0%" stopColor={BRAND} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={BRAND} stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#brand-accent1)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#brand-accent2)" />
      </Svg>
    </View>
  );
}
