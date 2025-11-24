/**
 * Drills Scenarios Route
 *
 * Thin wrapper route for drill practice screen.
 * Gets URL parameters and passes them to DrillsScreen component.
 */

import React from "react";
import { useLocalSearchParams } from "expo-router";
import DrillsScreen from "./components/DrillsScreen";

const DrillsScenariosRoute = () => {
  const { assignmentId } = useLocalSearchParams<{
    assignmentId: string;
  }>();

  return (
    <DrillsScreen
      mode="questions"
      assignmentId={assignmentId || ""}
    />
  );
};

export default DrillsScenariosRoute;
