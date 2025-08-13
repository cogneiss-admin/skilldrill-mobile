// Ensure Reanimated is initialized
import "react-native-reanimated";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import "./global.css";
import { Slot, useRootNavigationState, useSegments, useRouter } from "expo-router";
import { View, Animated as RNAnimated } from "react-native";
import { Provider as PaperProvider, MD3LightTheme } from "react-native-paper";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "../store";
import { useAuth } from "../hooks/useAuth";

const BRAND = "#0A66C2";

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: BRAND,
  },
};

const logoSrc = require("../assets/images/logo.png");

function GlobalOtpSheet() {
  return null; // reserved for future global portal
}

function SmallLogo() {
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
}

// Authentication middleware component
function AuthMiddleware({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading, isOnboardingComplete } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're on the root path and auth check is complete
    if (isLoading) {
      console.log('🔄 AuthMiddleware: Still loading...');
      return;
    }

    // Check if we're on the root path (first segment should be undefined for root)
    const isRootPath = !segments[0];
    
    console.log('🔍 AuthMiddleware: Current state:', {
      isAuthenticated,
      user: user ? { id: user.id, name: user.name, career_stage: user.career_stage, role_type: user.role_type } : null,
      segments,
      isRootPath
    });
    
    // Don't redirect if we're on the root path - let the splash screen handle it
    if (isRootPath) {
      console.log('🏠 AuthMiddleware: On root path, not redirecting');
      return;
    }

    // Don't redirect if we're on the OTP screen - let users enter OTP
    const isOtpScreen = segments[0] === 'auth' && segments[1] === 'otp';
    if (isOtpScreen) {
      console.log('📱 AuthMiddleware: On OTP screen, not redirecting');
      return;
    }

    // Don't redirect if we're on the career-role screen - let users complete onboarding
    const isCareerRoleScreen = segments[0] === 'auth' && segments[1] === 'career-role';
    if (isCareerRoleScreen) {
      console.log('📝 AuthMiddleware: On career-role screen, not redirecting');
      return;
    }

    // Don't redirect if we're on the login screen
    const isLoginScreen = segments[0] === 'auth' && segments[1] === 'login';
    if (isLoginScreen) {
      console.log('🔐 AuthMiddleware: On login screen, not redirecting');
      return;
    }

    // Don't redirect if we're on the signup screen
    const isSignupScreen = segments[0] === 'auth' && segments[1] === 'signup';
    if (isSignupScreen) {
      console.log('📝 AuthMiddleware: On signup screen, not redirecting');
      return;
    }

    // Don't redirect if we're on the dashboard screen
    const isDashboardScreen = segments[0] === 'dashboard';
    if (isDashboardScreen) {
      console.log('📊 AuthMiddleware: On dashboard screen, not redirecting');
      return;
    }

    // Calculate onboarding completion status
    const onboardingComplete = user?.career_stage && user?.role_type;
    console.log('✅ AuthMiddleware: Onboarding complete:', onboardingComplete);

    if (isAuthenticated) {
      if (onboardingComplete) {
        console.log('🎯 AuthMiddleware: User authenticated and onboarding complete, redirecting to dashboard');
        console.log('📊 AuthMiddleware: User data for onboarding check:', {
          career_stage: user?.career_stage,
          role_type: user?.role_type,
          onboardingComplete
        });
        router.replace('/dashboard');
      } else {
        console.log('📋 AuthMiddleware: User authenticated but onboarding incomplete, redirecting to career-role');
        console.log('📊 AuthMiddleware: User data for onboarding check:', {
          career_stage: user?.career_stage,
          role_type: user?.role_type,
          onboardingComplete
        });
        router.replace('/auth/career-role');
      }
    } else {
      // If not authenticated and not on auth screens, redirect to login
      console.log('🚪 AuthMiddleware: User not authenticated, redirecting to login');
      router.replace('/auth/login');
    }
  }, [isAuthenticated, user, isLoading, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const navState = useRootNavigationState();
  const segments = useSegments();
  const [routeOverlayVisible, setRouteOverlayVisible] = useState(false);

  // Disable previous blue flash overlay during navigation for smoother transitions
  const segmentKey = useMemo(() => segments.join("/"), [segments]);
  useEffect(() => {
    if (!segmentKey) return;
    setRouteOverlayVisible(false);
  }, [segmentKey]);

  return (
    <ReduxProvider store={store}>
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
    </ReduxProvider>
  );
}