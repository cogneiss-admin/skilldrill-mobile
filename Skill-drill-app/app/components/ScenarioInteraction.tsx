/**
 * ScenarioInteraction Component
 *
 * Unified component for both Assessment and Drill question/scenario screens.
 * Same UI/UX structure with conditional colors, icons, and button text.
 *
 * Features:
 * - Header
 * - Progress indicator
 * - Scenario display card
 * - Response input with character counter
 * - Submit button
 * - Navigation controls (for drills)
 * - Loading states
 */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Surface, ProgressBar } from "react-native-paper";
import Button from '../../components/Button';
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from '@expo/vector-icons';
import {
  BRAND,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from './Brand';

export interface ScenarioInteractionProps {
  type: 'assessment' | 'drill';
  title: string;
  subtitle?: string;
  currentIndex: number;
  totalItems: number;
  scenarioText: string;
  onSubmit: (text: string) => void;
  onBack?: () => void;
  onExit: () => void;
  loading?: boolean;
  loadingMessage?: string;
  loadingSubMessage?: string;
  submitting?: boolean;
  progress?: number; // For drill milestones (0-100)
  completedCount?: number; // For drill progress
  showNavigation?: boolean; // Show previous/next buttons
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  isCompleted?: boolean; // Whether current drill is completed
}

const ASSESSMENT_BRAND = "#0A66C2";

const ScenarioInteraction: React.FC<ScenarioInteractionProps> = ({
  type,
  title,
  subtitle,
  currentIndex,
  totalItems,
  scenarioText,
  onSubmit,
  onBack,
  onExit,
  loading = false,
  loadingMessage = 'Loading...',
  loadingSubMessage = '',
  submitting = false,
  progress = 0,
  completedCount = 0,
  showNavigation = false,
  onPrevious,
  onNext,
  canGoPrevious = false,
  canGoNext = false,
  isCompleted = false,
}) => {
  const [userResponse, setUserResponse] = useState('');

  // Clear response when scenario changes
  useEffect(() => {
    setUserResponse('');
  }, [currentIndex]);

  const handleSubmitResponse = () => {
    if (!userResponse.trim()) {
      return;
    }
    onSubmit(userResponse.trim());
    setUserResponse('');
  };

  const isLastItem = currentIndex === totalItems - 1;
  const canSubmit = userResponse.trim().length > 0 && !submitting;
  const isDrill = type === 'drill';
  const isAssessment = type === 'assessment';

  // Conditional colors and icons
  const headerBgColor = isAssessment ? ASSESSMENT_BRAND : BRAND;
  const buttonColor = isAssessment ? ASSESSMENT_BRAND : BRAND;
  const backButtonText = isAssessment ? 'Exit' : 'Back';
  const backButtonIcon = isAssessment ? 'arrow-left' : 'arrow-back';
  const progressText = isAssessment 
    ? `Question ${currentIndex + 1} of ${totalItems}`
    : subtitle || `Drill ${currentIndex + 1} of ${totalItems}`;
  const submitButtonText = submitting 
    ? 'Processing...' 
    : isLastItem 
      ? (isAssessment ? 'Complete Assessment' : 'Complete Drill')
      : 'Submit & Next';

  // Render Header - Same structure for both
  const renderHeader = () => (
    <View style={{
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 16,
      backgroundColor: headerBgColor
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <TouchableOpacity
          onPress={onBack || onExit}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <Ionicons name={backButtonIcon} size={20} color="white" style={{ marginRight: 4 }} />
          <Text style={{ color: "white", fontSize: 16, fontWeight: "500" }}>
            {backButtonText}
          </Text>
        </TouchableOpacity>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
          {title}
        </Text>
        <View style={{ width: 80 }} />
      </View>

      {/* Progress Bar */}
      <View style={{ marginBottom: 0 }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
            {progressText}
          </Text>
        </View>

        <ProgressBar
          progress={(currentIndex + 1) / totalItems}
          color="#4CAF50"
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(255,255,255,0.2)',
          }}
        />
      </View>
    </View>
  );

  // Render Scenario Card - Same structure (Surface) for both
  const renderScenarioCard = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 600 }}
    >
      <Surface style={{
        padding: 20,
        borderRadius: 16,
        backgroundColor: 'white',
        elevation: 4,
        marginBottom: 24,
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#333',
          marginBottom: 16,
          lineHeight: 24,
        }}>
          Scenario:
        </Text>
        <Text style={{
          fontSize: 15,
          color: '#666',
          lineHeight: 22,
        }}>
          {scenarioText}
        </Text>

        {isCompleted && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          }}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={{
              fontSize: 14,
              color: COLORS.success,
              fontWeight: '600',
              marginLeft: 8,
            }}>
              Completed
            </Text>
          </View>
        )}
      </Surface>
    </MotiView>
  );

  // Render Response Input - Same structure (Surface) for both
  const renderResponseInput = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 600, delay: 200 }}
    >
      <Surface style={{
        borderRadius: 16,
        backgroundColor: 'white',
        elevation: 4,
        marginBottom: 24,
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#333',
          padding: 20,
          paddingBottom: 12,
        }}>
          Your Response:
        </Text>

        <TextInput
          style={{
            minHeight: 120,
            paddingHorizontal: 20,
            paddingBottom: 20,
            fontSize: 15,
            color: '#333',
            textAlignVertical: 'top',
          }}
          multiline
          placeholder="Type your detailed response here..."
          placeholderTextColor="#999"
          value={userResponse}
          onChangeText={setUserResponse}
          maxLength={2400}
          editable={!submitting}
        />

        <Text style={{
          fontSize: 12,
          color: '#999',
          textAlign: 'right',
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}>
          {userResponse.length}/2400 characters
        </Text>
      </Surface>
    </MotiView>
  );

  // Render Navigation Buttons - Same structure for both (shown when showNavigation is true)
  const renderNavigationButtons = () => {
    if (showNavigation && totalItems > 1 && onPrevious && onNext) {
      return (
        <View style={{
          flexDirection: 'row',
          gap: 12,
          marginHorizontal: 16,
          marginBottom: 16,
        }}>
          <Button
            variant="secondary"
            onPress={onPrevious}
            disabled={!canGoPrevious || submitting}
            icon="arrow-back"
            style={{ flex: 1 }}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            onPress={onNext}
            disabled={!canGoNext || submitting}
            icon="arrow-forward"
            iconPosition="right"
            style={{ flex: 1 }}
          >
            Next
          </Button>
        </View>
      );
    }
    return null;
  };

  // Render Submit Button - Same structure, different color
  const renderSubmitButton = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 600, delay: 400 }}
    >
      <View style={{ marginBottom: 32 }}>
        <Button
          variant="primary"
          onPress={handleSubmitResponse}
          loading={submitting}
          disabled={!canSubmit}
          style={{
            marginHorizontal: 16,
          }}
        >
          {submitButtonText}
        </Button>
      </View>
    </MotiView>
  );

  const backgroundColor = headerBgColor;
  const statusBarStyle = 'light-content';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <StatusBar barStyle={statusBarStyle} />

      {renderHeader()}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          <LinearGradient
            colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.95)", "rgba(255,255,255,1)"]}
            locations={[0, 0.05, 0.15]}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, paddingTop: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {renderScenarioCard()}
              {renderResponseInput()}
              {renderNavigationButtons()}
              {renderSubmitButton()}
            </ScrollView>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ScenarioInteraction;
