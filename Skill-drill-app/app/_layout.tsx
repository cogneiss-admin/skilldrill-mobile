// Ensure Reanimated is initialized
import "react-native-reanimated";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import "./global.css";
import { Slot, useRootNavigationState, useSegments, useRouter } from "expo-router";
import { View, Animated as RNAnimated, StatusBar as RNStatusBar, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider, MD3LightTheme } from "react-native-paper";
import { Provider as ReduxProvider } from "react-redux";
import { PersistGate } from 'redux-persist/integration/react';
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import { store, persistor } from "../store";
import { useAuth } from "../hooks/useAuth";
import { BRAND, LOGO_SRC, SCREEN_CONTAINER_BACKGROUND } from "./components/Brand";
import SessionManager from "../utils/sessionManager";

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: BRAND,
  },
};

const logoSrc = LOGO_SRC;

function GlobalOtpSheet() {
  return null; // reserved for future global portal
}

const SmallLogo = React.memo(() => {
  const scale = new RNAnimated.Value(1);
  RNAnimated.loop(
    RNAnimated.sequence([
      RNAnimated.timing(scale, { toValue: 1.04, duration: 800, useNativeDriver: true }),
      RNAnimated.timing(scale, { toValue: 1.0, duration: 800, useNativeDriver: true }),
    ])
  ).start();
  return (
    <RNAnimated.Image
      source={logoSrc}
      resizeMode="contain"
      style={{ width: 96, height: 96, transform: [{ scale }] }}
    />
  );
});

SmallLogo.displayName = 'SmallLogo';

// Authentication middleware component
const AuthMiddleware = React.memo(({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isLoading, isOnboardingComplete, getOnboardingNextStep } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [checkComplete, setCheckComplete] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const isRootPath = !segments[0];
    if (isRootPath) return;

    if (isLoading) {
      if (!isRootPath) {
        router.replace('/');
      }
      return;
    }

    const isOtpScreen = segments[0] === 'auth' && segments[1] === 'otp';
    if (isOtpScreen) return;

    const isCareerRoleScreen = segments[0] === 'auth' && segments[1] === 'careerRole';
    if (isCareerRoleScreen) return;

    const isSkillsScreen = segments[0] === 'auth' && segments[1] === 'skills';
    if (isSkillsScreen) return;

    const isLoginScreen = segments[0] === 'auth' && segments[1] === 'login';
    if (isLoginScreen) return;

    const isSignupScreen = segments[0] === 'auth' && segments[1] === 'signup';
    if (isSignupScreen) return;

    const isDashboardScreen = segments[0] === 'dashboard';
    if (isDashboardScreen) return;

    const isAssessmentScenariosScreen = segments[0] === 'assessmentScenarios';
    if (isAssessmentScenariosScreen) return;

    const isAssessmentResultsScreen2 = segments[0] === 'assessmentResults';
    if (isAssessmentResultsScreen2) return;

    const isDrillsScenariosScreen = segments[0] === 'drillsScenarios';
    if (isDrillsScenariosScreen) return;

    const isDrillsResultsScreen = segments[0] === 'drillsResults';
    if (isDrillsResultsScreen) return;

    const isRecommendedDrillsScreen = segments[0] === 'recommended-drills';
    if (isRecommendedDrillsScreen) return;

    const isSubscriptionScreen = segments[0] === 'subscriptionScreen';
    if (isSubscriptionScreen) return;

    const isActivityScreen = segments[0] === 'activity';
    if (isActivityScreen) return;

    const isDiscoverScreen = segments[0] === 'discover';
    if (isDiscoverScreen) return;

    const isProfileScreen = segments[0] === 'profile';
    if (isProfileScreen) return;

    const isPaymentHistoryScreen = segments[0] === 'paymentHistory';
    if (isPaymentHistoryScreen) return;

    if (isAuthenticated) {
      const onboardingComplete = isOnboardingComplete();
      const nextStep = getOnboardingNextStep();

      if (onboardingComplete) {
        const isOnAuthFlow = segments[0] === 'auth';
        if (isOnAuthFlow) return;
        router.replace('/dashboard');
      } else if (nextStep) {
        router.replace(nextStep);
      } else {
        router.replace('/auth/careerRole');
      }
    } else {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, user, isLoading, segments, router, isOnboardingComplete, getOnboardingNextStep]);

  useEffect(() => {
    if (user) {
      setIsChecking(false);
      setCheckComplete(false);
    }
  }, [user?.id]);

  return <>{children}</>;
});

AuthMiddleware.displayName = 'AuthMiddleware';

const RootLayout = React.memo(() => {
  const navState = useRootNavigationState();
  const segments = useSegments();
  const [routeOverlayVisible, setRouteOverlayVisible] = useState(false);

  // Load Ionicons font to prevent "?" rendering
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  // Initialize SessionManager when app starts
  useEffect(() => {
    SessionManager.initialize();
  }, []);

  // Set a consistent status bar baseline across screens
  useEffect(() => {
    RNStatusBar.setBarStyle("dark-content");
    if (Platform.OS === "android") {
      RNStatusBar.setBackgroundColor(SCREEN_CONTAINER_BACKGROUND);
      RNStatusBar.setTranslucent(false);
    }
  }, []);

  // Disable previous blue flash overlay during navigation for smoother transitions
  const segmentKey = useMemo(() => segments.join("/"), [segments]);
  useEffect(() => {
    if (!segmentKey) return;
    setRouteOverlayVisible(false);
  }, [segmentKey]);

  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <PersistGate
          loading={
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: BRAND }}>
              <SmallLogo />
            </View>
          }
          persistor={persistor}
        >
          <PaperProvider theme={theme}>
            {navState?.key ? (
              <>
                <Suspense fallback={<View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: BRAND }}><SmallLogo /></View>}>
                  <AuthMiddleware>
                    <Slot />
                  </AuthMiddleware>
                </Suspense>
                {/* Global OTP Bottom Sheet Portal */}
                <GlobalOtpSheet />
              </>
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: BRAND }}>
                <SmallLogo />
              </View>
            )}
          </PaperProvider>
        </PersistGate>
      </ReduxProvider>
    </SafeAreaProvider>
  );
});

RootLayout.displayName = 'RootLayout';

export default RootLayout;