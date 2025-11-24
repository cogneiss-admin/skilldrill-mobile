/**
 * Drills Results Route
 *
 * Thin wrapper route for drill milestone/results screen.
 * Gets URL parameters and passes them to DrillsScreen component.
 *
 * Note: This is typically shown as a modal within DrillsScenarios,
 * but can also be accessed as a separate route if needed.
 */

import React from "react";
import { useLocalSearchParams } from "expo-router";
import DrillsScreen from "./components/DrillsScreen";

const DrillsResultsRoute = () => {
  const { percentage, averageScore, attemptsCount } = useLocalSearchParams<{
    percentage: string;
    averageScore: string;
    attemptsCount: string;
  }>();

  const milestoneData = {
    percentage: parseInt(percentage || '0', 10),
    averageScore: parseFloat(averageScore || '0'),
    attemptsCount: parseInt(attemptsCount || '0', 10),
    reached: true,
  };

  return (
    <DrillsScreen
      mode="results"
      milestoneData={milestoneData}
    />
  );
};

export default DrillsResultsRoute;
