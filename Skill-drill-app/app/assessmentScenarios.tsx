import React from "react";
import { useLocalSearchParams } from "expo-router";
import AssessmentScreen from "./components/AssessmentScreen";

const parseJsonParam = (value: string | string[] | undefined): any => {
  if (!value) return null;
  const str = Array.isArray(value) ? value[0] : value;
  if (!str) return null;

  try {
    return JSON.parse(str);
  } catch {
    try {
      return JSON.parse(decodeURIComponent(str));
    } catch {
      return null;
    }
  }
};

const AssessmentScenariosRoute = () => {
  const params = useLocalSearchParams<{
    skillId: string;
    sessionId: string;
    skillName: string;
    question: string;
    progress: string;
  }>();

  const skillId = Array.isArray(params.skillId) ? params.skillId[0] : params.skillId;
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const skillName = Array.isArray(params.skillName) ? params.skillName[0] : params.skillName;

  const parsedQuestion = parseJsonParam(params.question);
  const parsedProgress = parseJsonParam(params.progress);

  return (
    <AssessmentScreen
      mode="questions"
      skillId={skillId}
      sessionId={sessionId}
      skillName={skillName}
      initialQuestion={parsedQuestion}
      initialProgress={parsedProgress}
    />
  );
};

export default AssessmentScenariosRoute;
