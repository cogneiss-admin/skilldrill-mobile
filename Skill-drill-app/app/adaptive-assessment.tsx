import React from "react";
import { useLocalSearchParams } from "expo-router";
import AdaptiveAssessment from "./components/AdaptiveAssessment";

const AdaptiveAssessmentScreen = () => {
  const { skillId, skillName } = useLocalSearchParams<{
    skillId: string;
    skillName: string;
  }>();

  return (
    <AdaptiveAssessment
      skillId={skillId || ""}
      skillName={skillName || "Communication"}
    />
  );
};

export default AdaptiveAssessmentScreen;