// @ts-nocheck
import React, { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SplashOverlay from "./components/SplashOverlay";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-bold text-gray-900">Home</Text>
        <Text className="mt-2 text-gray-600">This is your next screen.</Text>
      </View>

      {showIntro && (
        <SplashOverlay onFinish={() => setShowIntro(false)} />
      )}
    </SafeAreaView>
  );
}

