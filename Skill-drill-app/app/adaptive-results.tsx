import React from "react";
import { useLocalSearchParams } from "expo-router";
import AdaptiveResults from "./components/AdaptiveResults";

const AdaptiveResultsScreen = () => {
  const { results, skillName } = useLocalSearchParams<{
    results: string;
    skillName: string;
  }>();

  let parsedResults;
  try {
    parsedResults = JSON.parse(results || '{}');
  } catch (error) {
    console.error('Error parsing results:', error);
    parsedResults = {};
  }

  return (
    <AdaptiveResults
      results={parsedResults}
      skillName={skillName || "Assessment"}
    />
  );
};

export default AdaptiveResultsScreen;