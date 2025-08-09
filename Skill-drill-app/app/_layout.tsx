// Ensure Reanimated is initialized
import "react-native-reanimated";
import React from "react";
import "./global.css";
import { Slot } from "expo-router";

export default function RootLayout() {
  return <Slot />;
}