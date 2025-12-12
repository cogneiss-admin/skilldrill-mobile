
import React from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import DrillsScreen from "./components/DrillsScreen";

const DrillsResultsRoute = () => {
  const { averageScore, attemptsCount, overall } = useLocalSearchParams<{
    averageScore: string;
    attemptsCount: string;
    overall?: string;
  }>();

  let overallData = undefined;
  if (overall) {
    try {
      overallData = JSON.parse(overall);
    } catch (e) {
    }
  }

  if (!overallData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#FF0000', textAlign: 'center' }}>
          Error: Missing overall data.
        </Text>
      </View>
    );
  }

  if (!overallData.skillName) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#FF0000', textAlign: 'center' }}>
          Error: Skill name is missing from drill results.
        </Text>
      </View>
    );
  }

  if (!averageScore || !attemptsCount) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#FF0000', textAlign: 'center' }}>
          Error: Missing required data (averageScore or attemptsCount).
        </Text>
      </View>
    );
  }

  const parsedAverageScore = parseFloat(averageScore);
  const parsedAttemptsCount = parseInt(attemptsCount, 10);

  if (isNaN(parsedAverageScore) || isNaN(parsedAttemptsCount)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#FF0000', textAlign: 'center' }}>
          Error: Invalid data format (averageScore or attemptsCount).
        </Text>
      </View>
    );
  }

  const completionData = {
    reached: true,
    skillName: overallData.skillName,
    overall: overallData,
    stats: {
      averageScore: parsedAverageScore,
      attemptsCount: parsedAttemptsCount
    }
  };

  return (
    <DrillsScreen
      mode="results"
      completionData={completionData}
    />
  );
};

export default DrillsResultsRoute;
