/**
 * DrillsScreen Component
 *
 * Unified component for drill practice flow - handles both questions and milestone results modes.
 *
 * Modes:
 * - 'questions': Shows drill practice questions using ScenarioInteraction component
 * - 'results': Shows milestone celebration using Results component (as modal)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useDrillProgress } from '../../hooks/useDrillProgress';
import { useAnimation } from '../../hooks/useAnimation';

import ScenarioInteraction from './ScenarioInteraction';
import Results from './Results';
import Button from '../../components/Button';

import {
  BRAND,
  COLORS,
  TYPOGRAPHY,
  SPACING,
} from './Brand';

export interface DrillsScreenProps {
  mode: 'questions' | 'results';
  // Props for questions mode
  assignmentId?: string;
  // Props for results mode (if showing results separately)
  milestoneData?: {
    percentage: number;
    averageScore: number;
    attemptsCount: number;
    reached: boolean;
  };
}

const DrillsScreen: React.FC<DrillsScreenProps> = ({
  mode,
  assignmentId,
  milestoneData: externalMilestoneData,
}) => {
  const router = useRouter();

  // ==================== QUESTIONS MODE STATE ====================
  const {
    loading,
    error,
    assignment,
    drills,
    currentDrill,
    currentIndex,
    totalDrills,
    completedCount,
    progress,
    submitting,
    milestoneData,
    submitDrill,
    nextDrill,
    previousDrill,
    dismissMilestone,
  } = useDrillProgress(assignmentId || '');

  const { celebrate, fadeIn } = useAnimation();

  // ==================== QUESTIONS MODE LOGIC ====================

  useEffect(() => {
    if (mode === 'questions') {
      fadeIn();
    }
  }, [mode]);

  useEffect(() => {
    if (milestoneData?.reached) {
      celebrate();
    }
  }, [milestoneData]);

  const handleSubmit = async (text: string) => {
    if (!text.trim()) {
      return;
    }

    try {
      await submitDrill({
        textContent: text.trim(),
      });
    } catch (error) {
      console.error('Submit failed:', error);
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleBack = () => {
    router.back();
  };

  // ==================== RENDER ====================

  // QUESTIONS MODE
  if (mode === 'questions') {
    // Loading state
    if (loading) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRAND} />
            <Text style={styles.loadingText}>Loading your drills...</Text>
          </View>
        </SafeAreaView>
      );
    }

    // Error state
    if (error || !currentDrill) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={COLORS.error} />
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorText}>
              {error || 'Failed to load drills'}
            </Text>
            <Button
              variant="primary"
              onPress={() => router.back()}
              style={{ marginTop: SPACING.margin.lg }}
            >
              Go Back
            </Button>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <>
        <ScenarioInteraction
          type="drill"
          title={`${assignment?.skillName} Drill`}
          currentIndex={currentIndex}
          totalItems={totalDrills}
          scenarioText={currentDrill.scenarioText}
          onSubmit={handleSubmit}
          onExit={handleBack}
          loading={loading}
          submitting={submitting}
        />
        {milestoneData?.reached && (
          <Results
            type="drill"
            visible={true}
            milestone={milestoneData.percentage}
            stats={{
              averageScore: milestoneData.averageScore,
              count: milestoneData.attemptsCount,
            }}
            onAction={dismissMilestone}
          />
        )}
      </>
    );
  }

  // RESULTS MODE (if showing separately)
  if (mode === 'results' && externalMilestoneData) {
    return (
      <Results
        type="drill"
        visible={true}
        milestone={externalMilestoneData.percentage}
        stats={{
          averageScore: externalMilestoneData.averageScore,
          count: externalMilestoneData.attemptsCount,
        }}
        onAction={handleGoToDashboard}
      />
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.md,
    color: COLORS.text.tertiary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.padding['2xl'],
  },
  errorTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});

export default DrillsScreen;
