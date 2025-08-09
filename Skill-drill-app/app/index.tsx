// @ts-nocheck
import React, { useState } from "react";
import { View, Text } from "react-native";
import SplashOverlay from "./components/SplashOverlay";

export default function App() {
  const [isSplashDone, setSplashDone] = useState(false);

  if (!isSplashDone) {
    return <SplashOverlay onFinish={() => setSplashDone(true)} />;
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Welcome to SkillSeed 🚀</Text>
    </View>
  );
}
