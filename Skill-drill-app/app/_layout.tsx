// Ensure Reanimated is initialized
import "react-native-reanimated";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import "./global.css";
import { Slot, useRootNavigationState, useSegments } from "expo-router";
import { View, Animated as RNAnimated } from "react-native";
import { Provider as PaperProvider, MD3LightTheme } from "react-native-paper";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "../store";

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
              <Slot />
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