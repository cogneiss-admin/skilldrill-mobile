/**
 * Assessment Scenarios Route
 *
 * Thin wrapper route for assessment questions screen.
 * Gets URL parameters and passes them to AssessmentScreen component.
 */

import React from "react";
import { useLocalSearchParams } from "expo-router";
import AssessmentScreen from "./components/AssessmentScreen";

const AssessmentScenariosRoute = () => {
  const { skillId, sessionId, skillName, resume } = useLocalSearchParams<{
    skillId: string;
    sessionId?: string;
    skillName?: string;
    resume?: string;
  }>();

  return (
    <AssessmentScreen
      mode="questions"
      skillId={skillId || ""}
      sessionId={sessionId}
      skillName={skillName}
      isResuming={resume === 'true'}
    />
  );
};

export default AssessmentScenariosRoute;
