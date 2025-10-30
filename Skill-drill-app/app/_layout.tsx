// @ts-nocheck
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
import ToastContainer from "../components/ToastContainer";
import { useToast } from "../hooks/useToast";
import { BRAND } from "./components/Brand";
import SessionManager from "../utils/sessionManager";

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
    // Only redirect if we're on the root path and auth check is complete
    if (isLoading) {
      console.log('🔄 AuthMiddleware: Still loading...');
      return;
    }

    // Check if we're on the root path (first segment should be undefined for root)
    const isRootPath = !segments[0];
    
    console.log('🔍 AuthMiddleware: Current state:', {
      isAuthenticated,
      user: user ? { id: user.id, name: user.name, careerLevelId: user.careerLevelId, roleTypeId: user.roleTypeId } : null,
      segments,
      isRootPath
    });
    
    // Don't redirect if we're on the root path - let the splash screen handle it
    if (isRootPath) {
      console.log('🏠 AuthMiddleware: On root path, not redirecting');
      return;
    }

    // If still loading, only redirect to splash if we're not already there
    // This prevents infinite redirects when session expiration dialog is showing
    if (isLoading) {
      if (!isRootPath) {
        console.log('🔄 AuthMiddleware: Still loading, redirecting to splash screen');
        router.replace('/');
      }
      return;
    }

    // Don't redirect if we're on the OTP screen - let users enter OTP
    const isOtpScreen = segments[0] === 'auth' && segments[1] === 'otp';
    if (isOtpScreen) {
      console.log('📱 AuthMiddleware: On OTP screen, not redirecting');
      return;
    }

    // Don't redirect if we're on the career-role screen - let users complete onboarding
    const isCareerRoleScreen = segments[0] === 'auth' && segments[1] === 'careerRole';
    if (isCareerRoleScreen) {
      console.log('📝 AuthMiddleware: On career-role screen, not redirecting');
      return;
    }

    // Don't redirect if we're on the skills screen (both signup and assessment modes)
    const isSkillsScreen = segments[0] === 'auth' && segments[1] === 'skills';
    if (isSkillsScreen) {
      console.log('🎯 AuthMiddleware: On skills screen, not redirecting');
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

    // Don't redirect if we're on the assessment screens
    const isAssessmentScreen = segments[0] === 'assessment';
    if (isAssessmentScreen) {
      console.log('🎯 AuthMiddleware: On assessment screen, not redirecting');
      return;
    }
    // Also allow adaptive-assessment (was being redirected previously)
    const isAssessmentIntro = segments[0] === 'adaptive-assessment';
    if (isAssessmentIntro) {
      console.log('🎯 AuthMiddleware: On adaptive-assessment screen, not redirecting');
      return;
    }

    // Don't redirect if we're on the session-loading screen
    const isSessionLoadingScreen = segments[0] === 'session-loading';
    if (isSessionLoadingScreen) {
      console.log('⏳ AuthMiddleware: On session-loading screen, not redirecting');
      return;
    }

    // Don't redirect if we're on the assessment-results screen
    const isAssessmentResultsScreen = segments[0] === 'assessment-results';
    if (isAssessmentResultsScreen) {
      console.log('📊 AuthMiddleware: On assessment-results screen, not redirecting');
      return;
    }

    // Don't redirect if we're on the adaptive-results screen
    const isAdaptiveResultsScreen = segments[0] === 'adaptive-results';
    if (isAdaptiveResultsScreen) {
      console.log('📊 AuthMiddleware: On adaptive-results screen, not redirecting');
      return;
    }

    // Don't redirect if we're on the activity screen
    const isActivityScreen = segments[0] === 'activity';
    if (isActivityScreen) {
      console.log('📊 AuthMiddleware: On activity screen, not redirecting');
      return;
    }

    if (isAuthenticated) {
      const onboardingComplete = isOnboardingComplete();
      const nextStep = getOnboardingNextStep();
      
      console.log('📊 AuthMiddleware: User onboarding status:', {
        userId: user?.id,
        onboardingStep: user?.onboardingStep,
        careerLevelId: user?.careerLevelId,
        roleTypeId: user?.roleTypeId,
        onboardingComplete,
        nextStep
      });

      if (onboardingComplete) {
        // Don't auto-redirect to dashboard if user is on auth screens (let them complete their flow)
        const isOnAuthFlow = segments[0] === 'auth' || segments.includes('auth');
        if (isOnAuthFlow) {
          console.log('🔐 AuthMiddleware: User on auth flow, letting them complete naturally');
          return;
        }
        console.log('🎯 AuthMiddleware: User authenticated and onboarding complete, redirecting to dashboard');
        router.replace('/dashboard');
      } else if (nextStep) {
        console.log(`📋 AuthMiddleware: User authenticated but onboarding incomplete, redirecting to: ${nextStep}`);
        router.replace(nextStep);
      } else {
        console.log('❓ AuthMiddleware: Unable to determine next onboarding step, redirecting to careerRole as fallback');
        router.replace('/auth/careerRole');
      }
    } else {
      // If not authenticated and not on auth screens, redirect to login
      console.log('🚪 AuthMiddleware: User not authenticated, redirecting to login');
      router.replace('/auth/login');
    }
  }, [isAuthenticated, user, isLoading, segments, router, isOnboardingComplete, getOnboardingNextStep]);

  // Reset check state when user changes
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
  const { toasts, dismissToast } = useToast();

  // Initialize SessionManager when app starts
  useEffect(() => {
    SessionManager.initialize();
  }, []);

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
            {/* Toast Container */}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
          </>
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: BRAND }}>
            <SmallLogo />
          </View>
        )}
      </PaperProvider>
    </ReduxProvider>
  );
});

RootLayout.displayName = 'RootLayout';

export default RootLayout;