/**
 * Assessment Results Route
 *
 * Thin wrapper route for assessment results screen.
 * Gets URL parameters and passes them to AssessmentScreen component.
 *
 * Accepts either:
 * - assessmentId: Fetches results from API
 * - results: Pre-fetched results data (from completion flow)
 */

import React from "react";
import { useLocalSearchParams } from "expo-router";
import AssessmentScreen from "./components/AssessmentScreen";

const AssessmentResultsRoute = () => {
  const { results, skillName, assessmentId } = useLocalSearchParams<{
    results?: string;
    skillName?: string;
    assessmentId?: string;
  }>();

  let parsedResults: import('../types/assessment').AssessmentResults | undefined;
  if (results) {
    try {
      parsedResults = JSON.parse(results);
    } catch (error) {
      parsedResults = undefined;
    }
  }

  return (
    <AssessmentScreen
      mode="results"
      results={parsedResults}
      skillName={skillName}
      assessmentId={assessmentId}
    />
  );
};

export default AssessmentResultsRoute;
