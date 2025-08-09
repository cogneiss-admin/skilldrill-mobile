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

  // Show a very brief branded overlay on any route segment change to mask default spinners
  const segmentKey = useMemo(() => segments.join("/"), [segments]);
  useEffect(() => {
    if (!segmentKey) return;
    setRouteOverlayVisible(true);
    const t = setTimeout(() => setRouteOverlayVisible(false), 450);
    return () => clearTimeout(t);
  }, [segmentKey]);
  return (
    <ReduxProvider store={store}>
      <PaperProvider theme={theme}>
        {navState?.key ? (
          <>
            <Suspense fallback={<View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: BRAND }}><SmallLogo /></View>}>
              <Slot />
            </Suspense>
            {routeOverlayVisible && (
              <View
                pointerEvents="none"
                style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: BRAND }}
              >
                <SmallLogo />
              </View>
            )}
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